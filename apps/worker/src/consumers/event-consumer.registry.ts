import { Inject, Injectable, Optional } from '@nestjs/common';
import type { OutboxEventRecord } from '../../../api/src/modules/notification/repositories/prisma-outbox.repository';
import { PrismaNotificationRepository } from '../../../api/src/modules/notification/repositories/prisma-notification.repository';
import { PrismaEmailRepository } from '../../../api/src/modules/notification/repositories/prisma-email.repository';
import { VIDEO_PORT, type VideoPort } from '../../../../libs/platform/video/video.port';
import type { TransactionContext as Tx } from '../../../../libs/platform/database/unit-of-work';

@Injectable()
export class EventConsumerRegistry {
  constructor(
    private readonly notificationRepo: PrismaNotificationRepository,
    private readonly emailRepo: PrismaEmailRepository,
    @Optional() @Inject(VIDEO_PORT) private readonly videoPort?: VideoPort,
  ) {}

  async consume(event: OutboxEventRecord, tx: Tx): Promise<void> {
    const { eventType, payload } = event;

    switch (eventType) {
      case 'interview.proposed': {
        const { interviewId, candidateId, interviewerIds, startAt } = payload;
        const timeStr = new Date(startAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        // Notify candidate
        if (candidateId) {
          await this.notificationRepo.createNotification(
            {
              userId: candidateId,
              eventId: event.id,
              title: 'Đề xuất lịch phỏng vấn mới',
              content: `Bạn nhận được đề xuất lịch phỏng vấn vào lúc ${timeStr}. Vui lòng phản hồi chấp nhận hoặc từ chối.`,
              targetType: 'INTERVIEW',
              targetId: interviewId,
            },
            tx,
          );
        }

        // Notify interviewers
        if (Array.isArray(interviewerIds)) {
          for (const interviewerId of interviewerIds) {
            await this.notificationRepo.createNotification(
              {
                userId: interviewerId,
                eventId: event.id,
                title: 'Lời mời phỏng vấn mới',
                content: `Bạn được phân công phỏng vấn vào lúc ${timeStr}. Vui lòng phản hồi lịch.`,
                targetType: 'INTERVIEW',
                targetId: interviewId,
              },
              tx,
            );
          }
        }
        break;
      }

      case 'interview.confirmed': {
        const { interviewId, applicationId, startAt } = payload;
        const timeStr = new Date(startAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        // Fetch participants for this interview to notify them
        const participants: any[] = await tx.client.$queryRaw`
          SELECT user_id, participant_role
          FROM interview_participant
          WHERE interview_id = ${interviewId}::uuid
        `;

        for (const p of participants) {
          await this.notificationRepo.createNotification(
            {
              userId: p.user_id,
              eventId: event.id,
              title: 'Lịch phỏng vấn đã được xác nhận',
              content: `Buổi phỏng vấn đã được xác nhận vào lúc ${timeStr}. Bạn có thể vào phòng trước 10 phút.`,
              targetType: 'INTERVIEW',
              targetId: interviewId,
            },
            tx,
          );
        }
        break;
      }

      case 'interview.cancelled': {
        const { interviewId, reason } = payload;
        const participants: any[] = await tx.client.$queryRaw`
          SELECT user_id
          FROM interview_participant
          WHERE interview_id = ${interviewId}::uuid
        `;

        for (const p of participants) {
          await this.notificationRepo.createNotification(
            {
              userId: p.user_id,
              eventId: event.id,
              title: 'Lịch phỏng vấn đã bị hủy',
              content: `Lịch phỏng vấn đã bị hủy. Lý do: ${reason || 'Không có lý do cụ thể'}`,
              targetType: 'INTERVIEW',
              targetId: interviewId,
            },
            tx,
          );
        }
        break;
      }

      case 'interview.room_revoke_requested': {
        const { interviewId, accessGeneration } = payload;
        if (this.videoPort) {
          await this.videoPort.revoke({
            operationId: event.id,
            interviewId,
            accessGeneration,
          });
        }
        // Update database room_access_state
        await tx.client.$executeRaw`
          UPDATE interview
          SET room_access_state = 'REVOKED'
          WHERE id = ${interviewId}::uuid
            AND access_generation = ${accessGeneration}
        `;
        break;
      }

      case 'application.result_published': {
        const { applicationId } = payload;
        // Fetch candidateId and public message
        const appRows: any[] = await tx.client.$queryRaw`
          SELECT candidate_id, result_message, status
          FROM application
          WHERE id = ${applicationId}::uuid
        `;
        if (appRows.length > 0) {
          const app = appRows[0];
          const isHired = app.status === 'HIRED';
          await this.notificationRepo.createNotification(
            {
              userId: app.candidate_id,
              eventId: event.id,
              title: isHired ? 'Chúc mừng! Bạn đã trúng tuyển' : 'Kết quả ứng tuyển',
              content: app.result_message || 'Kết quả ứng tuyển của bạn đã được công bố.',
              targetType: 'APPLICATION',
              targetId: applicationId,
            },
            tx,
          );
        }
        break;
      }

      case 'auth.verification_requested': {
        const { userId, email } = payload;
        await this.emailRepo.createDelivery(
          {
            eventId: event.id,
            userId,
            templateCode: 'AUTH_VERIFY_EMAIL',
            recipientEmail: email,
          },
          tx,
        );
        break;
      }

      case 'auth.password_reset_requested': {
        const { userId, email } = payload;
        await this.emailRepo.createDelivery(
          {
            eventId: event.id,
            userId,
            templateCode: 'AUTH_RESET_PASSWORD',
            recipientEmail: email,
          },
          tx,
        );
        break;
      }

      default:
        // Other events can be acknowledged without generating notifications
        break;
    }
  }
}
