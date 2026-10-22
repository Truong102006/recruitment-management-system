export interface Be2EventPayloads {
  'candidate.profile_updated': { candidateId: string };
  'cv.scan_requested': { cvId: string };
  'cv.delete_requested': { cvId: string };
  'application.submitted': { applicationId: string };
  'application.status_changed': { applicationId: string };
  'application.cv_replaced': { applicationId: string };
  'application.withdrawn': { applicationId: string };
  'application.result_published': { applicationId: string };
  'saved_job.created': { candidateId: string; jobId: string };
  'saved_job.deleted': { candidateId: string; jobId: string };
}

export type Be2Event = {
  [K in keyof Be2EventPayloads]: {
    readonly eventId: string;
    readonly eventType: K;
    readonly schemaVersion: 1;
    readonly aggregateId: string;
    readonly aggregateVersion: number;
    readonly occurredAt: string;
    readonly payload: Readonly<Be2EventPayloads[K]>;
  };
}[keyof Be2EventPayloads];
