import { ConflictException } from '@nestjs/common';

export interface JoinWindowCheckInput {
  startAt: Date;
  endAt: Date;
  status: string;
  now?: Date;
}

export class JoinAccessRules {
  static readonly EARLY_JOIN_MINUTES = 10;
  static readonly LATE_JOIN_MINUTES = 30;
  static readonly MAX_TOKEN_TTL_SECONDS = 300; // 5 minutes

  static assertCanJoin(input: JoinWindowCheckInput): { ttlSeconds: number; windowEnd: Date } {
    if (input.status !== 'CONFIRMED') {
      throw new ConflictException({
        code: 'STATE_CONFLICT',
        message: 'Cannot join an interview that is not CONFIRMED',
      });
    }

    const now = input.now ?? new Date();
    const windowStart = new Date(
      input.startAt.getTime() - this.EARLY_JOIN_MINUTES * 60 * 1000,
    );
    const windowEnd = new Date(
      input.endAt.getTime() + this.LATE_JOIN_MINUTES * 60 * 1000,
    );

    // [windowStart, windowEnd)
    if (now.getTime() < windowStart.getTime()) {
      throw new ConflictException({
        code: 'TIME_CONFLICT',
        message: 'Interview room is not open yet (opens 10 minutes before start)',
      });
    }

    if (now.getTime() >= windowEnd.getTime()) {
      throw new ConflictException({
        code: 'TIME_CONFLICT',
        message: 'Interview room has expired (closes 30 minutes after end time)',
      });
    }

    const remainingSeconds = Math.floor((windowEnd.getTime() - now.getTime()) / 1000);
    const ttlSeconds = Math.min(this.MAX_TOKEN_TTL_SECONDS, remainingSeconds);

    return { ttlSeconds, windowEnd };
  }
}
