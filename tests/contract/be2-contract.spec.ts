import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../contracts/schemas/be2.v1.json';
import events from '../../contracts/events/be2.v1.json';
import fixture from '../../contracts/fixtures/candidate-application.v1.json';
import eventFixture from '../../contracts/fixtures/application-submitted.v1.json';
import openapi from '../../contracts/openapi/be2-foundation.v1.json';
import profileOpenapi from '../../contracts/openapi/be2-profile.v1.json';
import {
  APPLICATION_STATUSES,
  type CandidateApplicationDto,
  type CandidateHistoryDto,
} from '../../libs/contracts/public';
import type { Be2EventPayloads } from '../../libs/contracts/backend/events';
import {
  toCandidateApplication,
  toCandidateHistory,
} from '../../apps/api/src/modules/application/mappers/candidate-application.mapper';
import { unimplementedBe2Ports } from '../../libs/contracts/backend/unimplemented-be2-ports';

const ajv = addFormats(new Ajv({ allErrors: true, strict: true, strictRequired: false }));
ajv.addSchema(schema);
const validateEvent = ajv.compile(events);
const validate = (name: string, value: unknown) =>
  ajv.validate(`${schema.$id}#/definitions/${name}`, value);
const application: CandidateApplicationDto = { ...fixture.data, status: 'SUBMITTED' };

describe('UC12 profile wire contract', () => {
  const profile = {
    name: 'Ứng viên',
    email: 'candidate@example.test',
    phone: null,
    headline: null,
    summary: null,
    location: null,
    skillIds: [],
    version: 0,
  };

  it('allows only public profile fields and requires a versioned update', () => {
    expect(validate('CandidateProfileDto', profile)).toBe(true);
    expect(validate('CandidateProfileDto', { ...profile, passwordHash: 'secret' })).toBe(false);
    expect(validate('UpdateCandidateProfileRequest', { version: 0, skillIds: [] })).toBe(true);
    expect(validate('UpdateCandidateProfileRequest', { name: 'Tên' })).toBe(false);
    expect(validate('UpdateCandidateProfileRequest', { version: 0, role: 'ADMIN' })).toBe(false);
  });

  it('publishes GET/PATCH profile with session and CSRF contract', () => {
    const path = profileOpenapi.paths['/api/candidate/profile'];
    expect(path.get.responses['200']).toBeDefined();
    expect(path.patch.responses['200']).toBeDefined();
    expect(path.patch.requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/UpdateProfileRequest',
    );
    expect(path.patch.parameters[0]).toMatchObject({
      in: 'header',
      name: 'X-CSRF-Token',
      required: true,
    });
    expect(path.get.security).toEqual([{ sessionCookie: [] }]);
  });
});

