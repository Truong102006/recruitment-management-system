import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../common/prisma/prisma.service';
import { PORTS } from '../../../../libs/contracts/backend';
import { Be2Module } from './be2.module';
import { CandidateProfileController } from './candidate/controllers/candidate-profile.controller';
import { SavedJobsController } from './candidate/controllers/saved-jobs.controller';
import { ApplicationsController } from './application/controllers/applications.controller';
import { RegisterService } from './identity/services/register.service';
import { CompanyMembershipService } from './company/services/company-membership.service';

describe('BE2 Nest binding', () => {
  it('boots the BE1 and BE2 provider graph without BE3, exposing real BE2 ports', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    expect(module.get(Be2Module)).toBeDefined();
    expect(module.get(PORTS.candidateProfile)).toBeDefined();
    expect(module.get(PORTS.applicationConflict)).toBeDefined();
    expect(module.get(PORTS.application)).toBeDefined();
    expect(module.get(PORTS.applicationResult)).toBeDefined();
    expect(module.get(CandidateProfileController)).toBeDefined();
    expect(module.get(SavedJobsController)).toBeDefined();
    expect(module.get(ApplicationsController)).toBeDefined();
    expect(
      (module.get(RegisterService) as unknown as { candidateProfilePort?: unknown })
        .candidateProfilePort,
    ).toBeDefined();
    expect(
      (module.get(CompanyMembershipService) as unknown as { applicationConflictPort?: unknown })
        .applicationConflictPort,
    ).toBeDefined();
    await module.close();
  });
});
