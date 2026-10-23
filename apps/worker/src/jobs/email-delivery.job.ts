import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { UnitOfWork } from '../../../../libs/platform/database/unit-of-work';
import { PrismaEmailRepository } from '../../../api/src/modules/notification/repositories/prisma-email.repository';
import { DeliveryRetryRules } from '../../../api/src/modules/notification/rules/delivery-retry.rules';
import { MAIL_PORT, type MailPort } from '../../../../libs/platform/mail/mail.port';
import type { WorkerConfig } from '../config/worker.config';

@Injectable()
export class EmailDeliveryJob {
  private readonly logger = new Logger(EmailDeliveryJob.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly emailRepo: PrismaEmailRepository,
    @Optional() @Inject(MAIL_PORT) private readonly mailPort?: MailPort,
  ) {}

  async runOnce(config: WorkerConfig): Promise<number> {
    if (!this.mailPort) {
      return 0;
    }

    let batch: any = null;
    await this.uow.run(async (tx) => {
      batch = await this.emailRepo.claimBatch(
        config.emailBatchSize,
        config.leaseDurationMs,
        tx,
      );
    });

    if (!batch || batch.deliveries.length === 0) {
      return 0;
    }

    let sentCount = 0;
    const { deliveries, leaseToken } = batch;

    for (const delivery of deliveries) {
      try {
        // Send email outside DB transaction
        const result = await this.mailPort.send({
          deliveryId: delivery.id,
          recipient: delivery.recipientEmail,
          content: {
            kind: 'public',
            templateCode: delivery.templateCode,
            recipient: delivery.recipientEmail,
            subject: 'Thông báo từ hệ thống tuyển dụng',
            variables: {
              deliveryId: delivery.id,
              userId: delivery.userId,
            },
          },
        });

        await this.uow.run(async (tx) => {
          await this.emailRepo.markSent(delivery.id, leaseToken, result.providerMessageId, tx);
        });
        sentCount++;
      } catch (error: any) {
        this.logger.error(`Error sending email delivery ${delivery.id}: ${error.message}`);
        const nextRetry = DeliveryRetryRules.calculateNextRetry(delivery.attemptCount);

        await this.uow.run(async (tx) => {
          if (nextRetry) {
            await this.emailRepo.scheduleRetry(
              delivery.id,
              leaseToken,
              nextRetry,
              error.message || 'EMAIL_SEND_FAILED',
              tx,
            );
          } else {
            await this.emailRepo.markFailed(
              delivery.id,
              leaseToken,
              error.message || 'EXCEEDED_MAX_ATTEMPTS',
              tx,
            );
          }
        });
      }
    }

    return sentCount;
  }
}
