import { Global, Module, ServiceUnavailableException } from '@nestjs/common';
import type {
  CompanyAccessPort,
  IdentityCandidatePort,
  JobApplicationPort,
  JobVisibilityPort,
  SkillCatalogPort,
  InterviewLifecyclePort,
  OutboxPort,
} from '../../../../libs/contracts/backend';
import { PORTS } from '../../../../libs/contracts/backend';
import type {
  ManagedUnitOfWork,
  UnitOfWork,
} from '../../../../libs/platform/database/unit-of-work';
import { UNIT_OF_WORK } from '../../../../libs/platform/database/unit-of-work';
import type { ParameterizedSqlClient } from '../../../../libs/platform/database/sql-client';
import { TransactionSql } from '../../../../libs/platform/database/sql-client';
import { SqlIdempotencyStore } from '../../../../libs/platform/idempotency/sql-idempotency-store';
import {
  IDEMPOTENCY_STORE,
  type IdempotencyStore,
} from '../../../../libs/platform/idempotency/idempotency-store';
import { IdentityModule } from './identity/identity.module';
import { CompanyModule } from './company/company.module';
import { JobModule } from './job/job.module';
import { PrismaCandidateProfileRepository } from './candidate/repositories/prisma-candidate-profile.repository';
import { CandidateProfileService } from './candidate/services/candidate-profile.service';
import { PrismaSavedJobRepository } from './candidate/repositories/saved-job.repository';
import { SavedJobService } from './candidate/services/saved-job.service';
import { PrismaCvRepository } from './cv/cv.repository';
import { PrismaApplicationRepository } from './application/repositories/prisma-application.repository';
import { PrismaApplicationWorkflowRepository } from './application/repositories/application-workflow.repository';
import { PrismaApplicationQueryRepository } from './application/repositories/application-query.repository';
import { SubmitApplicationPersistenceService } from './application/services/submit-application.service';
import { SubmitApplicationWorkflowService } from './application/services/submit-application-workflow.service';
import { CvChangeWorkflowService } from './application/services/cv-change-workflow.service';
import { ReviewApplicationWorkflowService } from './application/services/review-application-workflow.service';
import { ApplicationReadService } from './application/services/application-read.service';
import { Be2ApplicationPorts } from './application/services/application-ports.service';
import { CandidateProfileController } from './candidate/controllers/candidate-profile.controller';
import { SavedJobsController } from './candidate/controllers/saved-jobs.controller';
import { ApplicationsController } from './application/controllers/applications.controller';

const BE2_OUTBOX = Symbol('be2.optional-outbox');
const BE2_LIFECYCLE = Symbol('be2.optional-interview-lifecycle');
const missing = (): never => {
  throw new ServiceUnavailableException('BE3 provider is not connected');
};
const unavailableOutbox: OutboxPort = { append: async () => missing() };
const unavailableLifecycle: InterviewLifecyclePort = {
  getLockScope: async () => missing(),
  cancelOpenForApplication: async () => missing(),
  getEvidence: async () => missing(),
};

