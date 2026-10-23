import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../contracts/schemas/be1.v1.json';
import events from '../../contracts/events/be1.v1.json';
import registerFixture from '../../contracts/fixtures/auth-register.v1.json';
import companyFixture from '../../contracts/fixtures/company.v1.json';
import jobFixture from '../../contracts/fixtures/job.v1.json';
import eventFixture from '../../contracts/fixtures/be1-event.v1.json';
import {
  USER_ROLES,
  ACCOUNT_STATUSES,
  COMPANY_APPROVAL_STATUSES,
  MEMBERSHIP_ROLES,
  JOB_POST_STATUSES,
  JOB_TYPES,
  WORKPLACE_MODES,
  CURRENCIES,
} from '../../libs/contracts/public';
import { PORTS } from '../../libs/contracts/backend';

const ajv = addFormats(new Ajv({ allErrors: true, strict: true, strictRequired: false }));
ajv.addSchema(schema);
const validateEvent = ajv.compile(events);
const validate = (name: string, value: unknown) =>
  ajv.validate(`${schema.$id}#/definitions/${name}`, value);

describe('BE1 wire contracts — UC01, UC04, UC05, UC10, UC11', () => {
  it('compiles every definition in be1.v1.json and validates enum constants', () => {
    for (const name of Object.keys(schema.definitions)) {
      expect(ajv.getSchema(`${schema.$id}#/definitions/${name}`)).toBeDefined();
    }
    expect(schema.definitions.UserRole.enum).toEqual([...USER_ROLES]);
    expect(schema.definitions.AccountStatus.enum).toEqual([...ACCOUNT_STATUSES]);
    expect(schema.definitions.CompanyApprovalStatus.enum).toEqual([...COMPANY_APPROVAL_STATUSES]);
    expect(schema.definitions.MembershipRole.enum).toEqual([...MEMBERSHIP_ROLES]);
    expect(schema.definitions.JobPostStatus.enum).toEqual([...JOB_POST_STATUSES]);
    expect(schema.definitions.JobType.enum).toEqual([...JOB_TYPES]);
    expect(schema.definitions.WorkplaceMode.enum).toEqual([...WORKPLACE_MODES]);
    expect(schema.definitions.Currency.enum).toEqual([...CURRENCIES]);
  });

  describe('Auth & Identity contracts (UC04)', () => {
    it('validates register fixture and rules', () => {
      expect(validate('RegisterResponse', registerFixture.data)).toBe(true);

      // Valid register requests
      expect(
        validate('RegisterRequest', {
          email: 'user@example.com',
          password: 'password123',
          fullName: 'Nguyen Van A',
        }),
      ).toBe(true);
      expect(
        validate('RegisterRequest', {
          email: 'recruiter@example.com',
          password: 'password123',
          fullName: 'Tran Thi B',
          role: 'RECRUITER',
        }),
      ).toBe(true);

      // Rejects invalid passwords (too short < 10)
      expect(
        validate('RegisterRequest', {
          email: 'user@example.com',
          password: 'short',
          fullName: 'Nguyen Van A',
        }),
      ).toBe(false);

      // Rejects unallowed self-assigned roles (ADMIN, INTERVIEWER)
      expect(
        validate('RegisterRequest', {
          email: 'admin@example.com',
          password: 'password123',
          fullName: 'Admin User',
          role: 'ADMIN',
        }),
      ).toBe(false);

      // Rejects invalid email
      expect(
        validate('RegisterRequest', {
          email: 'not-an-email',
          password: 'password123',
          fullName: 'Nguyen Van A',
        }),
      ).toBe(false);
    });

    it('validates login, verify-email and reset-password contracts', () => {
      expect(validate('LoginRequest', { email: 'user@example.com', password: 'password123' })).toBe(
        true,
      );
      expect(validate('LoginRequest', { email: 'not-an-email', password: 'password123' })).toBe(
        false,
      );
      expect(validate('VerifyEmailRequest', { token: '1234567890abcdef1234' })).toBe(true);
      expect(validate('VerifyEmailRequest', { token: 'short' })).toBe(false);
      expect(
        validate('ResetPasswordRequest', {
          token: '1234567890abcdef1234',
          newPassword: 'newpassword123',
        }),
      ).toBe(true);
      expect(
        validate('ResetPasswordRequest', {
          token: '1234567890abcdef1234',
          newPassword: 'short',
        }),
      ).toBe(false);
    });

    it('validates session DTO structure', () => {
      const validSession = {
        userId: '10000000-0000-4000-8000-000000000001',
        email: 'user@example.com',
        fullName: 'Nguyen Van A',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        csrfToken: 'csrf-random-token-value',
      };
      expect(validate('SessionDto', validSession)).toBe(true);
    });
  });

  describe('Company & Membership contracts (UC11)', () => {
    it('validates company fixture and requests', () => {
      expect(validate('CompanyDto', companyFixture.data)).toBe(true);

      // Create company
      expect(
        validate('CreateCompanyRequest', {
          name: 'Tech Corp',
          taxCode: '0987654321',
          address: '456 Nguyen Hue, D1, HCMC',
        }),
      ).toBe(true);

      // Reject too short name or taxCode
      expect(
        validate('CreateCompanyRequest', {
          name: 'T',
          taxCode: '123',
          address: '456 Nguyen Hue',
        }),
      ).toBe(false);

      // Update and resubmit require version
      expect(
        validate('UpdateCompanyRequest', {
          name: 'Updated Tech Corp',
          version: 0,
        }),
      ).toBe(true);
      expect(
        validate('UpdateCompanyRequest', {
          name: 'Updated Tech Corp',
        }),
      ).toBe(false);
    });

    it('validates membership commands and transfer owner', () => {
      expect(
        validate('AddMemberRequest', {
          email: 'colleague@example.com',
          role: 'RECRUITER',
          permissions: ['RECRUITER'],
        }),
      ).toBe(true);

      // Cannot add member as OWNER via add member endpoint
      expect(
        validate('AddMemberRequest', {
          email: 'colleague@example.com',
          role: 'OWNER',
        }),
      ).toBe(false);

      // Transfer owner requires targetUserId, targetMemberVersion and companyVersion
      expect(
        validate('TransferOwnerRequest', {
          targetUserId: '10000000-0000-4000-8000-000000000002',
          targetMemberVersion: 1,
          companyVersion: 2,
        }),
      ).toBe(true);
    });
  });

  describe('Jobs & Skills contracts (UC01, UC05)', () => {
    it('validates job fixture and job requests', () => {
      expect(validate('JobDetailDto', jobFixture.data)).toBe(true);

      // Create job
      expect(
        validate('CreateJobRequest', {
          companyId: '20000000-0000-4000-8000-000000000001',
          title: 'Fullstack Dev',
          headcount: 2,
        }),
      ).toBe(true);

      // Rejects invalid headcount
      expect(
        validate('CreateJobRequest', {
          companyId: '20000000-0000-4000-8000-000000000001',
          headcount: 0,
        }),
      ).toBe(false);
      expect(
        validate('CreateJobRequest', {
          companyId: '20000000-0000-4000-8000-000000000001',
          headcount: 101,
        }),
      ).toBe(false);

      // Publish job requires version and future deadline
      expect(
        validate('PublishJobRequest', {
          version: 0,
          deadline: '2026-12-31T23:59:59.000Z',
        }),
      ).toBe(true);

      // Close job requires version
      expect(
        validate('CloseJobRequest', {
          version: 1,
          reason: 'Position filled',
        }),
      ).toBe(true);
    });
  });

  describe('Admin moderation contracts (UC10)', () => {
    it('validates review, suspend, user status and owner recovery', () => {
      expect(
        validate('ReviewCompanyRequest', {
          status: 'APPROVED',
          version: 0,
        }),
      ).toBe(true);
      expect(
        validate('ReviewCompanyRequest', {
          status: 'REJECTED',
          reason: 'Invalid business license',
          version: 0,
        }),
      ).toBe(true);

      expect(
        validate('SuspendCompanyRequest', {
          reason: 'Policy violation',
          version: 1,
        }),
      ).toBe(true);

      expect(
        validate('AdminUpdateUserStatusRequest', {
          status: 'LOCKED',
          reason: 'Fraudulent activity',
          version: 0,
        }),
      ).toBe(true);

      expect(
        validate('RecoverOwnerRequest', {
          targetUserId: '10000000-0000-4000-8000-000000000002',
          targetMemberVersion: 0,
          companyVersion: 1,
          reason: 'Previous owner departed company',
        }),
      ).toBe(true);
    });
  });

  describe('BE1 Event producer envelope', () => {
    it('validates event fixture and all declared BE1 event types', () => {
      expect(validateEvent(eventFixture)).toBe(true);

      // user.locked
      expect(
        validateEvent({
          eventId: '50000000-0000-4000-8000-000000000002',
          eventType: 'user.locked',
          schemaVersion: 1,
          aggregateId: '10000000-0000-4000-8000-000000000001',
          aggregateVersion: 1,
          occurredAt: '2026-10-22T08:00:00.000Z',
          payload: {
            userId: '10000000-0000-4000-8000-000000000001',
            reason: 'Suspicious login',
            lockedBy: '10000000-0000-4000-8000-000000000099',
          },
        }),
      ).toBe(true);

      // company.created
      expect(
        validateEvent({
          eventId: '50000000-0000-4000-8000-000000000003',
          eventType: 'company.created',
          schemaVersion: 1,
          aggregateId: '20000000-0000-4000-8000-000000000001',
          aggregateVersion: 0,
          occurredAt: '2026-10-22T08:00:00.000Z',
          payload: {
            companyId: '20000000-0000-4000-8000-000000000001',
            ownerUserId: '10000000-0000-4000-8000-000000000001',
          },
        }),
      ).toBe(true);

      // job.published
      expect(
        validateEvent({
          eventId: '50000000-0000-4000-8000-000000000004',
          eventType: 'job.published',
          schemaVersion: 1,
          aggregateId: '30000000-0000-4000-8000-000000000001',
          aggregateVersion: 1,
          occurredAt: '2026-10-22T08:00:00.000Z',
          payload: {
            jobId: '30000000-0000-4000-8000-000000000001',
            companyId: '20000000-0000-4000-8000-000000000001',
            publishedAt: '2026-10-22T08:00:00.000Z',
          },
        }),
      ).toBe(true);

      // Rejects unknown event type
      expect(
        validateEvent({
          eventId: '50000000-0000-4000-8000-000000000005',
          eventType: 'unknown.event',
          schemaVersion: 1,
          aggregateId: '10000000-0000-4000-8000-000000000001',
          aggregateVersion: 0,
          occurredAt: '2026-10-22T08:00:00.000Z',
          payload: {},
        }),
      ).toBe(false);
    });
  });

  describe('BE1 PORTS token registry', () => {
    it('defines all required ports in PORTS token registry', () => {
      const requiredPorts = [
        'identityCandidate',
        'identityAdmin',
        'companyAccess',
        'companyAdmin',
        'jobApplication',
        'jobVisibility',
        'jobAdmin',
        'jobReportingFacts',
        'skillCatalog',
        'authMailMaterial',
        'interviewAdmin',
        'interviewSecurity',
        'interviewMembership',
      ] as const;

      for (const portName of requiredPorts) {
        expect(PORTS[portName]).toBeDefined();
        expect(typeof PORTS[portName]).toBe('symbol');
      }
    });
  });
});
