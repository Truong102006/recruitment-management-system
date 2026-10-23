import { CreateCompanyService } from '../services/create-company.service';
import { CompanyService } from '../services/company.service';
import { CompanyMembershipService } from '../services/company-membership.service';
import { OwnerRecoveryService } from '../services/owner-recovery.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import { Prisma } from '@prisma/client';
import type { Actor } from '../../../../../../libs/contracts/backend';

function companyService(...args: any[]): CompanyService {
  args[1].lockRecoveryAccount ??= jest.fn().mockResolvedValue(true);
  return new CompanyService(args[0], args[1], args[2], args[3]);
}
function creationService(...args: any[]): CreateCompanyService {
  args[4] ??= { append: jest.fn().mockResolvedValue(undefined) };
  return new CreateCompanyService(args[0], args[1], args[2], args[3], args[4]);
}
function membershipService(...args: any[]): CompanyMembershipService {
  args[4] ??= { append: jest.fn().mockResolvedValue(undefined) };
  args[5] ??= { hasOpenApplication: jest.fn().mockResolvedValue(false) };
  args[6] ??= { assertNoUnresolvedProposedOrConfirmed: jest.fn().mockResolvedValue(undefined) };
  args[2].findByEmail = jest.fn().mockImplementation(async (email: string) => {
    const target = args[2].findByEmailWithLock
      ? await args[2].findByEmailWithLock(email)
      : { status: 'ACTIVE', emailVerifiedAt: new Date(), roles: [] };
    return target ? { ...target, id: target.id ?? 'u-target', email } : null;
  });
  args[2].findByIdWithLock ??= jest.fn().mockImplementation(async (id: string) => {
    const target = args[2].findByEmail.mock.results[0]
      ? await args[2].findByEmail.mock.results[0].value
      : null;
    return target && target.id === id
      ? target
      : { id, status: 'ACTIVE', emailVerifiedAt: new Date(), roles: [{ role: 'RECRUITER' }] };
  });
  args[2].findById ??= args[2].findByIdWithLock;
  return new CompanyMembershipService(
    args[0],
    args[1],
    args[2],
    args[3],
    args[4],
    args[5],
    args[6],
  );
}
describe('Company Branch Coverage Tests (Phase 4)', () => {
  const mockUow: any = {
    run: jest.fn(async (cb: any) =>
      cb({
        userRole: {
          create: jest.fn().mockResolvedValue({}),
          findMany: jest.fn().mockResolvedValue([{ role: 'CANDIDATE' }]),
        },
        company: {
          update: jest.fn().mockResolvedValue({}),
        },
      }),
    ),
    clientFor: jest.fn((tx) => tx),
  };

  const recruiterActor: Actor = {
    userId: 'user-recruiter-uuid',
    sessionId: 'session-recruiter',
    roles: ['RECRUITER'],
  };

  describe('CreateCompanyService edge branches', () => {
    it('throws UnauthorizedError when actor is missing', async () => {
      const service = creationService({} as any, {} as any, {} as any, mockUow);
      await expect(
        service.createCompany(null as any, { name: 'A', taxCode: '0101234567', address: '123 St' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws ForbiddenError when user account is not active', async () => {
      const mockUserRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ status: 'LOCKED' }),
      };
      const service = creationService({} as any, {} as any, mockUserRepo, mockUow);
      await expect(
        service.createCompany(recruiterActor, {
          name: 'A',
          taxCode: '0101234567',
          address: '123 St',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('catches P2002 Prisma error and throws ConflictError', async () => {
      const throwingUow: any = {
        run: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '6.19.0',
          }),
        ),
        clientFor: jest.fn(),
      };
      const service = creationService({} as any, {} as any, {} as any, throwingUow);
      await expect(
        service.createCompany(recruiterActor, {
          name: 'A',
          taxCode: '0101234567',
          address: '123 St',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('CompanyService edge branches', () => {
    it('getCompanyDetail throws NotFoundError when company does not exist', async () => {
      const mockCompRepo: any = { findById: jest.fn().mockResolvedValue(null) };
      const service = companyService(mockCompRepo, {} as any, mockUow);
      await expect(service.getCompanyDetail(recruiterActor, 'unknown-comp')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('updateCompany throws NotFoundError when company not found under lock', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const service = companyService(mockCompRepo, {} as any, mockUow);
      await expect(
        service.updateCompany(recruiterActor, 'unknown-comp', { version: 0 }),
      ).rejects.toThrow(NotFoundError);
    });

    it('resubmitCompany throws NotFoundError when company not found under lock', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const service = companyService(mockCompRepo, {} as any, mockUow);
      await expect(
        service.resubmitCompany(recruiterActor, 'unknown-comp', { version: 0 }),
      ).rejects.toThrow(NotFoundError);
    });

    it('updateCompany handles description and website null or string update', async () => {
      const mockCompRepo: any = {
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'c-1', approvalStatus: 'PENDING', version: 0 }),
        update: jest.fn().mockImplementation((id, ver, data) =>
          Promise.resolve({
            id,
            name: data.name ?? 'A',
            taxCode: '0101234567',
            address: data.address ?? '123 St',
            website: data.website ?? null,
            description: data.description ?? null,
            approvalStatus: 'PENDING',
            rejectionReason: null,
            version: ver + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };
      const service = companyService(mockCompRepo, mockMemRepo, mockUow);
      const res = await service.updateCompany(recruiterActor, 'c-1', {
        version: 0,
        address: '456 New St',
        website: 'https://example.com',
        description: 'New desc',
      });
      expect(res.address).toBe('456 New St');
      expect(res.website).toBe('https://example.com');
    });
  });

  describe('CompanyMembershipService edge branches', () => {
    it('listMembers throws NotFoundError when membership is inactive', async () => {
      const mockMemRepo: any = {
        findUnique: jest.fn().mockResolvedValue({ active: false }),
      };
      const service = membershipService({} as any, mockMemRepo, {} as any, mockUow);
      await expect(service.listMembers(recruiterActor, 'c-1')).rejects.toThrow(NotFoundError);
    });

    it('addMember throws NotFoundError if company not found', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const service = membershipService(mockCompRepo, {} as any, {} as any, mockUow);
      await expect(
        service.addMember(recruiterActor, 'c-1', { email: 't@ex.com', role: 'RECRUITER' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('addMember throws ValidationError if target user is not ACTIVE', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1' }) };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };
      const mockUserRepo: any = {
        findByEmailWithLock: jest.fn().mockResolvedValue({ status: 'LOCKED' }),
      };
      const service = membershipService(mockCompRepo, mockMemRepo, mockUserRepo, mockUow);
      await expect(
        service.addMember(recruiterActor, 'c-1', { email: 't@ex.com', role: 'RECRUITER' }),
      ).rejects.toThrow(ValidationError);
    });

    it('addMember reactivates inactive existing membership', async () => {
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', version: 0 }),
        incrementVersion: jest.fn().mockResolvedValue(1),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest
          .fn()
          .mockResolvedValueOnce({ role: 'OWNER', active: true })
          .mockResolvedValueOnce({ role: 'RECRUITER', active: false, version: 1 }),
        updateRoleAndStatus: jest.fn().mockResolvedValue({
          companyId: 'c-1',
          userId: 'u-target',
          role: 'INTERVIEWER',
          permissions: ['INTERVIEWER'],
          active: true,
          version: 2,
          createdAt: new Date(),
        }),
      };
      const mockUserRepo: any = {
        findByEmailWithLock: jest.fn().mockResolvedValue({
          id: 'u-target',
          email: 't@ex.com',
          fullName: 'Target',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          roles: [{ role: 'INTERVIEWER' }],
        }),
        addRole: jest.fn().mockResolvedValue(undefined),
      };
      const service = membershipService(mockCompRepo, mockMemRepo, mockUserRepo, mockUow);
      const res = await service.addMember(recruiterActor, 'c-1', {
        email: 't@ex.com',
        role: 'INTERVIEWER',
      });
      expect(res.active).toBe(true);
      expect(mockMemRepo.updateRoleAndStatus).toHaveBeenCalled();
    });

    it('updateMember throws NotFoundError if company not found or version mismatch', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const service = membershipService(mockCompRepo, {} as any, {} as any, mockUow);
      await expect(
        service.updateMember(recruiterActor, 'c-1', 'u-2', { version: 0, companyVersion: 0 }),
      ).rejects.toThrow(NotFoundError);

      mockCompRepo.findByIdWithLock.mockResolvedValue({ id: 'c-1', version: 5 });
      await expect(
        service.updateMember(recruiterActor, 'c-1', 'u-2', { version: 0, companyVersion: 0 }),
      ).rejects.toThrow(ConflictError);
    });

    it('updateMember throws NotFoundError if target member does not exist', async () => {
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', version: 0 }),
      };
      const mockMemRepo: any = {
        findUniqueWithLock: jest
          .fn()
          .mockResolvedValueOnce({ role: 'OWNER', active: true })
          .mockResolvedValueOnce(null),
      };
      const service = membershipService(mockCompRepo, mockMemRepo, {} as any, mockUow);
      await expect(
        service.updateMember(recruiterActor, 'c-1', 'u-unknown', { version: 0, companyVersion: 0 }),
      ).rejects.toThrow(NotFoundError);
    });

    it('transferOwner edge checks: company not found, target not found, inactive target, already owner', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const mockMemRepo: any = {
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };
      const service = membershipService(mockCompRepo, mockMemRepo, {} as any, mockUow);

      // Company not found
      await expect(
        service.transferOwner(recruiterActor, 'c-1', {
          targetUserId: 'u-2',
          targetMemberVersion: 0,
          companyVersion: 0,
        }),
      ).rejects.toThrow(NotFoundError);

      // Target not found
      mockCompRepo.findByIdWithLock.mockResolvedValue({ id: 'c-1' });
      mockMemRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true })
        .mockResolvedValueOnce(null);
      await expect(
        service.transferOwner(recruiterActor, 'c-1', {
          targetUserId: 'u-2',
          targetMemberVersion: 0,
          companyVersion: 0,
        }),
      ).rejects.toThrow(NotFoundError);

      // Target inactive
      mockMemRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true })
        .mockResolvedValueOnce({ role: 'RECRUITER', active: false });
      await expect(
        service.transferOwner(recruiterActor, 'c-1', {
          targetUserId: 'u-2',
          targetMemberVersion: 0,
          companyVersion: 0,
        }),
      ).rejects.toThrow(ConflictError);

      // Target already owner
      mockMemRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true })
        .mockResolvedValueOnce({ role: 'OWNER', active: true });
      await expect(
        service.transferOwner(recruiterActor, 'c-1', {
          targetUserId: 'u-2',
          targetMemberVersion: 0,
          companyVersion: 0,
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('OwnerRecoveryService edge branches', () => {
    it('listEligibleOwners throws NotFoundError when company not found', async () => {
      const mockCompRepo: any = { findById: jest.fn().mockResolvedValue(null) };
      const service = new OwnerRecoveryService(mockCompRepo, {
        lockRecoveryAccount: jest.fn().mockResolvedValue(true),
      } as any);
      await expect(service.listEligibleOwners('c-unknown')).rejects.toThrow(NotFoundError);
    });

    it('recoverOwner throws NotFoundError if company not found or version mismatch', async () => {
      const mockCompRepo: any = { findByIdWithLock: jest.fn().mockResolvedValue(null) };
      const service = new OwnerRecoveryService(mockCompRepo, {
        lockRecoveryAccount: jest.fn().mockResolvedValue(true),
      } as any);
      await expect(
        service.recoverOwner('c-1', 'u-1', 0, 0, 'reason', 'admin-id', {} as any),
      ).rejects.toThrow(NotFoundError);

      mockCompRepo.findByIdWithLock.mockResolvedValue({ id: 'c-1', version: 3 });
      await expect(
        service.recoverOwner('c-1', 'u-1', 0, 0, 'reason', 'admin-id', {} as any),
      ).rejects.toThrow(ConflictError);
    });

    it('recoverOwner throws NotFoundError if target member not found or inactive', async () => {
      const mockCompRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'c-1', version: 0 }),
      };
      const mockMemRepo: any = {
        lockRecoveryAccount: jest.fn().mockResolvedValue(true),
        findUniqueWithLock: jest.fn().mockResolvedValue(null),
      };
      const service = new OwnerRecoveryService(mockCompRepo, mockMemRepo);
      await expect(
        service.recoverOwner('c-1', 'u-1', 0, 0, 'reason', 'admin-id', {} as any),
      ).rejects.toThrow(NotFoundError);

      mockMemRepo.findUniqueWithLock.mockResolvedValue({ active: false });
      await expect(
        service.recoverOwner('c-1', 'u-1', 0, 0, 'reason', 'admin-id', {} as any),
      ).rejects.toThrow(ConflictError);
    });
  });
});
