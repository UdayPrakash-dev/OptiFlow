import crypto from 'node:crypto';
import { runWithContext } from '#platform/context/requestContext.js';

/**
 * Express middleware that extracts or generates an X-Request-Id,
 * sets the header on the response, and initializes the AsyncLocalStorage context.
 */
export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim()
    ? incomingId.trim()
    : crypto.randomUUID();

  // Attach to request object and response headers
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  // Initialize the AsyncLocalStorage context for downstream async execution
  runWithContext({ requestId }, next);
}
