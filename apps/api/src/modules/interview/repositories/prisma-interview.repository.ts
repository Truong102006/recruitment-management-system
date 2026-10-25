import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  ManagedUnitOfWork,
  TransactionContext as Tx,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import type {
  AttendanceStatus,
  InterviewDetailDto,
  InterviewParticipantDto,
  InterviewResponse,
  InterviewStatus,
  InterviewSummaryDto,
  ParticipantRole,
  RoomAccessState,
} from '../../../../../../libs/contracts/public';
import type { InterviewEvidence } from '../../../../../../libs/contracts/backend';

export interface InterviewRow {
  id: string;
  applicationId: string;
  createdBy: string;
  startAt: Date;
  endAt: Date;
  status: InterviewStatus;
  roomKey: string;
  providerRoomId: string | null;
  cancelReason: string | null;
  outcomeReason: string | null;
  replacesInterviewId: string | null;
  expiresAt: Date;
  accessGeneration: number;
  roomAccessState: RoomAccessState;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProposedInterviewInput {
  id?: string;
  applicationId: string;
  createdBy: string;
  startAt: Date;
  endAt: Date;
  candidateId: string;
  interviewerIds: readonly string[];
  replacesInterviewId?: string | null;
  expiresAt: Date;
}

export interface ReservationInput {
  interviewId: string;
  userId: string;
  startAt: Date;
  endAt: Date;
}

@Injectable()
export class PrismaInterviewRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  async createProposed(input: CreateProposedInterviewInput, tx: Tx): Promise<string> {
    const client = this.uow.clientFor(tx);
    const id = input.id ?? crypto.randomUUID();
    const roomKey = `rk_${crypto.randomBytes(16).toString('hex')}`;

    await client.$executeRaw`
      INSERT INTO interview (
        id, application_id, created_by, start_at, end_at, status,
        room_key, replaces_interview_id, expires_at, access_generation,
        room_access_state, version, created_at, updated_at
      )
      VALUES (
        ${id}::uuid,
        ${input.applicationId}::uuid,
        ${input.createdBy}::uuid,
        ${input.startAt},
        ${input.endAt},
        'PROPOSED',
        ${roomKey},
        ${input.replacesInterviewId ? input.replacesInterviewId : null}::uuid,
        ${input.expiresAt},
        0,
        'ACTIVE',
        0,
        now(),
        now()
      )
    `;

    // Insert Candidate participant
    await client.$executeRaw`
      INSERT INTO interview_participant (
        interview_id, user_id, participant_role, response, attendance, version, created_at, updated_at
      )
      VALUES (
        ${id}::uuid,
        ${input.candidateId}::uuid,
        'CANDIDATE',
        'PENDING',
        'UNKNOWN',
        0,
        now(),
        now()
      )
    `;

    // Insert Interviewer participants
    for (const interviewerId of input.interviewerIds) {
      await client.$executeRaw`
        INSERT INTO interview_participant (
          interview_id, user_id, participant_role, response, attendance, version, created_at, updated_at
        )
        VALUES (
          ${id}::uuid,
          ${interviewerId}::uuid,
          'INTERVIEWER',
          'PENDING',
          'UNKNOWN',
          0,
          now(),
          now()
        )
      `;
    }

    return id;
  }

  async findById(id: string, tx: Tx): Promise<InterviewRow | null> {
    const client = this.uow.clientFor(tx);
    const rows = await client.$queryRaw<InterviewRow[]>`
      SELECT
        i.id,
        i.application_id as "applicationId",
        i.created_by as "createdBy",
        i.start_at as "startAt",
        i.end_at as "endAt",
        i.status,
        i.room_key as "roomKey",
        i.provider_room_id as "providerRoomId",
        i.cancel_reason as "cancelReason",
        i.outcome_reason as "outcomeReason",
        i.replaces_interview_id as "replacesInterviewId",
        i.expires_at as "expiresAt",
        i.access_generation as "accessGeneration",
        i.room_access_state as "roomAccessState",
        i.completed_at as "completedAt",
        i.cancelled_at as "cancelledAt",
        i.cancelled_by as "cancelledBy",
        i.version,
        i.created_at as "createdAt",
        i.updated_at as "updatedAt"
      FROM interview i
      WHERE i.id = ${id}::uuid
    `;
    return rows[0] ?? null;
  }

