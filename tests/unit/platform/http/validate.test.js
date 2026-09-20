import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '#platform/http/validate.js';
import { AppError } from '#platform/errors/AppError.js';

describe('Zod Request Validation Middleware (validate)', () => {
  const sampleSchema = {
    body: z.object({
      name: z.string().min(3, 'Name must be at least 3 chars'),
      email: z.string().email('Invalid email address')
    }),
    params: z.object({
      id: z.string().uuid('ID must be a valid UUID')
    }),
    query: z.object({
      page: z.coerce.number().int().positive().default(1)
    })
  };

  it('passes and cleans data on valid input', () => {
    const middleware = validate(sampleSchema);
    const req = {
      body: { name: 'Acme Corp', email: 'owner@acme.com', extraIgnored: 'extra' },
      params: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      query: { page: '2' }
    };
    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Acme Corp', email: 'owner@acme.com' });
    expect(req.params).toEqual({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' });
    expect(req.query).toEqual({ page: 2 });
  });

  it('fails with AppError validation (422) when fields violate schemas', () => {
    const middleware = validate(sampleSchema);
    const req = {
      body: { name: 'A', email: 'not-an-email' },
      params: { id: 'invalid-id' },
      query: {}
    };
    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details.length).toBe(3);

    const locations = error.details.map((d) => d.location);
    expect(locations).toContain('body');
    expect(locations).toContain('params');
  });

  it('proceeds normally if no schemas are specified', () => {
    const middleware = validate({});
    const req = { body: { anything: true } };
    const next = vi.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
