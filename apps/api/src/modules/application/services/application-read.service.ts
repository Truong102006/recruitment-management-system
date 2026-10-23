import type {
  Actor,
  CompanyAccessPort,
  IdentityCandidatePort,
} from '../../../../../../libs/contracts/backend';
import type {
  UnitOfWork,
  TransactionContext,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { ApplicationWorkflowRepository } from '../repositories/application-workflow.repository';
import type { ApplicationQueryRepository } from '../repositories/application-query.repository';
import {
  assertCandidateOwnership,
  assertRecruiterCompanyScope,
} from '../policies/application.policy';
import { ApplicationRuleError } from '../rules/application-rule.error';

function pagination(page: number, pageSize: number) {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Invalid pagination');
}

/** Reads are scoped before querying private data; no internal reason/evaluation fields cross DTO mapping. */
export class ApplicationReadService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly identity: IdentityCandidatePort,
    private readonly company: CompanyAccessPort,
    private readonly workflow: ApplicationWorkflowRepository,
    private readonly queries: ApplicationQueryRepository,
  ) {}

  async listCandidate(actor: Actor, page: number, pageSize: number) {
    pagination(page, pageSize);
    return this.uow.run(async (tx) => {
      const identity = await this.identity.assertActiveCandidate(actor, tx);
      return this.queries.forCandidate(identity.userId, page, pageSize, tx);
    });
  }
  async listRecruiter(actor: Actor, companyId: string, page: number, pageSize: number) {
    pagination(page, pageSize);
    return this.uow.run(async (tx) => {
      const grant = await this.company.assertRecruiter(actor, companyId, tx);
      assertRecruiterCompanyScope(companyId, grant);
      return this.queries.forCompany(companyId, page, pageSize, tx);
    });
  }
  async one(actor: Actor, applicationId: string, companyId?: string) {
    return this.uow.run(async (tx) => {
      await this.authorize(actor, applicationId, companyId, tx);
      const data = await this.queries.one(applicationId, tx);
      if (!data) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
      return data;
    });
  }
  async history(actor: Actor, applicationId: string, companyId?: string) {
    return this.uow.run(async (tx) => {
      await this.authorize(actor, applicationId, companyId, tx);
      return this.queries.history(applicationId, tx);
    });
  }
  private async authorize(
    actor: Actor,
    applicationId: string,
    companyId: string | undefined,
    tx: TransactionContext,
  ) {
    const scope = await this.workflow.scope(applicationId, tx);
    if (!scope) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
    if (companyId) {
      const grant = await this.company.assertRecruiter(actor, companyId, tx);
      assertRecruiterCompanyScope(scope.companyId, grant);
    } else {
      const identity = await this.identity.assertActiveCandidate(actor, tx);
      assertCandidateOwnership(actor.userId, identity.userId, scope.candidateId);
    }
  }
}
