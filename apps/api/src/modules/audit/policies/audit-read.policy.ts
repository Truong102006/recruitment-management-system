import { Injectable, ForbiddenException } from '@nestjs/common';
import type { Actor } from '../../../../../../libs/contracts/backend';

@Injectable()
export class AuditReadPolicy {
  assertCanReadAudit(actor: Actor): void {
    if (!actor.roles.includes('ADMIN')) {
      throw new ForbiddenException({
        code: 'ACTION_FORBIDDEN',
        message: 'Only system administrators can access audit logs',
      });
    }
  }
}
