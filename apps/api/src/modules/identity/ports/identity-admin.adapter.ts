import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IdentityAdminPort, Tx, Actor } from '../../../../../../libs/contracts/backend';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../../../../libs/platform/errors/domain.error';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import { PrismaSessionRepository } from '../repositories/prisma-session.repository';

@Injectable()
export class IdentityAdminAdapter implements IdentityAdminPort {
  constructor(
    private readonly users: PrismaUserRepository,
    private readonly sessions: PrismaSessionRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}
  async serialize(tx: Tx) {
    await this.uow.clientFor(tx).$executeRaw`SELECT pg_advisory_xact_lock(113, 10)`;
  }
  async assertAdmin(actor: Actor, tx: Tx) {
    const user = await this.users.findByIdWithLock(actor.userId, tx);
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !user.roles.some((r) => r.role === 'ADMIN') ||
      !(await this.verified(user.id, tx))
    ) {
      throw new ForbiddenError('Active verified ADMIN required');
    }
    return user;
  }
  async verified(userId: string, tx: Tx) {
    return !!(
      await this.uow
        .clientFor(tx)
        .userAccount.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } })
    )?.emailVerifiedAt;
  }
  async lockUser(userId: string, reason: string, lockedBy: string, tx: Tx) {
    await this.serialize(tx);
    const target = await this.users.findByIdWithLock(userId, tx);
    if (!target) throw new NotFoundError('User not found');
    if (target.status !== 'ACTIVE') throw new ConflictError('User already locked', 'INVALID_STATE');
    if (
      target.roles.some((r) => r.role === 'ADMIN') &&
      (await this.verified(userId, tx)) &&
      (await this.countActiveAdmins(tx)) <= 1
    ) {
      throw new ConflictError('Cannot lock last available ADMIN', 'LAST_ADMIN');
    }
    await this.users.updateStatus(userId, 'LOCKED', reason, tx);
    await this.sessions.revokeAllForUser(userId, new Date(), tx);
    await this.uow.clientFor(tx).authToken.updateMany({
      where: { userId, consumedAt: null, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
  }
  async unlockUser(userId: string, tx: Tx) {
    const target = await this.users.findByIdWithLock(userId, tx);
    if (!target) throw new NotFoundError('User not found');
    if (target.status !== 'LOCKED') throw new ConflictError('User is not locked', 'INVALID_STATE');
    await this.users.updateStatus(userId, 'ACTIVE', null, tx);
  }
  async countActiveAdmins(tx: Tx) {
    return this.uow.clientFor(tx).userAccount.count({
      where: {
        status: 'ACTIVE',
        roles: { some: { role: 'ADMIN' } },
        emailVerifiedAt: { not: null },
      },
    });
  }
}
