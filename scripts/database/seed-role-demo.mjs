import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// This fixture owns only a dedicated loopback database named recruitment_demo.
const url = new URL(process.env.DATABASE_URL ?? '');
if (
  process.env.NODE_ENV === 'production' ||
  !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/recruitment_demo'
) {
  throw new Error('Role demo seed requires the local recruitment_demo database.');
}
const password = process.env.SEED_DEMO_PASSWORD;
if (!password || Buffer.byteLength(password) < 10 || Buffer.byteLength(password) > 72) {
  throw new Error('Configure a private SEED_DEMO_PASSWORD containing 10–72 UTF-8 bytes.');
}

export const accounts = [
  { key: 'admin', roles: ['ADMIN'], name: 'Demo Administrator' },
  { key: 'owner', roles: ['CANDIDATE', 'RECRUITER'], name: 'Demo Company Owner' },
  { key: 'recruiter', roles: ['CANDIDATE', 'RECRUITER'], name: 'Demo Recruiter Member' },
  { key: 'interviewer', roles: ['CANDIDATE', 'INTERVIEWER'], name: 'Demo Interviewer' },
  { key: 'candidate', roles: ['CANDIDATE'], name: 'Demo Candidate' },
  { key: 'outsider', roles: ['CANDIDATE', 'RECRUITER'], name: 'Demo Other Company Owner' },
  { key: 'locked', roles: ['CANDIDATE'], name: 'Demo Locked Account' },
];

const db = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.$transaction(async (tx) => {
    const users = {};
    for (const account of accounts) {
      const user = await tx.userAccount.upsert({
        where: { email: `${account.key}.demo@example.test` },
        create: {
          email: `${account.key}.demo@example.test`,
          passwordHash,
          fullName: account.name,
          status: account.key === 'locked' ? 'LOCKED' : 'ACTIVE',
          emailVerifiedAt: new Date(),
          lockedReason: account.key === 'locked' ? 'Local permission test fixture' : null,
        },
        update: { passwordHash },
      });
      users[account.key] = user;
      for (const role of account.roles) {
        await tx.userRole.upsert({
          where: { userId_role: { userId: user.id, role } },
          create: { userId: user.id, role },
          update: {},
        });
      }
      if (account.roles.includes('CANDIDATE')) {
        await tx.candidateProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, headline: account.name, location: 'Ho Chi Minh City' },
          update: {},
        });
      }
    }
    for (const [taxCode, name, owner] of [
      ['DEMO-LOCAL-001', 'Local Demo Recruitment', users.owner],
      ['DEMO-LOCAL-002', 'Local Other Company', users.outsider],
    ]) {
      const company = await tx.company.upsert({
        where: { taxCode },
        create: {
          taxCode,
          name,
          address: 'Local development fixture',
          approvalStatus: 'APPROVED',
          createdBy: owner.id,
        },
        update: {},
      });
      const members = [[owner.id, 'OWNER']];
      if (taxCode === 'DEMO-LOCAL-001') {
        members.push([users.recruiter.id, 'RECRUITER'], [users.interviewer.id, 'INTERVIEWER']);
      }
      for (const [userId, role] of members) {
        await tx.companyMembership.upsert({
          where: { companyId_userId: { companyId: company.id, userId } },
          create: {
            companyId: company.id,
            userId,
            role,
            active: true,
            permissions: [role === 'INTERVIEWER' ? 'INTERVIEWER' : 'RECRUITER'],
          },
          update: {},
        });
      }
      const jobId =
        taxCode === 'DEMO-LOCAL-001'
          ? '51000000-0000-4000-8000-000000000001'
          : '51000000-0000-4000-8000-000000000002';
      await tx.jobPost.upsert({
        where: { id: jobId },
        create: {
          id: jobId,
          companyId: company.id,
          createdBy: owner.id,
          title: `${name}: Software Engineer`,
          description: 'Local demo vacancy for role testing.',
          location: 'Ho Chi Minh City',
          headcount: 2,
          jobType: 'FULL_TIME',
          workplaceMode: 'HYBRID',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        update: {},
      });
    }
  });
  console.log(
    'Local role fixtures ready: admin, owner, recruiter, interviewer, candidate, outsider, locked.',
  );
  console.log('Password is read from ignored .env.local-demo; it is not written to reports.');
} finally {
  await db.$disconnect();
}
