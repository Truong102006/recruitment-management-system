import { Injectable } from '@nestjs/common';
import {
  Actor,
  JobVisibilityPort,
  TransactionContext as Tx,
} from '../../../../../../libs/contracts/backend';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';

@Injectable()
export class JobVisibilityAdapter implements JobVisibilityPort {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
  ) {}

  public async getPublicOrPlaceholder(
    jobId: string,
    _actor: Actor,
    tx: Tx,
  ): Promise<
    | { readonly available: true; readonly jobId: string; readonly acceptingApplications: boolean }
    | { readonly available: false; readonly jobId: string }
  > {
    const job = await this.jobRepo.findById(jobId, tx);
    if (!job) {
      return { available: false, jobId };
    }

    const company = await this.companyRepo.findById(job.companyId, tx);
    if (!company || company.approvalStatus !== 'APPROVED') {
      return { available: false, jobId };
    }

    const availableOwners = await this.membershipRepo.countAvailableOwners(company.id, tx);
    if (availableOwners < 1) {
      return { available: false, jobId };
    }

    if (job.status === 'DRAFT') {
      return { available: false, jobId };
    }

    if (job.status === 'CLOSED' && !job.publishedAt) {
      return { available: false, jobId };
    }

    const now = new Date();
    const isPastDeadline = job.deadline ? new Date(job.deadline).getTime() <= now.getTime() : false;
    const acceptingApplications = job.status === 'PUBLISHED' && !isPastDeadline;

    return {
      available: true,
      jobId,
      acceptingApplications,
    };
  }
}