/** BE2 owns its tables. BE3 dependencies fail closed until real providers are registered. */
@Global()
@Module({
  imports: [IdentityModule, CompanyModule, JobModule],
  controllers: [CandidateProfileController, SavedJobsController, ApplicationsController],
  providers: [
    {
      provide: TransactionSql,
      useFactory: (uow: UnitOfWork) =>
        new TransactionSql(uow as ManagedUnitOfWork<ParameterizedSqlClient>),
      inject: [UNIT_OF_WORK],
    },
    {
      provide: SqlIdempotencyStore,
      useFactory: (sql: TransactionSql) => new SqlIdempotencyStore(sql),
      inject: [TransactionSql],
    },
    { provide: IDEMPOTENCY_STORE, useExisting: SqlIdempotencyStore },
    {
      provide: BE2_OUTBOX,
      useFactory: (port?: OutboxPort) => port ?? unavailableOutbox,
      inject: [{ token: PORTS.outbox, optional: true }],
    },
    {
      provide: BE2_LIFECYCLE,
      useFactory: (port?: InterviewLifecyclePort) => port ?? unavailableLifecycle,
      inject: [{ token: PORTS.interviewLifecycle, optional: true }],
    },
    {
      provide: PrismaCandidateProfileRepository,
      useFactory: (sql: TransactionSql) => new PrismaCandidateProfileRepository(sql),
      inject: [TransactionSql],
    },
    {
      provide: PrismaSavedJobRepository,
      useFactory: (sql: TransactionSql) => new PrismaSavedJobRepository(sql),
      inject: [TransactionSql],
    },
    {
      provide: PrismaCvRepository,
      useFactory: (sql: TransactionSql) => new PrismaCvRepository(sql),
      inject: [TransactionSql],
    },
    {
      provide: PrismaApplicationRepository,
      useFactory: (sql: TransactionSql) => new PrismaApplicationRepository(sql),
      inject: [TransactionSql],
    },
    {
      provide: PrismaApplicationWorkflowRepository,
      useFactory: (sql: TransactionSql) => new PrismaApplicationWorkflowRepository(sql),
      inject: [TransactionSql],
    },
    {
      provide: PrismaApplicationQueryRepository,
      useFactory: (sql: TransactionSql) => new PrismaApplicationQueryRepository(sql),
      inject: [TransactionSql],
    },
    { provide: PORTS.candidateProfile, useExisting: PrismaCandidateProfileRepository },
    { provide: PORTS.cvSelection, useExisting: PrismaCvRepository },
    {
      provide: CandidateProfileService,
      useFactory: (
        uow: UnitOfWork,
        identity: IdentityCandidatePort,
        skills: SkillCatalogPort,
        profiles: PrismaCandidateProfileRepository,
        outbox: OutboxPort,
      ) => new CandidateProfileService(uow, identity, skills, profiles, outbox),
      inject: [
        UNIT_OF_WORK,
        PORTS.identityCandidate,
        PORTS.skillCatalog,
        PrismaCandidateProfileRepository,
        BE2_OUTBOX,
      ],
    },
    {
      provide: SavedJobService,
      useFactory: (
        uow: UnitOfWork,
        identity: IdentityCandidatePort,
        jobs: JobVisibilityPort,
        repo: PrismaSavedJobRepository,
        outbox: OutboxPort,
      ) => new SavedJobService(uow, identity, jobs, repo, outbox),
      inject: [
        UNIT_OF_WORK,
        PORTS.identityCandidate,
        PORTS.jobVisibility,
        PrismaSavedJobRepository,
        BE2_OUTBOX,
      ],
    },
    {
      provide: SubmitApplicationPersistenceService,
      useFactory: (
        uow: UnitOfWork,
        idem: IdempotencyStore,
        repo: PrismaApplicationRepository,
        outbox: OutboxPort,
      ) => new SubmitApplicationPersistenceService(uow, idem, repo, outbox),
      inject: [UNIT_OF_WORK, IDEMPOTENCY_STORE, PrismaApplicationRepository, BE2_OUTBOX],
    },
    {
      provide: SubmitApplicationWorkflowService,
      useFactory: (
        persistence: SubmitApplicationPersistenceService,
        identity: IdentityCandidatePort,
        jobs: JobApplicationPort,
        cvs: PrismaCvRepository,
        profiles: PrismaCandidateProfileRepository,
      ) => new SubmitApplicationWorkflowService(persistence, identity, jobs, cvs, profiles),
      inject: [
        SubmitApplicationPersistenceService,
        PORTS.identityCandidate,
        PORTS.jobApplication,
        PrismaCvRepository,
        PrismaCandidateProfileRepository,
      ],
    },
    {
      provide: CvChangeWorkflowService,
      useFactory: (
        uow: UnitOfWork,
        identity: IdentityCandidatePort,
        company: CompanyAccessPort,
        cvs: PrismaCvRepository,
        repo: PrismaApplicationWorkflowRepository,
        writer: PrismaApplicationRepository,
        idem: IdempotencyStore,
        outbox: OutboxPort,
      ) => new CvChangeWorkflowService(uow, identity, company, cvs, repo, writer, idem, outbox),
      inject: [
        UNIT_OF_WORK,
        PORTS.identityCandidate,
        PORTS.companyAccess,
        PrismaCvRepository,
        PrismaApplicationWorkflowRepository,
        PrismaApplicationRepository,
        IDEMPOTENCY_STORE,
        BE2_OUTBOX,
      ],
    },
    {
      provide: ReviewApplicationWorkflowService,
      useFactory: (
        uow: UnitOfWork,
        identity: IdentityCandidatePort,
        company: CompanyAccessPort,
        lifecycle: InterviewLifecyclePort,
        repo: PrismaApplicationWorkflowRepository,
        writer: PrismaApplicationRepository,
        outbox: OutboxPort,
      ) =>
        new ReviewApplicationWorkflowService(
          uow,
          identity,
          company,
          lifecycle,
          repo,
          writer,
          outbox,
        ),
      inject: [
        UNIT_OF_WORK,
        PORTS.identityCandidate,
        PORTS.companyAccess,
        BE2_LIFECYCLE,
        PrismaApplicationWorkflowRepository,
        PrismaApplicationRepository,
        BE2_OUTBOX,
      ],
    },
    {
      provide: ApplicationReadService,
      useFactory: (
        uow: UnitOfWork,
        identity: IdentityCandidatePort,
        company: CompanyAccessPort,
        repo: PrismaApplicationWorkflowRepository,
        queries: PrismaApplicationQueryRepository,
      ) => new ApplicationReadService(uow, identity, company, repo, queries),
      inject: [
        UNIT_OF_WORK,
        PORTS.identityCandidate,
        PORTS.companyAccess,
        PrismaApplicationWorkflowRepository,
        PrismaApplicationQueryRepository,
      ],
    },
    {
      provide: Be2ApplicationPorts,
      useFactory: (
        repo: PrismaApplicationWorkflowRepository,
        writer: PrismaApplicationRepository,
        company: CompanyAccessPort,
        idem: IdempotencyStore,
        outbox: OutboxPort,
      ) => new Be2ApplicationPorts(repo, writer, company, idem, outbox),
      inject: [
        PrismaApplicationWorkflowRepository,
        PrismaApplicationRepository,
        PORTS.companyAccess,
        IDEMPOTENCY_STORE,
        BE2_OUTBOX,
      ],
    },
    { provide: PORTS.application, useExisting: Be2ApplicationPorts },
    { provide: PORTS.applicationResult, useExisting: Be2ApplicationPorts },
    { provide: PORTS.applicationConflict, useExisting: Be2ApplicationPorts },
  ],
  exports: [
    PORTS.candidateProfile,
    PORTS.cvSelection,
    PORTS.application,
    PORTS.applicationResult,
    PORTS.applicationConflict,
  ],
})
export class Be2Module {}
