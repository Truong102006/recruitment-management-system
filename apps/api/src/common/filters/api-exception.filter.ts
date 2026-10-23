import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DomainError } from '../../../../../libs/platform/errors/domain.error';

interface CustomRequest extends Request {
  traceId?: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CustomRequest>();

    const traceId =
      request.traceId ||
      (request.headers['x-trace-id'] as string) ||
      '00000000-0000-4000-8000-000000000000';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let fieldErrors: Record<string, string[]> | undefined = undefined;

    if (exception instanceof DomainError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
      fieldErrors = exception.fieldErrors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;

        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          fieldErrors = {};
          for (const item of resObj.message) {
            if (typeof item === 'string') {
              const fieldMatch = item.match(/^([a-zA-Z0-9_]+)\s+/);
              const field = fieldMatch && fieldMatch[1] ? fieldMatch[1] : 'general';
              if (!fieldErrors[field]) {
                fieldErrors[field] = [];
              }
              fieldErrors[field].push(item);
            }
          }
        }
      }

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = 'VALIDATION_FAILED';
          break;
        case HttpStatus.UNAUTHORIZED:
          code = 'UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          code = 'FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          code = 'NOT_FOUND';
          break;
        case HttpStatus.CONFLICT:
          code = 'CONFLICT';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = 'TOO_MANY_REQUESTS';
          break;
        default:
          code = `HTTP_${status}`;
      }
    } else if (exception instanceof Error) {
      // Driver errors may contain credentials, token material or user data.
      this.logger.error(`Unhandled error [${traceId}]`);
      message = 'An internal server error occurred';
      code = 'INTERNAL_SERVER_ERROR';
    }

    const payload: {
      code: string;
      message: string;
      traceId: string;
      fieldErrors?: Record<string, string[]>;
    } = {
      code,
      message,
      traceId,
    };

    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      payload.fieldErrors = fieldErrors;
    }

    response.setHeader('X-Trace-Id', traceId);
    response.status(status).json(payload);
  }
}
