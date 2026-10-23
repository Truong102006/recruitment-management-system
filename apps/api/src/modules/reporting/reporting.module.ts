import { Module } from '@nestjs/common';
import { ReportingPolicy } from './policies/reporting.policy';
import { RecruitmentStatisticsService } from './services/recruitment-statistics.service';
import { StatisticsController } from './controllers/statistics.controller';

@Module({
  controllers: [StatisticsController],
  providers: [ReportingPolicy, RecruitmentStatisticsService],
  exports: [RecruitmentStatisticsService],
})
export class ReportingModule {}
