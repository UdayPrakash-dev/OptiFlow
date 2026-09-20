import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { REDACTION_PATHS, createLogger } from '#platform/logging/logger.js';

describe('Structured Logging & Secret Redaction (Pino)', () => {
  it('redacts sensitive fields in root and nested objects', () => {
    // Capture stream output into a buffer
    let output = '';
    const destination = {
      write: (chunk) => {
        output += chunk;
      }
    };

    const testLogger = pino(
      {
        level: 'debug',
        redact: {
          paths: REDACTION_PATHS,
          censor: '[REDACTED]'
        }
      },
      destination
    );

    testLogger.info(
      {
        user: {
          email: 'admin@acme.com',
          password: 'plain_password_123',
          token: 'jwt_access_token_value'
        },
        passwordHash: '$2b$12$securehash',
        secret: 'topsecretkey',
        authorization: 'Bearer sensitive_token',
        requestId: 'req-12345'
      },
      'User login event'
    );

    const parsedLog = JSON.parse(output.trim());

    // Non-sensitive fields preserved
    expect(parsedLog.msg).toBe('User login event');
    expect(parsedLog.requestId).toBe('req-12345');
    expect(parsedLog.user.email).toBe('admin@acme.com');

    // Sensitive fields redacted
    expect(parsedLog.user.password).toBe('[REDACTED]');
    expect(parsedLog.user.token).toBe('[REDACTED]');
    expect(parsedLog.passwordHash).toBe('[REDACTED]');
    expect(parsedLog.secret).toBe('[REDACTED]');
    expect(parsedLog.authorization).toBe('[REDACTED]');
  });

  it('creates child loggers with contextual metadata', () => {
    let output = '';
    const destination = {
      write: (chunk) => {
        output += chunk;
      }
    };

    const baseLogger = pino({ level: 'info' }, destination);
    const childLogger = baseLogger.child({
      requestId: 'req-abc-789',
      companyId: 'company-uuid-111',
      actorId: 'user-uuid-222'
    });

    childLogger.info('Processing task transition');

    const parsedLog = JSON.parse(output.trim());
    expect(parsedLog.msg).toBe('Processing task transition');
    expect(parsedLog.requestId).toBe('req-abc-789');
    expect(parsedLog.companyId).toBe('company-uuid-111');
    expect(parsedLog.actorId).toBe('user-uuid-222');
  });

  it('exports valid default logger instance', () => {
    const defaultLogger = createLogger({ pretty: false });
    expect(defaultLogger).toBeDefined();
    expect(typeof defaultLogger.info).toBe('function');
    expect(typeof defaultLogger.error).toBe('function');
    expect(typeof defaultLogger.child).toBe('function');
  });
});
