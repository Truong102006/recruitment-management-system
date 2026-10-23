import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { environmentConfig } from './config/environment.config';
import { PrismaModule } from './common/prisma/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CompanyModule } from './modules/company/company.module';
import { JobModule } from './modules/job/job.module';
import { AdminModule } from './modules/admin/admin.module';
import { Be2Module } from './modules/be2.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environmentConfig],
    }),
    PrismaModule,
    IdentityModule,
    CompanyModule,
    JobModule,
    AdminModule,
    Be2Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
