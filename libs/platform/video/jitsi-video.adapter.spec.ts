import { JitsiVideoAdapter } from './jitsi-video.adapter';

describe('JitsiVideoAdapter', () => {
  const adapter = new JitsiVideoAdapter({
    domain: 'meet.jit.si',
    appId: 'test-app',
    appSecret: 'test-secret',
  });

  it('issues a valid join grant', async () => {
    const grant = await adapter.issueJoinGrant({
      operationId: 'op-1',
      interviewId: 'inv-1',
      userId: 'user-1',
      accessGeneration: 1,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      roomKey: 'rk-123',
    });

    expect(grant.domain).toBe('meet.jit.si');
    expect(grant.roomName).toBe('rms-inv-1');
    expect(grant.token).toBeDefined();
    expect(grant.token.split('.').length).toBe(3);
  });

  it('rejects join grant if access generation is revoked', async () => {
    await adapter.revoke({
      operationId: 'op-1',
      interviewId: 'inv-2',
      accessGeneration: 2,
    });

    await expect(
      adapter.issueJoinGrant({
        operationId: 'op-2',
        interviewId: 'inv-2',
        userId: 'user-1',
        accessGeneration: 1, // revoked
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        roomKey: 'rk-123',
      }),
    ).rejects.toThrow('Access generation has been revoked');
  });
});
