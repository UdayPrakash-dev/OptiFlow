import { config } from '#config/env.js';
import { AppError } from '#platform/errors/AppError.js';

/**
 * Standard Success Response Envelope
 * Returns: { "data": ..., "meta": { ... } }
 *
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {object} [meta={}] - Optional metadata (pagination, counts, execution stats)
 * @param {number} [statusCode=200]
 */
export function respondSuccess(res, data, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    data: data !== undefined ? data : null,
    meta: meta || {}
  });
}

/**
 * Standard Created Response Envelope (201)
 *
 * @param {import('express').Response} res
 * @param {*} data - Created resource payload
 * @param {object} [meta={}]
 */
export function respondCreated(res, data, meta = {}) {
  return respondSuccess(res, data, meta, 201);
}

/**
 * Standard 204 No Content Response
 *
 * @param {import('express').Response} res
 */
export function respondNoContent(res) {
  return res.status(204).end();
}

/**
 * Standard Error Response Envelope
 * Returns: { "error": { "code": "...", "message": "...", "details": [...] }, "requestId": "..." }
 *
 * Guarantees that internal 5xx errors do not leak stack traces or internal implementation details to clients.
 *
 * @param {import('express').Response} res
 * @param {Error|AppError|any} error
 * @param {string|null} [requestId=null]
 */
export function respondError(res, error, requestId = null) {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected internal server error occurred';
  let details = null;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error && typeof error.statusCode === 'number') {
    statusCode = error.statusCode;
    errorCode = error.code || 'REQUEST_ERROR';
    message = error.message || 'Request failed';
    details = error.details || null;
  } else if (error && error.name === 'ZodError') {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Array.isArray(error.issues)
      ? error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
          code: i.code
        }))
      : null;
  }

  // In production, mask non-operational 500 internal errors
  if (statusCode >= 500 && !config.isDevelopment && !config.isTest) {
    message = 'An unexpected internal server error occurred';
    details = null;
  }

  const responseBody = {
    error: {
      code: errorCode,
      message,
      ...(details !== null && details !== undefined && { details })
    },
    ...(requestId && { requestId })
  };

  return res.status(statusCode).json(responseBody);
}
