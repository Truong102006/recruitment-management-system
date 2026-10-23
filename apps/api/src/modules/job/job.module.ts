import { Module } from '@nestjs/common';
import { JobsController } from './controllers/jobs.controller';
import { CompanyJobsController } from './controllers/company-jobs.controller';
import { SkillsController } from './controllers/skills.controller';
import { CreateJobService } from './services/create-job.service';
import { UpdateJobService } from './services/update-job.service';
import { PublishJobService } from './services/publish-job.service';
import { CloseJobService } from './services/close-job.service';
import { JobReadService } from './services/job-read.service';
import { PrismaJobRepository } from './repositories/prisma-job.repository';
import { PrismaSkillRepository } from './repositories/prisma-skill.repository';
import { JobQueryRepository } from './repositories/job-query.repository';
import { JobApplicationAdapter } from './ports/job-application.adapter';
import { JobVisibilityAdapter } from './ports/job-visibility.adapter';
import { JobAdminAdapter } from './ports/job-admin.adapter';
import { JobReportingFactsAdapter } from './ports/job-reporting-facts.adapter';
import { SkillCatalogAdapter } from './ports/skill-catalog.adapter';
import { IdentityModule } from '../identity/identity.module';
import { CompanyModule } from '../company/company.module';
import { PORTS } from '../../../../../libs/contracts/backend';

@Module({
  imports: [IdentityModule, CompanyModule],
  controllers: [JobsController, CompanyJobsController, SkillsController],
  providers: [
    PrismaJobRepository,
    PrismaSkillRepository,
    JobQueryRepository,
    CreateJobService,
    UpdateJobService,
    PublishJobService,
    CloseJobService,
    JobReadService,
    JobApplicationAdapter,
    JobVisibilityAdapter,
    JobAdminAdapter,
    JobReportingFactsAdapter,
    SkillCatalogAdapter,
    {
      provide: PORTS.jobApplication,
      useExisting: JobApplicationAdapter,
    },
    {
      provide: PORTS.jobVisibility,
      useExisting: JobVisibilityAdapter,
    },
    {
      provide: PORTS.jobAdmin,
      useExisting: JobAdminAdapter,
    },
    {
      provide: PORTS.jobReportingFacts,
      useExisting: JobReportingFactsAdapter,
    },
    {
      provide: PORTS.skillCatalog,
      useExisting: SkillCatalogAdapter,
    },
  ],
  exports: [
    PrismaJobRepository,
    PrismaSkillRepository,
    JobQueryRepository,
    CreateJobService,
    UpdateJobService,
    PublishJobService,
    CloseJobService,
    JobReadService,
    JobApplicationAdapter,
    JobVisibilityAdapter,
    JobAdminAdapter,
    JobReportingFactsAdapter,
    SkillCatalogAdapter,
    PORTS.jobApplication,
    PORTS.jobVisibility,
    PORTS.jobAdmin,
    PORTS.jobReportingFacts,
    PORTS.skillCatalog,
  ],
})
export class JobModule {}
