import { JobApplicationAdapter } from '../ports/job-application.adapter';
import { JobVisibilityAdapter } from '../ports/job-visibility.adapter';
import { SkillCatalogAdapter } from '../ports/skill-catalog.adapter';
import { JobAdminAdapter } from '../ports/job-admin.adapter';
import { JobReportingFactsAdapter } from '../ports/job-reporting-facts.adapter';
import { JobReadService } from '../services/job-read.service';
import { PrismaSkillRepository } from '../repositories/prisma-skill.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';

describe('Job Module Branch Coverage Tests (Phase 5)', () => {
  describe('JobApplicationAdapter', () => {
    it('throws NotFoundError if job or company not found', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue(null),
      };
      const adapter = new JobApplicationAdapter(mockJobRepo, {} as any, {} as any);
      await expect(adapter.lockForSubmission('j-missing', 'cand-1', {} as any)).rejects.toThrow(
        NotFoundError,
      );

      mockJobRepo.findById.mockResolvedValue({ id: 'j-1', companyId: 'c-1' });
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const adapter2 = new JobApplicationAdapter(mockJobRepo, mockCompRepo, {} as any);
      await expect(adapter2.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws ConflictError if company is not APPROVED or has no available owners', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'PENDING' }),
      };
      const mockMemRepo: any = { countAvailableOwners: jest.fn().mockResolvedValue(1) };
      const adapter = new JobApplicationAdapter(mockJobRepo, mockCompRepo, mockMemRepo);
      await expect(adapter.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        ConflictError,
      );

      mockCompRepo.findByIdWithLock.mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' });
      mockMemRepo.countAvailableOwners.mockResolvedValue(0);
      await expect(adapter.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        ConflictError,
      );
    });

    it('throws ConflictError if candidate is active member of this company', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        countAvailableOwners: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue({ active: true, role: 'RECRUITER' }),
      };
      const adapter = new JobApplicationAdapter(mockJobRepo, mockCompRepo, mockMemRepo);
      await expect(adapter.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        ConflictError,
      );
    });

    it('throws ConflictError if job not PUBLISHED or deadline passed', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'j-1', companyId: 'c-1', status: 'DRAFT' }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        countAvailableOwners: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(null),
      };
      const adapter = new JobApplicationAdapter(mockJobRepo, mockCompRepo, mockMemRepo);
      await expect(adapter.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        ConflictError,
      );

      // Past deadline
      mockJobRepo.findByIdWithLock.mockResolvedValue({
        id: 'j-1',
        companyId: 'c-1',
        status: 'PUBLISHED',
        deadline: new Date('2020-01-01T00:00:00Z'),
      });
      await expect(adapter.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        ConflictError,
      );

      // Missing deadline
      mockJobRepo.findByIdWithLock.mockResolvedValue({
        id: 'j-1',
        companyId: 'c-1',
        status: 'PUBLISHED',
        deadline: null,
      });
      await expect(adapter.lockForSubmission('j-1', 'cand-1', {} as any)).rejects.toThrow(
        ConflictError,
      );
    });

    it('locks and returns eligibility if all conditions pass', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          status: 'PUBLISHED',
          deadline: new Date('2030-01-01T00:00:00Z'),
        }),
      };
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = {
        countAvailableOwners: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(null),
      };
      const adapter = new JobApplicationAdapter(mockJobRepo, mockCompRepo, mockMemRepo);
      const res = await adapter.lockForSubmission('j-1', 'cand-1', {} as any);
      expect(res.jobId).toBe('j-1');
      expect(res.companyId).toBe('c-1');
    });
  });

  describe('JobVisibilityAdapter', () => {
    it('returns available: false for nonexistent, unapproved, draft, or never-published closed jobs', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue(null),
      };
      const adapter = new JobVisibilityAdapter(mockJobRepo, {} as any, {} as any);
      expect(await adapter.getPublicOrPlaceholder('j-missing', {} as any, {} as any)).toEqual({
        available: false,
        jobId: 'j-missing',
      });

      mockJobRepo.findById.mockResolvedValue({ id: 'j-1', companyId: 'c-1', status: 'DRAFT' });
      const mockCompRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'PENDING' }),
      };
      const adapter2 = new JobVisibilityAdapter(mockJobRepo, mockCompRepo, {} as any);
      expect(await adapter2.getPublicOrPlaceholder('j-1', {} as any, {} as any)).toEqual({
        available: false,
        jobId: 'j-1',
      });

      // No available owners
      mockCompRepo.findById.mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' });
      const mockMemRepo: any = { countAvailableOwners: jest.fn().mockResolvedValue(0) };
      const adapter3 = new JobVisibilityAdapter(mockJobRepo, mockCompRepo, mockMemRepo);
      expect(await adapter3.getPublicOrPlaceholder('j-1', {} as any, {} as any)).toEqual({
        available: false,
        jobId: 'j-1',
      });

      // Draft job
      mockMemRepo.countAvailableOwners.mockResolvedValue(1);
      expect(await adapter3.getPublicOrPlaceholder('j-1', {} as any, {} as any)).toEqual({
        available: false,
        jobId: 'j-1',
      });

      // Closed never published
      mockJobRepo.findById.mockResolvedValue({
        id: 'j-1',
        companyId: 'c-1',
        status: 'CLOSED',
        publishedAt: null,
      });
      expect(await adapter3.getPublicOrPlaceholder('j-1', {} as any, {} as any)).toEqual({
        available: false,
        jobId: 'j-1',
      });
    });

    it('returns available: true with acceptingApplications flag', async () => {
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue({
          id: 'j-1',
          companyId: 'c-1',
          status: 'PUBLISHED',
          deadline: new Date('2030-01-01T00:00:00Z'),
          publishedAt: new Date(),
        }),
      };
      const mockCompRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'c-1', approvalStatus: 'APPROVED' }),
      };
      const mockMemRepo: any = { countAvailableOwners: jest.fn().mockResolvedValue(1) };

      const adapter = new JobVisibilityAdapter(mockJobRepo, mockCompRepo, mockMemRepo);
      const res = await adapter.getPublicOrPlaceholder('j-1', {} as any, {} as any);
      expect(res).toEqual({
        available: true,
        jobId: 'j-1',
        acceptingApplications: true,
      });

      // Closed but was published
      mockJobRepo.findById.mockResolvedValue({
        id: 'j-1',
        companyId: 'c-1',
        status: 'CLOSED',
        deadline: new Date('2020-01-01T00:00:00Z'),
        publishedAt: new Date(),
      });
      const resClosed = await adapter.getPublicOrPlaceholder('j-1', {} as any, {} as any);
      expect(resClosed).toEqual({
        available: true,
        jobId: 'j-1',
        acceptingApplications: false,
      });
    });
  });

  describe('SkillCatalogAdapter & Admin & Facts Adapters', () => {
    it('SkillCatalogAdapter delegates to repo', async () => {
      const mockRepo: any = { assertAllActive: jest.fn().mockResolvedValue(['sk-1']) };
      const adapter = new SkillCatalogAdapter(mockRepo);
      expect(await adapter.assertActiveSkills(['sk-1'], {} as any)).toEqual(['sk-1']);
    });

    it('JobAdminAdapter throws NotFoundError if job not found', async () => {
      const mockRepo: any = { findById: jest.fn().mockResolvedValue(null) };
      const adapter = new JobAdminAdapter(mockRepo, {} as any, { append: jest.fn() });
      await expect(adapter.closeJob('j-missing', 'reason', 0, {} as any)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('JobAdminAdapter closes job successfully', async () => {
      const mockRepo: any = {
        findById: jest.fn().mockResolvedValue({ id: 'j-1', companyId: 'c-1' }),
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'j-1', companyId: 'c-1', status: 'PUBLISHED' }),
        closeJob: jest.fn().mockResolvedValue({ id: 'j-1', status: 'CLOSED' }),
      };
      const adapter = new JobAdminAdapter(mockRepo, { findByIdWithLock: jest.fn() } as any, {
        append: jest.fn(),
      });
      await adapter.closeJob('j-1', 'reason', 0, {} as any);
      expect(mockRepo.closeJob).toHaveBeenCalledWith('j-1', 0, 'reason', expect.any(Date), {});
    });

    it('JobReportingFactsAdapter delegates to repo', async () => {
      const mockRepo: any = {
        getJobFacts: jest.fn().mockResolvedValue({ totalJobs: 5, publishedJobs: 3, closedJobs: 2 }),
      };
      const adapter = new JobReportingFactsAdapter(mockRepo);
      const facts = await adapter.getJobFacts('c-1', {} as any);
      expect(facts.totalJobs).toBe(5);
    });
  });

  describe('PrismaSkillRepository', () => {
    it('assertAllActive returns empty array when given empty list', async () => {
      const repo = new PrismaSkillRepository({} as any, {} as any);
      expect(await repo.assertAllActive([])).toEqual([]);
    });

    it('assertAllActive throws ValidationError when some skills missing or inactive', async () => {
      const mockPrisma: any = {
        skill: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'sk-1', active: true },
            { id: 'sk-2', active: false },
          ]),
        },
      };
      const repo = new PrismaSkillRepository(mockPrisma, {} as any);
      await expect(repo.assertAllActive(['sk-1', 'sk-2', 'sk-3'])).rejects.toThrow(ValidationError);
    });
  });

  describe('JobReadService edge cases', () => {
    it('getCompanyJobs throws NotFoundError when company not found', async () => {
      const mockCompRepo: any = { findById: jest.fn().mockResolvedValue(null) };
      const service = new JobReadService({} as any, {} as any, {} as any, mockCompRepo, {} as any);
      await expect(
        service.getCompanyJobs({ userId: 'u-1', roles: ['RECRUITER'] } as any, 'c-missing'),
      ).rejects.toThrow(NotFoundError);
    });

    it('getCompanyJobDetail throws NotFoundError when company or job not found', async () => {
      const mockCompRepo: any = { findById: jest.fn().mockResolvedValue(null) };
      const service = new JobReadService({} as any, {} as any, {} as any, mockCompRepo, {} as any);
      await expect(
        service.getCompanyJobDetail({ userId: 'u-1', roles: ['ADMIN'] } as any, 'c-missing', 'j-1'),
      ).rejects.toThrow(NotFoundError);

      mockCompRepo.findById.mockResolvedValue({ id: 'c-1' });
      const mockJobRepo: any = {
        clock: jest.fn().mockResolvedValue(new Date()),
        findById: jest.fn().mockResolvedValue(null),
      };
      const mockMemRepo: any = {
        findUnique: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };
      const service2 = new JobReadService(
        mockJobRepo,
        {} as any,
        {} as any,
        mockCompRepo,
        mockMemRepo,
      );
      await expect(
        service2.getCompanyJobDetail(
          { userId: 'u-1', roles: ['ADMIN'] } as any,
          'c-1',
          'j-missing',
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
