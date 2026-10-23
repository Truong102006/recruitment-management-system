import type {
  ApplicationConflictPort,
  ApplicationPort,
  ApplicationResultPort,
  CandidateProfilePort,
  CvSelectionPort,
} from './index';

/** Explicit wiring placeholder. NEVER reports success or grants access. Not registered by default. */
export class UnimplementedPortError extends Error {
  readonly code = 'DEPENDENCY_UNAVAILABLE';
  constructor(readonly portName: string) {
    super(`${portName} is not implemented`);
  }
}

export function unimplementedBe2Ports(): {
  application: ApplicationPort;
  applicationResult: ApplicationResultPort;
  applicationConflict: ApplicationConflictPort;
  candidateProfile: CandidateProfilePort;
  cvSelection: CvSelectionPort;
} {
  const unavailable = (name: string) => async (): Promise<never> => {
    throw new UnimplementedPortError(name);
  };
  return {
    application: {
      getSchedulingContext: unavailable('ApplicationPort.getSchedulingContext'),
      onInterviewConfirmed: unavailable('ApplicationPort.onInterviewConfirmed'),
      onInterviewsCancelled: unavailable('ApplicationPort.onInterviewsCancelled'),
      markInterviewed: unavailable('ApplicationPort.markInterviewed'),
    },
    applicationResult: { publish: unavailable('ApplicationResultPort.publish') },
    applicationConflict: {
      hasOpenApplication: unavailable('ApplicationConflictPort.hasOpenApplication'),
    },
    candidateProfile: {
      ensureForCandidate: unavailable('CandidateProfilePort.ensureForCandidate'),
      getSubmissionSnapshot: unavailable('CandidateProfilePort.getSubmissionSnapshot'),
    },
    cvSelection: { requireReady: unavailable('CvSelectionPort.requireReady') },
  };
}
