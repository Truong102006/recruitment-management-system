import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const dbUrl = new URL(process.env.DATABASE_URL ?? '');
if (
  !['127.0.0.1', 'localhost'].includes(dbUrl.hostname) ||
  dbUrl.pathname !== '/recruitment_demo'
) {
  throw new Error('Run auth role E2E with --env-file=.env.local-demo against recruitment_demo.');
}
const password = process.env.SEED_DEMO_PASSWORD;
if (!password) throw new Error('SEED_DEMO_PASSWORD is required for role E2E.');
const prefix = `browser-${randomUUID()}`;
test.use({ trace: 'off' });

async function login(page: Page, key: string, target: string) {
  await page.goto(`/login?returnTo=${encodeURIComponent(target)}`);
  await page.getByLabel('Địa chỉ email').fill(`${key}.demo@example.test`);
  await page.locator('#login-password').fill(password!);
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${target.replaceAll('/', '\\/')}$`));
}

test.afterAll(async () => {
  const db = new PrismaClient();
  try {
    const ids = (await db.userAccount.findMany({ where: { email: { startsWith: prefix } } })).map(
      (u) => u.id,
    );
    await db.outboxEvent.deleteMany({ where: { aggregateId: { in: ids } } });
    await db.authSession.deleteMany({ where: { userId: { in: ids } } });
    await db.authToken.deleteMany({ where: { userId: { in: ids } } });
    await db.candidateProfile.deleteMany({ where: { userId: { in: ids } } });
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.userAccount.deleteMany({ where: { id: { in: ids } } });
  } finally {
    await db.$disconnect();
  }
});

test('guest cannot open candidate, recruiter, admin or interview routes', async ({ page }) => {
  for (const target of ['/candidate/profile', '/recruiter/jobs', '/admin/users', '/interviews']) {
    await page.goto(target);
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(target);
  }
});

for (const role of [
  { key: 'admin', path: '/admin/users', pageId: 'ui27-admin-users', deny: '/recruiter/jobs' },
  { key: 'owner', path: '/recruiter/jobs', pageId: 'ui17-jobs-list', deny: '/admin/users' },
  { key: 'recruiter', path: '/recruiter/jobs', pageId: 'ui17-jobs-list', deny: '/admin/users' },
  { key: 'interviewer', path: '/interviews', pageId: 'ui13-interviews', deny: '/recruiter/jobs' },
  { key: 'candidate', path: '/candidate/profile', pageId: 'profile-page', deny: '/admin/users' },
]) {
  test(`${role.key}: browser login, allowed screen, denied route and logout`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await login(page, role.key, role.path);
    await expect(page.getByTestId(role.pageId)).toBeVisible();
    if (role.key === 'owner' || role.key === 'recruiter') {
      await expect(page.getByText('Local Demo Recruitment: Software Engineer')).toBeVisible();
    }
    const sessionResponse = await page.request.get('/api/auth/session');
    expect(sessionResponse.status()).toBe(200);
    const session = (await sessionResponse.json()).data;
    expect(session.email).toBe(`${role.key}.demo@example.test`);
    const memberships = (await (await page.request.get('/api/companies')).json()).data;
    if (role.key === 'owner' || role.key === 'recruiter' || role.key === 'interviewer') {
      expect(memberships[0].role).toBe(role.key.toUpperCase());
    } else {
      expect(memberships).toEqual([]);
    }
    await page.screenshot({ path: info.outputPath(`${role.key}.png`), fullPage: true });
    const extraScreens: Record<string, string[]> = {
      admin: ['/admin/companies', '/admin/jobs', '/admin/audit', '/admin/events', '/notifications'],
      owner: [
        '/recruiter/company',
        '/recruiter/members',
        '/recruiter/applications',
        '/recruiter/statistics',
        '/notifications',
      ],
      recruiter: [
        '/recruiter/company',
        '/recruiter/members',
        '/recruiter/applications',
        '/recruiter/statistics',
        '/notifications',
      ],
      interviewer: ['/candidate/profile', '/notifications'],
      candidate: [
        '/candidate/applications',
        '/candidate/cvs',
        '/candidate/saved-jobs',
        '/notifications',
      ],
    };
    for (const path of extraScreens[role.key] ?? []) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`));
      await expect(
        page.getByRole('heading', { name: 'Unexpected Application Error!' }),
      ).toHaveCount(0);
    }
    await page.goto(role.deny);
    await expect(page).toHaveURL(/\/403$/);
    await page.goto(role.path);
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).first().click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    expect((await page.request.get('/api/auth/session')).status()).toBe(401);
    expect(errors).toEqual([]);
  });
}

test('wrong password and locked account are rejected without a session', async ({ page }) => {
  for (const [key, attempt] of [
    ['outsider', 'Wrong-Password-123!'],
    ['locked', password!],
  ] as const) {
    await page.goto('/login');
    await page.getByLabel('Địa chỉ email').fill(`${key}.demo@example.test`);
    await page.locator('#login-password').fill(attempt);
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    expect((await response).status()).toBe(401);
    await expect(page.getByRole('alert')).toContainText('Email hoặc mật khẩu không chính xác');
    expect((await page.request.get('/api/auth/session')).status()).toBe(401);
  }
});

for (const role of ['CANDIDATE', 'RECRUITER']) {
  test(`browser registration ${role} creates only allowed roles`, async ({ page }, info) => {
    await page.goto('/register');
    await page.getByLabel('Họ và tên').fill('Browser Registration Test');
    const email = `${prefix}-${role.toLowerCase()}-${info.project.name}@example.test`;
    await page.getByLabel('Địa chỉ email').fill(email);
    await page.locator('#register-password').fill(password!);
    await page.getByLabel('Xác nhận mật khẩu').fill(password!);
    await page.locator(`input[name="role"][value="${role}"]`).check();
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/api/auth/register') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Đăng ký tài khoản', exact: true }).click();
    const result = await response;
    expect(result.status()).toBe(201);
    const user = (await result.json()).data;
    expect(user.roles.sort()).toEqual(
      role === 'RECRUITER' ? ['CANDIDATE', 'RECRUITER'] : ['CANDIDATE'],
    );
    await expect(
      page.getByRole('heading', { name: 'Đăng ký tài khoản thành công!' }),
    ).toBeVisible();
  });
}