  async findParticipants(interviewId: string, tx: Tx): Promise<InterviewParticipantDto[]> {
    const client = this.uow.clientFor(tx);
    const rows = await client.$queryRaw<Array<{
      userId: string;
      participantRole: ParticipantRole;
      response: InterviewResponse;
      respondedAt: Date | null;
      attendance: AttendanceStatus;
      attendanceReason: string | null;
      version: number;
      fullName?: string;
      email?: string;
    }>>`
      SELECT
        p.user_id as "userId",
        p.participant_role as "participantRole",
        p.response,
        p.responded_at as "respondedAt",
        p.attendance,
        p.attendance_reason as "attendanceReason",
        p.version,
        u.full_name as "fullName",
        u.email
      FROM interview_participant p
      JOIN user_account u ON u.id = p.user_id
      WHERE p.interview_id = ${interviewId}::uuid
      ORDER BY p.participant_role ASC, u.full_name ASC
    `;

    return rows.map((r) => ({
      userId: r.userId,
      participantRole: r.participantRole,
      response: r.response,
      respondedAt: r.respondedAt ? r.respondedAt.toISOString() : null,
      attendance: r.attendance,
      attendanceReason: r.attendanceReason,
      version: r.version,
      fullName: r.fullName,
      email: r.email,
    }));
  }

  async findDetail(id: string, tx: Tx): Promise<InterviewDetailDto | null> {
    const interview = await this.findById(id, tx);
    if (!interview) return null;

    const participants = await this.findParticipants(id, tx);

    return {
      id: interview.id,
      applicationId: interview.applicationId,
      startAt: interview.startAt.toISOString(),
      endAt: interview.endAt.toISOString(),
      status: interview.status,
      roomAccessState: interview.roomAccessState,
      replacesInterviewId: interview.replacesInterviewId,
      expiresAt: interview.expiresAt.toISOString(),
      version: interview.version,
      createdAt: interview.createdAt.toISOString(),
      cancelReason: interview.cancelReason,
      outcomeReason: interview.outcomeReason,
      completedAt: interview.completedAt ? interview.completedAt.toISOString() : null,
      cancelledAt: interview.cancelledAt ? interview.cancelledAt.toISOString() : null,
      participants,
    };
  }

  async findForApplication(applicationId: string, tx: Tx): Promise<InterviewSummaryDto[]> {
    const client = this.uow.clientFor(tx);
    const rows = await client.$queryRaw<
      Array<{
        id: string;
        applicationId: string;
        startAt: Date;
        endAt: Date;
        status: InterviewStatus;
        roomAccessState: RoomAccessState;
        replacesInterviewId: string | null;
        expiresAt: Date;
        version: number;
        createdAt: Date;
      }>
    >`
      SELECT
        i.id,
        i.application_id as "applicationId",
        i.start_at as "startAt",
        i.end_at as "endAt",
        i.status,
        i.room_access_state as "roomAccessState",
        i.replaces_interview_id as "replacesInterviewId",
        i.expires_at as "expiresAt",
        i.version,
        i.created_at as "createdAt"
      FROM interview i
      WHERE i.application_id = ${applicationId}::uuid
      ORDER BY i.start_at ASC
    `;

    const results: InterviewSummaryDto[] = [];
    for (const r of rows) {
      const participants = await this.findParticipants(r.id, tx);
      results.push({
        id: r.id,
        applicationId: r.applicationId,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
        status: r.status,
        roomAccessState: r.roomAccessState,
        replacesInterviewId: r.replacesInterviewId,
        expiresAt: r.expiresAt.toISOString(),
        version: r.version,
        createdAt: r.createdAt.toISOString(),
        participants,
      });
    }

    return results;
  }

