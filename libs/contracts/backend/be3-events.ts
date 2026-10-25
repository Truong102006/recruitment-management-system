export interface Be3EventPayloads {
  'interview.proposed': {
    readonly interviewId: string;
    readonly applicationId: string;
    readonly startAt: string;
    readonly endAt: string;
    readonly candidateId: string;
    readonly interviewerIds: readonly string[];
  };
  'interview.responded': {
    readonly interviewId: string;
    readonly userId: string;
    readonly response: 'ACCEPTED' | 'DECLINED';
  };
  'interview.confirmed': {
    readonly interviewId: string;
    readonly applicationId: string;
    readonly startAt: string;
    readonly endAt: string;
  };
  'interview.rescheduled': {
    readonly interviewId: string;
    readonly oldInterviewId: string;
    readonly applicationId: string;
  };
  'interview.cancelled': {
    readonly interviewId: string;
    readonly applicationId: string;
    readonly reason: string;
    readonly cancelledBy?: string;
  };
  'interview.expired': {
    readonly interviewId: string;
    readonly applicationId: string;
  };
  'interview.completed': {
    readonly interviewId: string;
    readonly applicationId: string;
  };
  'interview.no_show': {
    readonly interviewId: string;
    readonly applicationId: string;
    readonly reason: string;
  };
  'interview.room_revoke_requested': {
    readonly interviewId: string;
    readonly accessGeneration: number;
    readonly reason: string;
  };
  'evaluation.submitted': {
    readonly evaluationId: string;
    readonly interviewId: string;
    readonly interviewerId: string;
  };
}

export type Be3Event = {
  [K in keyof Be3EventPayloads]: {
    readonly eventId: string;
    readonly eventType: K;
    readonly schemaVersion: 1;
    readonly aggregateType: 'INTERVIEW' | 'EVALUATION' | 'APPLICATION';
    readonly aggregateId: string;
    readonly aggregateVersion: number;
    readonly occurredAt: string;
    readonly payload: Readonly<Be3EventPayloads[K]>;
  };
}[keyof Be3EventPayloads];

export type AnyDomainEvent =
  | import('./events').Be2Event
  | import('./be1-events').Be1Event
  | Be3Event;
