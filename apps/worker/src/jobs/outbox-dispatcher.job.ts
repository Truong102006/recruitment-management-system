import { Inject, Injectable, Logger } from '@nestjs/common';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../../libs/platform/database/unit-of-work';
import { PrismaOutboxRepository } from '../../../api/src/modules/notification/repositories/prisma-outbox.repository';
import { DeliveryRetryRules } from '../../../api/src/modules/notification/rules/delivery-retry.rules';
import { EventConsumerRegistry } from '../consumers/event-consumer.registry';
import type { WorkerConfig } from '../config/worker.config';

@Injectable()
export class OutboxDispatcherJob {
  private readonly logger = new Logger(OutboxDispatcherJob.name);

  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    private readonly outboxRepo: PrismaOutboxRepository,
    private readonly registry: EventConsumerRegistry,
  ) {}

  async runOnce(config: WorkerConfig): Promise<number> {
    let processedCount = 0;

    await this.uow.run(async (tx) => {
      const { events, leaseToken } = await this.outboxRepo.claimBatch(
        config.outboxBatchSize,
        config.leaseDurationMs,
        tx,
      );

      for (const event of events) {
        try {
          await this.registry.consume(event, tx);
          await this.outboxRepo.markDone(event.id, leaseToken, tx);
          processedCount++;
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Error processing outbox event ${event.id}: ${errorMsg}`);
          const nextRetry = DeliveryRetryRules.calculateNextRetry(event.attemptCount);
          if (nextRetry) {
            await this.outboxRepo.scheduleRetry(
              event.id,
              leaseToken,
              nextRetry,
              errorMsg || 'UNKNOWN_ERROR',
              tx,
            );
          } else {
            await this.outboxRepo.markFailed(
              event.id,
              leaseToken,
              errorMsg || 'EXCEEDED_MAX_ATTEMPTS',
              tx,
            );
          }
        }
      }
    });

    return processedCount;
  }
}