  async findForUser(
    userId: string,
    filter: { status?: string; from?: Date; to?: Date },
    tx: Tx,
  ): Promise<InterviewSummaryDto[]> {
    const client = this.uow.clientFor(tx);
    const rows = await client.$queryRaw<
      Array<{
        id: string;
        applicationId: string;
        startAt: Date;
        endAt: Date;
        status: InterviewStatus;
        roomAccessState: RoomAccessState;
        replacesInterviewId: string | null;
        expiresAt: Date;
        version: number;
        createdAt: Date;
      }>
    >`
      SELECT DISTINCT
        i.id,
        i.application_id as "applicationId",
        i.start_at as "startAt",
        i.end_at as "endAt",
        i.status,
        i.room_access_state as "roomAccessState",
        i.replaces_interview_id as "replacesInterviewId",
        i.expires_at as "expiresAt",
        i.version,
        i.created_at as "createdAt"
      FROM interview i
      JOIN interview_participant p ON p.interview_id = i.id
      WHERE p.user_id = ${userId}::uuid
        AND (${filter.status ? filter.status : null}::varchar IS NULL OR i.status = ${filter.status})
        AND (${filter.from ? filter.from : null}::timestamptz IS NULL OR i.start_at >= ${filter.from})
        AND (${filter.to ? filter.to : null}::timestamptz IS NULL OR i.start_at < ${filter.to})
      ORDER BY i.start_at ASC
    `;

    const results: InterviewSummaryDto[] = [];
    for (const r of rows) {
      const participants = await this.findParticipants(r.id, tx);
      results.push({
        id: r.id,
        applicationId: r.applicationId,
        startAt: r.startAt.toISOString(),
        endAt: r.endAt.toISOString(),
        status: r.status,
        roomAccessState: r.roomAccessState,
        replacesInterviewId: r.replacesInterviewId,
        expiresAt: r.expiresAt.toISOString(),
        version: r.version,
        createdAt: r.createdAt.toISOString(),
        participants,
      });
    }

    return results;
  }

  async updateParticipantResponse(
    interviewId: string,
    userId: string,
    response: 'ACCEPTED' | 'DECLINED',
    tx: Tx,
  ): Promise<boolean> {
    const client = this.uow.clientFor(tx);
    const updated = await client.$executeRaw`
      UPDATE interview_participant
      SET
        response = ${response},
        responded_at = now(),
        version = version + 1,
        updated_at = now()
      WHERE interview_id = ${interviewId}::uuid
        AND user_id = ${userId}::uuid
    `;
    return updated > 0;
  }

  async createReservations(reservations: ReservationInput[], tx: Tx): Promise<void> {
    const client = this.uow.clientFor(tx);
    for (const r of reservations) {
      await client.$executeRaw`
        INSERT INTO interview_reservation (
          interview_id, user_id, start_at, end_at, created_at
        )
        VALUES (
          ${r.interviewId}::uuid,
          ${r.userId}::uuid,
          ${r.startAt},
          ${r.endAt},
          now()
        )
      `;
    }
  }

  async releaseReservations(interviewId: string, reason: string, tx: Tx): Promise<number> {
    const client = this.uow.clientFor(tx);
    const updated = await client.$executeRaw`
      UPDATE interview_reservation
      SET
        released_at = now(),
        release_reason = ${reason}
      WHERE interview_id = ${interviewId}::uuid
        AND released_at IS NULL
    `;
    return updated;
  }

