import { Module } from '@nestjs/common';
import { CompaniesController } from './controllers/companies.controller';
import { MembershipsController } from './controllers/memberships.controller';
import { CreateCompanyService } from './services/create-company.service';
import { CompanyService } from './services/company.service';
import { CompanyMembershipService } from './services/company-membership.service';
import { OwnerRecoveryService } from './services/owner-recovery.service';
import { PrismaCompanyRepository } from './repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from './repositories/prisma-company-membership.repository';
import { CompanyAccessAdapter } from './ports/company-access.adapter';
import { CompanyAdminAdapter } from './ports/company-admin.adapter';
import { IdentityModule } from '../identity/identity.module';
import { PORTS } from '../../../../../libs/contracts/backend';

@Module({
  imports: [IdentityModule],
  controllers: [CompaniesController, MembershipsController],
  providers: [
    PrismaCompanyRepository,
    PrismaCompanyMembershipRepository,
    CreateCompanyService,
    CompanyService,
    CompanyMembershipService,
    OwnerRecoveryService,
    CompanyAccessAdapter,
    CompanyAdminAdapter,
    {
      provide: PORTS.companyAccess,
      useExisting: CompanyAccessAdapter,
    },
    {
      provide: PORTS.companyAdmin,
      useExisting: CompanyAdminAdapter,
    },
  ],
  exports: [
    PrismaCompanyRepository,
    PrismaCompanyMembershipRepository,
    CreateCompanyService,
    CompanyService,
    CompanyMembershipService,
    OwnerRecoveryService,
    CompanyAccessAdapter,
    CompanyAdminAdapter,
    PORTS.companyAccess,
    PORTS.companyAdmin,
  ],
})
export class CompanyModule {}
