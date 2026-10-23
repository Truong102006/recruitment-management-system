import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentConfig } from './config/environment.config';
import { PrismaModule } from './common/prisma/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CompanyModule } from './modules/company/company.module';
import { JobModule } from './modules/job/job.module';
import { AdminModule } from './modules/admin/admin.module';
import { Be2Module } from './modules/be2.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { InterviewModule } from './modules/interview/interview.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
    }),
    PrismaModule,
    IdentityModule,
    CompanyModule,
    JobModule,
    AdminModule,
    Be2Module,
    AuditModule,
    NotificationModule,
    InterviewModule,
    EvaluationModule,
    ReportingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
