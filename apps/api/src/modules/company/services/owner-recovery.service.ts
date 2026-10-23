import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaCompanyRepository } from '../repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../repositories/prisma-company-membership.repository';
import { CompanyMapper } from '../mappers/company.mapper';
import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import { OutboxPort, PORTS } from '../../../../../../libs/contracts/backend';
import type { Tx } from '../../../../../../libs/contracts/backend';
import type { EligibleOwnerDto } from '../../../../../../libs/contracts/public';

@Injectable()
export class OwnerRecoveryService {
  constructor(
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
  ) {}

  public async listEligibleOwners(companyId: string, tx?: Tx): Promise<EligibleOwnerDto[]> {
    const company = await this.companyRepo.findById(companyId, tx);
    if (!company) {
      throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
    }

    const members = await this.membershipRepo.listByCompanyId(companyId, tx);
    // Eligible members: active membership, active account
    const eligible = members.filter(
      (m) => m.active && m.user.status === 'ACTIVE' && m.user.emailVerifiedAt != null,
    );

    return eligible.map((m) => CompanyMapper.toEligibleOwnerDto(m));
  }

  public async recoverOwner(
    companyId: string,
    targetUserId: string,
    targetMemberVersion: number,
    companyVersion: number,
    reason: string,
    adminUserId: string,
    tx: Tx,
  ): Promise<void> {
    // The account lock precedes the company lock, including when called outside HTTP.
    const eligibleAccount = await this.membershipRepo.lockRecoveryAccount(targetUserId, tx);
    const company = await this.companyRepo.findByIdWithLock(companyId, tx);
    if (!company) {
      throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
    }
    if (company.version !== companyVersion) {
      throw new ConflictError('Company version mismatch', 'STALE_VERSION');
    }

    const targetMembership = await this.membershipRepo.findUniqueWithLock(
      companyId,
      targetUserId,
      tx,
    );
    if (!targetMembership) {
      throw new NotFoundError('Target member not found in company', 'MEMBER_NOT_FOUND');
    }
    if (!targetMembership.active) {
      throw new ConflictError('Target member is inactive', 'MEMBER_INACTIVE');
    }
    if (!eligibleAccount) {
      throw new ConflictError('Target account must be active and verified', 'OWNER_UNAVAILABLE');
    }
    if (!reason.trim() || reason.length > 500)
      throw new ValidationError('Recovery reason is required (maximum 500 characters)');
    if (!this.outboxPort)
      throw new ServiceUnavailableError('Outbox provider is required', 'OUTBOX_UNAVAILABLE');

    // Advance company version
    await this.companyRepo.incrementVersion(companyId, tx);

    // Promote target member to OWNER
    await this.membershipRepo.updateRoleAndStatus(
      companyId,
      targetUserId,
      targetMemberVersion,
      {
        role: 'OWNER',
        active: true,
      },
      tx,
    );

    // Emit event
    if (this.outboxPort) {
      await this.outboxPort.append(
        {
          eventId: randomUUID(),
          eventType: 'company.membership_changed',
          schemaVersion: 1,
          aggregateId: companyId,
          aggregateVersion: company.version + 1,
          occurredAt: new Date().toISOString(),
          payload: {
            companyId,
            userId: targetUserId,
            role: 'OWNER',
            active: true,
          },
        },
        tx,
      );
    }
  }
}
