import { Global, Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { InterviewModule } from './interview/interview.module';

/** Cross-domain ports must be visible to BE1/BE2, not only to root module siblings. */
@Global()
@Module({
  imports: [AuditModule, NotificationModule, InterviewModule],
  exports: [AuditModule, NotificationModule, InterviewModule],
})
export class Be3PortsModule {}
