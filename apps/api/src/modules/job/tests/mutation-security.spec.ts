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

  it.each(['create', 'update'] as const)(
    'normalizes %s text before validating and persisting for direct service callers',
    async (command) => {
      const row = {
        id: 'job',
        companyId: 'company',
        status: 'DRAFT',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        salaryMin: null,
        salaryMax: null,
        currency: null,
      };
      const jobs: any = {
        findById: jest.fn().mockResolvedValue(row),
        findByIdWithLock: jest.fn().mockResolvedValue(row),
        create: jest.fn().mockImplementation(async (data) => ({ ...row, ...data })),
        update: jest.fn().mockImplementation(async (_id, _version, data) => ({ ...row, ...data })),
      };
      const companies: any = {
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'company', name: 'Company', approvalStatus: 'APPROVED' }),
      };
      const membership: any = {
        lockRecoveryAccount: jest.fn().mockResolvedValue(true),
        findUniqueWithLock: jest.fn().mockResolvedValue({ active: true, role: 'RECRUITER' }),
        countAvailableOwners: jest.fn().mockResolvedValue(1),
      };
      const text = {
        title: `  ${'e\u0301'.repeat(10)}  `,
        description: 'e\u0301'.repeat(100),
        location: '  HCM  ',
      };
      const result =
        command === 'create'
          ? await new CreateJobService(jobs, {} as any, companies, membership, uow).createDraft(
              actor,
              { companyId: 'company', ...text },
            )
          : await new UpdateJobService(jobs, {} as any, companies, membership, uow).updateJob(
              actor,
              'job',
              { version: 0, ...text },
            );
      expect(result.title).toBe(text.title.trim().normalize('NFC'));
      expect(result.description).toBe('é'.repeat(100));
      expect(result.location).toBe('HCM');
    },
  );

  it.each(['create', 'update', 'publish', 'close'] as const)(
    'rejects %s before write/event when company has no available OWNER',
    async (command) => {
      const job = { id: 'job', companyId: 'company', status: 'DRAFT', version: 0 };
      const jobs: any = {
        findById: jest.fn().mockResolvedValue(job),
        findByIdWithLock: jest.fn().mockResolvedValue(job),
        create: jest.fn(),
        update: jest.fn(),
        closeJob: jest.fn(),
      };
      const companies: any = {
        findByIdWithLock: jest
          .fn()
          .mockResolvedValue({ id: 'company', approvalStatus: 'APPROVED' }),
      };
      const membership: any = {
        lockRecoveryAccount: jest.fn().mockResolvedValue(true),
        findUniqueWithLock: jest.fn().mockResolvedValue({ active: true, role: 'RECRUITER' }),
        countAvailableOwners: jest.fn().mockResolvedValue(0),
      };
      const events = { append: jest.fn() };
      const commands = {
        create: () =>
          new CreateJobService(jobs, {} as any, companies, membership, uow).createDraft(actor, {
            companyId: 'company',
          }),
        update: () =>
          new UpdateJobService(jobs, {} as any, companies, membership, uow).updateJob(
            actor,
            'job',
            { version: 0 },
          ),
        publish: () =>
          new PublishJobService(jobs, companies, membership, uow, events).publishJob(actor, 'job', {
            version: 0,
          }),
        close: () =>
          new CloseJobService(jobs, companies, membership, uow, events).closeJob(actor, 'job', {
            version: 0,
            reason: 'close',
          }),
      };
      await expect(commands[command]()).rejects.toThrow('available active owner');
      expect(membership.countAvailableOwners).toHaveBeenCalledWith('company', tx);
      expect(jobs.create).not.toHaveBeenCalled();
      expect(jobs.update).not.toHaveBeenCalled();
      expect(jobs.closeJob).not.toHaveBeenCalled();
      expect(events.append).not.toHaveBeenCalled();
    },
  );

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
