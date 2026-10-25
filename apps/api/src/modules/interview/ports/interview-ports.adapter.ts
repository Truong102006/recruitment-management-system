import { Injectable } from '@nestjs/common';
import type {
  Actor,
  InterviewAdminPort,
  InterviewEvidence,
  InterviewLifecyclePort,
  InterviewMembershipPort,
  InterviewSecurityPort,
} from '../../../../../../libs/contracts/backend';
import type { TransactionContext as Tx } from '../../../../../../libs/platform/database/unit-of-work';
import { PrismaInterviewRepository } from '../repositories/prisma-interview.repository';

@Injectable()
export class InterviewLifecycleAdapter implements InterviewLifecyclePort {
  constructor(private readonly repo: PrismaInterviewRepository) {}

  async getLockScope(
    applicationId: string,
  ): Promise<{ readonly userIds: readonly string[]; readonly interviewIds: readonly string[] }> {
    return this.repo.getLockScope(applicationId);
  }

  async cancelOpenForApplication(
    input: {
      readonly applicationId: string;
      readonly actor: Actor;
      readonly reason: 'WITHDRAWN' | 'RESULT_REJECTED';
    },
    tx: Tx,
  ): Promise<{ readonly cancelledInterviewIds: readonly string[] }> {
    return this.repo.cancelOpenForApplication(input.applicationId, input.actor.userId, input.reason, tx);
  }

  async getEvidence(applicationId: string, tx: Tx): Promise<InterviewEvidence> {
    return this.repo.getEvidence(applicationId, tx);
  }
}

@Injectable()
export class InterviewSecurityAdapter implements InterviewSecurityPort {
  constructor(private readonly repo: PrismaInterviewRepository) {}

  async revokeForUser(
    userId: string,
    tx: Tx,
  ): Promise<{ readonly revokedInterviewsCount: number; readonly currentGeneration: number }> {
    return this.repo.revokeForUser(userId, tx);
  }

  async revokeForCompany(
    companyId: string,
    tx: Tx,
  ): Promise<{ readonly revokedInterviewsCount: number; readonly currentGeneration: number }> {
    return this.repo.revokeForCompany(companyId, tx);
  }
}

@Injectable()
export class InterviewAdminAdapter implements InterviewAdminPort {
  constructor(private readonly repo: PrismaInterviewRepository) {}

  async securityCancel(
    interviewId: string,
    reason: string,
    expectedVersion: number,
    tx: Tx,
  ): Promise<{ readonly cancelled: boolean; readonly currentVersion: number }> {
    const res = await this.repo.cancelInterview(interviewId, reason, null, expectedVersion, tx);
    return { cancelled: res.success, currentVersion: res.newVersion };
  }
}

@Injectable()
export class InterviewMembershipAdapter implements InterviewMembershipPort {
  constructor(private readonly repo: PrismaInterviewRepository) {}

  async assertNoUnresolvedProposedOrConfirmed(userId: string, companyId: string, tx: Tx): Promise<void> {
    await this.repo.assertNoUnresolvedProposedOrConfirmed(userId, companyId, tx);
  }
}
