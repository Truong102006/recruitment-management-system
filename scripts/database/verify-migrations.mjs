import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

// Only a newly generated isolated schema is mutated; never reset the supplied database.
const schema = `be1_verify_${randomUUID().replaceAll('-', '')}`;
const source = process.env.MIGRATION_TEST_DATABASE_URL;
if (!source)
  throw new Error(
    'MIGRATION_TEST_DATABASE_URL must point to a disposable PostgreSQL test database',
  );
const url = new URL(source);
url.searchParams.set('schema', schema);
const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const run = () =>
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });
try {
  run();
  const user = await prisma.userAccount.create({
    data: {
      email: `${schema}@example.test`,
      passwordHash: 'migration-fixture-not-a-login',
      fullName: 'Migration fixture',
      roles: { create: { role: 'CANDIDATE' } },
    },
  });
  await prisma.candidateProfile.create({ data: { userId: user.id } });
  run();
  if (
    (
      await prisma.userAccount.findUniqueOrThrow({
        where: { id: user.id },
        include: { roles: true },
      })
    ).roles.length !== 1
  )
    throw new Error('Data lost on repeated deploy');
  if (!(await prisma.candidateProfile.findUnique({ where: { userId: user.id } })))
    throw new Error('BE2 profile lost on repeated deploy');
  const constraints =
    await prisma.$queryRaw`SELECT conname FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = ${schema} AND c.convalidated`;
  for (const name of [
    'check_user_status',
    'check_user_role',
    'check_job_salary',
    'check_job_published_complete',
    'company_membership_user_id_fkey',
    'fk_application_original_cv',
    'fk_application_current_cv',
    'ck_final_result',
    'fk_cv_change_application_owner',
    'ck_idempotency_state',
  ]) {
    if (!constraints.some((row) => row.conname === name))
      throw new Error(`Missing validated constraint ${name}`);
  }
  const indexes =
    await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE schemaname = ${schema}`;
  for (const name of [
    'user_account_email_key',
    'company_tax_code_key',
    'job_post_status_deadline_idx',
    'uq_cv_change_pending',
    'saved_job_candidate_id_created_at_job_id_idx',
  ]) {
    if (!indexes.some((row) => row.indexname === name)) throw new Error(`Missing index ${name}`);
  }
  let denied = false;
  try {
    await prisma.userAccount.update({ where: { id: user.id }, data: { status: 'INVALID' } });
  } catch {
    denied = true;
  }
  if (!denied) throw new Error('Database accepted invalid account status');
  let invalidProfileDenied = false;
  try {
    await prisma.candidateProfile.create({ data: { userId: randomUUID() } });
  } catch {
    invalidProfileDenied = true;
  }
  if (!invalidProfileDenied) throw new Error('BE2 accepted profile without an identity owner');
  mkdirSync('reports/backend/migrations', { recursive: true });
  writeFileSync(
    'reports/backend/migrations/result.json',
    JSON.stringify(
      {
        commit: process.env.GITHUB_SHA ?? process.env.EVIDENCE_COMMIT ?? null,
        status: 'success',
        checks: [
          'empty-schema deploy',
          'repeat deploy preserves fixture',
          'validated constraints',
          'indexes',
          'invalid status rejected',
          'BE2 profile preserved on repeated deploy',
          'BE2 constraints and indexes',
          'BE2 candidate identity foreign key',
        ],
        limitations: [
          'No historical release upgrade fixture exists yet',
          'Runtime/migration role permissions not verified by this command',
        ],
      },
      null,
      2,
    ),
  );
  console.log('Migration smoke verification passed in isolated schema');
} catch (error) {
  // Child Prisma output can contain connection details: do not print it.
  console.error(
    error.status === undefined
      ? error.message
      : 'Prisma migrate deploy failed; verify test database availability and migration SQL',
  );
  process.exitCode = 1;
} finally {
  // Identifier is generated above from UUID and never taken from user input.
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await prisma.$disconnect();
}
