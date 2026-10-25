import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../../apps/api/src/app.module';
import { configureApi } from '../../../apps/api/src/common/bootstrap/configure-api';

describe('UC05 public search publication order (real AppModule and PostgreSQL)', () => {
  let app: INestApplication | undefined;
  const db = new PrismaClient();
  const userId = randomUUID();
  const companyId = randomUUID();
  const marker = `search-${randomUUID()}`;
  const ids = [randomUUID(), randomUUID(), randomUUID()].sort();

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ logger: false });
    configureApi(app);
    await app.init();
    await db.userAccount.create({
      data: {
        id: userId,
        email: `${userId}@search.test`,
        passwordHash: 'fixture',
        fullName: 'Search owner',
        emailVerifiedAt: new Date(),
      },
    });
    await db.company.create({
      data: {
        id: companyId,
        name: marker,
        taxCode: marker,
        address: 'Search address',
        createdBy: userId,
        approvalStatus: 'APPROVED',
        memberships: { create: { userId, role: 'OWNER', active: true } },
      },
    });
    const now = Date.now();
    for (let i = 0; i < ids.length; i++) {
      await db.jobPost.create({
        data: {
          id: ids[i],
          companyId,
          createdBy: userId,
          title: `${marker} Café`,
          description: 'a'.repeat(100),
          location: 'Hồ Chí Minh',
          headcount: 1,
          jobType: 'FULL_TIME',
          workplaceMode: 'ON_SITE',
          status: 'PUBLISHED',
          deadline: new Date(now + 86400000),
          // The oldest-created job was most recently published; two tie on publication.
          createdAt: new Date(now - (3 - i) * 10000),
          publishedAt: new Date(now - (i === 0 ? 1000 : 5000)),
        },
      });
    }
  }, 30_000); // Full AppModule startup and fixture inserts; assertion budgets stay unchanged.

  afterAll(async () => {
    try {
      await db.jobPost.deleteMany({ where: { companyId } });
      await db.companyMembership.deleteMany({ where: { companyId } });
      await db.company.deleteMany({ where: { id: companyId } });
      await db.userAccount.deleteMany({ where: { id: userId } });
    } finally {
      try {
        await app?.close();
      } finally {
        await db.$disconnect();
      }
    }
  });

  it('defaults to latest publication and a stable id tie-break across pages', async () => {
    const first = await request(app!.getHttpServer())
      .get('/api/jobs')
      .query({ q: marker, pageSize: 1 });
    const next = await request(app!.getHttpServer())
      .get('/api/jobs')
      .query({ q: marker, pageSize: 1, page: 2 });
    const last = await request(app!.getHttpServer())
      .get('/api/jobs')
      .query({ q: marker, pageSize: 1, page: 3 });
    expect([first.status, next.status, last.status]).toEqual([200, 200, 200]);
    expect([first.body.data[0].id, next.body.data[0].id, last.body.data[0].id]).toEqual([
      ids[0],
      ids[2],
      ids[1],
    ]);
    expect(first.body.meta.total).toBe(3);
  });

  it.each([
    ['createdAt', 'asc', [0, 1, 2]],
    ['createdAt', 'desc', [2, 1, 0]],
    ['publishedAt', 'desc', [0, 2, 1]],
  ])('honors explicit %s %s', async (sortBy, sortOrder, order) => {
    const res = await request(app!.getHttpServer())
      .get('/api/jobs')
      .query({ q: marker, sortBy, sortOrder });
    expect(res.status).toBe(200);
    expect(res.body.data.map((item: { id: string }) => item.id)).toEqual(order.map((i) => ids[i]));
  });

  it('normalizes decomposed keyword and location before matching NFC text', async () => {
    const res = await request(app!.getHttpServer())
      .get('/api/jobs')
      .query({
        q: `  ${marker} Café  `.normalize('NFD'),
        location: '  Hồ Chí Minh  '.normalize('NFD'),
      });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);
  });
});
