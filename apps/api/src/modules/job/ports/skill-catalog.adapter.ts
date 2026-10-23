import { Injectable } from '@nestjs/common';
import {
  SkillCatalogPort,
  TransactionContext as Tx,
} from '../../../../../../libs/contracts/backend';
import { PrismaSkillRepository } from '../repositories/prisma-skill.repository';

@Injectable()
export class SkillCatalogAdapter implements SkillCatalogPort {
  constructor(private readonly skillRepo: PrismaSkillRepository) {}

  public async assertActiveSkills(skillIds: readonly string[], tx: Tx): Promise<readonly string[]> {
    return this.skillRepo.assertAllActive([...skillIds], tx);
  }
}
