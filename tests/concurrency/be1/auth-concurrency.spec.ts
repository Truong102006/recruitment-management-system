import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTestApi } from '../../helpers/create-test-api';
import { TokenRules } from '../../../apps/api/src/modules/identity/rules/token.rules';

describe('UC04 Concurrency & Race Tests (Phase 3)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await createTestApi();
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('handles concurrent identical registration requests safely: exactly 1 account created', async () => {
    const concurrentEmail = `race_reg_${Date.now()}@example.com`;
    const password = 'P@ssword12345!';

    // Launch 3 simultaneous registrations with the same email
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: concurrentEmail, password, fullName: 'Race User 1' }),
      request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: concurrentEmail, password, fullName: 'Race User 2' }),
      request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: concurrentEmail, password, fullName: 'Race User 3' }),
    ]);

    const statuses = responses.map((r) => r.status).sort();
    // Exactly 1 must be 201 (created), and the other 2 must be 202 (accepted duplicate)
    expect(statuses).toEqual([201, 202, 202]);

    // Check DB: exactly 1 record
    const count = await prisma.userAccount.count({
      where: { email: concurrentEmail },
    });
    expect(count).toBe(1);
  });

  it('guarantees CAS token consumption race: only 1 verification succeeds, second gets 409', async () => {
    const user = await prisma.userAccount.create({
      data: {
        email: `verify_race_${Date.now()}@example.com`,
        passwordHash: 'hash',
        fullName: 'Verify Race',
        roles: { create: [{ role: 'CANDIDATE' }] },
      },
    });

    const rawToken = `verify_race_token_${Date.now()}`;
    const tokenHash = TokenRules.hashToken(rawToken);

    await prisma.authToken.create({
      data: {
        userId: user.id,
        purpose: 'VERIFY_EMAIL',
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    // Run 2 simultaneous verify requests
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ token: rawToken }),
      request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ token: rawToken }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('guarantees CAS password reset race: only 1 reset succeeds, second gets 409', async () => {
    const user = await prisma.userAccount.create({
      data: {
        email: `reset_race_${Date.now()}@example.com`,
        passwordHash: 'old_hash',
        fullName: 'Reset Race',
        roles: { create: [{ role: 'CANDIDATE' }] },
      },
    });

    const rawToken = `reset_race_token_${Date.now()}`;
    const tokenHash = TokenRules.hashToken(rawToken);

    await prisma.authToken.create({
      data: {
        userId: user.id,
        purpose: 'RESET_PASSWORD',
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // Run 2 simultaneous reset requests
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ token: rawToken, newPassword: 'NewPassword111!' }),
      request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ token: rawToken, newPassword: 'NewPassword222!' }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });
});
