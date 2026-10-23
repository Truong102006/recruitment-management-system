export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    code = 'INTERNAL_ERROR',
    statusCode = 500,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, 'VALIDATION_FAILED', 400, fieldErrors);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, code, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, code, 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, code, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code, 409);
  }
}

export class RateLimitExceededError extends DomainError {
  constructor(message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
    super(message, code, 429);
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(message, code, 503);
  }
}
