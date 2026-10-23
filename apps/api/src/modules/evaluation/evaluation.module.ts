import { Module } from '@nestjs/common';
import { PrismaEvaluationRepository } from './repositories/prisma-evaluation.repository';
import { EvaluationPolicy } from './policies/evaluation.policy';
import { EvaluateService } from './services/evaluate.service';
import { RecordAttendanceService } from './services/record-attendance.service';
import { CompleteInterviewService } from './services/complete-interview.service';
import { MarkInterviewedService } from './services/mark-interviewed.service';
import { PublishResultService } from './services/publish-result.service';
import { EvaluationsController } from './controllers/evaluations.controller';
import { InterviewCompletionController } from './controllers/interview-completion.controller';
import { ResultsController } from './controllers/results.controller';
import { InterviewModule } from '../interview/interview.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [InterviewModule, NotificationModule],
  controllers: [
    EvaluationsController,
    InterviewCompletionController,
    ResultsController,
  ],
  providers: [
    PrismaEvaluationRepository,
    EvaluationPolicy,
    EvaluateService,
    RecordAttendanceService,
    CompleteInterviewService,
    MarkInterviewedService,
    PublishResultService,
  ],
  exports: [
    PrismaEvaluationRepository,
    EvaluateService,
    RecordAttendanceService,
    CompleteInterviewService,
    MarkInterviewedService,
    PublishResultService,
  ],
})
export class EvaluationModule {}
