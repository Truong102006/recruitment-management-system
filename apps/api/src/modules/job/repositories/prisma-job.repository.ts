import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { ConflictError } from '../../../../../../libs/platform/errors/domain.error';
import type { Tx } from '../../../../../../libs/contracts/backend';

@Injectable()
export class PrismaJobRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  private getClient(tx?: Tx): Prisma.TransactionClient | PrismaService {
    return tx ? this.uow.clientFor(tx as TransactionContext) : this.prisma;
  }

  public async clock(tx: Tx): Promise<Date> {
    const rows = await this.getClient(tx).$queryRaw<
      { now: Date }[]
    >`SELECT clock_timestamp() AS now`;
    return rows[0]!.now;
  }

  public async create(
    data: {
      companyId: string;
      createdBy: string;
      title?: string | null;
      description?: string | null;
      location?: string | null;
      headcount?: number | null;
      jobType?: string | null;
      workplaceMode?: string | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      currency?: string | null;
      deadline?: Date | null;
      status?: string;
    },
    tx?: TransactionContext,
  ) {
    const client = this.getClient(tx);
    return client.jobPost.create({
      data: {
        companyId: data.companyId,
        createdBy: data.createdBy,
        title: data.title ?? null,
        description: data.description ?? null,
        location: data.location ?? null,
        headcount: data.headcount ?? null,
        jobType: data.jobType ?? null,
        workplaceMode: data.workplaceMode ?? null,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        currency: data.currency ?? null,
        deadline: data.deadline ?? null,
        status: data.status || 'DRAFT',
        version: 0,
      },
      include: {
        skills: {
          include: { skill: true },
        },
        company: true,
      },
    });
  }

  public async findById(id: string, tx?: TransactionContext) {
    const client = this.getClient(tx);
    return client.jobPost.findUnique({
      where: { id },
      include: {
        skills: {
          include: { skill: true },
        },
        company: true,
      },
    });
  }

  public async findByIdWithLock(id: string, tx?: TransactionContext) {
    const client = this.getClient(tx);
    // Row lock in PostgreSQL
    await client.$queryRawUnsafe(`SELECT id FROM "job_post" WHERE "id" = $1::uuid FOR UPDATE`, id);
    return this.findById(id, tx);
  }

  public async update(
    id: string,
    expectedVersion: number,
    data: {
      title?: string | null;
      description?: string | null;
      location?: string | null;
      headcount?: number | null;
      jobType?: string | null;
      workplaceMode?: string | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      currency?: string | null;
      deadline?: Date | null;
      status?: string;
      publishedAt?: Date | null;
      closedAt?: Date | null;
      closeReason?: string | null;
    },
    tx?: TransactionContext,
  ) {
    const client = this.getClient(tx);

    const updateData: Prisma.JobPostUpdateInput = {
      version: expectedVersion + 1,
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.headcount !== undefined) updateData.headcount = data.headcount;
    if (data.jobType !== undefined) updateData.jobType = data.jobType;
    if (data.workplaceMode !== undefined) updateData.workplaceMode = data.workplaceMode;
    if (data.salaryMin !== undefined) updateData.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) updateData.salaryMax = data.salaryMax;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt;
    if (data.closedAt !== undefined) updateData.closedAt = data.closedAt;
    if (data.closeReason !== undefined) updateData.closeReason = data.closeReason;

    const res = await client.jobPost.updateMany({
      where: {
        id,
        version: expectedVersion,
      },
      data: updateData,
    });

    if (res.count === 0) {
      throw new ConflictError('Job post has been concurrently modified or does not exist.');
    }

    return this.findById(id, tx);
  }

  public async setSkills(jobId: string, skillIds: string[], tx?: TransactionContext) {
    const client = this.getClient(tx);

    await client.jobSkill.deleteMany({
      where: { jobId },
    });

    if (skillIds.length > 0) {
      await client.jobSkill.createMany({
        data: skillIds.map((skillId) => ({
          jobId,
          skillId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findById(jobId, tx);
  }

  public async findByCompany(
    companyId: string,
    pagination: { skip?: number; take?: number } = {},
    tx?: TransactionContext,
  ) {
    const client = this.getClient(tx);
    return client.jobPost.findMany({
      where: { companyId },
      include: {
        skills: {
          include: { skill: true },
        },
        company: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: pagination.skip,
      take: pagination.take,
    });
  }

  public async countByCompany(companyId: string, tx?: TransactionContext) {
    const client = this.getClient(tx);
    return client.jobPost.count({
      where: { companyId },
    });
  }

  public async closeJob(
    id: string,
    expectedVersion: number,
    reason: string,
    closedAt: Date = new Date(),
    tx?: TransactionContext,
  ) {
    return this.update(
      id,
      expectedVersion,
      {
        status: 'CLOSED',
        closedAt,
        closeReason: reason,
      },
      tx,
    );
  }

  public async getJobFacts(companyId: string, tx?: TransactionContext) {
    const client = this.getClient(tx);
    const [totalJobs, publishedJobs, closedJobs] = await Promise.all([
      client.jobPost.count({ where: { companyId } }),
      client.jobPost.count({ where: { companyId, status: 'PUBLISHED' } }),
      client.jobPost.count({ where: { companyId, status: 'CLOSED' } }),
    ]);

    return { totalJobs, publishedJobs, closedJobs };
  }
}
