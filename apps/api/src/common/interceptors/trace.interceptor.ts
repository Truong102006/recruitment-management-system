import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { traceId?: string }>();
    const res = http.getResponse<Response>();

    const incomingTrace = req.headers['x-trace-id'];
    const traceId =
      typeof incomingTrace === 'string' && UUID_REGEX.test(incomingTrace)
        ? incomingTrace
        : randomUUID();

    req.traceId = traceId;
    res.setHeader('X-Trace-Id', traceId);

    return next.handle();
  }
}
