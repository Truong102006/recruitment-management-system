export interface JoinGrant {
  token: string;
  roomName: string;
  domain: string;
  expiresAt: string;
  roomKey: string;
}

export interface IssueJoinGrantInput {
  operationId: string;
  interviewId: string;
  userId: string;
  accessGeneration: number;
  expiresAt: string;
  roomKey: string;
}

export interface RevokeVideoInput {
  operationId: string;
  interviewId: string;
  accessGeneration: number;
}

export interface VideoPort {
  issueJoinGrant(input: IssueJoinGrantInput): Promise<JoinGrant>;
  revoke(input: RevokeVideoInput): Promise<void>;
}

export const VIDEO_PORT = Symbol.for('rms.VideoPort.v1');
