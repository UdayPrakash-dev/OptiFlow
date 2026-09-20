/**
 * Simple, unified application error.
 * Encapsulates HTTP status code, error code, and optional structured details.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new AppError(message, 400, code, details);
  }

  static validation(details, message = 'Validation failed') {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHENTICATED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Access denied', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(resource = 'Resource', identifier = null) {
    const message = identifier ? `${resource} with ID '${identifier}' was not found` : `${resource} was not found`;
    return new AppError(message, 404, 'NOT_FOUND', { resource, identifier });
  }

  static conflict(message, code = 'CONFLICT', details = null) {
    return new AppError(message, 409, code, details);
  }
}
