import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CompanyModule } from '../company/company.module';
import { JobModule } from '../job/job.module';
import { IdentityAdminAdapter } from '../identity/ports/identity-admin.adapter';
import { PORTS } from '../../../../../libs/contracts/backend';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
@Module({
  imports: [IdentityModule, CompanyModule, JobModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    IdentityAdminAdapter,
    { provide: PORTS.identityAdmin, useExisting: IdentityAdminAdapter },
  ],
  exports: [PORTS.identityAdmin, IdentityAdminAdapter],
})
export class AdminModule {}
