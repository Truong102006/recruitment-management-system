import { Module } from '@nestjs/common';
import { PrismaModule } from '../../api/src/common/prisma/prisma.module';
import { PrismaOutboxRepository } from '../../api/src/modules/notification/repositories/prisma-outbox.repository';
import { PrismaNotificationRepository } from '../../api/src/modules/notification/repositories/prisma-notification.repository';
import { PrismaEmailRepository } from '../../api/src/modules/notification/repositories/prisma-email.repository';
import { EventConsumerRegistry } from './consumers/event-consumer.registry';
import { OutboxDispatcherJob } from './jobs/outbox-dispatcher.job';
import { EmailDeliveryJob } from './jobs/email-delivery.job';
import { ExpireProposalsJob } from './jobs/expire-proposals.job';
import { ReservationReconciliation } from './reconciliation/reservation-reconciliation';
import { VIDEO_PORT } from '../../../libs/platform/video/video.port';
import { JitsiVideoAdapter } from '../../../libs/platform/video/jitsi-video.adapter';
import { MAIL_PORT } from '../../../libs/platform/mail/mail.port';
import { SmtpMailAdapter } from '../../../libs/platform/mail/smtp-mail.adapter';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaOutboxRepository,
    PrismaNotificationRepository,
    PrismaEmailRepository,
    EventConsumerRegistry,
    OutboxDispatcherJob,
    EmailDeliveryJob,
    ExpireProposalsJob,
    ReservationReconciliation,
    {
      provide: VIDEO_PORT,
      useFactory: () =>
        new JitsiVideoAdapter({
          domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
          appId: process.env.JITSI_APP_ID || '',
          appSecret: process.env.JITSI_APP_SECRET || '',
        }),
    },
    {
      provide: MAIL_PORT,
      useFactory: () =>
        new SmtpMailAdapter({
          host: process.env.SMTP_HOST || '127.0.0.1',
          port: parseInt(process.env.SMTP_PORT || '1025', 10),
          from: process.env.SMTP_FROM || 'noreply@example.test',
        }),
    },
  ],
  exports: [
    OutboxDispatcherJob,
    EmailDeliveryJob,
    ExpireProposalsJob,
    ReservationReconciliation,
  ],
})
export class WorkerModule {}
