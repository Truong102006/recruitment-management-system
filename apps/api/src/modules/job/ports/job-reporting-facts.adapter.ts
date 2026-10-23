import { Injectable } from '@nestjs/common';
import {
  JobReportingFactsPort,
  TransactionContext as Tx,
} from '../../../../../../libs/contracts/backend';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';

@Injectable()
export class JobReportingFactsAdapter implements JobReportingFactsPort {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  public async getJobFacts(
    companyId: string,
    tx: Tx,
  ): Promise<{
    readonly totalJobs: number;
    readonly publishedJobs: number;
    readonly closedJobs: number;
  }> {
    return this.jobRepo.getJobFacts(companyId, tx);
  }
}
