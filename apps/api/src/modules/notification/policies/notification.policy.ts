import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Actor } from '../../../../../libs/contracts/backend';

@Injectable()
export class NotificationPolicy {
  assertCanReadNotifications(actor: Actor): void {
    if (!actor || !actor.userId) {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID',
        message: 'Must be authenticated to view notifications',
      });
    }
  }

  assertCanManageEvents(actor: Actor): void {
    if (!actor.roles.includes('ADMIN')) {
      throw new ForbiddenException({
        code: 'ACTION_FORBIDDEN',
        message: 'Only administrators can manage outbox events',
      });
    }
  }
}
