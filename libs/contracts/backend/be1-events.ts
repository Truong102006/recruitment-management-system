export interface Be1EventPayloads {
  'auth.verification_requested': {
    readonly userId: string;
    readonly email: string;
    readonly tokenId: string;
    readonly expiresAt: string;
    readonly encryptedEnvelope?: string;
  };
  'auth.password_reset_requested': {
    readonly userId: string;
    readonly email: string;
    readonly tokenId: string;
    readonly expiresAt: string;
    readonly encryptedEnvelope?: string;
  };
  'user.locked': {
    readonly userId: string;
    readonly reason: string;
    readonly lockedBy: string;
  };
  'company.created': {
    readonly companyId: string;
    readonly ownerUserId: string;
  };
  'company.reviewed': {
    readonly companyId: string;
    readonly status: 'APPROVED' | 'REJECTED';
    readonly reason?: string;
  };
  'company.suspended': {
    readonly companyId: string;
    readonly reason: string;
  };
  'company.membership_changed': {
    readonly companyId: string;
    readonly userId: string;
    readonly role: 'OWNER' | 'RECRUITER' | 'INTERVIEWER';
    readonly active: boolean;
  };
  'job.published': {
    readonly jobId: string;
    readonly companyId: string;
    readonly publishedAt: string;
  };
  'job.closed': {
    readonly jobId: string;
    readonly companyId: string;
    readonly reason?: string;
  };
}

export type Be1Event = {
  [K in keyof Be1EventPayloads]: {
    readonly eventId: string;
    readonly eventType: K;
    readonly schemaVersion: 1;
    readonly aggregateId: string;
    readonly aggregateVersion: number;
    readonly occurredAt: string;
    readonly payload: Readonly<Be1EventPayloads[K]>;
  };
}[keyof Be1EventPayloads];
