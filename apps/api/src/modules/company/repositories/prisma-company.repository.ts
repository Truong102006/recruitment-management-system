import { Inject, Injectable } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ConflictError } from '../../../../../../libs/platform/errors/domain.error';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { Tx } from '../../../../../../libs/contracts/backend';

@Injectable()
export class PrismaCompanyRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  private getClient(tx?: Tx): Prisma.TransactionClient | PrismaService {
    return tx ? this.uow.clientFor(tx as TransactionContext) : this.prisma;
  }

  public async create(
    data: {
      name: string;
      taxCode: string;
      address: string;
      website?: string | null;
      description?: string | null;
      createdBy: string;
    },
    tx?: Tx,
  ): Promise<Company> {
    const client = this.getClient(tx);
    return client.company.create({
      data: {
        name: data.name,
        taxCode: data.taxCode,
        address: data.address,
        website: data.website ?? null,
        description: data.description ?? null,
        createdBy: data.createdBy,
        approvalStatus: 'PENDING',
        version: 0,
      },
    });
  }

  public async findById(id: string, tx?: Tx): Promise<Company | null> {
    const client = this.getClient(tx);
    return client.company.findUnique({ where: { id } });
  }

  public async findByIdWithLock(id: string, tx: Tx): Promise<Company | null> {
    const client = this.getClient(tx);
    const rows = await client.$queryRaw<Company[]>`
      SELECT id, name, tax_code as "taxCode", address, website, description,
             approval_status as "approvalStatus", rejection_reason as "rejectionReason",
             created_by as "createdBy", version, created_at as "createdAt", updated_at as "updatedAt"
      FROM company
      WHERE id = ${id}::uuid
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  public async findByTaxCode(taxCode: string, tx?: Tx): Promise<Company | null> {
    const client = this.getClient(tx);
    return client.company.findUnique({ where: { taxCode } });
  }

  public async findByTaxCodeWithLock(taxCode: string, tx: Tx): Promise<Company | null> {
    const client = this.getClient(tx);
    const rows = await client.$queryRaw<Company[]>`
      SELECT id, name, tax_code as "taxCode", address, website, description,
             approval_status as "approvalStatus", rejection_reason as "rejectionReason",
             created_by as "createdBy", version, created_at as "createdAt", updated_at as "updatedAt"
      FROM company
      WHERE tax_code = ${taxCode}
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  public async update(
    id: string,
    expectedVersion: number,
    data: Partial<{
      name: string;
      address: string;
      website: string | null;
      description: string | null;
    }>,
    tx: Tx,
  ): Promise<Company> {
    const client = this.getClient(tx);
    const updateData: Prisma.CompanyUpdateManyMutationInput = {
      version: { increment: 1 },
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.description !== undefined) updateData.description = data.description;

    const result = await client.company.updateMany({
      where: { id, version: expectedVersion },
      data: updateData,
    });

    if (result.count === 0) {
      throw new ConflictError(
        'Company was concurrently modified or version mismatch',
        'STALE_VERSION',
      );
    }

    return (await client.company.findUnique({ where: { id } }))!;
  }

  public async resubmit(
    id: string,
    expectedVersion: number,
    data: Partial<{
      name: string;
      address: string;
      website: string | null;
      description: string | null;
    }>,
    tx: Tx,
  ): Promise<Company> {
    const client = this.getClient(tx);
    const updateData: Prisma.CompanyUpdateManyMutationInput = {
      approvalStatus: 'PENDING',
      rejectionReason: null,
      version: { increment: 1 },
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.description !== undefined) updateData.description = data.description;

    const result = await client.company.updateMany({
      where: { id, version: expectedVersion, approvalStatus: 'REJECTED' },
      data: updateData,
    });

    if (result.count === 0) {
      throw new ConflictError(
        'Company was concurrently modified, status changed, or version mismatch',
        'STALE_VERSION',
      );
    }

    return (await client.company.findUnique({ where: { id } }))!;
  }

  public async updateStatus(
    id: string,
    expectedVersion: number,
    status: string,
    rejectionReason: string | null,
    tx: Tx,
  ): Promise<Company> {
    const client = this.getClient(tx);
    const result = await client.company.updateMany({
      where: { id, version: expectedVersion },
      data: {
        approvalStatus: status,
        rejectionReason,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new ConflictError(
        'Company was concurrently modified or version mismatch',
        'STALE_VERSION',
      );
    }

    return (await client.company.findUnique({ where: { id } }))!;
  }

  public async listForAdmin(tx?: Tx): Promise<Company[]> {
    const client = this.getClient(tx);
    return client.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  public async listByMemberUserId(userId: string, tx?: Tx): Promise<Company[]> {
    const client = this.getClient(tx);
    const memberships = await client.companyMembership.findMany({
      where: { userId, active: true },
      include: { company: true },
    });
    return memberships.map((m) => m.company);
  }

  public async incrementVersion(id: string, tx: Tx): Promise<void> {
    const client = this.getClient(tx);
    await client.company.update({
      where: { id },
      data: {
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }
}
