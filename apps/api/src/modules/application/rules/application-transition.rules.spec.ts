import type { InterviewEvidence } from '../../../../../../libs/contracts/backend';
import type { ApplicationStatus } from '../../../../../../libs/contracts/public';
import { ApplicationRuleError } from './application-rule.error';
import {
  decideApplicationTransition,
  type ApplicationTransitionCommand,
} from './application-transition.rules';

const applicationId = 'application-1';
const transactionId = 'transaction-1';
const evidence: InterviewEvidence = {
  applicationId,
  transactionId,
  proposedCount: 0,
  confirmedCount: 0,
  completedCount: 1,
  noShowCount: 0,
  missingEvaluationCount: 0,
};
const state = (status: ApplicationStatus, version = 2) => ({ applicationId, status, version });

function codeOf(work: () => unknown): string {
  try {
    work();
    return 'NO_ERROR';
  } catch (error) {
    if (!(error instanceof ApplicationRuleError)) throw error;
    return error.code;
  }
}

describe('application transitions — BR09, BR14, TC19, TC43, TC46', () => {
  it.each([
    ['SUBMITTED', 'SCREENING', 'SCREENING'],
    ['SCREENING', 'SHORTLISTED', 'SHORTLISTED'],
  ] as const)('allows recruiter review %s → %s', (from, target, to) => {
    expect(
      decideApplicationTransition(state(from), { kind: 'REVIEW', target, expectedVersion: 2 }),
    ).toMatchObject({
      fromStatus: from,
      toStatus: to,
      nextVersion: 3,
      cancelPendingCvChange: from === 'SCREENING',
    });
  });

  it.each([
    'SUBMITTED',
    'SCREENING',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'HIRED',
    'REJECTED',
    'WITHDRAWN',
  ] as const)('only permits valid review edges from %s', (from) => {
    for (const target of ['SCREENING', 'SHORTLISTED'] as const) {
      const allowed =
        (from === 'SUBMITTED' && target === 'SCREENING') ||
        (from === 'SCREENING' && target === 'SHORTLISTED');
      expect(
        codeOf(() =>
          decideApplicationTransition(state(from), { kind: 'REVIEW', target, expectedVersion: 2 }),
        ),
      ).toBe(allowed ? 'NO_ERROR' : 'STATE_CONFLICT');
    }
  });

  it('moves SHORTLISTED to INTERVIEW_SCHEDULED only on confirmation; another round remains scheduled', () => {
    const command: ApplicationTransitionCommand = {
      kind: 'INTERVIEW_CONFIRMED',
      expectedVersion: 2,
    };
    expect(decideApplicationTransition(state('SHORTLISTED'), command).toStatus).toBe(
      'INTERVIEW_SCHEDULED',
    );
    expect(decideApplicationTransition(state('INTERVIEW_SCHEDULED'), command)).toMatchObject({
      toStatus: 'INTERVIEW_SCHEDULED',
      nextVersion: 3,
    });
    expect(codeOf(() => decideApplicationTransition(state('SUBMITTED'), command))).toBe(
      'STATE_CONFLICT',
    );
  });

  it.each([
    [0, 0, 'SHORTLISTED'],
    [1, 0, 'INTERVIEW_SCHEDULED'],
    [0, 1, 'INTERVIEW_SCHEDULED'],
  ] as const)(
    'after a cancellation with %i confirmed and %i no-show stays/returns %s',
    (confirmedCount, noShowCount, target) => {
      expect(
        decideApplicationTransition(state('INTERVIEW_SCHEDULED'), {
          kind: 'INTERVIEWS_CANCELLED',
          expectedVersion: 2,
          cancelledCount: 1,
          transactionId,
          evidence: { ...evidence, completedCount: 0, confirmedCount, noShowCount },
        }).toStatus,
      ).toBe(target);
    },
  );

  it('does not fall back after a completed round or accept a cancellation with no changed interview', () => {
    expect(
      decideApplicationTransition(state('INTERVIEW_SCHEDULED'), {
        kind: 'INTERVIEWS_CANCELLED',
        expectedVersion: 2,
        cancelledCount: 1,
        transactionId,
        evidence,
      }).toStatus,
    ).toBe('INTERVIEW_SCHEDULED');
    expect(
      codeOf(() =>
        decideApplicationTransition(state('INTERVIEW_SCHEDULED'), {
          kind: 'INTERVIEWS_CANCELLED',
          expectedVersion: 2,
          cancelledCount: 0,
          transactionId,
          evidence,
        }),
      ),
    ).toBe('STATE_CONFLICT');
  });

  it('marks INTERVIEWED only after a complete evaluated round and no open interviews', () => {
    const command: ApplicationTransitionCommand = {
      kind: 'MARK_INTERVIEWED',
      expectedVersion: 2,
      transactionId,
      evidence,
    };
    expect(decideApplicationTransition(state('INTERVIEW_SCHEDULED'), command).toStatus).toBe(
      'INTERVIEWED',
    );
    for (const invalid of [
      { completedCount: 0 },
      { missingEvaluationCount: 1 },
      { proposedCount: 1 },
      { confirmedCount: 1 },
    ]) {
      expect(
        codeOf(() =>
          decideApplicationTransition(state('INTERVIEW_SCHEDULED'), {
            ...command,
            evidence: { ...evidence, ...invalid },
          }),
        ),
      ).toBe('STATE_CONFLICT');
    }
    expect(codeOf(() => decideApplicationTransition(state('SHORTLISTED'), command))).toBe(
      'STATE_CONFLICT',
    );
  });

  it('rejects interview facts from another aggregate/transaction or invalid counts', () => {
    for (const invalid of [
      { applicationId: 'other' },
      { transactionId: 'old' },
      { completedCount: -1 },
      { completedCount: 1.5 },
    ]) {
      expect(
        codeOf(() =>
          decideApplicationTransition(state('INTERVIEW_SCHEDULED'), {
            kind: 'MARK_INTERVIEWED',
            expectedVersion: 2,
            transactionId,
            evidence: { ...evidence, ...invalid },
          }),
        ),
      ).toBe('STATE_CONFLICT');
    }
  });

  it('HIRED is published only from INTERVIEWED with a public result and valid evidence', () => {
    const command: ApplicationTransitionCommand = {
      kind: 'PUBLISH_RESULT',
      expectedVersion: 2,
      result: 'HIRED',
      publicMessage: '  Đã trúng tuyển  ',
      transactionId,
      evidence,
    };
    expect(decideApplicationTransition(state('INTERVIEWED'), command)).toMatchObject({
      toStatus: 'HIRED',
      publication: { publicMessage: 'Đã trúng tuyển' },
      nextVersion: 3,
    });
    for (const from of ['SUBMITTED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'] as const) {
      expect(codeOf(() => decideApplicationTransition(state(from), command))).toBe(
        'STATE_CONFLICT',
      );
    }
    expect(
      codeOf(() =>
        decideApplicationTransition(state('INTERVIEWED'), {
          ...command,
          evidence: { ...evidence, missingEvaluationCount: 1 },
        }),
      ),
    ).toBe('STATE_CONFLICT');
  });

  it.each(['SUBMITTED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'] as const)(
    'allows a published REJECTED from %s with reason and no proposed interview',
    (from) => {
      const command: ApplicationTransitionCommand = {
        kind: 'PUBLISH_RESULT',
        expectedVersion: 2,
        result: 'REJECTED',
        publicMessage: '  Không phù hợp  ',
        internalReason: '  Thiếu kinh nghiệm  ',
        transactionId,
        evidence: { ...evidence, completedCount: from === 'INTERVIEWED' ? 1 : 0 },
      };
      expect(decideApplicationTransition(state(from), command)).toMatchObject({
        toStatus: 'REJECTED',
        cancelPendingCvChange: from === 'SCREENING',
        publication: { publicMessage: 'Không phù hợp', internalReason: 'Thiếu kinh nghiệm' },
      });
      expect(
        decideApplicationTransition(state(from), {
          ...command,
          evidence: { ...command.evidence, confirmedCount: 1 },
        }).toStatus,
      ).toBe('REJECTED');
      expect(
        codeOf(() =>
          decideApplicationTransition(state(from), {
            ...command,
            evidence: { ...command.evidence, proposedCount: 1 },
          }),
        ),
      ).toBe('STATE_CONFLICT');
      expect(
        codeOf(() =>
          decideApplicationTransition(state(from), {
            ...command,
            internalReason: '   ',
          }),
        ),
      ).toBe('VALIDATION_FAILED');
    },
  );

  it('normalizes NFC and counts the result message in Unicode code points', () => {
    const command: ApplicationTransitionCommand = {
      kind: 'PUBLISH_RESULT',
      expectedVersion: 2,
      result: 'HIRED',
      publicMessage: `  ${'😀'.repeat(3000)}  `,
      transactionId,
      evidence,
    };
    expect([
      ...decideApplicationTransition(state('INTERVIEWED'), command).publication!.publicMessage,
    ]).toHaveLength(3000);
    expect(
      codeOf(() =>
        decideApplicationTransition(state('INTERVIEWED'), {
          ...command,
          publicMessage: '😀'.repeat(3001),
        }),
      ),
    ).toBe('VALIDATION_FAILED');
    expect(
      codeOf(() =>
        decideApplicationTransition(state('INTERVIEWED'), {
          ...command,
          publicMessage: '   ',
        }),
      ),
    ).toBe('VALIDATION_FAILED');
    expect(
      decideApplicationTransition(state('INTERVIEWED'), {
        ...command,
        publicMessage: '  e\u0301  ',
      }).publication?.publicMessage,
    ).toBe('é');
  });

  it.each(['SUBMITTED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'] as const)(
    'lets the owner withdraw from %s and requests BE3 cancellation',
    (from) => {
      expect(
        decideApplicationTransition(state(from), { kind: 'WITHDRAW', expectedVersion: 2 }),
      ).toMatchObject({
        toStatus: 'WITHDRAWN',
        cancelOpenInterviews: true,
        cancelPendingCvChange: from === 'SCREENING',
      });
    },
  );

  it.each(['HIRED', 'REJECTED', 'WITHDRAWN'] as const)('never reopens terminal %s', (from) => {
    expect(
      codeOf(() =>
        decideApplicationTransition(state(from), { kind: 'WITHDRAW', expectedVersion: 2 }),
      ),
    ).toBe('STATE_CONFLICT');
  });

  it('rejects stale/malformed version before planning any mutation', () => {
    for (const version of [-1, 1.2, NaN]) {
      expect(
        codeOf(() =>
          decideApplicationTransition(state('SUBMITTED'), {
            kind: 'WITHDRAW',
            expectedVersion: version,
          }),
        ),
      ).toBe('VALIDATION_FAILED');
    }
    expect(
      codeOf(() =>
        decideApplicationTransition(state('SUBMITTED'), { kind: 'WITHDRAW', expectedVersion: 1 }),
      ),
    ).toBe('VERSION_CONFLICT');
    expect(
      codeOf(() =>
        decideApplicationTransition(state('SUBMITTED', Number.MAX_SAFE_INTEGER), {
          kind: 'WITHDRAW',
          expectedVersion: Number.MAX_SAFE_INTEGER,
        }),
      ),
    ).toBe('STATE_CONFLICT');
  });
});
