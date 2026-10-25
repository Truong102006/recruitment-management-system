import { BadRequestException } from '@nestjs/common';
import { ScheduleRules } from './schedule.rules';

describe('ScheduleRules', () => {
  const now = new Date('2026-10-25T10:00:00Z');
  const validStart = new Date('2026-10-25T11:00:00Z');
  const validEnd = new Date('2026-10-25T12:00:00Z');
  const candidateId = 'c0000000-0000-0000-0000-000000000001';
  const interviewer1 = 'i0000000-0000-0000-0000-000000000001';
  const interviewer2 = 'i0000000-0000-0000-0000-000000000002';

  it('validates a correct schedule successfully', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validEnd,
        candidateId,
        interviewerIds: [interviewer1, interviewer2],
        now,
      }),
    ).not.toThrow();
  });

  it('rejects start time in the past or now', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: new Date('2026-10-25T09:59:59Z'),
        endAt: validEnd,
        candidateId,
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: now,
        endAt: validEnd,
        candidateId,
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects end time <= start time', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validStart,
        candidateId,
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: new Date('2026-10-25T10:30:00Z'),
        candidateId,
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects duration shorter than 15 minutes', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: new Date('2026-10-25T11:10:00Z'), // 10 mins
        candidateId,
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects duration longer than 120 minutes', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: new Date('2026-10-25T13:30:00Z'), // 150 mins
        candidateId,
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects missing candidateId', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validEnd,
        candidateId: '',
        interviewerIds: [interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects empty interviewer list', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validEnd,
        candidateId,
        interviewerIds: [],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects more than 10 interviewers', () => {
    const elevenInterviewers = Array.from({ length: 11 }, (_, i) => `i${i}`);
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validEnd,
        candidateId,
        interviewerIds: elevenInterviewers,
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects duplicate interviewers', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validEnd,
        candidateId,
        interviewerIds: [interviewer1, interviewer1],
        now,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects candidate as an interviewer', () => {
    expect(() =>
      ScheduleRules.validateSchedule({
        startAt: validStart,
        endAt: validEnd,
        candidateId,
        interviewerIds: [interviewer1, candidateId],
        now,
      }),
    ).toThrow(BadRequestException);
  });
});
