import { Injectable } from '@nestjs/common';
import { Actor, IdentityCandidatePort, Tx } from '../../../../../../libs/contracts/backend';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';

@Injectable()
export class IdentityCandidateAdapter implements IdentityCandidatePort {
  constructor(private readonly userRepo: PrismaUserRepository) {}

  async assertActiveCandidate(
    actor: Actor,
    tx: Tx,
  ): Promise<{ readonly userId: string; readonly name: string; readonly email: string }> {
    const user = await this.userRepo.findByIdWithLock(
      actor.userId,
      tx as unknown as TransactionContext,
    );
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(user.lockedReason || 'User account is locked');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenError('Email verification required', 'EMAIL_NOT_VERIFIED');
    }

    const hasCandidateRole = user.roles.some((r) => r.role === 'CANDIDATE');
    if (!hasCandidateRole) {
      throw new ForbiddenError('User is not a candidate');
    }

    return {
      userId: user.id,
      name: user.fullName,
      email: user.email,
    };
  }

  async updateCandidateName(actor: Actor, name: string, tx: Tx): Promise<void> {
    await this.assertActiveCandidate(actor, tx);
    await this.userRepo.updateFullName(
      actor.userId,
      name.trim().normalize('NFC'),
      tx as unknown as TransactionContext,
    );
  }
}
