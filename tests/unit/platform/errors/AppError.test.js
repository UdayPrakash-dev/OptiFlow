import { describe, it, expect } from 'vitest';
import { AppError } from '#platform/errors/AppError.js';

describe('AppError', () => {
  it('instantiates base AppError with default properties', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.isOperational).toBe(true);
  });

  it('provides simple static factory helpers', () => {
    const valErr = AppError.validation([{ field: 'email', message: 'Invalid' }]);
    expect(valErr.statusCode).toBe(422);
    expect(valErr.code).toBe('VALIDATION_ERROR');

    const unauthErr = AppError.unauthorized();
    expect(unauthErr.statusCode).toBe(401);

    const forbErr = AppError.forbidden();
    expect(forbErr.statusCode).toBe(403);

    const notFoundErr = AppError.notFound('Task', '123');
    expect(notFoundErr.statusCode).toBe(404);
    expect(notFoundErr.message).toContain("Task with ID '123' was not found");

    const conflictErr = AppError.conflict('Email exists');
    expect(conflictErr.statusCode).toBe(409);
  });
});
