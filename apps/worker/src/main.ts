import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';
import { OutboxDispatcherJob } from './jobs/outbox-dispatcher.job';
import { EmailDeliveryJob } from './jobs/email-delivery.job';
import { ExpireProposalsJob } from './jobs/expire-proposals.job';
import { ReservationReconciliation } from './reconciliation/reservation-reconciliation';
import { defaultWorkerConfig } from './config/worker.config';

async function bootstrap() {
  const logger = new Logger('WorkerRunner');
  const app = await NestFactory.createApplicationContext(WorkerModule);

  const outboxJob = app.get(OutboxDispatcherJob);
  const emailJob = app.get(EmailDeliveryJob);
  const expireJob = app.get(ExpireProposalsJob);
  const reconJob = app.get(ReservationReconciliation);

  logger.log('RMS Worker started');

  let running = true;
  const tick = async () => {
    if (!running) return;
    try {
      await outboxJob.runOnce(defaultWorkerConfig);
      await emailJob.runOnce(defaultWorkerConfig);
      await expireJob.runOnce();
      await reconJob.reconcile();
    } catch (err: any) {
      logger.error(`Worker tick error: ${err.message}`);
    }
    if (running) {
      setTimeout(tick, defaultWorkerConfig.pollIntervalMs);
    }
  };

  tick();

  const shutdown = async () => {
    logger.log('Worker shutting down...');
    running = false;
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
