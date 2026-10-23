import type { Company, CompanyMembership, UserAccount } from '@prisma/client';
import type {
  CompanyDto,
  CompanyMemberDto,
  EligibleOwnerDto,
  CompanyApprovalStatus,
  MembershipRole,
  MemberPermission,
} from '../../../../../../libs/contracts/public';

export class CompanyMapper {
  public static toCompanyDto(company: Company): CompanyDto {
    return {
      id: company.id,
      name: company.name,
      taxCode: company.taxCode,
      address: company.address,
      website: company.website,
      description: company.description,
      approvalStatus: company.approvalStatus as CompanyApprovalStatus,
      rejectionReason: company.rejectionReason,
      version: company.version,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  public static toCompanyMemberDto(
    membership: CompanyMembership & {
      user: Pick<UserAccount, 'id' | 'email' | 'fullName'>;
    },
  ): CompanyMemberDto {
    return {
      userId: membership.userId,
      email: membership.user.email,
      fullName: membership.user.fullName,
      role: membership.role as MembershipRole,
      permissions: membership.permissions as MemberPermission[],
      active: membership.active,
      version: membership.version,
      joinedAt: membership.createdAt.toISOString(),
    };
  }

  public static toEligibleOwnerDto(
    membership: CompanyMembership & {
      user: Pick<UserAccount, 'id' | 'email' | 'fullName'>;
    },
  ): EligibleOwnerDto {
    return {
      userId: membership.userId,
      fullName: membership.user.fullName,
      email: membership.user.email,
      role: membership.role as MembershipRole,
      active: membership.active,
      version: membership.version,
    };
  }
}
