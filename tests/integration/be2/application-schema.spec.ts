import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { ManagedUnitOfWork } from '../../../libs/platform/database/unit-of-work';
import { PrismaTransactionDriver } from '../../../libs/platform/database/prisma-transaction-driver';
import { TransactionSql } from '../../../libs/platform/database/sql-client';
import { PrismaSavedJobRepository } from '../../../apps/api/src/modules/candidate/repositories/saved-job.repository';

describe('BE2 PostgreSQL migration and saved job adapter', () => {
  const prisma = new PrismaClient();
  let candidateId: string;
  let secondCandidateId: string;
  let cvId: string;
  let jobId: string;
  let applicationId: string;
  const snapshot = { name: 'Candidate', email: 'be2@example.test', phone: null, headline: null };

  beforeAll(async () => {
    await prisma.$connect();
    const suffix = randomUUID();
    const candidate = await prisma.userAccount.create({
      data: {
        email: `be2-candidate-${suffix}@example.test`,
        passwordHash: 'fixture',
        fullName: 'Candidate',
      },
    });
    const other = await prisma.userAccount.create({
      data: {
        email: `be2-other-${suffix}@example.test`,
        passwordHash: 'fixture',
        fullName: 'Other',
      },
    });
    candidateId = candidate.id;
    secondCandidateId = other.id;
    await prisma.candidateProfile.createMany({
      data: [{ userId: candidate.id }, { userId: other.id }],
    });
    const company = await prisma.company.create({
      data: {
        name: 'BE2 test company',
        taxCode: `be2-${suffix}`,
        address: 'test',
        createdBy: other.id,
      },
    });
    const job = await prisma.jobPost.create({
      data: {
        companyId: company.id,
        createdBy: other.id,
        title: 'BE2 fixture',
      },
    });
    jobId = job.id;
    const cv = await prisma.cvVersion.create({
      data: {
        id: randomUUID(),
        candidateId: candidate.id,
        versionNo: 1,
        originalName: 'test.pdf',
        objectKey: `cv/test/${suffix}`,
        status: 'READY',
        uploadExpiresAt: new Date(Date.now() + 60_000),
        sizeBytes: 20n,
        mimeType: 'application/pdf',
        checksumSha256: 'a'.repeat(64),
        storageVersionId: 'v1',
        readyAt: new Date(),
      },
    });
    cvId = cv.id;
    const app = await prisma.application.create({
      data: {
        id: randomUUID(),
        jobId,
        candidateId,
        originalCvVersionId: cvId,
        currentCvVersionId: cvId,
        candidateSnapshot: snapshot,
        status: 'SUBMITTED',
      },
    });
    applicationId = app.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('enforces owner-matched CV foreign keys', async () => {
    await expect(
      prisma.application.create({
        data: {
          id: randomUUID(),
          jobId,
          candidateId: secondCandidateId,
          originalCvVersionId: cvId,
          currentCvVersionId: cvId,
          candidateSnapshot: snapshot,
          status: 'SUBMITTED',
        },
      }),
    ).rejects.toThrow();
  });

  it('preserves the original snapshot and append-only history', async () => {
    await expect(
      prisma.application.update({
        where: { id: applicationId },
        data: { candidateSnapshot: { ...snapshot, name: 'Changed' } },
      }),
    ).rejects.toThrow();
    const history = await prisma.applicationHistory.create({
      data: {
        id: randomUUID(),
        applicationId,
        candidateId,
        actorId: candidateId,
        actorType: 'USER',
        eventType: 'SUBMIT',
        toStatus: 'SUBMITTED',
        aggregateVersion: 0,
        newCvId: cvId,
      },
    });
    await expect(
      prisma.applicationHistory.update({ where: { id: history.id }, data: { reason: 'Mutated' } }),
    ).rejects.toThrow();
  });

  it('keeps saved jobs unique across concurrent transactions and removes idempotently', async () => {
    const uow = new ManagedUnitOfWork(
      new PrismaTransactionDriver<Prisma.TransactionClient>(prisma),
    );
    const repo = new PrismaSavedJobRepository(new TransactionSql(uow));
    const results = await Promise.all([
      uow.run((tx) => repo.save(candidateId, jobId, tx)),
      uow.run((tx) => repo.save(candidateId, jobId, tx)),
    ]);
    expect(results.sort()).toEqual([false, true]);
    const page = await uow.run((tx) => repo.list(candidateId, 1, 20, tx));
    expect(page.total).toBe(1);
    expect(page.rows[0]?.jobId).toBe(jobId);
    expect(await uow.run((tx) => repo.remove(candidateId, jobId, tx))).toBe(true);
    expect(await uow.run((tx) => repo.remove(candidateId, jobId, tx))).toBe(false);
  });
});
