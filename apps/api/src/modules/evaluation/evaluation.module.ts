import { Module } from '@nestjs/common';
import { InterviewModule } from '../interview/interview.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [InterviewModule, NotificationModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class EvaluationModule {}
