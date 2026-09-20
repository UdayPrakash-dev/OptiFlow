import pino from 'pino';
import { config } from '#config/env.js';

/**
 * List of sensitive key paths to automatically redact from log outputs.
 * Ported and expanded from the legacy LoggingService security specification.
 */
export const REDACTION_PATHS = [
  'password',
  'passwordHash',
  'password_hash',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'refresh_token',
  'resetToken',
  'secret',
  'jwtSecret',
  'cookieSecret',
  'apiKey',
  'authorization',
  'cookie',
  '["set-cookie"]',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'headers["set-cookie"]',
  'headers.authorization',
  '*.password',
  '*.passwordHash',
  '*.password_hash',
  '*.currentPassword',
  '*.newPassword',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.apiKey'
];

/**
 * Creates a configured Pino logger instance.
 *
 * @param {object} [options={}]
 * @param {string} [options.level]
 * @param {boolean} [options.pretty]
 * @returns {import('pino').Logger}
 */
export function createLogger(options = {}) {
  const isDev = config.isDevelopment;
  const logLevel = options.level || config.LOG_LEVEL || (isDev ? 'debug' : 'info');

  const pinoOptions = {
    level: logLevel,
    redact: {
      paths: REDACTION_PATHS,
      censor: '[REDACTED]'
    },
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        pid: bindings.pid,
        host: bindings.hostname
      })
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: 'optiflow-api',
      env: config.NODE_ENV
    }
  };

  // In development, if requested and not in test, pretty-print for readability
  if (isDev && options.pretty !== false && process.env.NODE_ENV !== 'test') {
    return pino({
      ...pinoOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,host,service,env'
        }
      }
    });
  }

  return pino(pinoOptions);
}

/**
 * Global application logger instance
 */
export const logger = createLogger({ pretty: false });

/**
 * Creates a contextual child logger with attached correlation fields.
 *
 * @param {object} context
 * @param {string} [context.requestId]
 * @param {string} [context.actorId]
 * @param {string} [context.companyId]
 * @param {string} [context.module]
 * @returns {import('pino').Logger}
 */
export function createChildLogger(context = {}) {
  return logger.child(context);
}
