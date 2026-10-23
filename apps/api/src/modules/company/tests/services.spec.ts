import { CreateCompanyService } from '../services/create-company.service';
import { CompanyService } from '../services/company.service';
import { CompanyMembershipService } from '../services/company-membership.service';
import { OwnerRecoveryService } from '../services/owner-recovery.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../../../../libs/platform/errors/domain.error';
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
describe('Company Services Unit Tests (Phase 4)', () => {
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

  const candidateActor: Actor = {
    userId: 'user-candidate-uuid',
    sessionId: 'session-candidate',
    roles: ['CANDIDATE'],
  };

  const adminActor: Actor = {
    userId: 'user-admin-uuid',
    sessionId: 'session-admin',
    roles: ['ADMIN'],
  };

  describe('CreateCompanyService', () => {
    let mockCompanyRepo: any;
    let mockMembershipRepo: any;
    let mockUserRepo: any;
    let mockOutboxPort: any;

    beforeEach(() => {
      mockCompanyRepo = {
        findByTaxCodeWithLock: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data: any) =>
          Promise.resolve({
            id: 'comp-uuid-1',
            ...data,
            approvalStatus: 'PENDING',
            rejectionReason: null,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      };
      mockMembershipRepo = {
        create: jest.fn().mockResolvedValue({}),
      };
      mockUserRepo = {
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: recruiterActor.userId,
          roles: [{ role: 'RECRUITER' }],
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        }),
      };
      mockOutboxPort = {
        append: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('rejects creation if actor is not RECRUITER or ADMIN', async () => {
      const service = creationService(mockCompanyRepo, mockMembershipRepo, mockUserRepo, mockUow);

      await expect(
        service.createCompany(candidateActor, {
          name: 'Tech Corp',
          taxCode: '0101234567',
          address: '123 Main St, Hanoi',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects duplicate tax code with ConflictError', async () => {
      mockCompanyRepo.findByTaxCodeWithLock.mockResolvedValue({ id: 'existing-id' });
      const service = creationService(mockCompanyRepo, mockMembershipRepo, mockUserRepo, mockUow);

      await expect(
        service.createCompany(recruiterActor, {
          name: 'Tech Corp',
          taxCode: '0101234567',
          address: '123 Main St, Hanoi',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates company in PENDING status with creator as OWNER and emits event', async () => {
      const service = creationService(
        mockCompanyRepo,
        mockMembershipRepo,
        mockUserRepo,
        mockUow,
        mockOutboxPort,
      );

      const result = await service.createCompany(recruiterActor, {
        name: 'Tech Corp',
        taxCode: '0101234567',
        address: '123 Main St, Hanoi',
      });

      expect(result).toMatchObject({
        id: 'comp-uuid-1',
        name: 'Tech Corp',
        taxCode: '0101234567',
        approvalStatus: 'PENDING',
      });
      expect(mockMembershipRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'comp-uuid-1',
          userId: recruiterActor.userId,
          role: 'OWNER',
        }),
        expect.anything(),
      );
      expect(mockOutboxPort.append).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'company.created',
          payload: {
            companyId: 'comp-uuid-1',
            ownerUserId: recruiterActor.userId,
          },
        }),
        expect.anything(),
      );
    });
  });

  describe('CompanyService', () => {
    let mockCompanyRepo: any;
    let mockMembershipRepo: any;

    beforeEach(() => {
      mockCompanyRepo = {
        findById: jest.fn().mockResolvedValue({
          id: 'comp-uuid-1',
          name: 'Tech Corp',
          taxCode: '0101234567',
          address: '123 Main St',
          website: null,
          description: null,
          approvalStatus: 'PENDING',
          rejectionReason: null,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: 'comp-uuid-1',
          approvalStatus: 'PENDING',
          version: 0,
        }),
        update: jest.fn().mockImplementation((id, ver, data) =>
          Promise.resolve({
            id,
            name: data.name ?? 'Tech Corp',
            taxCode: '0101234567',
            address: data.address ?? '123 Main St',
            website: null,
            description: null,
            approvalStatus: 'PENDING',
            rejectionReason: null,
            version: ver + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        resubmit: jest.fn().mockImplementation((id, ver) =>
          Promise.resolve({
            id,
            name: 'Tech Corp',
            taxCode: '0101234567',
            address: '123 Main St',
            website: null,
            description: null,
            approvalStatus: 'PENDING',
            rejectionReason: null,
            version: ver + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      };
      mockMembershipRepo = {
        findUnique: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      };
    });

    it('getCompanyDetail: allows active member to view company', async () => {
      const service = companyService(mockCompanyRepo, mockMembershipRepo, mockUow);
      const result = await service.getCompanyDetail(recruiterActor, 'comp-uuid-1');
      expect(result.id).toBe('comp-uuid-1');
      expect(result.name).toBe('Tech Corp');
    });

    it('getCompanyDetail: throws NotFoundError for outsider', async () => {
      mockMembershipRepo.findUnique.mockResolvedValue(null);
      const service = companyService(mockCompanyRepo, mockMembershipRepo, mockUow);
      await expect(service.getCompanyDetail(candidateActor, 'comp-uuid-1')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('updateCompany: allows owner to update company details', async () => {
      const service = companyService(mockCompanyRepo, mockMembershipRepo, mockUow);
      const result = await service.updateCompany(recruiterActor, 'comp-uuid-1', {
        name: 'New Name Corp',
        version: 0,
      });
      expect(result.name).toBe('New Name Corp');
      expect(result.version).toBe(1);
    });

    it('updateCompany: throws ForbiddenError for non-owner member', async () => {
      mockMembershipRepo.findUniqueWithLock.mockResolvedValue({
        role: 'RECRUITER',
        active: true,
      });
      const service = companyService(mockCompanyRepo, mockMembershipRepo, mockUow);
      await expect(
        service.updateCompany(recruiterActor, 'comp-uuid-1', {
          name: 'New Name Corp',
          version: 0,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('resubmitCompany: allows owner to resubmit REJECTED company', async () => {
      mockCompanyRepo.findByIdWithLock.mockResolvedValue({
        id: 'comp-uuid-1',
        approvalStatus: 'REJECTED',
        version: 0,
      });
      const service = companyService(mockCompanyRepo, mockMembershipRepo, mockUow);
      const result = await service.resubmitCompany(recruiterActor, 'comp-uuid-1', {
        version: 0,
      });
      expect(result.approvalStatus).toBe('PENDING');
    });
  });

  describe('CompanyMembershipService', () => {
    let mockCompanyRepo: any;
    let mockMembershipRepo: any;
    let mockUserRepo: any;
    let mockConflictPort: any;
    let mockInterviewPort: any;
    let mockOutboxPort: any;

    beforeEach(() => {
      mockCompanyRepo = {
        findByIdWithLock: jest.fn().mockResolvedValue({
          id: 'comp-uuid-1',
          approvalStatus: 'PENDING',
          version: 0,
        }),
        incrementVersion: jest.fn().mockResolvedValue(undefined),
      };
      mockMembershipRepo = {
        findUnique: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
        findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
        listByCompanyId: jest.fn().mockResolvedValue([
          {
            companyId: 'comp-uuid-1',
            userId: 'user-recruiter-uuid',
            role: 'OWNER',
            permissions: ['RECRUITER'],
            active: true,
            version: 0,
            createdAt: new Date(),
            user: {
              id: 'user-recruiter-uuid',
              email: 'recruiter@example.com',
              fullName: 'Recruiter Owner',
              status: 'ACTIVE',
              emailVerifiedAt: new Date(),
            },
          },
        ]),
        create: jest.fn().mockImplementation((data: any) =>
          Promise.resolve({
            ...data,
            version: 0,
            createdAt: new Date(),
          }),
        ),
        updateRoleAndStatus: jest.fn().mockImplementation((cid, uid, ver, data) =>
          Promise.resolve({
            companyId: cid,
            userId: uid,
            role: data.role ?? 'RECRUITER',
            permissions: data.permissions ?? ['RECRUITER'],
            active: data.active ?? true,
            version: ver + 1,
            createdAt: new Date(),
          }),
        ),
        transferOwnerAtomic: jest.fn().mockResolvedValue(undefined),
      };
      mockUserRepo = {
        findByEmailWithLock: jest.fn().mockResolvedValue({
          id: 'target-user-uuid',
          email: 'target@example.com',
          fullName: 'Target Member',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          roles: [{ role: 'CANDIDATE' }],
        }),
        findById: jest.fn().mockResolvedValue({
          id: 'target-user-uuid',
          email: 'target@example.com',
          fullName: 'Target Member',
        }),
        addRole: jest.fn().mockResolvedValue(undefined),
      };
      mockConflictPort = {
        hasOpenApplication: jest.fn().mockResolvedValue(false),
      };
      mockInterviewPort = {
        assertNoUnresolvedProposedOrConfirmed: jest.fn().mockResolvedValue(undefined),
      };
      mockOutboxPort = {
        append: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('addMember: creates new member and emits event', async () => {
      mockMembershipRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true }) // owner check
        .mockResolvedValueOnce(null); // target membership check (doesn't exist yet)

      const service = membershipService(
        mockCompanyRepo,
        mockMembershipRepo,
        mockUserRepo,
        mockUow,
        mockOutboxPort,
        mockConflictPort,
        mockInterviewPort,
      );

      const result = await service.addMember(recruiterActor, 'comp-uuid-1', {
        email: 'target@example.com',
        role: 'INTERVIEWER',
      });

      expect(result.userId).toBe('target-user-uuid');
      expect(result.role).toBe('INTERVIEWER');
      expect(mockOutboxPort.append).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'company.membership_changed',
        }),
        expect.anything(),
      );
    });

    it('addMember: rejects candidate with open application with ConflictError', async () => {
      mockMembershipRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true })
        .mockResolvedValueOnce(null);

      mockConflictPort.hasOpenApplication.mockResolvedValue(true);

      const service = membershipService(
        mockCompanyRepo,
        mockMembershipRepo,
        mockUserRepo,
        mockUow,
        mockOutboxPort,
        mockConflictPort,
        mockInterviewPort,
      );

      await expect(
        service.addMember(recruiterActor, 'comp-uuid-1', {
          email: 'target@example.com',
          role: 'RECRUITER',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('updateMember: rejects demoting the last available owner', async () => {
      mockMembershipRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true }) // owner check
        .mockResolvedValueOnce({ role: 'OWNER', active: true }); // target is the owner

      const service = membershipService(mockCompanyRepo, mockMembershipRepo, mockUserRepo, mockUow);

      await expect(
        service.updateMember(recruiterActor, 'comp-uuid-1', recruiterActor.userId, {
          role: 'RECRUITER',
          version: 0,
          companyVersion: 0,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('transferOwner: calls transferOwnerAtomic and emits events for both participants', async () => {
      mockMembershipRepo.findUniqueWithLock
        .mockResolvedValueOnce({ role: 'OWNER', active: true }) // actor check
        .mockResolvedValueOnce({ role: 'RECRUITER', active: true }); // target check

      const service = membershipService(
        mockCompanyRepo,
        mockMembershipRepo,
        mockUserRepo,
        mockUow,
        mockOutboxPort,
      );

      await service.transferOwner(recruiterActor, 'comp-uuid-1', {
        targetUserId: 'target-user-uuid',
        targetMemberVersion: 0,
        companyVersion: 0,
      });

      expect(mockMembershipRepo.transferOwnerAtomic).toHaveBeenCalledWith(
        'comp-uuid-1',
        recruiterActor.userId,
        'target-user-uuid',
        0,
        0,
        expect.anything(),
      );
      expect(mockOutboxPort.append).toHaveBeenCalledTimes(2);
    });
  });

  describe('OwnerRecoveryService', () => {
    let mockCompanyRepo: any;
    let mockMembershipRepo: any;
    let mockOutboxPort: any;

    beforeEach(() => {
      mockCompanyRepo = {
        findById: jest.fn().mockResolvedValue({ id: 'comp-uuid-1' }),
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'comp-uuid-1', version: 0 }),
        incrementVersion: jest.fn().mockResolvedValue(undefined),
      };
      mockMembershipRepo = {
        lockRecoveryAccount: jest.fn().mockResolvedValue(true),
        listByCompanyId: jest.fn().mockResolvedValue([
          {
            userId: 'user-recruiter-uuid',
            role: 'RECRUITER',
            active: true,
            version: 0,
            user: {
              id: 'user-recruiter-uuid',
              email: 'recruiter@example.com',
              fullName: 'Recruiter Member',
              status: 'ACTIVE',
              emailVerifiedAt: new Date(),
            },
          },
        ]),
        findUniqueWithLock: jest.fn().mockResolvedValue({
          role: 'RECRUITER',
          active: true,
          version: 0,
        }),
        updateRoleAndStatus: jest.fn().mockResolvedValue({}),
      };
      mockOutboxPort = {
        append: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('listEligibleOwners: returns eligible active verified members', async () => {
      const service = new OwnerRecoveryService(mockCompanyRepo, mockMembershipRepo);
      const eligible = await service.listEligibleOwners('comp-uuid-1');
      expect(eligible.length).toBe(1);
      expect(eligible[0]?.userId).toBe('user-recruiter-uuid');
    });

    it('recoverOwner: promotes target member to OWNER and advances versions', async () => {
      const service = new OwnerRecoveryService(mockCompanyRepo, mockMembershipRepo, mockOutboxPort);

      await service.recoverOwner(
        'comp-uuid-1',
        'user-recruiter-uuid',
        0,
        0,
        'Owner lost access',
        adminActor.userId,
        {
          company: { update: jest.fn().mockResolvedValue({}) },
        } as any,
      );

      expect(mockMembershipRepo.updateRoleAndStatus).toHaveBeenCalledWith(
        'comp-uuid-1',
        'user-recruiter-uuid',
        0,
        { role: 'OWNER', active: true },
        expect.anything(),
      );
      expect(mockOutboxPort.append).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'company.membership_changed',
          payload: expect.objectContaining({
            userId: 'user-recruiter-uuid',
            role: 'OWNER',
          }),
        }),
        expect.anything(),
      );
    });
  });
});
