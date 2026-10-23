import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('BE1 PostgreSQL Identity Schema & Constraints (Integration)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts and retrieves a valid user_account with roles', async () => {
    const email = `test-${Date.now()}@example.com`;
    const user = await prisma.userAccount.create({
      data: {
        email,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        fullName: 'Nguyen Integration Test',
        status: 'ACTIVE',
        roles: {
          create: [{ role: 'CANDIDATE' }, { role: 'RECRUITER' }],
        },
      },
      include: {
        roles: true,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.version).toBe(0);
    expect(user.roles).toHaveLength(2);
    expect(user.roles.map((r) => r.role).sort()).toEqual(['CANDIDATE', 'RECRUITER']);
  });

  it('enforces UNIQUE constraint on user_account email', async () => {
    const email = `unique-${Date.now()}@example.com`;
    await prisma.userAccount.create({
      data: {
        email,
        passwordHash: 'hash1',
        fullName: 'User One',
      },
    });

    await expect(
      prisma.userAccount.create({
        data: {
          email,
          passwordHash: 'hash2',
          fullName: 'User Two',
        },
      }),
    ).rejects.toThrow();
  });

  it('enforces CHECK constraint on user_role allowed values', async () => {
    const user = await prisma.userAccount.create({
      data: {
        email: `role-test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        fullName: 'Role Test',
      },
    });

    // Valid role works
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: 'INTERVIEWER',
      },
    });

    // Invalid role rejected by Postgres check_user_role
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "user_role" ("user_id", "role") VALUES ('${user.id}', 'SUPER_ADMIN')`,
      ),
    ).rejects.toThrow(/check_user_role/i);
  });

  it('enforces CHECK constraint on user_account status', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "user_account" ("email", "password_hash", "full_name", "status") VALUES ('invalid-status-${Date.now()}@example.com', 'h', 'Test', 'DELETED')`,
      ),
    ).rejects.toThrow(/check_user_status/i);
  });

  it('enforces CHECK constraint on auth_token purpose', async () => {
    const user = await prisma.userAccount.create({
      data: {
        email: `token-test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        fullName: 'Token Test',
      },
    });

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "auth_token" ("user_id", "purpose", "token_hash", "expires_at") VALUES ('${user.id}', 'MAGIC_LOGIN', 'hash_${randomUUID()}', NOW() + INTERVAL '1 hour')`,
      ),
    ).rejects.toThrow(/check_auth_token_purpose/i);
  });

  it('enforces ON DELETE RESTRICT on user_account with active sessions', async () => {
    const user = await prisma.userAccount.create({
      data: {
        email: `fk-test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        fullName: 'FK Test',
        sessions: {
          create: {
            tokenHash: `token_hash_${randomUUID()}`,
            csrfHash: 'csrf_hash',
            expiresAt: new Date(Date.now() + 86400000),
          },
        },
      },
    });

    // Attempting to delete user must fail due to FK RESTRICT (no cascade delete!)
    await expect(
      prisma.userAccount.delete({
        where: { id: user.id },
      }),
    ).rejects.toThrow();
  });
});
