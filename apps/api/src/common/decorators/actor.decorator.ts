import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Actor } from '../../../../../libs/contracts/backend';

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor | undefined => {
    const request = ctx.switchToHttp().getRequest<{ actor?: Actor }>();
    return request.actor;
  },
);