  async confirmInterview(
    interviewId: string,
    expectedVersion: number,
    tx: Tx,
  ): Promise<{ success: boolean; newVersion: number }> {
    const client = this.uow.clientFor(tx);
    const rows = await client.$queryRaw<Array<{ version: number }>>`
      UPDATE interview
      SET
        status = 'CONFIRMED',
        version = version + 1,
        updated_at = now()
      WHERE id = ${interviewId}::uuid
        AND version = ${expectedVersion}
        AND status = 'PROPOSED'
      RETURNING version
    `;

    const first = rows[0];
    if (!first) {
      return { success: false, newVersion: expectedVersion };
    }
    return { success: true, newVersion: first.version };
  }

  async cancelInterview(
    interviewId: string,
    reason: string,
    cancelledBy: string | null,
    expectedVersion: number,
    tx: Tx,
  ): Promise<{ success: boolean; newVersion: number }> {
    const client = this.uow.clientFor(tx);
    const rows = await client.$queryRaw<Array<{ version: number }>>`
      UPDATE interview
      SET
        status = 'CANCELLED',
        cancel_reason = ${reason},
        cancelled_at = now(),
        cancelled_by = ${cancelledBy ? cancelledBy : null}::uuid,
        room_access_state = 'REVOKE_PENDING',
        access_generation = access_generation + 1,
        version = version + 1,
        updated_at = now()
      WHERE id = ${interviewId}::uuid
        AND version = ${expectedVersion}
        AND status IN ('PROPOSED', 'CONFIRMED')
      RETURNING version
    `;

    const first = rows[0];
    if (!first) {
      return { success: false, newVersion: expectedVersion };
    }
    return { success: true, newVersion: first.version };
  }

  async getEvidence(applicationId: string, tx: Tx): Promise<InterviewEvidence> {
    const client = this.uow.clientFor(tx);
    const txId = crypto.randomUUID();
    const rows = await client.$queryRaw<
      Array<{
        proposed_count: string;
        confirmed_count: string;
        completed_count: string;
        no_show_count: string;
      }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE status = 'PROPOSED') as proposed_count,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show_count
      FROM interview
      WHERE application_id = ${applicationId}::uuid
    `;

    const proposedCount = parseInt(rows[0]?.proposed_count || '0', 10);
    const confirmedCount = parseInt(rows[0]?.confirmed_count || '0', 10);
    const completedCount = parseInt(rows[0]?.completed_count || '0', 10);
    const noShowCount = parseInt(rows[0]?.no_show_count || '0', 10);

    // Missing evaluations: for each COMPLETED interview, count attended interviewers who have not submitted an evaluation
    const missingRows = await client.$queryRaw<Array<{ missing_count: string }>>`
      SELECT COUNT(*) as missing_count
      FROM interview_participant ip
      JOIN interview i ON i.id = ip.interview_id
      LEFT JOIN evaluation e ON e.interview_id = ip.interview_id AND e.interviewer_id = ip.user_id
      WHERE i.application_id = ${applicationId}::uuid
        AND i.status = 'COMPLETED'
        AND ip.participant_role = 'INTERVIEWER'
        AND ip.attendance = 'ATTENDED'
        AND e.id IS NULL
    `;
    const missingEvaluationCount = parseInt(missingRows[0]?.missing_count || '0', 10);

    return {
      applicationId,
      transactionId: txId,
      proposedCount,
      confirmedCount,
      completedCount,
      noShowCount,
      missingEvaluationCount,
    };
  }

  async getLockScope(
    applicationId: string,
  ): Promise<{ readonly userIds: readonly string[]; readonly interviewIds: readonly string[] }> {
    return this.uow.run(async (tx) => {
      const client = this.uow.clientFor(tx);
      const interviews = await client.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM interview WHERE application_id = ${applicationId}::uuid
      `;
      const interviewIds = interviews.map((i: { id: string }) => i.id);

      if (interviewIds.length === 0) {
        return { userIds: [], interviewIds: [] };
      }

