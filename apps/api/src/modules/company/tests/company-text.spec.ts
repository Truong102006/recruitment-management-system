import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCompanyDto, ResubmitCompanyDto, UpdateCompanyDto } from '../dto/company.dto';
import { CreateCompanyService } from '../services/create-company.service';
import { CompanyService } from '../services/company.service';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';
import type { Actor } from '../../../../../../libs/contracts/backend';

describe('UC11 BR18 company text normalization regression', () => {
  const actor: Actor = { userId: 'owner', sessionId: 'session', roles: ['RECRUITER'] };
  const company = {
    id: 'company',
    name: 'Valid company',
    address: 'Valid address',
    taxCode: 'ABC12345',
    approvalStatus: 'REJECTED',
    rejectionReason: null,
    version: 0,
    website: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const tx = {} as any;
  const uow: any = { run: async (callback: any) => callback(tx) };
  const outbox: any = { append: jest.fn() };

  function services() {
    const repo: any = {
      findByTaxCodeWithLock: jest.fn().mockResolvedValue(null),
      findByIdWithLock: jest.fn().mockResolvedValue(company),
      create: jest.fn().mockImplementation(async (data: any) => ({ ...company, ...data })),
      update: jest.fn().mockImplementation(async (_id: string, _version: number, data: any) => ({
        ...company,
        ...data,
      })),
      resubmit: jest.fn().mockImplementation(async (_id: string, _version: number, data: any) => ({
        ...company,
        ...data,
      })),
    };
    const members: any = {
      lockRecoveryAccount: jest.fn().mockResolvedValue(true),
      findUniqueWithLock: jest.fn().mockResolvedValue({ role: 'OWNER', active: true }),
      create: jest.fn(),
    };
    const users: any = {
      findByIdWithLock: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        roles: [{ role: 'RECRUITER' }],
      }),
    };
    return {
      repo,
      create: new CreateCompanyService(repo, members, users, uow, outbox),
      edit: new CompanyService(repo, members, uow, outbox),
    };
  }

  const dtoClasses: Array<
    new () => { name?: string; address?: string; description?: string | null }
  > = [CreateCompanyDto, UpdateCompanyDto, ResubmitCompanyDto];
  describe.each(dtoClasses)('%s DTO', (Dto) => {
    it.each([{ name: '  ' }, { address: '\t     ' }, { name: null }, { address: null }])(
      'rejects a supplied blank or null required field %j',
      async (fields) => {
        const dto = plainToInstance(Dto, { ...company, taxCode: 'ABC12345', ...fields });
        expect(
          (await validate(dto)).some((error) => Object.keys(fields).includes(error.property)),
        ).toBe(true);
      },
    );

    it('normalizes text before checking lengths and retains supplementary characters', async () => {
      const dto = plainToInstance(Dto, {
        ...company,
        name: `  ${'e\u0301'.repeat(255)}  `,
        address: `  ${'😀'.repeat(500)}  `,
        description: '  Cafe\u0301  ',
      });
      expect(await validate(dto)).toEqual([]);
      expect(dto.name).toBe('é'.repeat(255));
      expect(dto.address).toBe('😀'.repeat(500));
      expect(dto.description).toBe('Café');
    });

    it('counts variation selectors as code points', async () => {
      const dto = plainToInstance(Dto, { ...company, name: 'a\uFE0F'.repeat(128) });
      expect((await validate(dto)).some((error) => error.property === 'name')).toBe(true);
    });
  });

  it.each(['name', 'address'] as const)(
    'direct create rejects whitespace %s before writes',
    async (field) => {
      const { create, repo } = services();
      await expect(
        create.createCompany(actor, {
          name: 'Valid company',
          taxCode: 'ABC12345',
          address: 'Valid address',
          [field]: '     ',
        }),
      ).rejects.toThrow(ValidationError);
      expect(repo.create).not.toHaveBeenCalled();
    },
  );

  it.each(['updateCompany', 'resubmitCompany'] as const)(
    '%s rejects invalid direct inputs atomically',
    async (method) => {
      for (const value of ['    ', '', null]) {
        const { edit, repo } = services();
        await expect(
          edit[method](actor, company.id, { version: 0, name: value } as any),
        ).rejects.toThrow(ValidationError);
        expect(repo.update).not.toHaveBeenCalled();
        expect(repo.resubmit).not.toHaveBeenCalled();
      }
    },
  );

  it('normalizes direct create and edit inputs while retaining null/omitted patch values', async () => {
    const { create, edit, repo } = services();
    await create.createCompany(actor, {
      name: '  Cafe\u0301  ',
      taxCode: ' abc12345 ',
      address: '  Le\u0301 Loi  ',
      website: null,
      description: '  Cafe\u0301  ',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Café',
        taxCode: 'ABC12345',
        address: 'Lé Loi',
        website: null,
        description: 'Café',
      }),
      tx,
    );
    for (const method of ['updateCompany', 'resubmitCompany'] as const) {
      await edit[method](actor, company.id, { version: 0, name: '  Cafe\u0301  ', website: null });
      const write = method === 'updateCompany' ? repo.update : repo.resubmit;
      expect(write).toHaveBeenLastCalledWith(
        company.id,
        0,
        {
          name: 'Café',
          address: undefined,
          website: null,
          description: undefined,
        },
        tx,
      );
    }
  });
});
