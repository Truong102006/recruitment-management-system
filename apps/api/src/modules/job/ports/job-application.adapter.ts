import { Injectable } from '@nestjs/common';
import {
  JobApplicationPort,
  TransactionContext as Tx,
} from '../../../../../../libs/contracts/backend';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';
import { ConflictError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';

@Injectable()
export class JobApplicationAdapter implements JobApplicationPort {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
  ) {}

  public async lockForSubmission(
    jobId: string,
    candidateId: string,
    tx: Tx,
  ): Promise<{ readonly jobId: string; readonly companyId: string; readonly deadline: string }> {
    // 1. Initial lookup to get companyId
    const initialJob = await this.jobRepo.findById(jobId, tx);
    if (!initialJob) {
      throw new NotFoundError(`Job post '${jobId}' not found.`);
    }

    // 2. Canonical locks: company -> job
    const company = await this.companyRepo.findByIdWithLock(initialJob.companyId, tx);
    if (!company) {
      throw new NotFoundError(`Company '${initialJob.companyId}' not found.`);
    }

    const job = await this.jobRepo.findByIdWithLock(jobId, tx);
    if (!job) {
      throw new NotFoundError(`Job post '${jobId}' not found.`);
    }

    // 3. Verify company operational status
    if (company.approvalStatus !== 'APPROVED') {
      throw new ConflictError(`Company '${company.id}' is not approved for recruiting.`);
    }

    // 4. Verify company has active available owner
    const availableOwners = await this.membershipRepo.countAvailableOwners(company.id, tx);
    if (availableOwners < 1) {
      throw new ConflictError(`Company '${company.id}' has no available active owner.`);
    }

    // 5. Verify candidate is not an active member of this company
    const candidateMembership = await this.membershipRepo.findUnique(company.id, candidateId, tx);
    if (candidateMembership && candidateMembership.active) {
      throw new ConflictError('Company members cannot apply to jobs within their own company.');
    }

    // 6. Verify job status
    if (job.status !== 'PUBLISHED') {
      throw new ConflictError(
        `Job '${jobId}' is not accepting applications (status: ${job.status}).`,
      );
    }

    // 7. Verify deadline against DB clock
    if (!job.deadline) {
      throw new ConflictError(`Job '${jobId}' does not have an active deadline.`);
    }

    const now = await this.jobRepo.clock(tx);
    if (new Date(job.deadline).getTime() <= now.getTime()) {
      throw new ConflictError(`Job '${jobId}' deadline has passed. Cannot submit application.`);
    }

    return {
      jobId: job.id,
      companyId: job.companyId,
      deadline: new Date(job.deadline).toISOString(),
    };
  }
}
