import { CreateJobService } from '../services/create-job.service';
import { UpdateJobService } from '../services/update-job.service';
import { PublishJobService } from '../services/publish-job.service';
import { CloseJobService } from '../services/close-job.service';
import { JobReadService } from '../services/job-read.service';
import { Actor } from '../../../../../../libs/contracts/backend';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';

describe('Job Services Unit Tests', () => {
  const actor: Actor = {
    userId: 'u-1',
    sessionId: 's-1',
    roles: ['RECRUITER'],
  };

  const mockUow: any = {
    run: jest.fn().mockImplementation((fn) => fn('mock-tx')),
  };

  describe('CreateJobService', () => {
    it('creates draft job and attaches skills', async () => {
      const mockCompRepo: any = {
        findById: jest
          .fn()
          .mockResolvedValue({ id: 'c-1', name: 'Acme', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        findUnique: jest.fn().mockResolvedValue({ role: 'RECRUITER', active: true }),
      };
      const mockSkillRepo: any = {
        assertAllActive: jest.fn().mockResolvedValue(['sk-1']),
      };
      const mockJobRepo: any = {
        create: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          title: 'Senior Software Engineer',
          status: 'DRAFT',
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          skills: [{ skill: { id: 'sk-1', name: 'TypeScript', active: true } }],
        }),
        setSkills: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          title: 'Senior Software Engineer',
          status: 'DRAFT',
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          skills: [{ skill: { id: 'sk-1', name: 'TypeScript', active: true } }],
        }),
      };

      const service = createJobService(
        mockJobRepo,
        mockSkillRepo,
        mockCompRepo,
        mockMemRepo,
        mockUow,
      );
      const res = await service.createDraft(actor, {
        companyId: 'c-1',
        title: 'Senior Software Engineer',
        skillIds: ['sk-1'],
      });

      expect(res.id).toBe('j-1');
      expect(res.companyName).toBe('Acme');
      expect(res.status).toBe('DRAFT');
      expect(mockJobRepo.create).toHaveBeenCalled();
      expect(mockJobRepo.setSkills).toHaveBeenCalled();
    });

    it('throws NotFoundError if company does not exist', async () => {
      const mockCompRepo: any = { findById: jest.fn().mockResolvedValue(null) };
      const service = createJobService({} as any, {} as any, mockCompRepo, {} as any, mockUow);
      await expect(service.createDraft(actor, { companyId: 'c-missing' })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('UpdateJobService', () => {
    it('updates draft job with optimistic concurrency check', async () => {
      const mockJobRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          status: 'DRAFT',
          version: 0,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          title: 'Updated Title Here',
          status: 'DRAFT',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          skills: [],
        }),
      };
      const mockCompRepo: any = {
        findById: jest
          .fn()
          .mockResolvedValue({ id: 'c-1', name: 'Acme', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        findUnique: jest.fn().mockResolvedValue({ role: 'RECRUITER', active: true }),
      };
      const mockSkillRepo: any = {
        assertAllActive: jest.fn().mockResolvedValue([]),
      };

      const service = updateJobService(
        mockJobRepo,
        mockSkillRepo,
        mockCompRepo,
        mockMemRepo,
        mockUow,
      );
      const res = await service.updateJob(actor, 'j-1', {
        version: 0,
        title: 'Updated Title Here',
      });

      expect(res.version).toBe(1);
      expect(mockJobRepo.update).toHaveBeenCalledWith('j-1', 0, expect.anything(), 'mock-tx');
    });

    it('throws ConflictError on version mismatch', async () => {
      const mockJobRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'j-1', version: 3 }),
      };
      const service = updateJobService(mockJobRepo, {} as any, {} as any, {} as any, mockUow);
      await expect(service.updateJob(actor, 'j-1', { version: 0 })).rejects.toThrow(ConflictError);
    });
  });

  describe('PublishJobService', () => {
    it.each([100, 99])(
      'normalizes legacy draft text before publication, validating description of %i code points',
      async (descriptionLength) => {
        const legacyJob = {
          id: 'j-legacy',
          companyId: 'c-1',
          status: 'DRAFT',
          version: 0,
          title: `  ${'e\u0301'.repeat(10)}  `,
          description: `  ${'e\u0301'.repeat(descriptionLength)}  `,
          location: '  Đa\u0300 Na\u0306\u0303ng  ',
          headcount: 1,
          jobType: 'FULL_TIME',
          workplaceMode: 'ON_SITE',
          deadline: new Date(Date.now() + 86_400_000),
          salaryMin: null,
          salaryMax: null,
          currency: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          skills: [],
        };
        const jobs: any = {
          findById: jest.fn().mockResolvedValue(legacyJob),
          findByIdWithLock: jest.fn().mockResolvedValue(legacyJob),
          update: jest.fn().mockImplementation(async (_id, _version, data) => ({
            ...legacyJob,
            ...data,
            version: 1,
          })),
        };
        const companies: any = {
          findByIdWithLock: jest
            .fn()
            .mockResolvedValue({ id: 'c-1', name: 'Company', approvalStatus: 'APPROVED' }),
        };
        const memberships: any = {
          findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
        };
        const events = { append: jest.fn() };
        const service = publishJobService(jobs, companies, memberships, mockUow, events);
        if (descriptionLength === 99) {
          await expect(service.publishJob(actor, legacyJob.id, { version: 0 })).rejects.toThrow(
            ValidationError,
          );
          expect(jobs.update).not.toHaveBeenCalled();
          expect(events.append).not.toHaveBeenCalled();
          return;
        }
        const result = await service.publishJob(actor, legacyJob.id, { version: 0 });
        expect(jobs.update).toHaveBeenCalledWith(
          legacyJob.id,
          0,
          expect.objectContaining({
            title: 'é'.repeat(10),
            description: 'é'.repeat(100),
            location: 'Đà Nẵng',
            status: 'PUBLISHED',
            publishedAt: expect.any(Date),
          }),
          'mock-tx',
        );
        expect(result).toMatchObject({
          title: 'é'.repeat(10),
          description: 'é'.repeat(100),
          location: 'Đà Nẵng',
          version: 1,
        });
        expect(events.append).toHaveBeenCalledTimes(1);
      },
    );

    it('publishes valid draft job and emits outbox event', async () => {
      const mockJobRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          title: 'Senior Software Engineer',
          description:
            'We are seeking an experienced Senior Software Engineer with strong skills in TypeScript, Node.js, and distributed systems architecture.'.padEnd(
              120,
              '.',
            ),
          location: 'Ho Chi Minh City',
          headcount: 2,
          jobType: 'FULL_TIME',
          workplaceMode: 'HYBRID',
          deadline: new Date('2026-11-20T00:00:00Z'),
          salaryMin: 2000,
          salaryMax: 4000,
          currency: 'USD',
          status: 'DRAFT',
          version: 0,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          title: 'Senior Software Engineer',
          status: 'PUBLISHED',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          skills: [],
        }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'c-1', name: 'Acme', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
        countAvailableOwners: jest.fn().mockResolvedValue(1),
      };
      const mockOutbox: any = { append: jest.fn().mockResolvedValue(undefined) };

      const service = publishJobService(
        mockJobRepo,
        mockCompRepo,
        mockMemRepo,
        mockUow,
        mockOutbox,
      );
      const res = await service.publishJob(actor, 'j-1', { version: 0 });

      expect(res.status).toBe('PUBLISHED');
      expect(mockOutbox.append).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'job.published' }),
        'mock-tx',
      );
    });

    it('rejects publication if no available active owner remains', async () => {
      const mockJobRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1', version: 0 }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'RECRUITER', active: true }),
        countAvailableOwners: jest.fn().mockResolvedValue(0),
      };

      const service = publishJobService(mockJobRepo, mockCompRepo, mockMemRepo, mockUow, {
        append: jest.fn().mockResolvedValue(undefined),
      });
      await expect(service.publishJob(actor, 'j-1', { version: 0 })).rejects.toThrow(ConflictError);
    });
  });

  describe('CloseJobService', () => {
    it('permanently closes a job and emits outbox event', async () => {
      const mockJobRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          status: 'PUBLISHED',
          version: 1,
        }),
        closeJob: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          status: 'CLOSED',
          closeReason: 'Position filled',
          version: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          skills: [],
        }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'c-1', name: 'Acme', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };
      const mockOutbox: any = { append: jest.fn().mockResolvedValue(undefined) };

      const service = closeJobService(mockJobRepo, mockCompRepo, mockMemRepo, mockUow, mockOutbox);
      const res = await service.closeJob(actor, 'j-1', { version: 1, reason: 'Position filled' });

      expect(res.status).toBe('CLOSED');
      expect(mockOutbox.append).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'job.closed' }),
        'mock-tx',
      );
    });

    it('rejects closing if reason is empty', async () => {
      const service = closeJobService({} as any, {} as any, {} as any, mockUow, {
        append: jest.fn().mockResolvedValue(undefined),
      });
      await expect(service.closeJob(actor, 'j-1', { version: 0, reason: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('rejects closing an already CLOSED job', async () => {
      const mockJobRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'j-1', companyId: 'c-1', status: 'CLOSED', version: 1 }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };

      const service = closeJobService(mockJobRepo, mockCompRepo, mockMemRepo, mockUow, {
        append: jest.fn().mockResolvedValue(undefined),
      });
      await expect(
        service.closeJob(actor, 'j-1', { version: 1, reason: 'Filled' }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('JobReadService', () => {
    it('getPublicJobDetail throws NotFoundError if job not found or not public', async () => {
      const mockJobQueryRepo: any = { findPublicJobDetail: jest.fn().mockResolvedValue(null) };
      const service = new JobReadService(
        {} as any,
        {} as any,
        mockJobQueryRepo,
        {} as any,
        {} as any,
      );
      await expect(service.getPublicJobDetail('j-missing')).rejects.toThrow(NotFoundError);
    });

    it('getActiveSkills returns mapped skill dtos', async () => {
      const mockSkillRepo: any = {
        listActiveSkills: jest
          .fn()
          .mockResolvedValue([
            { id: 'sk-1', name: 'TypeScript', category: 'Backend', active: true },
          ]),
      };
      const service = new JobReadService({} as any, mockSkillRepo, {} as any, {} as any, {} as any);
      const skills = await service.getActiveSkills();
      expect(skills).toEqual([
        { id: 'sk-1', name: 'TypeScript', category: 'Backend', active: true },
      ]);
    });
  });
});

function createJobService(...args: any[]): CreateJobService {
  const memberships = args[3];
  memberships.countAvailableOwners ??= jest.fn().mockResolvedValue(1);
  memberships.lockRecoveryAccount ??= jest.fn().mockResolvedValue(true);
  memberships.findUniqueWithLock ??= memberships.findUnique;
  const companies = args[2];
  companies.findByIdWithLock ??=
    companies.findById ?? jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' });
  args[0].findById ??= args[0].findByIdWithLock;
  return new CreateJobService(...(args as ConstructorParameters<typeof CreateJobService>));
}

function updateJobService(...args: any[]): UpdateJobService {
  const memberships = args[3];
  memberships.countAvailableOwners ??= jest.fn().mockResolvedValue(1);
  memberships.lockRecoveryAccount ??= jest.fn().mockResolvedValue(true);
  memberships.findUniqueWithLock ??= memberships.findUnique;
  const companies = args[2];
  companies.findByIdWithLock ??=
    companies.findById ?? jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' });
  args[0].findById ??= args[0].findByIdWithLock;
  return new UpdateJobService(...(args as ConstructorParameters<typeof UpdateJobService>));
}

function publishJobService(...args: any[]): PublishJobService {
  const memberships = args[2];
  memberships.countAvailableOwners ??= jest.fn().mockResolvedValue(1);
  memberships.lockRecoveryAccount ??= jest.fn().mockResolvedValue(true);
  memberships.findUniqueWithLock ??= memberships.findUnique;
  const companies = args[1];
  companies.findByIdWithLock ??=
    companies.findById ?? jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' });
  args[0].findById ??= args[0].findByIdWithLock;
  return new PublishJobService(...(args as ConstructorParameters<typeof PublishJobService>));
}

function closeJobService(...args: any[]): CloseJobService {
  const memberships = args[2];
  memberships.countAvailableOwners ??= jest.fn().mockResolvedValue(1);
  memberships.lockRecoveryAccount ??= jest.fn().mockResolvedValue(true);
  memberships.findUniqueWithLock ??= memberships.findUnique;
  const companies = args[1];
  companies.findByIdWithLock ??=
    companies.findById ?? jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' });
  args[0].findById ??= args[0].findByIdWithLock;
  return new CloseJobService(...(args as ConstructorParameters<typeof CloseJobService>));
}
