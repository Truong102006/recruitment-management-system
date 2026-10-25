import { BadRequestException } from '@nestjs/common';

export interface ValidateScheduleInput {
  startAt: Date;
  endAt: Date;
  candidateId: string;
  interviewerIds: readonly string[];
  now?: Date;
}

export class ScheduleRules {
  static readonly MIN_DURATION_MINUTES = 15;
  static readonly MAX_DURATION_MINUTES = 120;
  static readonly MAX_INTERVIEWERS = 10;

  static validateSchedule(input: ValidateScheduleInput): void {
    const now = input.now ?? new Date();

    if (input.startAt.getTime() <= now.getTime()) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Interview start time must be in the future',
      });
    }

    if (input.endAt.getTime() <= input.startAt.getTime()) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Interview end time must be strictly after start time',
      });
    }

    const durationMinutes = (input.endAt.getTime() - input.startAt.getTime()) / (1000 * 60);
    if (
      durationMinutes < this.MIN_DURATION_MINUTES ||
      durationMinutes > this.MAX_DURATION_MINUTES
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: `Interview duration must be between ${this.MIN_DURATION_MINUTES} and ${this.MAX_DURATION_MINUTES} minutes`,
      });
    }

    if (!input.candidateId) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Interview must have an assigned candidate',
      });
    }

    if (!input.interviewerIds || input.interviewerIds.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Interview must have at least one interviewer',
      });
    }

    if (input.interviewerIds.length > this.MAX_INTERVIEWERS) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: `Interview cannot have more than ${this.MAX_INTERVIEWERS} interviewers`,
      });
    }

    const uniqueInterviewers = new Set(input.interviewerIds);
    if (uniqueInterviewers.size !== input.interviewerIds.length) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Interviewer list contains duplicates',
      });
    }

    if (uniqueInterviewers.has(input.candidateId)) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Candidate cannot be an interviewer for their own interview',
      });
    }
  }
}
