import { Inject, Injectable } from '@nestjs/common';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { AuditLogDto, PageResponse } from '../../../../../../libs/contracts/public';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import { AuditReadPolicy } from '../policies/audit-read.policy';
import { FindAuditLogsFilter, PrismaAuditRepository } from '../repositories/prisma-audit.repository';

@Injectable()
export class AuditQueryService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    private readonly policy: AuditReadPolicy,
    private readonly auditRepo: PrismaAuditRepository,
  ) {}

  async getAuditLogs(
    actor: Actor,
    filter: FindAuditLogsFilter,
  ): Promise<PageResponse<AuditLogDto>> {
    this.policy.assertCanReadAudit(actor);

    return this.uow.run(async (tx) => {
      const page = Math.max(1, filter.page ?? 1);
      const pageSize = Math.min(50, Math.max(1, filter.pageSize ?? 20));

      const { data, total } = await this.auditRepo.findMany(
        { ...filter, page, pageSize },
        tx,
      );

      return {
        data,
        meta: {
          page,
          pageSize,
          total,
        },
      };
    });
  }
}
