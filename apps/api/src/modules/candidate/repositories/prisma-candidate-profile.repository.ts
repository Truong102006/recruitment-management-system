import type { CandidateSnapshot } from '../../../../../../libs/contracts/public';
import { TransactionSql } from '../../../../../../libs/platform/database/sql-client';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';
import type {
  CandidateProfilePatch,
  CandidateProfileRepository,
  CandidateProfileRow,
} from './candidate-profile.repository';

interface ProfileSqlRow {
  user_id: string;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  version: number;
}
interface SkillSqlRow {
  skill_id: string;
}
interface VersionSqlRow {
  version: number;
}

export class PrismaCandidateProfileRepository implements CandidateProfileRepository {
  constructor(private readonly sql: TransactionSql) {}

  async ensureForCandidate(userId: string, tx: TransactionContext): Promise<void> {
    await this.sql.query(
      tx,
      `INSERT INTO candidate_profile (user_id, updated_at, version)
       VALUES ($1::uuid, clock_timestamp(), 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
  }

  async getSubmissionSnapshot(
    candidateId: string,
    identity: { readonly name: string; readonly email: string },
    tx: TransactionContext,
  ): Promise<CandidateSnapshot> {
    const profile = await this.get(candidateId, tx);
    if (!profile) throw new Error('CANDIDATE_PROFILE_MISSING');
    return {
      name: identity.name,
      email: identity.email,
      phone: profile.phone,
      headline: profile.headline,
    };
  }

  get(candidateId: string, tx: TransactionContext): Promise<CandidateProfileRow | null> {
    return this.read(candidateId, tx, false);
  }

  getForUpdate(candidateId: string, tx: TransactionContext): Promise<CandidateProfileRow | null> {
    return this.read(candidateId, tx, true);
  }

  private async read(
    candidateId: string,
    tx: TransactionContext,
    lock: boolean,
  ): Promise<CandidateProfileRow | null> {
    const rows = await this.sql.query<ProfileSqlRow>(
      tx,
      lock
        ? `SELECT user_id, phone, headline, summary, location, version
           FROM candidate_profile WHERE user_id = $1::uuid FOR UPDATE`
        : `SELECT user_id, phone, headline, summary, location, version
           FROM candidate_profile WHERE user_id = $1::uuid`,
      [candidateId],
    );
    const row = rows[0];
    if (!row) return null;
    const skills = await this.sql.query<SkillSqlRow>(
      tx,
      `SELECT skill_id FROM candidate_skill
       WHERE candidate_id = $1::uuid ORDER BY skill_id`,
      [candidateId],
    );
    return {
      userId: row.user_id,
      phone: row.phone,
      headline: row.headline,
      summary: row.summary,
      location: row.location,
      version: row.version,
      skillIds: skills.map((skill) => skill.skill_id),
    };
  }

  async update(
    candidateId: string,
    expectedVersion: number,
    patch: CandidateProfilePatch,
    tx: TransactionContext,
  ): Promise<number | null> {
    const rows = await this.sql.query<VersionSqlRow>(
      tx,
      `UPDATE candidate_profile SET phone = $3, headline = $4, summary = $5,
         location = $6, version = version + 1, updated_at = clock_timestamp()
       WHERE user_id = $1::uuid AND version = $2
       RETURNING version`,
      [candidateId, expectedVersion, patch.phone, patch.headline, patch.summary, patch.location],
    );
    return rows[0]?.version ?? null;
  }

  async replaceSkills(
    candidateId: string,
    skillIds: readonly string[],
    tx: TransactionContext,
  ): Promise<void> {
    await this.sql.query(tx, `DELETE FROM candidate_skill WHERE candidate_id = $1::uuid`, [
      candidateId,
    ]);
    if (skillIds.length === 0) return;
    await this.sql.query(
      tx,
      `INSERT INTO candidate_skill (candidate_id, skill_id)
       SELECT $1::uuid, unnest($2::uuid[])
       ON CONFLICT (candidate_id, skill_id) DO NOTHING`,
      [candidateId, [...skillIds]],
    );
  }
}
