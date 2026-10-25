import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Actor } from '../../../../../../libs/contracts/backend';

@Injectable()
export class InterviewPolicy {
  assertCanPropose(actor: Actor, isRecruiterInCompany: boolean): void {
    if (!isRecruiterInCompany) {
      throw new ForbiddenException({
        code: 'ACTION_FORBIDDEN',
        message: 'Only recruiters of this company can propose interviews',
      });
    }
  }

  assertCanRespond(actor: Actor, participantUserId: string): void {
    if (actor.userId !== participantUserId) {
      throw new ForbiddenException({
        code: 'ACTION_FORBIDDEN',
        message: 'You can only respond to your own interview invitation',
      });
    }
  }

  assertCanCancel(actor: Actor, isRecruiterInCompany: boolean): void {
    if (!isRecruiterInCompany && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenException({
        code: 'ACTION_FORBIDDEN',
        message: 'Only recruiters of this company or system administrators can cancel interviews',
      });
    }
  }

  assertCanJoin(actor: Actor, isParticipant: boolean): void {
    if (!isParticipant) {
      throw new ForbiddenException({
        code: 'ACTION_FORBIDDEN',
        message: 'Only assigned participants can join the interview room',
      });
    }
  }

  assertCanRead(actor: Actor, isRecruiterInCompany: boolean, isParticipant: boolean): void {
    if (!isRecruiterInCompany && !isParticipant && !actor.roles.includes('ADMIN')) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Interview not found or access denied',
      });
    }
  }
}
