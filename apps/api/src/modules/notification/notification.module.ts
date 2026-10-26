import { Module } from '@nestjs/common';
import { PORTS } from '../../../../../libs/contracts/backend';
import { PrismaOutboxRepository } from './repositories/prisma-outbox.repository';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { PrismaEmailRepository } from './repositories/prisma-email.repository';
import { NotificationService } from './services/notification.service';
import { EventOperationsService } from './services/event-operations.service';
import { NotificationPolicy } from './policies/notification.policy';
import { NotificationsController } from './controllers/notifications.controller';
import { EventOperationsController } from './controllers/event-operations.controller';
import { PrismaAuditRepository } from '../audit/repositories/prisma-audit.repository';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [NotificationsController, EventOperationsController],
  providers: [
    PrismaOutboxRepository,
    PrismaNotificationRepository,
    PrismaEmailRepository,
    NotificationService,
    EventOperationsService,
    NotificationPolicy,
    PrismaAuditRepository,
    {
      provide: PORTS.outbox,
      useExisting: NotificationService,
    },
  ],
  exports: [
    NotificationService,
    PrismaOutboxRepository,
    PrismaNotificationRepository,
    PrismaEmailRepository,
    PORTS.outbox,
  ],
})
export class NotificationModule {}
