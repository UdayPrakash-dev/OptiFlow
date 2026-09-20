import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '#platform/http/middleware/errorHandler.js';
import { AppError } from '#platform/errors/AppError.js';

function createMockReqRes() {
  const req = {
    method: 'POST',
    url: '/api/v1/tasks',
    headers: {},
    requestId: 'req-err-unit-test'
  };
  const res = {
    headersSent: false,
    statusCode: 200,
    status: vi.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((body) => {
      res.body = body;
      return res;
    })
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('Central Error Handler Middleware', () => {
  it('translates Prisma P2002 unique violation into 409 Conflict AppError', () => {
    const { req, res, next } = createMockReqRes();
    const prismaError = {
      code: 'P2002',
      meta: { target: ['email', 'companyId'] }
    };

    errorHandler(prismaError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.body.error.code).toBe('UNIQUE_CONSTRAINT_VIOLATION');
  });

  it('translates Prisma P2025 record not found into 404 NotFound AppError', () => {
    const { req, res, next } = createMockReqRes();
    const prismaError = {
      code: 'P2025',
      meta: { cause: 'Record not found' }
    };

    errorHandler(prismaError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('translates Prisma P2003 foreign key violation into 422 AppError', () => {
    const { req, res, next } = createMockReqRes();
    const prismaError = {
      code: 'P2003',
      meta: { field_name: 'projectId' }
    };

    errorHandler(prismaError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('catches AppError and responds with standard JSON error envelope', () => {
    const { req, res, next } = createMockReqRes();
    const appError = AppError.notFound('Task', 'task-123');

    errorHandler(appError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: "Task with ID 'task-123' was not found",
        details: { resource: 'Task', identifier: 'task-123' }
      },
      requestId: 'req-err-unit-test'
    });
  });

  it('catches malformed JSON syntax error and responds with 422', () => {
    const { req, res, next } = createMockReqRes();
    const syntaxError = new SyntaxError('Unexpected token in JSON');
    // @ts-ignore
    syntaxError.status = 400;
    // @ts-ignore
    syntaxError.body = '{ bad json';

    errorHandler(syntaxError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Validation failed');
  });

  it('delegates to next if headers were already sent', () => {
    const { req, res, next } = createMockReqRes();
    res.headersSent = true;
    const genericError = new Error('Late failure');

    errorHandler(genericError, req, res, next);

    expect(next).toHaveBeenCalledWith(genericError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
