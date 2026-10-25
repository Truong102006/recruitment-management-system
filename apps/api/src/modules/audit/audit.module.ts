import { Module } from '@nestjs/common';
import { PORTS } from '../../../../../libs/contracts/backend';
import { PrismaAuditRepository } from './repositories/prisma-audit.repository';
import { AuditWriterService } from './services/audit-writer.service';
import { AuditQueryService } from './services/audit-query.service';
import { AuditReadPolicy } from './policies/audit-read.policy';
import { AuditQueryController } from './controllers/audit-query.controller';

@Module({
  controllers: [AuditQueryController],
  providers: [
    PrismaAuditRepository,
    AuditWriterService,
    AuditQueryService,
    AuditReadPolicy,
    {
      provide: PORTS.audit,
      useExisting: AuditWriterService,
    },
  ],
  exports: [
    AuditWriterService,
    AuditQueryService,
    PrismaAuditRepository,
    PORTS.audit,
  ],
})
export class AuditModule {}
