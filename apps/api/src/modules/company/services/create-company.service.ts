import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaCompanyRepository } from '../repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../repositories/prisma-company-membership.repository';
import { PrismaUserRepository } from '../../identity/repositories/prisma-user.repository';
import { CompanyRules } from '../rules/company.rules';
import { CompanyMapper } from '../mappers/company.mapper';
import { CreateCompanyDto } from '../dto/company.dto';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../../../../libs/platform/errors/domain.error';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { OutboxPort, PORTS } from '../../../../../../libs/contracts/backend';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { CompanyDto } from '../../../../../../libs/contracts/public';

@Injectable()
export class CreateCompanyService {
  constructor(
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    private readonly userRepo: PrismaUserRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
  ) {}

  public async createCompany(actor: Actor, dto: CreateCompanyDto): Promise<CompanyDto> {
    if (!actor || !actor.userId) {
      throw new UnauthorizedError();
    }

    if (!this.outboxPort) {
      throw new ServiceUnavailableError('Company outbox unavailable');
    }
    // 1. Verify actor has RECRUITER role
    if (!actor.roles.includes('RECRUITER') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError(
        'Only users with RECRUITER role can register a new company',
        'RECRUITER_ROLE_REQUIRED',
      );
    }

    // 2. Validate and normalize tax code
    CompanyRules.validateTaxCode(dto.taxCode);
    const normalizedTaxCode = CompanyRules.normalizeTaxCode(dto.taxCode);

    try {
      return await this.uow.run(async (tx: TransactionContext) => {
        // 3. Verify actor account is ACTIVE and verified in database under lock
        const user = await this.userRepo.findByIdWithLock(actor.userId, tx);
        if (!user || user.status !== 'ACTIVE') {
          throw new ForbiddenError('Account is not active', 'ACCOUNT_NOT_ACTIVE');
        }

        if (!user.emailVerifiedAt) {
          throw new ForbiddenError('Email verification required', 'EMAIL_NOT_VERIFIED');
        }
        if (!user.roles.some((role) => role.role === 'RECRUITER')) {
          throw new ForbiddenError('Recruiter role required', 'RECRUITER_ROLE_REQUIRED');
        }
        // 4. Check for duplicate tax code under lock
        const existing = await this.companyRepo.findByTaxCodeWithLock(normalizedTaxCode, tx);
        if (existing) {
          throw new ConflictError(
            'A company with this tax/registration code already exists',
            'TAX_CODE_ALREADY_EXISTS',
          );
        }

        // 5. Create company with PENDING status
        const company = await this.companyRepo.create(
          {
            name: CompanyRules.normalizeRequiredText(dto.name, 'name'),
            taxCode: normalizedTaxCode,
            address: CompanyRules.normalizeRequiredText(dto.address, 'address'),
            website: CompanyRules.normalizeNullableText(dto.website, 'website') ?? null,
            description: CompanyRules.normalizeNullableText(dto.description, 'description') ?? null,
            createdBy: actor.userId,
          },
          tx,
        );

        // 6. Create initial OWNER membership for creator
        await this.membershipRepo.create(
          {
            companyId: company.id,
            userId: actor.userId,
            role: 'OWNER',
            permissions: ['RECRUITER', 'INTERVIEWER'],
            active: true,
          },
          tx,
        );

        // 7. Append company.created event to Outbox
        if (this.outboxPort) {
          await this.outboxPort.append(
            {
              eventId: randomUUID(),
              eventType: 'company.created',
              schemaVersion: 1,
              aggregateId: company.id,
              aggregateVersion: company.version,
              occurredAt: new Date().toISOString(),
              payload: {
                companyId: company.id,
                ownerUserId: actor.userId,
              },
            },
            tx,
          );
        }

        return CompanyMapper.toCompanyDto(company);
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(
          'A company with this tax/registration code already exists',
          'TAX_CODE_ALREADY_EXISTS',
        );
      }
      throw err;
    }
  }
}