      const participants = await client.$queryRaw<Array<{ user_id: string }>>`
        SELECT DISTINCT user_id FROM interview_participant WHERE interview_id IN (${Prisma.join(
          interviewIds.map((id: string) => Prisma.sql`${id}::uuid`),
        )})
      `;
      return {
        userIds: participants.map((p: { user_id: string }) => p.user_id),
        interviewIds,
      };
    });
  }

  async cancelOpenForApplication(
    applicationId: string,
    actorId: string,
    reason: 'WITHDRAWN' | 'RESULT_REJECTED',
    tx: Tx,
  ): Promise<{ readonly cancelledInterviewIds: readonly string[] }> {
    const client = this.uow.clientFor(tx);
    const statusesToCancel = reason === 'WITHDRAWN' ? ['PROPOSED', 'CONFIRMED'] : ['PROPOSED'];

    const openInterviews: Array<{ id: string; version: number }> = await client.$queryRaw`
      SELECT id, version FROM interview
      WHERE application_id = ${applicationId}::uuid
        AND status IN (${Prisma.join(statusesToCancel)})
    `;

    const cancelledInterviewIds: string[] = [];
    for (const item of openInterviews) {
      const res = await this.cancelInterview(item.id, reason, actorId, item.version, tx);
      if (res.success) {
        cancelledInterviewIds.push(item.id);
        await this.releaseReservations(item.id, reason, tx);
      }
    }

    return { cancelledInterviewIds };
  }

  async revokeForUser(
    userId: string,
    tx: Tx,
  ): Promise<{ readonly revokedInterviewsCount: number; readonly currentGeneration: number }> {
    const client = this.uow.clientFor(tx);
    const rows: Array<{ id: string; access_generation: number }> = await client.$queryRaw`
      UPDATE interview i
      SET
        room_access_state = 'REVOKED',
        access_generation = access_generation + 1,
        updated_at = now()
      FROM interview_participant ip
      WHERE ip.interview_id = i.id
        AND ip.user_id = ${userId}::uuid
        AND i.status IN ('PROPOSED', 'CONFIRMED')
      RETURNING i.id, i.access_generation
    `;
    const maxGen = rows.length > 0 ? Math.max(...rows.map((r) => r.access_generation)) : 0;
    return {
      revokedInterviewsCount: rows.length,
      currentGeneration: maxGen,
    };
  }

  async revokeForCompany(
    companyId: string,
    tx: Tx,
  ): Promise<{ readonly revokedInterviewsCount: number; readonly currentGeneration: number }> {
    const client = this.uow.clientFor(tx);
    const rows: Array<{ id: string; access_generation: number }> = await client.$queryRaw`
      UPDATE interview i
      SET
        room_access_state = 'REVOKED',
        access_generation = access_generation + 1,
        updated_at = now()
      FROM application a
      JOIN job_post j ON j.id = a.job_id
      WHERE a.id = i.application_id
        AND j.company_id = ${companyId}::uuid
        AND i.status IN ('PROPOSED', 'CONFIRMED')
      RETURNING i.id, i.access_generation
    `;
    const maxGen = rows.length > 0 ? Math.max(...rows.map((r) => r.access_generation)) : 0;
    return {
      revokedInterviewsCount: rows.length,
      currentGeneration: maxGen,
    };
  }

  async assertNoUnresolvedProposedOrConfirmed(userId: string, companyId: string, tx: Tx): Promise<void> {
    const client = this.uow.clientFor(tx);
    const rows: Array<{ count: string }> = await client.$queryRaw`
      SELECT COUNT(*)::text as count
      FROM interview i
      JOIN interview_participant ip ON ip.interview_id = i.id
      JOIN application a ON a.id = i.application_id
      JOIN job_post j ON j.id = a.job_id
      WHERE ip.user_id = ${userId}::uuid
        AND j.company_id = ${companyId}::uuid
        AND i.status IN ('PROPOSED', 'CONFIRMED')
    `;
    if (parseInt(rows[0]?.count || '0', 10) > 0) {
      throw new Error('User has unresolved active interviews with this company');
    }
  }
}
