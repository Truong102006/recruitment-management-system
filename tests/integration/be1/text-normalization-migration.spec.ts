import { PrismaClient } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';
import { AppModule } from '../../../apps/api/src/app.module';
import { configureApi } from '../../../apps/api/src/common/bootstrap/configure-api';
import { PrismaService } from '../../../apps/api/src/common/prisma/prisma.service';

describe('BE1 legacy text normalization migration (isolated PostgreSQL schema)', () => {
  // Both the schema identifier and all fixtures belong only to this test invocation.
  const schema = `be1_text_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  let app: INestApplication | undefined;
  const oldTime = new Date('2020-01-02T03:04:05.000Z');
  const publishedAt = new Date('2020-02-01T00:00:00.000Z');
  const closedAt = new Date('2020-03-01T00:00:00.000Z');
  const deadline = new Date('2020-04-01T00:00:00.000Z');
  const wrap = (value: string) => `\uFEFF\u2003 \t${value}\r\n\u2003\uFEFF`;
  const userId = randomUUID();
  const companyId = randomUUID();
  const jobId = randomUUID();
  const untouchedId = randomUUID();
  const nullJobId = randomUUID();
  const applicationId = randomUUID();
  const snapshot = {
    name: wrap('Cafe\u0301'),
    email: 'snapshot@example.test',
    phone: null,
    headline: null,
  };
  const migration = () =>
    readFileSync(
      resolve('prisma/migrations/20261025073000_be1_normalize_text/migration.sql'),
      'utf8',
    );

  beforeAll(async () => {
    try {
      execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
        env: { ...process.env, DATABASE_URL: url.toString() },
        stdio: 'pipe',
        timeout: 45_000,
      });
    } catch {
      // Prisma's child-process output can include connection details.
      throw new Error('Isolated migration setup failed; verify local test database and SQL');
    }
    await db.$connect();
    await db.userAccount.create({
      data: {
        id: userId,
        email: `${userId}@migration.test`,
        fullName: wrap('Cafe\u0301 owner'),
        passwordHash: '  password-must-stay-e\u0301  ',
        status: 'LOCKED',
        version: 3,
        updatedAt: oldTime,
      },
    });
    await db.userAccount.create({
      data: {
        id: untouchedId,
        email: `${untouchedId}@migration.test`,
        fullName: 'Already NFC',
        passwordHash: 'unchanged',
        version: 7,
        updatedAt: oldTime,
      },
    });
    await db.company.create({
      data: {
        id: companyId,
        createdBy: userId,
        name: wrap('Cafe\u0301 company'),
        taxCode: `TEXT-${randomUUID()}`,
        address: wrap('Đa\u0300 Na\u0306\u0303ng'),
        website: wrap('https://cafe\u0301.example'),
        description: wrap('Cafe\u0301 description'),
        approvalStatus: 'SUSPENDED',
        version: 5,
        updatedAt: oldTime,
        memberships: { create: { userId, role: 'OWNER', active: true } },
      },
    });
    await db.jobPost.create({
      data: {
        id: jobId,
        companyId,
        createdBy: userId,
        title: wrap('Cafe\u0301 job title'),
        description: wrap('e\u0301'.repeat(100)),
        location: wrap('Đa\u0300 Na\u0306\u0303ng'),
        closeReason: wrap('Đa\u0303 tuye\u0302\u0309n'),
        status: 'CLOSED',
        publishedAt,
        closedAt,
        deadline,
        version: 9,
        updatedAt: oldTime,
      },
    });
    await db.jobPost.create({
      data: {
        id: nullJobId,
        companyId,
        createdBy: userId,
        status: 'DRAFT',
        version: 4,
        updatedAt: oldTime,
      },
    });
    await db.candidateProfile.create({ data: { userId: untouchedId } });
    const cvId = randomUUID();
    await db.cvVersion.create({
      data: {
        id: cvId,
        candidateId: untouchedId,
        versionNo: 1,
        originalName: 'fixture.pdf',
        objectKey: `${schema}/fixture.pdf`,
        status: 'PENDING_UPLOAD',
        uploadExpiresAt: deadline,
      },
    });
    await db.application.create({
      data: {
        id: applicationId,
        jobId,
        candidateId: untouchedId,
        originalCvVersionId: cvId,
        currentCvVersionId: cvId,
        candidateSnapshot: snapshot,
        status: 'SUBMITTED',
      },
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(db)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApi(app);
    await app.init();
  }, 60_000); // CLI schema deployment and fixtures have a separate setup budget.

  afterAll(async () => {
    try {
      await app?.close();
    } finally {
      try {
        // Identifier is generated from UUID above, never supplied externally.
        await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await db.$disconnect();
      }
    }
  });

  const state = async () => ({
    users: await db.userAccount.findMany({ orderBy: { id: 'asc' } }),
    companies: await db.company.findMany({ orderBy: { id: 'asc' } }),
    jobs: await db.jobPost.findMany({ orderBy: { id: 'asc' } }),
    memberships: await db.companyMembership.findMany(),
    applications: await db.application.findMany(),
  });

  it('normalizes existing rows once, preserves unrelated data and leaves canonical rows untouched', async () => {
    const before = await state();
    await db.$executeRawUnsafe(migration());
    const after = await state();
    expect(after.users.find((user) => user.id === userId)).toMatchObject({
      fullName: 'Café owner',
      passwordHash: '  password-must-stay-e\u0301  ',
      status: 'LOCKED',
      version: 4,
    });
    expect(after.companies[0]).toMatchObject({
      name: 'Café company',
      address: 'Đà Nẵng',
      website: 'https://café.example',
      description: 'Café description',
      approvalStatus: 'SUSPENDED',
      createdBy: userId,
      version: 6,
    });
    expect(after.jobs.find((job) => job.id === jobId)).toMatchObject({
      title: 'Café job title',
      description: 'é'.repeat(100),
      location: 'Đà Nẵng',
      closeReason: 'Đã tuyển',
      status: 'CLOSED',
      publishedAt,
      closedAt,
      deadline,
      companyId,
      createdBy: userId,
      version: 10,
    });
    for (const changed of [
      after.users.find((user) => user.id === userId)!,
      after.companies[0]!,
      after.jobs.find((job) => job.id === jobId)!,
    ])
      expect(changed.updatedAt.getTime()).toBeGreaterThan(oldTime.getTime());
    expect(after.users.find((user) => user.id === untouchedId)).toEqual(
      before.users.find((user) => user.id === untouchedId),
    );
    expect(after.jobs.find((job) => job.id === nullJobId)).toEqual(
      before.jobs.find((job) => job.id === nullJobId),
    );
    expect(after.memberships).toEqual(before.memberships);
    expect(after.applications).toEqual(before.applications);
    expect(after.applications[0]!.candidateSnapshot).toEqual(snapshot);
    await db.$executeRawUnsafe(migration());
    expect(await state()).toEqual(after);
  });

  it('finds a migrated legacy job through the real HTTP search with decomposed input', async () => {
    // Make the preserved suspended/closed fixture publicly eligible after checking
    // that the migration itself did not change its business state.
    await db.userAccount.update({
      where: { id: userId },
      data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
    });
    await db.company.update({ where: { id: companyId }, data: { approvalStatus: 'APPROVED' } });
    await db.jobPost.update({
      where: { id: jobId },
      data: {
        status: 'PUBLISHED',
        headcount: 1,
        jobType: 'FULL_TIME',
        workplaceMode: 'ON_SITE',
        deadline: new Date(Date.now() + 86_400_000),
      },
    });
    const response = await request(app!.getHttpServer())
      .get('/api/jobs')
      .query({ q: '  Cafe\u0301 job title  ', location: '  Đa\u0300 Na\u0306\u0303ng  ' });
    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBe(1);
    expect(response.body.data).toEqual([
      expect.objectContaining({ id: jobId, title: 'Café job title', location: 'Đà Nẵng' }),
    ]);
  });

  it('rolls back every earlier update when NFC expansion exceeds a column limit', async () => {
    await db.userAccount.update({
      where: { id: userId },
      data: { fullName: wrap('Another cafe\u0301 owner') },
    });
    await db.company.update({
      where: { id: companyId },
      data: { name: wrap('Another cafe\u0301 company') },
    });
    // U+0344 expands under NFC into U+0308 U+0301: 100 -> 200 code points.
    await db.jobPost.update({ where: { id: jobId }, data: { title: '\u0344'.repeat(100) } });
    const before = await state();
    await expect(db.$executeRawUnsafe(migration())).rejects.toThrow();
    expect(await state()).toEqual(before);
  });
});
