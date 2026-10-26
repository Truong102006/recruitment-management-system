import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';

const dbUrl = new URL(process.env.DATABASE_URL ?? '');
if (
  !['127.0.0.1', 'localhost'].includes(dbUrl.hostname) ||
  dbUrl.pathname !== '/recruitment_demo'
) {
  throw new Error('Permission matrix requires the local recruitment_demo database.');
}
const base = 'http://127.0.0.1:3000/api';
const origin = 'http://127.0.0.1:5173';
const password = process.env.SEED_DEMO_PASSWORD;
if (!password) throw new Error('SEED_DEMO_PASSWORD is required.');
const results = [];
const limitations = [];
const db = new PrismaClient();
const createdJobs = [];
async function call(path, session = {}, options = {}) {
  const { body, ...rest } = options;
  const response = await fetch(base + path, {
    ...rest,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...(session.cookie ? { Cookie: session.cookie } : {}),
      ...(session.csrfToken ? { 'X-CSRF-Token': session.csrfToken } : {}),
      ...options.headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  return {
    status: response.status,
    data,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
function check(name, actual, expected) {
  results.push({
    name,
    actual,
    expected,
    pass: Array.isArray(expected) ? expected.includes(actual) : actual === expected,
  });
}

try {
  const company = await db.company.findUniqueOrThrow({ where: { taxCode: 'DEMO-LOCAL-001' } });
  for (const path of [
    '/auth/session',
    '/admin/users',
    '/admin/audit',
    '/admin/events',
    '/candidate/profile',
    '/applications',
    '/saved-jobs',
    '/companies',
    '/notifications',
  ]) {
    check(`guest GET ${path}`, (await call(path)).status, 401);
  }
  for (const key of [
    'admin',
    'owner',
    'recruiter',
    'interviewer',
    'candidate',
    'outsider',
    'locked',
  ]) {
    const login = await call(
      '/auth/login',
      {},
      { method: 'POST', body: { email: `${key}.demo@example.test`, password } },
    );
    check(`${key} login`, login.status, key === 'locked' ? 401 : 200);
    if (login.status !== 200) continue;
    const session = { cookie: login.cookie };
    const current = await call('/auth/session', session);
    check(`${key} session`, current.status, 200);
    session.csrfToken = current.data?.data?.csrfToken;
    for (const path of [
      '/admin/users',
      '/admin/companies',
      '/admin/jobs',
      '/admin/audit',
      '/admin/events',
    ]) {
      check(`${key} GET ${path}`, (await call(path, session)).status, key === 'admin' ? 200 : 403);
    }
    check(`${key} GET /notifications`, (await call('/notifications', session)).status, 200);
    check(
      `${key} GET /candidate/profile`,
      (await call('/candidate/profile', session)).status,
      key === 'admin' ? 403 : 200,
    );
    const memberships = await call('/companies', session);
    check(`${key} GET /companies`, memberships.status, 200);
    const expectedRole = {
      owner: 'OWNER',
      recruiter: 'RECRUITER',
      interviewer: 'INTERVIEWER',
      outsider: 'OWNER',
    }[key];
    check(
      `${key} company membership role`,
      memberships.data?.data?.[0]?.role ?? null,
      expectedRole ?? null,
    );
    const member = ['owner', 'recruiter', 'interviewer'].includes(key);
    check(
      `${key} company read scope`,
      (await call(`/companies/${company.id}`, session)).status,
      member ? 200 : 404,
    );
    check(
      `${key} company jobs scope`,
      (await call(`/companies/${company.id}/jobs`, session)).status,
      ['owner', 'recruiter'].includes(key) ? 200 : [403, 404],
    );
    const freshCompany = await db.company.findUniqueOrThrow({ where: { id: company.id } });
    check(
      `${key} company update ownership`,
      (
        await call(`/companies/${company.id}`, session, {
          method: 'PATCH',
          body: { name: company.name, version: freshCompany.version },
        })
      ).status,
      key === 'owner' ? 200 : member ? 403 : 404,
    );
    const draft = await call('/jobs', session, {
      method: 'POST',
      body: { companyId: company.id, title: 'Permission matrix draft' },
    });
    check(
      `${key} job creation operational membership`,
      draft.status,
      ['owner', 'recruiter'].includes(key) ? 201 : [403, 404],
    );
    if (draft.status === 201) createdJobs.push(draft.data.data.id);
    if (key === 'owner') {
      check(
        'owner write without CSRF',
        (
          await call(
            '/jobs',
            { cookie: session.cookie },
            { method: 'POST', body: { companyId: company.id } },
          )
        ).status,
        403,
      );
      check(
        'owner write with hostile Origin',
        (
          await call('/jobs', session, {
            method: 'POST',
            headers: { Origin: 'https://attacker.invalid' },
            body: { companyId: company.id },
          })
        ).status,
        403,
      );
    }
    if (key === 'candidate') {
      for (const path of [
        '/interviews',
        '/candidate/cvs',
        `/companies/${company.id}/statistics/funnel`,
      ]) {
        limitations.push({
          path,
          status: (await call(path, session)).status,
          note: 'Endpoint is absent from current source; no business acceptance claimed.',
        });
      }
    }
    check(`${key} logout`, (await call('/auth/logout', session, { method: 'POST' })).status, 204);
    check(`${key} revoked session`, (await call('/auth/session', session)).status, 401);
  }
  // Exercise actual admin mutation, audit/outbox and session revocation on the dedicated locked fixture.
  const adminLogin = await call(
    '/auth/login',
    {},
    { method: 'POST', body: { email: 'admin.demo@example.test', password } },
  );
  const adminSession = { cookie: adminLogin.cookie };
  const adminInfo = await call('/auth/session', adminSession);
  adminSession.csrfToken = adminInfo.data?.data?.csrfToken;
  const target = await db.userAccount.findUniqueOrThrow({
    where: { email: 'locked.demo@example.test' },
  });
  const unlock = await call(`/admin/users/${target.id}`, adminSession, {
    method: 'PATCH',
    body: {
      status: 'ACTIVE',
      reason: 'Local role matrix unlock probe',
      version: target.version,
    },
  });
  check('ADMIN unlocks locked fixture', unlock.status, 200);
  const unlockedLogin = await call(
    '/auth/login',
    {},
    { method: 'POST', body: { email: target.email, password } },
  );
  check('unlocked account can login', unlockedLogin.status, 200);
  const refreshed = await db.userAccount.findUniqueOrThrow({ where: { id: target.id } });
  const relock = await call(`/admin/users/${target.id}`, adminSession, {
    method: 'PATCH',
    body: {
      status: 'LOCKED',
      reason: 'Restore locked role fixture',
      version: refreshed.version,
    },
  });
  check('ADMIN locks fixture through real BE3 security ports', relock.status, 200);
  check(
    'locked account existing session is revoked',
    (await call('/auth/session', { cookie: unlockedLogin.cookie })).status,
    401,
  );
  check(
    'admin mutation writes audit',
    (await db.auditLog.count({
      where: { actorId: adminInfo.data.data.userId, entityId: target.id },
    })) > 0,
    true,
  );
  await call('/auth/logout', adminSession, { method: 'POST' });
} finally {
  if (createdJobs.length) await db.jobPost.deleteMany({ where: { id: { in: createdJobs } } });
  await db.$disconnect();
}
await mkdir('reports/auth-roles', { recursive: true });
const report = {
  timestamp: new Date().toISOString(),
  database: 'local recruitment_demo',
  results,
  limitations,
  passed: results.filter((r) => r.pass).length,
  failed: results.filter((r) => !r.pass).length,
};
await writeFile('reports/auth-roles/api-matrix.json', JSON.stringify(report, null, 2) + '\n');
console.log(`API permission matrix: ${report.passed} passed, ${report.failed} failed.`);
for (const result of results.filter((r) => !r.pass)) console.log(JSON.stringify(result));
console.log(
  `Missing endpoint probes: ${limitations.length}; see reports/auth-roles/api-matrix.json.`,
);
if (report.failed) process.exitCode = 1;