describe('BE2 wire contracts — Word BR01, BR07, BR13, BR18, BR20', () => {
  it('compiles every definition and keeps all documented application states', () => {
    for (const name of Object.keys(schema.definitions)) {
      expect(ajv.getSchema(`${schema.$id}#/definitions/${name}`)).toBeDefined();
    }
    expect(schema.definitions.Status.enum).toEqual([...APPLICATION_STATUSES]);
    expect(validate('CandidateApplicationResponse', fixture)).toBe(true);
  });

  it('rejects client-supplied identity, privileged status and missing/stale-shaped version input', () => {
    expect(validate('SubmitApplicationRequest', { cvId: fixture.data.currentCvVersionId })).toBe(
      true,
    );
    expect(
      validate('SubmitApplicationRequest', {
        cvId: fixture.data.currentCvVersionId,
        candidateId: fixture.data.applicationId,
      }),
    ).toBe(false);
    expect(validate('ReviewApplicationRequest', { status: 'HIRED', version: 0 })).toBe(false);
    expect(validate('ReviewApplicationRequest', { status: 'SCREENING' })).toBe(false);
    expect(validate('ReviewApplicationRequest', { status: 'SCREENING', version: '0' })).toBe(false);
    expect(validate('ReviewApplicationRequest', { status: 'SCREENING', version: -1 })).toBe(false);
    expect(validate('ReviewApplicationRequest', { status: 'SCREENING', version: 0 })).toBe(true);
    expect(validate('ReviewApplicationRequest', { status: 'SCREENING', expectedVersion: 0 })).toBe(
      false,
    );
  });

  it('requires public results for terminal decisions and disallows hidden final results on active applications', () => {
    expect(validate('CandidateApplicationDto', { ...application, status: 'HIRED' })).toBe(false);
    expect(
      validate('CandidateApplicationDto', { ...application, resultMessage: 'premature' }),
    ).toBe(false);
    expect(
      validate('CandidateApplicationDto', {
        ...application,
        status: 'REJECTED',
        resultMessage: 'Cảm ơn bạn đã ứng tuyển.',
        resultPublishedAt: '2026-10-20T12:00:00+07:00',
      }),
    ).toBe(true);
    expect(
      validate('PublishResultRequest', { result: 'REJECTED', message: 'Cảm ơn', version: 2 }),
    ).toBe(false);
    expect(
      validate('PublishResultRequest', {
        result: 'REJECTED',
        message: 'Cảm ơn',
        reason: '   ',
        version: 2,
      }),
    ).toBe(false);
    expect(
      validate('PublishResultRequest', {
        result: 'REJECTED',
        message: 'Cảm ơn',
        reason: 'Internal reason',
        version: 2,
      }),
    ).toBe(true);
  });

  it('preserves absent vs nullable profile fields and counts Unicode code points', () => {
    expect(validate('UpdateCandidateProfileRequest', { version: 0 })).toBe(true);
    expect(validate('UpdateCandidateProfileRequest', { version: 0, phone: null })).toBe(true);
    expect(validate('UpdateCandidateProfileRequest', { version: 0, name: null })).toBe(false);
    expect(validate('UpdateCandidateProfileRequest', { version: 0, role: 'ADMIN' })).toBe(false);
    expect(validate('UpdateCandidateProfileRequest', { version: 0, name: '😀'.repeat(120) })).toBe(
      true,
    );
    expect(validate('UpdateCandidateProfileRequest', { version: 0, name: '😀'.repeat(121) })).toBe(
      false,
    );
    expect(
      validate('CandidateApplicationDto', { ...application, submittedAt: '2026-10-20T12:00:00' }),
    ).toBe(false);
  });

  it('enforces application AND request version for CV review, plus a rejection reason', () => {
    expect(validate('ReviewCvChangeRequest', { applicationVersion: 3, requestVersion: 0 })).toBe(
      true,
    );
    expect(validate('ReviewCvChangeRequest', { requestVersion: 0 })).toBe(false);
    expect(validate('RejectCvChangeRequest', { applicationVersion: 3, requestVersion: 0 })).toBe(
      false,
    );
    expect(
      validate('RejectCvChangeRequest', {
        applicationVersion: 3,
        requestVersion: 0,
        reason: 'Invalid change',
      }),
    ).toBe(true);
  });

  it('allowlist mapping drops internal data at the root AND snapshot boundary', () => {
    const raw = {
      ...application,
      reason: 'INTERNAL',
      score: 5,
      storageKey: 'private/object',
      candidateSnapshot: { ...application.candidateSnapshot, passwordHash: 'PRIVATE' },
    };
    expect(validate('CandidateApplicationDto', raw)).toBe(false);
    const safe = toCandidateApplication(raw);
    expect(validate('CandidateApplicationDto', safe)).toBe(true);
    expect(JSON.stringify(safe)).not.toMatch(/INTERNAL|PRIVATE|passwordHash|storageKey|score/);
    expect(safe.candidateSnapshot).not.toBe(raw.candidateSnapshot);
  });

  it('keeps candidate history publicMessage separate from internal reason', () => {
    const raw: CandidateHistoryDto & { reason: string; note: string } = {
      id: fixture.data.applicationId,
      eventType: 'RESULT_PUBLISHED',
      fromStatus: 'INTERVIEWED',
      toStatus: 'REJECTED',
      oldCvId: null,
      newCvId: null,
      publicMessage: 'Cảm ơn bạn',
      createdAt: fixture.data.updatedAt,
      aggregateVersion: 5,
      reason: 'INTERNAL',
      note: 'INTERNAL NOTE',
    };
    const safe = toCandidateHistory(raw);
    expect(validate('CandidateHistoryDto', safe)).toBe(true);
    expect(JSON.stringify(safe)).not.toContain('INTERNAL');
    expect(safe.publicMessage).toBe('Cảm ơn bạn');
  });

  it('connects OpenAPI submit request/response to the same checked schemas', () => {
    const post = openapi.paths['/jobs/{id}/applications'].post;
    expect(post.requestBody.content['application/json'].schema.$ref).toBe(
      '../schemas/be2.v1.json#/definitions/SubmitApplicationRequest',
    );
    expect(post.responses['201'].content['application/json'].schema.$ref).toBe(
      '../schemas/be2.v1.json#/definitions/CandidateApplicationResponse',
    );
    expect(post.parameters.find((p) => p.name === 'Idempotency-Key')?.required).toBe(true);
  });
});

