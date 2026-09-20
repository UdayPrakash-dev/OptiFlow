import { pinoHttp } from 'pino-http';
import { logger } from '#platform/logging/logger.js';
import { getTenantId, getActor } from '#platform/context/requestContext.js';

/**
 * Standard HTTP request logger middleware powered by pino-http.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || req.requestId,
  customProps: () => ({
    companyId: getTenantId(),
    actorId: getActor()?.id
  }),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => req.url === '/healthz' || req.url === '/readyz'
  }
});
