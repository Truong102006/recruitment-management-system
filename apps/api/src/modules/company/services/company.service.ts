import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaCompanyRepository } from '../repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../repositories/prisma-company-membership.repository';
import { CompanyPolicy } from '../policies/company.policy';
import { CompanyRules } from '../rules/company.rules';
import { CompanyMapper } from '../mappers/company.mapper';
import { UpdateCompanyDto, ResubmitCompanyDto } from '../dto/company.dto';
import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { OutboxPort, PORTS } from '../../../../../../libs/contracts/backend';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type {
  CompanyDto,
  MyCompanyMembershipDto,
  MembershipRole,
} from '../../../../../../libs/contracts/public';

@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
  ) {}

  public async listMyCompanies(actor: Actor): Promise<MyCompanyMembershipDto[]> {
    const memberships = await this.membershipRepo.listActiveByUserId(actor.userId);
    return memberships.map((membership) => ({
      company: CompanyMapper.toCompanyDto(membership.company),
      role: membership.role as MembershipRole,
    }));
  }

  public async getCompanyDetail(actor: Actor, companyId: string): Promise<CompanyDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
    }

    const membership = await this.membershipRepo.findUnique(companyId, actor.userId);
    CompanyPolicy.assertMemberReadAccess(actor, membership);

    return CompanyMapper.toCompanyDto(company);
  }

  public async updateCompany(
    actor: Actor,
    companyId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyDto> {
    return this.uow.run(async (tx: TransactionContext) => {
      if (!(await this.membershipRepo.lockRecoveryAccount(actor.userId, tx)))
        throw new ForbiddenError('Active verified account required');
      const company = await this.companyRepo.findByIdWithLock(companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
      }

      const membership = await this.membershipRepo.findUniqueWithLock(companyId, actor.userId, tx);
      CompanyPolicy.assertOwnerAccess(actor, membership);

      CompanyRules.assertCompanyCanBeUpdated(company.approvalStatus);

      const updated = await this.companyRepo.update(
        companyId,
        dto.version,
        {
          name:
            dto.name !== undefined
              ? CompanyRules.normalizeRequiredText(dto.name, 'name')
              : undefined,
          address:
            dto.address !== undefined
              ? CompanyRules.normalizeRequiredText(dto.address, 'address')
              : undefined,
          website: CompanyRules.normalizeNullableText(dto.website, 'website'),
          description: CompanyRules.normalizeNullableText(dto.description, 'description'),
        },
        tx,
      );

      return CompanyMapper.toCompanyDto(updated);
    });
  }

  public async resubmitCompany(
    actor: Actor,
    companyId: string,
    dto: ResubmitCompanyDto,
  ): Promise<CompanyDto> {
    return this.uow.run(async (tx: TransactionContext) => {
      if (!(await this.membershipRepo.lockRecoveryAccount(actor.userId, tx)))
        throw new ForbiddenError('Active verified account required');
      const company = await this.companyRepo.findByIdWithLock(companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
      }

      const membership = await this.membershipRepo.findUniqueWithLock(companyId, actor.userId, tx);
      CompanyPolicy.assertOwnerAccess(actor, membership);

      CompanyRules.assertCompanyCanBeResubmitted(company.approvalStatus);

      const resubmitted = await this.companyRepo.resubmit(
        companyId,
        dto.version,
        {
          name:
            dto.name !== undefined
              ? CompanyRules.normalizeRequiredText(dto.name, 'name')
              : undefined,
          address:
            dto.address !== undefined
              ? CompanyRules.normalizeRequiredText(dto.address, 'address')
              : undefined,
          website: CompanyRules.normalizeNullableText(dto.website, 'website'),
          description: CompanyRules.normalizeNullableText(dto.description, 'description'),
        },
        tx,
      );

      return CompanyMapper.toCompanyDto(resubmitted);
    });
  }
}
