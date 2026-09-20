import { logger } from '#platform/logging/logger.js';
import { getRequestId } from '#platform/context/requestContext.js';
import { respondError } from '#platform/http/respond.js';
import { AppError } from '#platform/errors/AppError.js';

/**
 * Translates known Prisma database errors into AppErrors.
 */
function translatePrismaError(err) {
  if (!err?.code) return err;

  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'field';
      return AppError.conflict(`A record with this ${target} already exists`, 'UNIQUE_CONSTRAINT_VIOLATION', { fields: err.meta?.target });
    }
    case 'P2025':
      return AppError.notFound('Record', err.meta?.cause || null);
    case 'P2003':
      return AppError.validation([{ field: err.meta?.field_name || 'foreignKey', message: 'Referenced foreign record was not found' }]);
    case 'P2000':
      return AppError.validation([{ field: 'input', message: 'Input value exceeds column capacity' }]);
    default:
      return err;
  }
}

/**
 * Central Express Error Handling Middleware.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const requestId = req.requestId || getRequestId();
  let error = err;

  // Handle malformed JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = AppError.validation([{ field: 'body', message: 'Malformed JSON payload in request body' }]);
  } else {
    error = translatePrismaError(error);
  }

  const statusCode = error.statusCode || 500;

  // Log 5xx unexpected server errors
  if (statusCode >= 500) {
    logger.error({ requestId, err: error, path: req.originalUrl || req.url }, `Server Error: ${error.message}`);
  }

  return respondError(res, error, requestId);
}
