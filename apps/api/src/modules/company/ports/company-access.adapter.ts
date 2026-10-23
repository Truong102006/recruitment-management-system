import { Injectable } from '@nestjs/common';
import { PrismaCompanyRepository } from '../repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../repositories/prisma-company-membership.repository';
import { CompanyPolicy } from '../policies/company.policy';
import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import type { CompanyAccessPort, Actor, Tx } from '../../../../../../libs/contracts/backend';

@Injectable()
export class CompanyAccessAdapter implements CompanyAccessPort {
  constructor(
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
  ) {}

  public async assertRecruiter(
    actor: Actor,
    companyId: string,
    tx: Tx,
  ): Promise<{
    readonly companyId: string;
    readonly permission: 'OWNER' | 'RECRUITER';
    readonly membershipId: string;
  }> {
    if (!(await this.membershipRepo.lockRecoveryAccount(actor.userId, tx))) {
      throw new ForbiddenError('Active verified account required');
    }
    const company = await this.companyRepo.findByIdWithLock(companyId, tx);
    if (!company) {
      throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
    }

    const membership = await this.membershipRepo.findUnique(companyId, actor.userId, tx);
    if (!membership) {
      throw new NotFoundError('Company not found', 'COMPANY_NOT_FOUND');
    }

    const availableOwnerCount = await this.membershipRepo.countAvailableOwners(companyId, tx);

    CompanyPolicy.assertOperationalAccess(company, membership, availableOwnerCount);

    const permission: 'OWNER' | 'RECRUITER' = membership.role === 'OWNER' ? 'OWNER' : 'RECRUITER';

    return {
      companyId,
      permission,
      membershipId: `${companyId}:${actor.userId}`,
    };
  }
}
