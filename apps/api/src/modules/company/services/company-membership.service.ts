import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaCompanyRepository } from '../repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../repositories/prisma-company-membership.repository';
import { PrismaUserRepository } from '../../identity/repositories/prisma-user.repository';
import { CompanyPolicy } from '../policies/company.policy';
import { OwnerRules } from '../rules/owner.rules';
import { MembershipRules } from '../rules/membership.rules';
import { EmailRules } from '../../identity/rules/email.rules';
import { CompanyMapper } from '../mappers/company.mapper';
import { AddMemberDto, UpdateMemberDto, TransferOwnerDto } from '../dto/company.dto';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import {
  ApplicationConflictPort,
  InterviewMembershipPort,
  OutboxPort,
  PORTS,
} from '../../../../../../libs/contracts/backend';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { CompanyMemberDto } from '../../../../../../libs/contracts/public';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompanyMembershipService {
  constructor(
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    private readonly userRepo: PrismaUserRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
    @Optional()
    @Inject(PORTS.applicationConflict)
    private readonly applicationConflictPort?: ApplicationConflictPort,
    @Optional()
    @Inject(PORTS.interviewMembership)
    private readonly interviewMembershipPort?: InterviewMembershipPort,
  ) {}

  private requireDependencies(): void {
    if (!this.outboxPort || !this.applicationConflictPort || !this.interviewMembershipPort) {
      throw new ServiceUnavailableError('Membership dependencies unavailable');
    }
  }

  private async lockAccounts(actor: Actor, targetUserId: string, tx: TransactionContext) {
    const accounts = new Map<
      string,
      Awaited<ReturnType<PrismaUserRepository['findByIdWithLock']>>
    >();
    for (const id of [...new Set([actor.userId, targetUserId])].sort()) {
      accounts.set(id, await this.userRepo.findByIdWithLock(id, tx));
    }
    const currentActor = accounts.get(actor.userId);
    if (!currentActor || currentActor.status !== 'ACTIVE' || !currentActor.emailVerifiedAt) {
      throw new ForbiddenError('Active verified account required');
    }
    return accounts.get(targetUserId);
  }

  public async listMembers(actor: Actor, companyId: string): Promise<CompanyMemberDto[]> {
    const membership = await this.membershipRepo.findUnique(companyId, actor.userId);
    CompanyPolicy.assertMemberReadAccess(actor, membership);

    const members = await this.membershipRepo.listByCompanyId(companyId);
    return members.map((m) => CompanyMapper.toCompanyMemberDto(m));
  }

  public async addMember(
    actor: Actor,
    companyId: string,
    dto: AddMemberDto,
  ): Promise<CompanyMemberDto> {
    this.requireDependencies();
    MembershipRules.validateAddRole(dto.role);
    if (dto.permissions) {
      MembershipRules.validatePermissions(dto.permissions);
    }
    const normalizedEmail = EmailRules.normalize(dto.email);

    const discoveredTarget = await this.userRepo.findByEmail(normalizedEmail);
    if (!discoveredTarget) throw new NotFoundError('Target user not found', 'USER_NOT_FOUND');
    return this.uow.run(async (tx: TransactionContext) => {
      const targetUser = await this.lockAccounts(actor, discoveredTarget.id, tx);
      if (!targetUser || targetUser.email !== normalizedEmail)
        throw new ConflictError('Target changed', 'SCOPE_CHANGED');
      // Accounts precede the company and membership locks.
      // 1. Lock company and verify owner access
      const company = await this.companyRepo.findByIdWithLock(companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
      }

      const ownerMembership = await this.membershipRepo.findUniqueWithLock(
        companyId,
        actor.userId,
        tx,
      );
      CompanyPolicy.assertOwnerAccess(actor, ownerMembership);

      // 2. Resolve target user by email
      if (targetUser.status !== 'ACTIVE' || !targetUser.emailVerifiedAt) {
        throw new ValidationError('Target user account is locked or inactive');
      }

      // 3. Check existing membership
      const existingMembership = await this.membershipRepo.findUniqueWithLock(
        companyId,
        targetUser.id,
        tx,
      );
      if (existingMembership && existingMembership.active) {
        throw new ConflictError(
          'User is already an active member of this company',
          'MEMBER_ALREADY_EXISTS',
        );
      }

      // 4. Check candidate open application conflict via ApplicationConflictPort
      if (this.applicationConflictPort) {
        const hasOpen = await this.applicationConflictPort.hasOpenApplication(
          targetUser.id,
          companyId,
          tx,
        );
        if (hasOpen) {
          throw new ConflictError(
            'Cannot add candidate as company member while they have open applications with this company',
            'CANDIDATE_APPLICATION_CONFLICT',
          );
        }
      }

      // 5. If role or permission includes INTERVIEWER, grant global INTERVIEWER role if missing
      const sanitizedPermissions = MembershipRules.sanitizePermissions(dto.role, dto.permissions);
      if (dto.role === 'INTERVIEWER' || sanitizedPermissions.includes('INTERVIEWER')) {
        await this.userRepo.addRole(targetUser.id, 'INTERVIEWER', tx);
      }

      // 6. Create or reactivate membership
      let createdOrUpdated;
      if (existingMembership) {
        createdOrUpdated = await this.membershipRepo.updateRoleAndStatus(
          companyId,
          targetUser.id,
          existingMembership.version,
          {
            role: dto.role,
            permissions: sanitizedPermissions,
            active: true,
          },
          tx,
        );
      } else {
        createdOrUpdated = await this.membershipRepo.create(
          {
            companyId,
            userId: targetUser.id,
            role: dto.role,
            permissions: sanitizedPermissions,
            active: true,
          },
          tx,
        );
      }

      // 7. Advance company version
      await this.companyRepo.incrementVersion(companyId, tx);

      // 8. Emit company.membership_changed event
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
              userId: targetUser.id,
              role: dto.role,
              active: true,
            },
          },
          tx,
        );
      }

      return CompanyMapper.toCompanyMemberDto({
        ...createdOrUpdated,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.fullName,
        },
      });
    });
  }

  public async updateMember(
    actor: Actor,
    companyId: string,
    targetUserId: string,
    dto: UpdateMemberDto,
  ): Promise<CompanyMemberDto> {
    this.requireDependencies();
    return this.uow.run(async (tx: TransactionContext) => {
      const targetAccount = await this.lockAccounts(actor, targetUserId, tx);
      if (
        dto.active === true &&
        (!targetAccount || targetAccount.status !== 'ACTIVE' || !targetAccount.emailVerifiedAt)
      ) {
        throw new ConflictError('Target account must be active and verified', 'MEMBER_INELIGIBLE');
      }
      // 1. Lock company and verify companyVersion
      const company = await this.companyRepo.findByIdWithLock(companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
      }
      if (company.version !== dto.companyVersion) {
        throw new ConflictError('Company version mismatch', 'STALE_VERSION');
      }

      // 2. Lock actor membership & verify OWNER
      const ownerMembership = await this.membershipRepo.findUniqueWithLock(
        companyId,
        actor.userId,
        tx,
      );
      CompanyPolicy.assertOwnerAccess(actor, ownerMembership);

      // 3. Lock target membership
      const targetMembership = await this.membershipRepo.findUniqueWithLock(
        companyId,
        targetUserId,
        tx,
      );
      if (!targetMembership) {
        throw new NotFoundError('Member not found', 'MEMBER_NOT_FOUND');
      }

      const allMembers = await this.membershipRepo.listByCompanyId(companyId, tx);

      // 4. Invariant: last available OWNER check
      const willDemoteOrDeactivate =
        (dto.role && targetMembership.role === 'OWNER') ||
        (dto.active === false && targetMembership.role === 'OWNER');

      if (willDemoteOrDeactivate) {
        OwnerRules.assertAvailableOwnerRemains(allMembers, targetUserId);
      }

      // 5. Invariant: if demoting/deactivating an interviewer, check unresolved interviews
      const willDemoteInterviewer =
        (dto.role && dto.role !== 'INTERVIEWER') ||
        (dto.permissions && !dto.permissions.includes('INTERVIEWER')) ||
        dto.active === false;

      if (willDemoteInterviewer && this.interviewMembershipPort) {
        await this.interviewMembershipPort.assertNoUnresolvedProposedOrConfirmed(
          targetUserId,
          companyId,
          tx,
        );
      }

      // 6. Global INTERVIEWER role grant if needed
      if (
        (dto.role === 'INTERVIEWER' ||
          (dto.permissions && dto.permissions.includes('INTERVIEWER'))) &&
        dto.active !== false
      ) {
        await this.userRepo.addRole(targetUserId, 'INTERVIEWER', tx);
      }

      // 7. Update target membership
      const updated = await this.membershipRepo.updateRoleAndStatus(
        companyId,
        targetUserId,
        dto.version,
        {
          role: dto.role,
          permissions: dto.permissions,
          active: dto.active,
        },
        tx,
      );

      // 8. Advance company version
      await this.companyRepo.incrementVersion(companyId, tx);

      // 9. Emit company.membership_changed
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
              role: updated.role as 'OWNER' | 'RECRUITER' | 'INTERVIEWER',
              active: updated.active,
            },
          },
          tx,
        );
      }

      const targetUser = await this.userRepo.findById(targetUserId, tx);
      return CompanyMapper.toCompanyMemberDto({
        ...updated,
        user: {
          id: targetUserId,
          email: targetUser ? targetUser.email : '',
          fullName: targetUser ? targetUser.fullName : '',
        },
      });
    });
  }

  public async transferOwner(
    actor: Actor,
    companyId: string,
    dto: TransferOwnerDto,
  ): Promise<void> {
    this.requireDependencies();
    return this.uow.run(async (tx: TransactionContext) => {
      const targetAccount = await this.lockAccounts(actor, dto.targetUserId, tx);
      // 1. Lock company
      const company = await this.companyRepo.findByIdWithLock(companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
      }

      // 2. Lock actor membership & verify OWNER
      const ownerMembership = await this.membershipRepo.findUniqueWithLock(
        companyId,
        actor.userId,
        tx,
      );
      CompanyPolicy.assertOwnerAccess(actor, ownerMembership);

      // 3. Lock target membership
      const targetMembership = await this.membershipRepo.findUniqueWithLock(
        companyId,
        dto.targetUserId,
        tx,
      );
      if (!targetMembership) {
        throw new NotFoundError('Target member not found', 'MEMBER_NOT_FOUND');
      }
      if (!targetMembership.active) {
        throw new ConflictError('Target member is inactive', 'MEMBER_INACTIVE');
      }
      if (targetMembership.role === 'OWNER') {
        throw new ConflictError('Target member is already OWNER', 'ALREADY_OWNER');
      }

      if (!targetAccount || targetAccount.status !== 'ACTIVE' || !targetAccount.emailVerifiedAt) {
        throw new ConflictError('Target account must be active and verified', 'MEMBER_INELIGIBLE');
      }
      // 4. Perform atomic transfer
      await this.membershipRepo.transferOwnerAtomic(
        companyId,
        actor.userId,
        dto.targetUserId,
        dto.targetMemberVersion,
        dto.companyVersion,
        tx,
      );

      // 5. Emit events for both participants
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
              userId: dto.targetUserId,
              role: 'OWNER',
              active: true,
            },
          },
          tx,
        );

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
              userId: actor.userId,
              role: 'RECRUITER',
              active: true,
            },
          },
          tx,
        );
      }
    });
  }
}
