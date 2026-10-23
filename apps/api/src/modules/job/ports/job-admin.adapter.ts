import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  JobAdminPort,
  TransactionContext as Tx,
  PORTS,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../../../../../libs/platform/errors/domain.error';
@Injectable()
export class JobAdminAdapter implements JobAdminPort {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly companies: PrismaCompanyRepository,
    @Optional() @Inject(PORTS.outbox) private readonly outbox?: OutboxPort,
  ) {}
  async closeJob(jobId: string, reason: string, expectedVersion: number, tx: Tx): Promise<void> {
    if (!this.outbox)
      throw new ServiceUnavailableError('Outbox required', 'DEPENDENCY_UNAVAILABLE');
    const discovered = await this.jobRepo.findById(jobId, tx);
    if (!discovered) throw new NotFoundError('Job not found');
    await this.companies.findByIdWithLock(discovered.companyId, tx);
    const job = await this.jobRepo.findByIdWithLock(jobId, tx);
    if (!job) throw new NotFoundError('Job not found');
    if (job.status !== 'PUBLISHED')
      throw new ConflictError('Only published jobs can be closed', 'INVALID_STATE');
    const updated = await this.jobRepo.closeJob(jobId, expectedVersion, reason, new Date(), tx);
    await this.outbox.append(
      {
        eventId: randomUUID(),
        eventType: 'job.closed',
        schemaVersion: 1,
        aggregateId: jobId,
        aggregateVersion: updated!.version,
        occurredAt: new Date().toISOString(),
        payload: { jobId, companyId: job.companyId, reason },
      },
      tx,
    );
  }
}
