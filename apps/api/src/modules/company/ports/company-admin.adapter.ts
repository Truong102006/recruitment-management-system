import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaCompanyRepository } from '../repositories/prisma-company.repository';
import { OutboxPort, PORTS } from '../../../../../../libs/contracts/backend';
import type { CompanyAdminPort, Tx } from '../../../../../../libs/contracts/backend';
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import { PrismaCompanyMembershipRepository } from '../repositories/prisma-company-membership.repository';

@Injectable()
export class CompanyAdminAdapter implements CompanyAdminPort {
  constructor(
    private readonly companyRepo: PrismaCompanyRepository,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
    @Optional() private readonly membershipRepo?: PrismaCompanyMembershipRepository,
  ) {}

  public async reviewCompany(
    companyId: string,
    status: 'APPROVED' | 'REJECTED',
    reason: string | undefined,
    expectedVersion: number,
    tx: Tx,
  ): Promise<void> {
    if (status === 'REJECTED' && !reason?.trim())
      throw new ValidationError('Rejection reason is required');
    await this.assertTransition(companyId, expectedVersion, ['PENDING'], reason, tx);
    if (status === 'APPROVED') {
      if (
        !this.membershipRepo ||
        (await this.membershipRepo.countAvailableOwners(companyId, tx)) < 1
      )
        throw new ConflictError(
          'Company requires an available verified owner',
          'OWNER_UNAVAILABLE',
        );
    }
    const updated = await this.companyRepo.updateStatus(
      companyId,
      expectedVersion,
      status,
      reason ?? null,
      tx,
    );

    if (this.outboxPort) {
      await this.outboxPort.append(
        {
          eventId: randomUUID(),
          eventType: 'company.reviewed',
          schemaVersion: 1,
          aggregateId: companyId,
          aggregateVersion: updated.version,
          occurredAt: new Date().toISOString(),
          payload: {
            companyId,
            status,
            reason,
          },
        },
        tx,
      );
    }
  }

  public async suspendCompany(
    companyId: string,
    reason: string,
    expectedVersion: number,
    tx: Tx,
  ): Promise<void> {
    if (!reason?.trim()) throw new ValidationError('Suspension reason is required');
    await this.assertTransition(companyId, expectedVersion, ['APPROVED'], reason, tx);
    const updated = await this.companyRepo.updateStatus(
      companyId,
      expectedVersion,
      'SUSPENDED',
      reason,
      tx,
    );

    if (this.outboxPort) {
      await this.outboxPort.append(
        {
          eventId: randomUUID(),
          eventType: 'company.suspended',
          schemaVersion: 1,
          aggregateId: companyId,
          aggregateVersion: updated.version,
          occurredAt: new Date().toISOString(),
          payload: {
            companyId,
            reason,
          },
        },
        tx,
      );
    }
  }

  public async unsuspendCompany(companyId: string, expectedVersion: number, tx: Tx): Promise<void> {
    await this.assertTransition(companyId, expectedVersion, ['SUSPENDED'], undefined, tx);
    const updated = await this.companyRepo.updateStatus(
      companyId,
      expectedVersion,
      'APPROVED',
      null,
      tx,
    );
    await this.outboxPort!.append(
      {
        eventId: randomUUID(),
        eventType: 'company.reviewed',
        schemaVersion: 1,
        aggregateId: companyId,
        aggregateVersion: updated.version,
        occurredAt: new Date().toISOString(),
        payload: { companyId, status: 'APPROVED' },
      },
      tx,
    );
  }

  private async assertTransition(
    companyId: string,
    expectedVersion: number,
    from: string[],
    reason: string | undefined,
    tx: Tx,
  ): Promise<void> {
    const company = await this.companyRepo.findByIdWithLock(companyId, tx);
    if (!company) throw new NotFoundError('Company not found');
    if (company.version !== expectedVersion)
      throw new ConflictError('Company version mismatch', 'STALE_VERSION');
    if (!from.includes(company.approvalStatus))
      throw new ConflictError('Invalid company transition', 'INVALID_COMPANY_STATUS');
    if (reason !== undefined && (!reason.trim() || reason.length > 500))
      throw new ValidationError('Reason must contain 1–500 characters');
    if (!this.outboxPort)
      throw new ServiceUnavailableError('Outbox provider is required', 'OUTBOX_UNAVAILABLE');
  }
}
