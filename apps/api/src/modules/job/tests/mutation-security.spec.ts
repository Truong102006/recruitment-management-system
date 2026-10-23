import { CreateJobService } from '../services/create-job.service';
import { UpdateJobService } from '../services/update-job.service';
import { PublishJobService } from '../services/publish-job.service';
import { CloseJobService } from '../services/close-job.service';
import { Actor } from '../../../../../../libs/contracts/backend';

describe('Job mutation authorization inside transaction', () => {
  const actor: Actor = { userId: 'actor', sessionId: 'session', roles: ['RECRUITER'] };
  const tx = {};
  const uow: any = { run: async (work: any) => work(tx) };
  const outbox = { append: jest.fn() };

  it('checks current account before company lookup or write for every mutation', async () => {
    const jobs: any = { create: jest.fn(), update: jest.fn(), findById: jest.fn() };
    const companies: any = { findByIdWithLock: jest.fn() };
    const membership: any = { lockRecoveryAccount: jest.fn().mockResolvedValue(false) };
    const commands = [
      () =>
        new CreateJobService(jobs, {} as any, companies, membership, uow).createDraft(actor, {
          companyId: 'company',
        }),
      () =>
        new UpdateJobService(jobs, {} as any, companies, membership, uow).updateJob(actor, 'job', {
          version: 0,
        }),
      () =>
        new PublishJobService(jobs, companies, membership, uow, outbox).publishJob(actor, 'job', {
          version: 0,
        }),
      () =>
        new CloseJobService(jobs, companies, membership, uow, outbox).closeJob(actor, 'job', {
          version: 0,
          reason: 'close',
        }),
    ];
    for (const command of commands)
      await expect(command()).rejects.toMatchObject({ code: 'ACCOUNT_NOT_ACTIVE' });
    expect(companies.findByIdWithLock).not.toHaveBeenCalled();
    expect(jobs.findById).not.toHaveBeenCalled();
    expect(jobs.create).not.toHaveBeenCalled();
    expect(jobs.update).not.toHaveBeenCalled();
  });

  it('checks company and membership under the transaction before creating or validating skills', async () => {
    const jobs: any = { create: jest.fn() };
    const skills: any = { assertAllActive: jest.fn() };
    const company: any = {
      findByIdWithLock: jest.fn().mockResolvedValue({ approvalStatus: 'SUSPENDED' }),
    };
    const membership: any = {
      lockRecoveryAccount: jest.fn().mockResolvedValue(true),
      findUniqueWithLock: jest.fn().mockResolvedValue({ active: true, role: 'OWNER' }),
    };
    const service = new CreateJobService(jobs, skills, company, membership, uow);
    await expect(
      service.createDraft(actor, { companyId: 'company', skillIds: ['skill'] }),
    ).rejects.toThrow('Company is not approved');
    expect(company.findByIdWithLock).toHaveBeenCalledWith('company', tx);
    expect(membership.findUniqueWithLock).toHaveBeenCalledWith('company', actor.userId, tx);
    expect(skills.assertAllActive).not.toHaveBeenCalled();
    expect(jobs.create).not.toHaveBeenCalled();
  });
});
