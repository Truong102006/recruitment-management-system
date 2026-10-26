import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Candidate profile backfill migration preserves legacy accounts', () => {
  const db = new PrismaClient();
  const schema = `profile_backfill_${randomUUID().replaceAll('-', '')}`;
  const migration = readFileSync(
    resolve('prisma/migrations/20261026010000_backfill_candidate_profiles/migration.sql'),
    'utf8',
  );

  afterAll(async () => {
    await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await db.$disconnect();
  });

  it('backfills candidate-only and multi-role accounts, preserves existing profile/version and is idempotent', async () => {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      await tx.$executeRawUnsafe('CREATE TABLE user_account (id uuid PRIMARY KEY)');
      await tx.$executeRawUnsafe(
        'CREATE TABLE user_role (user_id uuid REFERENCES user_account(id), role text, PRIMARY KEY (user_id, role))',
      );
      await tx.$executeRawUnsafe(
        'CREATE TABLE candidate_profile (user_id uuid PRIMARY KEY REFERENCES user_account(id), headline text, version integer NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now())',
      );
      const [candidate, recruiter, admin, existing] = Array.from({ length: 4 }, () => randomUUID());
      for (const id of [candidate!, recruiter!, admin!, existing!]) {
        await tx.$executeRaw`INSERT INTO user_account(id) VALUES (${id}::uuid)`;
      }
      for (const [id, role] of [
        [candidate!, 'CANDIDATE'],
        [recruiter!, 'CANDIDATE'],
        [recruiter!, 'RECRUITER'],
        [admin!, 'ADMIN'],
        [existing!, 'CANDIDATE'],
      ]) {
        await tx.$executeRaw`INSERT INTO user_role(user_id,role) VALUES (${id}::uuid,${role})`;
      }
      await tx.$executeRaw`INSERT INTO candidate_profile(user_id,headline,version) VALUES (${existing!}::uuid,'Keep my existing profile',7)`;
      await tx.$executeRawUnsafe(migration);
      const first = await tx.$queryRaw<
        { user_id: string; headline: string | null; version: number; updated_at: Date }[]
      >`SELECT * FROM candidate_profile ORDER BY user_id`;
      expect(first.map((row) => row.user_id).sort()).toEqual(
        [candidate, recruiter, existing].sort(),
      );
      expect(first.find((row) => row.user_id === existing)).toMatchObject({
        headline: 'Keep my existing profile',
        version: 7,
      });
      expect(first.find((row) => row.user_id === candidate)).toMatchObject({
        headline: null,
        version: 0,
      });
      await tx.$executeRawUnsafe(migration);
      expect(await tx.$queryRaw`SELECT * FROM candidate_profile ORDER BY user_id`).toEqual(first);
    });
  });
});
