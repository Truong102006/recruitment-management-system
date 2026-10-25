import { ConflictException } from '@nestjs/common';
import { JoinAccessRules } from './join-access.rules';

describe('JoinAccessRules', () => {
  const startAt = new Date('2026-10-25T11:00:00Z');
  const endAt = new Date('2026-10-25T12:00:00Z');

  it('allows joining within the valid window and returns correct TTL and windowEnd', () => {
    // 5 minutes before start (within 10-minute early window)
    const now = new Date('2026-10-25T10:55:00Z');
    const result = JoinAccessRules.assertCanJoin({
      startAt,
      endAt,
      status: 'CONFIRMED',
      now,
    });

    expect(result.ttlSeconds).toBe(300); // capped at MAX_TOKEN_TTL_SECONDS
    expect(result.windowEnd.toISOString()).toBe('2026-10-25T12:30:00.000Z');
  });

  it('calculates remaining TTL correctly when less than 300 seconds remain', () => {
    // 2 minutes before window closes (12:28:00Z)
    const now = new Date('2026-10-25T12:28:00Z');
    const result = JoinAccessRules.assertCanJoin({
      startAt,
      endAt,
      status: 'CONFIRMED',
      now,
    });

    expect(result.ttlSeconds).toBe(120);
  });

  it('rejects joining when interview is not CONFIRMED', () => {
    const now = new Date('2026-10-25T11:00:00Z');
    expect(() =>
      JoinAccessRules.assertCanJoin({
        startAt,
        endAt,
        status: 'PROPOSED',
        now,
      }),
    ).toThrow(ConflictException);

    expect(() =>
      JoinAccessRules.assertCanJoin({
        startAt,
        endAt,
        status: 'CANCELLED',
        now,
      }),
    ).toThrow(ConflictException);
  });

  it('rejects joining too early (more than 10 minutes before start)', () => {
    const now = new Date('2026-10-25T10:49:00Z'); // 11 mins before
    expect(() =>
      JoinAccessRules.assertCanJoin({
        startAt,
        endAt,
        status: 'CONFIRMED',
        now,
      }),
    ).toThrow(ConflictException);
  });

  it('rejects joining too late (at or after 30 minutes after end)', () => {
    const now = new Date('2026-10-25T12:30:00Z'); // exactly 30 mins after end
    expect(() =>
      JoinAccessRules.assertCanJoin({
        startAt,
        endAt,
        status: 'CONFIRMED',
        now,
      }),
    ).toThrow(ConflictException);
  });
});
