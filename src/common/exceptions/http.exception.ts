import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Base HTTP exception, mirroring NestJS's built-in exception classes. */
export class HttpException extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
    readonly error: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad request', details?: unknown) {
    super(400, message, 'Bad Request', details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(401, message, 'Unauthorized');
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(403, message, 'Forbidden');
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not found') {
    super(404, message, 'Not Found');
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, message, 'Conflict', details);
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message = 'Payload too large') {
    super(413, message, 'Payload Too Large');
  }
}
