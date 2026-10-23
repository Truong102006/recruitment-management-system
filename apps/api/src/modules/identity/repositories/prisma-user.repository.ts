import { Inject, Injectable } from '@nestjs/common';
import { Prisma, UserAccount, UserRole } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';

export type UserWithRoles = UserAccount & { roles: UserRole[] };

@Injectable()
export class PrismaUserRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  private getClient(tx?: TransactionContext): Prisma.TransactionClient | PrismaService {
    return tx ? this.uow.clientFor(tx) : this.prisma;
  }

  async findByEmail(email: string, tx?: TransactionContext): Promise<UserWithRoles | null> {
    const client = this.getClient(tx);
    return client.userAccount.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async findById(id: string, tx?: TransactionContext): Promise<UserWithRoles | null> {
    const client = this.getClient(tx);
    return client.userAccount.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  async findByIdWithLock(id: string, tx: TransactionContext): Promise<UserWithRoles | null> {
    const client = this.uow.clientFor(tx);
    // Lock row with SELECT FOR UPDATE
    await client.$queryRaw`SELECT id FROM "user_account" WHERE id = ${id}::uuid FOR UPDATE`;
    return client.userAccount.findUnique({
      where: { id },
      include: { roles: true },
    });
  }

  async findByEmailWithLock(email: string, tx: TransactionContext): Promise<UserWithRoles | null> {
    const client = this.uow.clientFor(tx);
    await client.$queryRaw`SELECT id FROM "user_account" WHERE email = ${email} FOR UPDATE`;
    return client.userAccount.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async create(
    data: {
      email: string;
      passwordHash: string;
      fullName: string;
      roles: string[];
    },
    tx: TransactionContext,
  ): Promise<UserWithRoles> {
    const client = this.uow.clientFor(tx);
    return client.userAccount.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        roles: {
          create: data.roles.map((role) => ({ role })),
        },
      },
      include: { roles: true },
    });
  }

  async updatePasswordHash(
    id: string,
    passwordHash: string,
    tx: TransactionContext,
  ): Promise<UserAccount> {
    const client = this.uow.clientFor(tx);
    return client.userAccount.update({
      where: { id },
      data: {
        passwordHash,
        version: { increment: 1 },
      },
    });
  }

  async markEmailVerified(id: string, verifiedAt: Date, tx: TransactionContext): Promise<void> {
    await this.uow.clientFor(tx).userAccount.updateMany({
      where: { id, emailVerifiedAt: null },
      data: { emailVerifiedAt: verifiedAt, version: { increment: 1 } },
    });
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'LOCKED',
    lockedReason: string | null,
    tx: TransactionContext,
  ): Promise<UserAccount> {
    const client = this.uow.clientFor(tx);
    return client.userAccount.update({
      where: { id },
      data: {
        status,
        lockedReason,
        version: { increment: 1 },
      },
    });
  }

  async updateFullName(id: string, fullName: string, tx: TransactionContext): Promise<UserAccount> {
    const client = this.uow.clientFor(tx);
    return client.userAccount.update({
      where: { id },
      data: {
        fullName,
        version: { increment: 1 },
      },
    });
  }

  async countActiveAdmins(tx?: TransactionContext): Promise<number> {
    const client = this.getClient(tx);
    return client.userRole.count({
      where: {
        role: 'ADMIN',
        user: { status: 'ACTIVE' },
      },
    });
  }

  async addRole(userId: string, role: string, tx?: TransactionContext): Promise<void> {
    const client = this.getClient(tx);
    await client.userRole.upsert({
      where: {
        userId_role: { userId, role },
      },
      update: {},
      create: { userId, role },
    });
  }

  async getUserRoles(userId: string, tx?: TransactionContext): Promise<string[]> {
    const client = this.getClient(tx);
    const roles = await client.userRole.findMany({ where: { userId } });
    return roles.map((r) => r.role);
  }

  async listForAdmin(tx?: TransactionContext): Promise<UserWithRoles[]> {
    const client = this.getClient(tx);
    return client.userAccount.findMany({
      include: { roles: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
