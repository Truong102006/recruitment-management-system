import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';
import type { Tx } from '../../../../../../libs/contracts/backend';

@Injectable()
export class PrismaSkillRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  private getClient(tx?: Tx): Prisma.TransactionClient | PrismaService {
    return tx ? this.uow.clientFor(tx as TransactionContext) : this.prisma;
  }

  public async listActiveSkills(tx?: TransactionContext) {
    const client = this.getClient(tx);
    return client.skill.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  public async findByIds(ids: string[], tx?: TransactionContext) {
    if (!ids.length) return [];
    const client = this.getClient(tx);
    return client.skill.findMany({
      where: { id: { in: ids } },
    });
  }

  public async assertAllActive(ids: string[], tx?: TransactionContext): Promise<string[]> {
    if (!ids.length) return [];
    const skills = await this.findByIds(ids, tx);

    const foundMap = new Map(skills.map((s) => [s.id, s]));
    const invalidIds: string[] = [];

    for (const id of ids) {
      const s = foundMap.get(id);
      if (!s || !s.active) {
        invalidIds.push(id);
      }
    }

    if (invalidIds.length > 0) {
      throw new ValidationError(`Skills not found or not active: ${invalidIds.join(', ')}`, {
        skillIds: ['Contains invalid or inactive skill IDs'],
      });
    }

    return ids;
  }
}
