import type { CandidateProfilePort } from '../../../../../../libs/contracts/backend';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';

export interface CandidateProfileRow {
  readonly userId: string;
  readonly phone: string | null;
  readonly headline: string | null;
  readonly summary: string | null;
  readonly location: string | null;
  readonly version: number;
  readonly skillIds: readonly string[];
}

export interface CandidateProfilePatch {
  readonly phone: string | null;
  readonly headline: string | null;
  readonly summary: string | null;
  readonly location: string | null;
}

export interface CandidateProfileRepository extends CandidateProfilePort {
  get(candidateId: string, tx: TransactionContext): Promise<CandidateProfileRow | null>;
  getForUpdate(candidateId: string, tx: TransactionContext): Promise<CandidateProfileRow | null>;
  update(
    candidateId: string,
    expectedVersion: number,
    patch: CandidateProfilePatch,
    tx: TransactionContext,
  ): Promise<number | null>;
  replaceSkills(
    candidateId: string,
    skillIds: readonly string[],
    tx: TransactionContext,
  ): Promise<void>;
}
