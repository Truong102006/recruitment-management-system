export interface WorkerConfig {
  outboxBatchSize: number;
  emailBatchSize: number;
  leaseDurationMs: number;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
}

export const defaultWorkerConfig: WorkerConfig = {
  outboxBatchSize: 20,
  emailBatchSize: 20,
  leaseDurationMs: 120_000,
  heartbeatIntervalMs: 30_000,
  pollIntervalMs: 5_000,
};
