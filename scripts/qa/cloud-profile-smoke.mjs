import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const target = new URL(process.env.DATABASE_URL ?? '');
if (target.hostname !== 'ep-sweet-sea-azka5gjs.c-3.ap-southeast-1.aws.neon.tech') {
  throw new Error('Unexpected database target for the authorized cloud profile verification.');
}
const password = parseEnv(readFileSync('.env.local-demo', 'utf8')).SEED_DEMO_PASSWORD;
if (!password) throw new Error('Demo credentials are required.');
const db = new PrismaClient();
const base = 'http://127.0.0.1:3000/api';
const results = [];
function check(name, actual, expected) {
  results.push({ name, actual, expected, pass: actual === expected });
}
async function call(method, path, session = {}, body, extraHeaders = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Content-Type': 'application/json',
      ...(session.cookie ? { Cookie: session.cookie } : {}),
      ...(session.csrf ? { 'X-CSRF-Token': session.csrf } : {}),
      ...extraHeaders,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
async function login(key) {
  const response = await call(
    'POST',
    '/auth/login',
    {},
    { email: `${key}.demo@example.test`, password },
  );
  check(`${key} login`, response.status, key === 'locked' ? 401 : 200);
  if (response.status !== 200) return null;
  const session = { cookie: response.cookie };
  session.csrf = (await call('GET', '/auth/session', session)).data.data.csrfToken;
  return session;
}

try {
  for (const key of [
    'owner',
    'recruiter',
    'interviewer',
    'candidate',
    'outsider',
    'admin',
    'locked',
  ]) {
    const session = await login(key);
    if (!session) continue;
    try {
      const profile = await call('GET', '/candidate/profile', session);
      check(`${key} profile read`, profile.status, key === 'admin' ? 403 : 200);
      if (profile.status === 200)
        check(
          `${key} profile belongs to actor`,
          profile.data.data.email,
          `${key}.demo@example.test`,
        );
      if (key === 'candidate' && profile.status === 200) {
        const original = profile.data.data;
        const own = await db.userAccount.findUniqueOrThrow({
          where: { email: 'candidate.demo@example.test' },
        });
        const outboxBefore = await db.outboxEvent.count({
          where: { aggregateId: own.id, eventType: 'candidate.profile_updated' },
        });
        check(
          'profile write requires CSRF',
          (
            await call(
              'PATCH',
              '/candidate/profile',
              { cookie: session.cookie },
              { version: original.version, location: original.location },
            )
          ).status,
          403,
        );
        check(
          'profile write rejects actor override',
          (
            await call('PATCH', '/candidate/profile', session, {
              version: original.version,
              userId: own.id,
            })
          ).status,
          400,
        );
        const updated = await call('PATCH', '/candidate/profile', session, {
          version: original.version,
          location: 'Cloud profile verification',
        });
        check('candidate profile save', updated.status, 200);
        if (updated.status === 200) {
          check('profile version increments', updated.data.data.version, original.version + 1);
          try {
            check(
              'profile persists after save',
              (await call('GET', '/candidate/profile', session)).data.data.location,
              'Cloud profile verification',
            );
            check(
              'stale profile version rejected',
              (
                await call('PATCH', '/candidate/profile', session, {
                  version: original.version,
                  location: 'Should never persist',
                })
              ).status,
              409,
            );
          } finally {
            const restored = await call('PATCH', '/candidate/profile', session, {
              version: updated.data.data.version,
              location: original.location,
            });
            check('restore demo location', restored.status, 200);
          }
          check(
            'profile writes append transactional outbox events',
            (await db.outboxEvent.count({
              where: { aggregateId: own.id, eventType: 'candidate.profile_updated' },
            })) - outboxBefore,
            2,
          );
        }
      }
    } finally {
      check(`${key} logout`, (await call('POST', '/auth/logout', session)).status, 204);
    }
  }
  const missing = await db.$queryRawUnsafe(
    "SELECT count(*)::int AS count FROM user_account a JOIN user_role r ON r.user_id=a.id AND r.role='CANDIDATE' LEFT JOIN candidate_profile p ON p.user_id=a.id WHERE p.user_id IS NULL",
  );
  check('all existing candidates have a profile', missing[0].count, 0);
} finally {
  await db.$disconnect();
}
const report = {
  timestamp: new Date().toISOString(),
  targetHost: target.hostname,
  results,
  passed: results.filter((r) => r.pass).length,
  failed: results.filter((r) => !r.pass).length,
};
writeFileSync(
  'reports/auth-roles/cloud-profile-api-verification.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(`Cloud profile API: ${report.passed} passed, ${report.failed} failed.`);
for (const result of results.filter((r) => !r.pass)) console.log(JSON.stringify(result));
if (report.failed) process.exitCode = 1;
