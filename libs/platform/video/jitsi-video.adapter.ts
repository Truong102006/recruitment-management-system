import * as crypto from 'node:crypto';
import type { IssueJoinGrantInput, JoinGrant, RevokeVideoInput, VideoPort } from './video.port';

export interface JitsiConfig {
  domain: string;
  appId: string;
  appSecret: string;
}

export class JitsiVideoAdapter implements VideoPort {
  private readonly revokedGenerations = new Map<string, number>();

  constructor(private readonly config: JitsiConfig) {}

  async issueJoinGrant(input: IssueJoinGrantInput): Promise<JoinGrant> {
    const lastRevokedGen = this.revokedGenerations.get(input.interviewId) ?? -1;
    if (input.accessGeneration <= lastRevokedGen) {
      throw new Error('Access generation has been revoked');
    }

    const domain = this.config.domain || 'meet.jit.si';
    const roomName = `rms-${input.interviewId}`;

    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: this.config.appId || 'rms-app' }),
    ).toString('base64url');

    const exp = Math.floor(new Date(input.expiresAt).getTime() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        aud: this.config.appId || 'rms-app',
        iss: 'recruitment-management-system',
        sub: input.userId,
        room: roomName,
        generation: input.accessGeneration,
        exp,
        context: {
          user: {
            id: input.userId,
          },
        },
      }),
    ).toString('base64url');

    const secret = this.config.appSecret || 'local_jitsi_secret_key_32_bytes_long!';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const token = `${header}.${payload}.${signature}`;

    return {
      token,
      roomName,
      domain,
      expiresAt: input.expiresAt,
      roomKey: input.roomKey,
    };
  }

  async revoke(input: RevokeVideoInput): Promise<void> {
    this.revokedGenerations.set(input.interviewId, input.accessGeneration);
  }
}
