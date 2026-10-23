import { Inject, Injectable } from '@nestjs/common';
import { CompanyMembership, Prisma, UserAccount } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ConflictError } from '../../../../../../libs/platform/errors/domain.error';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { Tx } from '../../../../../../libs/contracts/backend';

export type MembershipWithUser = CompanyMembership & {
  user: Pick<UserAccount, 'id' | 'email' | 'fullName' | 'status' | 'emailVerifiedAt'>;
};

@Injectable()
export class PrismaCompanyMembershipRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  private getClient(tx?: Tx): Prisma.TransactionClient | PrismaService {
    return tx ? this.uow.clientFor(tx as TransactionContext) : this.prisma;
  }

  public async create(
    data: {
      companyId: string;
      userId: string;
      role: string;
      permissions: string[];
      active: boolean;
    },
    tx?: Tx,
  ): Promise<CompanyMembership> {
    const client = this.getClient(tx);
    return client.companyMembership.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        role: data.role,
        permissions: data.permissions,
        active: data.active,
        version: 0,
      },
    });
  }

  public async findUnique(
    companyId: string,
    userId: string,
    tx?: Tx,
  ): Promise<CompanyMembership | null> {
    const client = this.getClient(tx);
    return client.companyMembership.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });
  }

  public async findUniqueWithLock(
    companyId: string,
    userId: string,
    tx: Tx,
  ): Promise<CompanyMembership | null> {
    const client = this.getClient(tx);
    const rows = await client.$queryRaw<CompanyMembership[]>`
      SELECT company_id as "companyId", user_id as "userId", role, permissions, active,
             version, created_at as "createdAt", updated_at as "updatedAt"
      FROM company_membership
      WHERE company_id = ${companyId}::uuid AND user_id = ${userId}::uuid
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  public async listByCompanyId(companyId: string, tx?: Tx): Promise<MembershipWithUser[]> {
    const client = this.getClient(tx);
    return client.companyMembership.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            status: true,
            emailVerifiedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async countActiveOwners(companyId: string, tx?: Tx): Promise<number> {
    const client = this.getClient(tx);
    return client.companyMembership.count({
      where: {
        companyId,
        role: 'OWNER',
        active: true,
        user: {
          status: 'ACTIVE',
        },
      },
    });
  }

  public async countAvailableOwners(companyId: string, tx?: Tx): Promise<number> {
    return this.getClient(tx).companyMembership.count({
      where: {
        companyId,
        role: 'OWNER',
        active: true,
        user: { status: 'ACTIVE', emailVerifiedAt: { not: null } },
      },
    });
  }

  public async lockRecoveryAccount(userId: string, tx: Tx): Promise<boolean> {
    const client = this.getClient(tx);
    await client.$queryRaw`SELECT id FROM user_account WHERE id = ${userId}::uuid FOR UPDATE`;
    const user = await client.userAccount.findUnique({
      where: { id: userId },
      select: { status: true, emailVerifiedAt: true },
    });
    return user?.status === 'ACTIVE' && user.emailVerifiedAt !== null;
  }

  public async updateRoleAndStatus(
    companyId: string,
    userId: string,
    expectedVersion: number,
    data: {
      role?: string;
      permissions?: string[];
      active?: boolean;
    },
    tx: Tx,
  ): Promise<CompanyMembership> {
    const client = this.getClient(tx);
    const updateData: Prisma.CompanyMembershipUpdateManyMutationInput = {
      version: { increment: 1 },
      updatedAt: new Date(),
    };
    if (data.role !== undefined) updateData.role = data.role;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.active !== undefined) updateData.active = data.active;

    const result = await client.companyMembership.updateMany({
      where: {
        companyId,
        userId,
        version: expectedVersion,
      },
      data: updateData,
    });

    if (result.count === 0) {
      throw new ConflictError(
        'Company member was concurrently modified or version mismatch',
        'STALE_VERSION',
      );
    }

    return (await client.companyMembership.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    }))!;
  }

  public async transferOwnerAtomic(
    companyId: string,
    currentOwnerId: string,
    targetUserId: string,
    targetMemberVersion: number,
    companyVersion: number,
    tx: Tx,
  ): Promise<void> {
    const client = this.getClient(tx);

    // 1. Advance company version
    const compResult = await client.company.updateMany({
      where: { id: companyId, version: companyVersion },
      data: {
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    if (compResult.count === 0) {
      throw new ConflictError(
        'Company version mismatch during ownership transfer',
        'STALE_VERSION',
      );
    }

    // 2. Demote current owner to RECRUITER
    const demoteResult = await client.companyMembership.updateMany({
      where: {
        companyId,
        userId: currentOwnerId,
        role: 'OWNER',
      },
      data: {
        role: 'RECRUITER',
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    if (demoteResult.count === 0) {
      throw new ConflictError('Current user is no longer OWNER during transfer', 'TRANSFER_FAILED');
    }

    // 3. Promote target member to OWNER
    const promoteResult = await client.companyMembership.updateMany({
      where: {
        companyId,
        userId: targetUserId,
        version: targetMemberVersion,
      },
      data: {
        role: 'OWNER',
        active: true,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    if (promoteResult.count === 0) {
      throw new ConflictError(
        'Target member version mismatch or member not found during transfer',
        'STALE_VERSION',
      );
    }
  }
}
