import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  Actor,
  AuditWriterPort,
  CompanyAdminPort,
  InterviewAdminPort,
  InterviewSecurityPort,
  JobAdminPort,
  OutboxPort,
  PORTS,
  Tx,
} from '../../../../../libs/contracts/backend';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../libs/platform/database/unit-of-work';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../../../../libs/platform/errors/domain.error';
import { IdentityAdminAdapter } from '../identity/ports/identity-admin.adapter';
import { PrismaUserRepository } from '../identity/repositories/prisma-user.repository';
import { PrismaCompanyRepository } from '../company/repositories/prisma-company.repository';
import { OwnerRecoveryService } from '../company/services/owner-recovery.service';
import { AdminMutationDto, RecoverOwnerDto, AdminCompanyDecisionDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    private readonly identity: IdentityAdminAdapter,
    private readonly users: PrismaUserRepository,
    private readonly companies: PrismaCompanyRepository,
    private readonly recovery: OwnerRecoveryService,
    @Inject(PORTS.companyAdmin) private readonly company: CompanyAdminPort,
    @Inject(PORTS.jobAdmin) private readonly jobs: JobAdminPort,
    @Optional() @Inject(PORTS.interviewSecurity) private readonly security?: InterviewSecurityPort,
    @Optional() @Inject(PORTS.interviewAdmin) private readonly interviews?: InterviewAdminPort,
    @Optional() @Inject(PORTS.outbox) private readonly outbox?: OutboxPort,
    @Optional() @Inject(PORTS.audit) private readonly audit?: AuditWriterPort,
  ) {}

  async read(
    actor: Actor,
    resource: 'users' | 'companies' | 'jobs',
    page = 1,
    limit = 20,
    status?: string,
  ) {
    return this.uow.run(async (tx) => {
      await this.identity.assertAdmin(actor, tx);
      const client = this.uow.clientFor(tx);
      const skip = (page - 1) * limit;
      if (resource === 'users') {
        const where = status ? { status } : {};
        const [items, total] = await Promise.all([
          client.userAccount.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              email: true,
              fullName: true,
              status: true,
              version: true,
              roles: { select: { role: true } },
            },
          }),
          client.userAccount.count({ where }),
        ]);
        return { items, total, page, limit };
      }
      if (resource === 'companies') {
        const where = status ? { approvalStatus: status } : {};
        const [items, total] = await Promise.all([
          client.company.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
              id: true,
              name: true,
              taxCode: true,
              address: true,
              website: true,
              approvalStatus: true,
              rejectionReason: true,
              version: true,
            },
          }),
          client.company.count({ where }),
        ]);
        return { items, total, page, limit };
      }
      const where = status ? { status } : {};
      const [jobs, total] = await Promise.all([
        client.jobPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            companyId: true,
            company: { select: { name: true } },
            title: true,
            location: true,
            workplaceMode: true,
            status: true,
            version: true,
            closeReason: true,
          },
        }),
        client.jobPost.count({ where }),
      ]);
      const items = jobs.map(({ company, ...job }) => ({ ...job, companyName: company.name }));
      return { items, total, page, limit };
    });
  }
  async decideCompany(actor: Actor, id: string, dto: AdminCompanyDecisionDto) {
    const current = await this.companyDetail(actor, id);
    const action =
      dto.status === 'REJECTED'
        ? 'reject'
        : dto.status === 'SUSPENDED'
          ? 'suspend'
          : current.approvalStatus === 'SUSPENDED'
            ? 'unsuspend'
            : 'approve';
    return this.mutate(actor, 'companies', id, action, dto);
  }
  async companyDetail(actor: Actor, id: string) {
    return this.uow.run(async (tx) => {
      await this.identity.assertAdmin(actor, tx);
      const item = await this.companies.findById(id, tx);
      if (!item) throw new NotFoundError();
      return {
        id: item.id,
        name: item.name,
        taxCode: item.taxCode,
        address: item.address,
        website: item.website,
        description: item.description,
        approvalStatus: item.approvalStatus,
        rejectionReason: item.rejectionReason,
        version: item.version,
      };
    });
  }
  async eligibleOwners(actor: Actor, id: string) {
    return this.uow.run(async (tx) => {
      await this.identity.assertAdmin(actor, tx);
      return this.recovery.listEligibleOwners(id, tx);
    });
  }
  async mutate(
    actor: Actor,
    resource: 'users' | 'companies' | 'jobs' | 'interviews',
    id: string,
    action: string,
    dto: AdminMutationDto & Partial<RecoverOwnerDto>,
  ) {
    const allowed = {
      users: ['lock', 'unlock'],
      companies: ['approve', 'reject', 'suspend', 'unsuspend', 'recover-owner'],
      jobs: ['close'],
      interviews: ['security-cancel'],
    };
    if (!allowed[resource]?.includes(action))
      throw new ValidationError('Invalid moderation action');
    return this.uow.run(async (tx) => {
      // Fixed advisory lock precedes all account row locks, including the actor.
      await this.identity.serialize(tx);
      const accountIds = new Set([actor.userId]);
      if (resource === 'users') accountIds.add(id);
      if (action === 'recover-owner') {
        if (!dto.targetUserId || dto.targetMemberVersion === undefined)
          throw new ValidationError('Recovery target and membership version required');
        accountIds.add(dto.targetUserId);
      }
      for (const accountId of [...accountIds].sort())
        await this.users.findByIdWithLock(accountId, tx);
      await this.identity.assertAdmin(actor, tx);
      if (!this.audit || !this.outbox)
        throw new ServiceUnavailableError(
          'Audit and outbox providers are required',
          'DEPENDENCY_UNAVAILABLE',
        );
      if (resource === 'users') await this.userAction(actor, id, action, dto, tx);
      else if (resource === 'companies') {
        if (action === 'recover-owner') {
          const recovery = dto as AdminMutationDto & RecoverOwnerDto;
          await this.recovery.recoverOwner(
            id,
            recovery.targetUserId,
            recovery.targetMemberVersion,
            dto.version,
            dto.reason,
            actor.userId,
            tx,
          );
        } else if (action === 'approve' || action === 'reject')
          await this.company.reviewCompany(
            id,
            action === 'approve' ? 'APPROVED' : 'REJECTED',
            dto.reason,
            dto.version,
            tx,
          );
        else if (action === 'suspend') {
          if (!this.security)
            throw new ServiceUnavailableError(
              'Interview security provider required',
              'DEPENDENCY_UNAVAILABLE',
            );
          await this.company.suspendCompany(id, dto.reason, dto.version, tx);
          await this.security.revokeForCompany(id, tx);
        } else await this.company.unsuspendCompany(id, dto.version, tx);
      } else if (resource === 'jobs') await this.jobs.closeJob(id, dto.reason, dto.version, tx);
      else {
        if (!this.interviews)
          throw new ServiceUnavailableError(
            'Interview admin provider required',
            'DEPENDENCY_UNAVAILABLE',
          );
        await this.interviews.securityCancel(id, dto.reason, dto.version, tx);
      }
      await this.audit.write(
        {
          action: `${resource}.${action}`,
          actorId: actor.userId,
          resourceId: id,
          reason: dto.reason,
        },
        tx,
      );
      return {
        id,
        version: dto.version + 1,
        ...(action === 'lock' || action === 'suspend' || resource === 'interviews'
          ? { revocationStatus: 'PENDING' }
          : {}),
      };
    });
  }
  private async userAction(
    actor: Actor,
    id: string,
    action: string,
    dto: AdminMutationDto,
    tx: Tx,
  ) {
    const user = await this.users.findByIdWithLock(id, tx);
    if (!user) throw new NotFoundError();
    if (user.version !== dto.version)
      throw new ConflictError('User version mismatch', 'STALE_VERSION');
    if (action === 'lock') {
      if (!this.security)
        throw new ServiceUnavailableError(
          'Interview security provider required',
          'DEPENDENCY_UNAVAILABLE',
        );
      await this.identity.lockUser(id, dto.reason, actor.userId, tx);
      await this.security.revokeForUser(id, tx);
      await this.outbox!.append(
        {
          eventId: randomUUID(),
          eventType: 'user.locked',
          schemaVersion: 1,
          aggregateId: id,
          aggregateVersion: user.version + 1,
          occurredAt: new Date().toISOString(),
          payload: { userId: id, reason: dto.reason, lockedBy: actor.userId },
        },
        tx,
      );
    } else await this.identity.unlockUser(id, tx);
  }
}
