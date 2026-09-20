import { describe, it, expect, vi } from 'vitest';
import {
  respondSuccess,
  respondCreated,
  respondNoContent,
  respondError
} from '#platform/http/respond.js';
import { AppError } from '#platform/errors/AppError.js';

function createMockResponse() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res;
}

describe('HTTP Unified Response Envelopes', () => {
  it('formats standard success response with { data, meta }', () => {
    const res = createMockResponse();
    const payload = [{ id: 1, name: 'Main Branch' }];
    const meta = { total: 1, page: 1 };

    respondSuccess(res, payload, meta);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: payload,
      meta
    });
  });

  it('formats created response with 201 status code', () => {
    const res = createMockResponse();
    const createdItem = { id: 'task-1', title: 'Code Review' };

    respondCreated(res, createdItem);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: createdItem,
      meta: {}
    });
  });

  it('formats no content response with 204 status code', () => {
    const res = createMockResponse();

    respondNoContent(res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('formats AppError into standardized error envelope', () => {
    const res = createMockResponse();
    const error = AppError.notFound('Company', 'comp-999');

    respondError(res, error, 'req-trace-001');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: "Company with ID 'comp-999' was not found",
        details: { resource: 'Company', identifier: 'comp-999' }
      },
      requestId: 'req-trace-001'
    });
  });

  it('formats validation errors with field details', () => {
    const res = createMockResponse();
    const fieldErrors = [{ field: 'name', message: 'Name is required' }];
    const error = AppError.validation(fieldErrors, 'Invalid company payload');

    respondError(res, error);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid company payload',
        details: fieldErrors
      }
    });
  });

  it('handles generic internal errors with 500 status', () => {
    const res = createMockResponse();
    const genericError = new Error('Database connection dropped');

    respondError(res, genericError, 'req-err-500');

    expect(res.status).toHaveBeenCalledWith(500);
    const sentJson = res.json.mock.calls[0][0];
    expect(sentJson.error.code).toBe('INTERNAL_ERROR');
    expect(sentJson.requestId).toBe('req-err-500');
  });
});
