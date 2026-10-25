import { Module } from '@nestjs/common';
import { PORTS } from '../../../../../libs/contracts/backend';
import { VIDEO_PORT } from '../../../../../libs/platform/video/video.port';
import { JitsiVideoAdapter } from '../../../../../libs/platform/video/jitsi-video.adapter';
import { PrismaInterviewRepository } from './repositories/prisma-interview.repository';
import { InterviewPolicy } from './policies/interview.policy';
import {
  InterviewLifecycleAdapter,
  InterviewSecurityAdapter,
  InterviewAdminAdapter,
  InterviewMembershipAdapter,
} from './ports/interview-ports.adapter';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [],
  providers: [
    PrismaInterviewRepository,
    InterviewPolicy,
    InterviewLifecycleAdapter,
    InterviewSecurityAdapter,
    InterviewAdminAdapter,
    InterviewMembershipAdapter,
    {
      provide: PORTS.interviewLifecycle,
      useExisting: InterviewLifecycleAdapter,
    },
    {
      provide: PORTS.interviewSecurity,
      useExisting: InterviewSecurityAdapter,
    },
    {
      provide: PORTS.interviewAdmin,
      useExisting: InterviewAdminAdapter,
    },
    {
      provide: PORTS.interviewMembership,
      useExisting: InterviewMembershipAdapter,
    },
    {
      provide: VIDEO_PORT,
      useFactory: () =>
        new JitsiVideoAdapter({
          domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
          appId: process.env.JITSI_APP_ID || '',
          appSecret: process.env.JITSI_APP_SECRET || '',
        }),
    },
  ],
  exports: [
    PrismaInterviewRepository,
    InterviewPolicy,
    InterviewLifecycleAdapter,
    InterviewSecurityAdapter,
    InterviewAdminAdapter,
    InterviewMembershipAdapter,
    PORTS.interviewLifecycle,
    PORTS.interviewSecurity,
    PORTS.interviewAdmin,
    PORTS.interviewMembership,
    VIDEO_PORT,
  ],
})
export class InterviewModule {}
