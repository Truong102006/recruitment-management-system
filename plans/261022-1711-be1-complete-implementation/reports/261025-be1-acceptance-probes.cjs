// Run from repository root after npm run build. Only a disposable local rms_audit DB is allowed.
const { resolve } = require('node:path');
const { mkdirSync, writeFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { Test } = require('@nestjs/testing');
const load = (path) => require(resolve('dist/api', path));
const { AppModule } = load('apps/api/src/app.module.js');
const { configureApi } = load('apps/api/src/common/bootstrap/configure-api.js');
const { PrismaService } = load('apps/api/src/common/prisma/prisma.service.js');
const { PublicationRules } = load('apps/api/src/modules/job/rules/publication.rules.js');
const { PORTS } = load('libs/contracts/backend/index.js');

async function main() {
  const url = new URL(process.env.DATABASE_URL || 'http://invalid');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.pathname !== '/rms_audit') {
    throw new Error('Use a disposable local database named rms_audit');
  }
  process.env.NODE_ENV = 'test';
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication({ logger: false });
  configureApi(app);
  await app.init();
  const db = app.get(PrismaService);
  const results = [];
  let user;
  let company;
  let lockedOwner;
  const check = (id, expected, actual, pass) => results.push({ id, expected, actual, pass });
  try {
    const ports = {};
    for (const key of ['candidateProfile', 'applicationConflict', 'outbox', 'audit', 'interviewMembership', 'interviewSecurity', 'interviewAdmin']) {
      try { ports[key] = Boolean(app.get(PORTS[key], { strict: false })); }
      catch { ports[key] = false; }
    }
    check('runtime-ports', 'All required runtime ports bound', ports, Object.values(ports).every(Boolean));
    const registration = await request(app.getHttpServer()).post('/api/auth/register')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({ email: `${randomUUID()}@audit.example`, password: 'Audit-fixture-123!', fullName: 'Audit user' });
    check('standalone-register', 201, registration.status, registration.status === 201);

    user = await db.userAccount.create({ data: {
      email: `${randomUUID()}@audit.example`, passwordHash: await bcrypt.hash('Audit-fixture-123!', 10),
      fullName: 'Audit recruiter', emailVerifiedAt: new Date(), roles: { create: { role: 'RECRUITER' } },
    } });
    company = await db.company.create({ data: {
      name: 'Audit company', taxCode: `AUDIT-${randomUUID()}`, address: 'Audit address',
      createdBy: user.id, approvalStatus: 'APPROVED',
      memberships: { create: { userId: user.id, role: 'OWNER', permissions: ['RECRUITER'], active: true } },
    } });
    const login = await request(app.getHttpServer()).post('/api/auth/login')
      .set('Origin', 'http://127.0.0.1:5173').send({ email: user.email, password: 'Audit-fixture-123!' });
    if (login.status !== 200) throw new Error('Audit login setup failed');
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const session = await request(app.getHttpServer()).get('/api/auth/session').set('Cookie', cookie);
    const mutation = (method, path) => request(app.getHttpServer())[method](path)
      .set('Cookie', cookie).set('Origin', 'http://127.0.0.1:5173')
      .set('X-CSRF-Token', session.body.data.csrfToken);

    const blank = await mutation('patch', `/api/companies/${company.id}`)
      .send({ name: '  ', address: '     ', version: 0 });
    const storedCompany = await db.company.findUniqueOrThrow({ where: { id: company.id } });
    check('company-whitespace', '400 and unchanged company', {
      status: blank.status, name: storedCompany.name, address: storedCompany.address,
    }, blank.status === 400 && storedCompany.name === 'Audit company');

    const rawTitle = '  Backend engineer  ';
    const rawDescription = 'e\u0301'.repeat(100);
    const draft = await mutation('post', '/api/jobs').send({
      companyId: company.id, title: rawTitle, description: rawDescription, location: '  HCM  ',
    });
    const storedJob = draft.status === 201
      ? await db.jobPost.findUniqueOrThrow({ where: { id: draft.body.data.id } }) : null;
    check('job-normalization', '201; trimmed NFC text persisted', {
      status: draft.status, title: storedJob?.title,
      descriptionIsNfc: storedJob?.description === rawDescription.normalize('NFC'),
      location: storedJob?.location,
    }, draft.status === 201 && storedJob?.title === rawTitle.trim()
      && storedJob?.description === rawDescription.normalize('NFC') && storedJob?.location === 'HCM');

    for (const size of [5, 150]) {
      let accepted = true;
      try { PublicationRules.validateTitle('😀'.repeat(size), true); } catch { accepted = false; }
      check(`title-codepoints-${size}`, size === 150 ? 'accepted' : 'rejected',
        accepted ? 'accepted' : 'rejected', accepted === (size === 150));
    }
    const marker = `audit-order-${randomUUID()}`;
    const now = Date.now();
    const base = { companyId: company.id, createdBy: user.id, title: marker,
      description: 'x'.repeat(100), location: 'HCM', headcount: 1, jobType: 'FULL_TIME',
      workplaceMode: 'ON_SITE', deadline: new Date(now + 86400000), status: 'PUBLISHED' };
    const publishedLatest = await db.jobPost.create({ data: { ...base,
      createdAt: new Date(now - 86400000), publishedAt: new Date(now - 1000) } });
    await db.jobPost.create({ data: { ...base,
      createdAt: new Date(now - 10000), publishedAt: new Date(now - 5000) } });
    const search = await request(app.getHttpServer()).get('/api/jobs').query({ q: marker });
    check('search-default-order', 'latest published first (UC05 step 3)', {
      status: search.status, latestPublishedFirst: search.body.data?.[0]?.id === publishedLatest.id,
    }, search.status === 200 && search.body.data?.[0]?.id === publishedLatest.id);
    lockedOwner = await db.userAccount.create({ data: {
      email: `${randomUUID()}@audit.example`, passwordHash: 'not-a-login-hash',
      fullName: 'Locked owner fixture', status: 'LOCKED', lockedReason: 'Audit fixture',
      emailVerifiedAt: new Date(),
    } });
    await db.companyMembership.update({
      where: { companyId_userId: { companyId: company.id, userId: user.id } },
      data: { role: 'RECRUITER' },
    });
    await db.companyMembership.create({ data: {
      companyId: company.id, userId: lockedOwner.id, role: 'OWNER', active: true,
      permissions: ['RECRUITER'],
    } });
    const ownerlessDraft = await mutation('post', '/api/jobs')
      .send({ companyId: company.id, title: 'Owner locked draft' });
    check('owner-unavailable-mutation', '403 or 409, no job created', {
      status: ownerlessDraft.status,
    }, [403, 409].includes(ownerlessDraft.status));
  } finally {
    if (company) {
      await db.jobSkill.deleteMany({ where: { job: { companyId: company.id } } });
      await db.jobPost.deleteMany({ where: { companyId: company.id } });
      await db.companyMembership.deleteMany({ where: { companyId: company.id } });
      await db.company.delete({ where: { id: company.id } });
    }
    if (user) {
      await db.authSession.deleteMany({ where: { userId: user.id } });
      await db.userRole.deleteMany({ where: { userId: user.id } });
      await db.userAccount.delete({ where: { id: user.id } });
    }
    if (lockedOwner) await db.userAccount.delete({ where: { id: lockedOwner.id } });
    await app.close();
  }
  mkdirSync('reports/be1-audit-20261025', { recursive: true });
  writeFileSync('reports/be1-audit-20261025/acceptance-probes.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => !r.pass)) process.exitCode = 1;
}
main().catch(() => { console.error('Audit probe setup/execution failed; no credentials logged'); process.exitCode = 2; });
