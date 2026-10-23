import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        // If status is 204 or no content, return undefined
        if (res.statusCode === 204 || data === undefined || data === null) {
          return data;
        }

        // If data is already wrapped with data property (e.g. { data: ..., meta: ... })
        if (typeof data === 'object' && data !== null && 'data' in data) {
          return data;
        }

        // Wrap plain response in data envelope
        return { data };
      }),
    );
  }
}
