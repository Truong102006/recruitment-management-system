import type { ParameterizedSqlClient } from '../../../../../../libs/platform/database/sql-client';
import { TransactionSql } from '../../../../../../libs/platform/database/sql-client';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import { PrismaApplicationRepository } from './prisma-application.repository';

const record = {
  id: '11111111-1111-4111-8111-111111111111',
  candidateId: '22222222-2222-4222-8222-222222222222',
  jobId: '33333333-3333-4333-8333-333333333333',
  cvId: '44444444-4444-4444-8444-444444444444',
  snapshot: { name: 'A', email: 'a@example.test', phone: null, headline: null },
  coverLetter: null,
};

function setup(error: unknown) {
  const client: ParameterizedSqlClient = {
    async $queryRawUnsafe() {
      throw error;
    },
  };
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (client: ParameterizedSqlClient) => Promise<T>) {
      return work(client);
    },
  });
  return { uow, repository: new PrismaApplicationRepository(new TransactionSql(uow)) };
}

describe('application unique constraint mapping', () => {
  it('returns a conflict for a concurrent submission of the same candidate/job', async () => {
    const h = setup({
      code: 'P2010',
      meta: { code: '23505', message: 'uq_application_candidate_job' },
    });
    await expect(h.uow.run((tx) => h.repository.createSubmitted(record, tx))).rejects.toMatchObject(
      { code: 'STATE_CONFLICT' },
    );
  });

  it('does not disguise an unrelated database failure as a duplicate', async () => {
    const error = { code: 'P2010', meta: { code: '23503', message: 'missing FK' } };
    const h = setup(error);
    await expect(h.uow.run((tx) => h.repository.createSubmitted(record, tx))).rejects.toBe(error);
  });
});
