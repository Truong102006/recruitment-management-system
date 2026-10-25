import { Test, TestingModule } from '@nestjs/testing';
import { Global, INestApplication, Module } from '@nestjs/common';
import { AppModule } from '../../apps/api/src/app.module';
import { configureApi } from '../../apps/api/src/common/bootstrap/configure-api';
import { PORTS } from '../../libs/contracts/backend';

// Explicit test doubles: API tests below do not prove BE2/BE3 runtime integration.
@Global()
@Module({
  providers: [
    { provide: PORTS.candidateProfile, useValue: { ensureForCandidate: async () => {} } },
    { provide: PORTS.outbox, useValue: { append: async () => {} } },
    { provide: PORTS.applicationConflict, useValue: { hasOpenApplication: async () => false } },
    {
      provide: PORTS.interviewMembership,
      useValue: { assertNoUnresolvedProposedOrConfirmed: async () => {} },
    },
  ],
  exports: [
    PORTS.candidateProfile,
    PORTS.outbox,
    PORTS.applicationConflict,
    PORTS.interviewMembership,
  ],
})
class TestDependencyModule {}

export async function createTestApi(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestDependencyModule, AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  try {
    configureApi(app);
    await app.init();
    return app;
  } catch (error) {
    // Preserve the startup failure even if closing a partially initialized app fails.
    await app.close().catch(() => undefined);
    throw error;
  }
}