describe('BE2 event producer contract for BE3', () => {
  const id = fixture.data.applicationId;
  const examples = {
    'candidate.profile_updated': { candidateId: id },
    'cv.scan_requested': { cvId: id },
    'cv.delete_requested': { cvId: id },
    'application.submitted': { applicationId: id },
    'application.status_changed': { applicationId: id },
    'application.cv_replaced': { applicationId: id },
    'application.cv_change_requested': { applicationId: id },
    'application.cv_change_rejected': { applicationId: id },
    'application.withdrawn': { applicationId: id },
    'application.result_published': { applicationId: id },
    'saved_job.created': { candidateId: id, jobId: fixture.data.jobId },
    'saved_job.deleted': { candidateId: id, jobId: fixture.data.jobId },
  } satisfies Be2EventPayloads;

  it('accepts every declared event type with only reference IDs', () => {
    expect(Object.keys(examples).sort()).toEqual([...events.properties.eventType.enum].sort());
    for (const [eventType, payload] of Object.entries(examples)) {
      expect(validateEvent({ ...eventFixture, eventType, payload })).toBe(true);
    }
  });
  it('rejects private payload, wrong shape, unknown type and unsupported version', () => {
    for (const property of [
      'email',
      'score',
      'reason',
      'note',
      'token',
      'objectKey',
      'signedUrl',
    ]) {
      expect(
        validateEvent({
          ...eventFixture,
          payload: { ...eventFixture.payload, [property]: 'PRIVATE' },
        }),
      ).toBe(false);
    }
    expect(validateEvent({ ...eventFixture, eventType: 'cv.scan_requested' })).toBe(false);
    expect(validateEvent({ ...eventFixture, eventType: 'unknown' })).toBe(false);
    expect(validateEvent({ ...eventFixture, schemaVersion: 2 })).toBe(false);
  });
});

describe('UC14 saved job wire contract', () => {
  it('hides restricted job details and validates paging shape', () => {
    const page = {
      data: [
        {
          jobId: fixture.data.jobId,
          savedAt: fixture.data.updatedAt,
          available: false,
          acceptingApplications: false,
          title: null,
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1 },
    };
    expect(validate('SavedJobPage', page)).toBe(true);
    expect(
      validate('SavedJobPage', {
        ...page,
        data: [{ ...page.data[0], title: 'private', internalNote: 'secret' }],
      }),
    ).toBe(false);
  });
});

it('all optional wiring stubs fail closed rather than pretending the business implementation exists', async () => {
  for (const port of Object.values(unimplementedBe2Ports())) {
    for (const method of Object.values(port)) {
      await expect(Reflect.apply(method, undefined, [])).rejects.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
      });
    }
  }
});
