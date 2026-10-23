import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedBe1(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (
    !demoPassword ||
    Buffer.byteLength(demoPassword) < 10 ||
    Buffer.byteLength(demoPassword) > 72
  ) {
    throw new Error('SEED_DEMO_PASSWORD must contain 10–72 UTF-8 bytes for local demo accounts');
  }
  const defaultPasswordHash = await bcrypt.hash(demoPassword, 10);

  // 1. Seed System Users
  const admin = await prisma.userAccount.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000001',
      email: 'admin@example.com',
      passwordHash: defaultPasswordHash,
      fullName: 'System Administrator',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: {
        create: [{ role: 'ADMIN' }],
      },
    },
  });

  const recruiter1 = await prisma.userAccount.upsert({
    where: { email: 'recruiter1@example.com' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000002',
      email: 'recruiter1@example.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Nguyen Van Recruiter',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: {
        create: [{ role: 'RECRUITER' }],
      },
    },
  });

  const recruiter2 = await prisma.userAccount.upsert({
    where: { email: 'recruiter2@example.com' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000003',
      email: 'recruiter2@example.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Le Thi Recruiter',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: {
        create: [{ role: 'RECRUITER' }],
      },
    },
  });

  const interviewer1 = await prisma.userAccount.upsert({
    where: { email: 'interviewer1@example.com' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000004',
      email: 'interviewer1@example.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Tran Van Interviewer',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: {
        create: [{ role: 'INTERVIEWER' }],
      },
    },
  });

  const candidate1 = await prisma.userAccount.upsert({
    where: { email: 'candidate1@example.com' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000005',
      email: 'candidate1@example.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Pham Thi Candidate',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: {
        create: [{ role: 'CANDIDATE' }],
      },
    },
  });

  const lockedUser = await prisma.userAccount.upsert({
    where: { email: 'locked@example.com' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000006',
      email: 'locked@example.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Locked User',
      status: 'LOCKED',
      lockedReason: 'Policy violation',
      roles: {
        create: [{ role: 'CANDIDATE' }],
      },
    },
  });

  // 2. Seed Companies
  const company1 = await prisma.company.upsert({
    where: { taxCode: '0101010101' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000000001',
      name: 'Acme Corporation',
      taxCode: '0101010101',
      address: '123 Le Loi, District 1, Ho Chi Minh City',
      website: 'https://acme.example.com',
      description: 'Leading technology recruitment and software development firm',
      approvalStatus: 'APPROVED',
      createdBy: recruiter1.id,
      memberships: {
        create: [
          {
            userId: recruiter1.id,
            role: 'OWNER',
            permissions: ['RECRUITER'],
            active: true,
          },
          {
            userId: interviewer1.id,
            role: 'INTERVIEWER',
            permissions: ['INTERVIEWER'],
            active: true,
          },
        ],
      },
    },
  });

  const company2 = await prisma.company.upsert({
    where: { taxCode: '0202020202' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000000002',
      name: 'Beta Tech Global',
      taxCode: '0202020202',
      address: '456 Nguyen Hue, District 1, Ho Chi Minh City',
      website: 'https://betatech.example.com',
      description: 'Fintech solutions provider',
      approvalStatus: 'PENDING',
      createdBy: recruiter2.id,
      memberships: {
        create: [
          {
            userId: recruiter2.id,
            role: 'OWNER',
            permissions: ['RECRUITER'],
            active: true,
          },
        ],
      },
    },
  });

  const company3 = await prisma.company.upsert({
    where: { taxCode: '0303030303' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000000003',
      name: 'Gamma Financial',
      taxCode: '0303030303',
      address: '789 Vo Van Kiet, District 5, Ho Chi Minh City',
      approvalStatus: 'SUSPENDED',
      rejectionReason: 'Operating license expired',
      createdBy: recruiter1.id,
      memberships: {
        create: [
          {
            userId: recruiter1.id,
            role: 'OWNER',
            permissions: ['RECRUITER'],
            active: true,
          },
        ],
      },
    },
  });

  // 3. Seed Skills
  const skillNames = [
    'TypeScript',
    'Node.js',
    'PostgreSQL',
    'NestJS',
    'React',
    'Docker',
    'AWS',
    'Python',
    'Java',
    'Go',
  ];

  const skills = [];
  for (let i = 0; i < skillNames.length; i++) {
    const name = skillNames[i]!;
    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: {
        id: `40000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        name,
        category: 'Engineering',
        active: true,
      },
    });
    skills.push(skill);
  }

  // 4. Seed Jobs
  await prisma.jobPost.upsert({
    where: { id: '30000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '30000000-0000-4000-8000-000000000001',
      companyId: company1.id,
      createdBy: recruiter1.id,
      title: 'Senior Backend Engineer (NestJS / PostgreSQL)',
      description: 'We are seeking a senior backend engineer to build scalable services.',
      location: 'Ho Chi Minh City',
      headcount: 3,
      jobType: 'FULL_TIME',
      workplaceMode: 'HYBRID',
      salaryMin: 25000000,
      salaryMax: 50000000,
      currency: 'VND',
      deadline: new Date('2026-12-31T23:59:59.000Z'),
      status: 'PUBLISHED',
      publishedAt: new Date(),
      skills: {
        create: [
          { skillId: skills[0]!.id },
          { skillId: skills[1]!.id },
          { skillId: skills[2]!.id },
        ],
      },
    },
  });

  await prisma.jobPost.upsert({
    where: { id: '30000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '30000000-0000-4000-8000-000000000002',
      companyId: company1.id,
      createdBy: recruiter1.id,
      title: 'Frontend Engineer (React)',
      description: 'Draft post for upcoming frontend opening.',
      location: 'Ho Chi Minh City',
      headcount: 2,
      jobType: 'FULL_TIME',
      workplaceMode: 'ON_SITE',
      status: 'DRAFT',
    },
  });

  await prisma.jobPost.upsert({
    where: { id: '30000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '30000000-0000-4000-8000-000000000003',
      companyId: company1.id,
      createdBy: recruiter1.id,
      title: 'DevOps Specialist',
      description: 'Role has been successfully filled.',
      location: 'Remote',
      headcount: 1,
      jobType: 'CONTRACT',
      workplaceMode: 'REMOTE',
      status: 'CLOSED',
      closedAt: new Date(),
      closeReason: 'Position filled',
    },
  });
}
