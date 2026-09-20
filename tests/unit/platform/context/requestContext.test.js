import { describe, it, expect, vi } from 'vitest';
import {
  runWithContext,
  getContext,
  getRequestId,
  getTenantId,
  getActor
} from '#platform/context/requestContext.js';
import { requestIdMiddleware } from '#platform/http/middleware/requestId.js';

describe('Request Context (AsyncLocalStorage)', () => {
  it('propagates context across asynchronous execution chains', async () => {
    const contextData = {
      requestId: 'req-test-123',
      companyId: 'company-abc-456',
      actor: { id: 'user-789', role: 'admin' }
    };

    await runWithContext(contextData, async () => {
      // Simulate async boundary
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(getContext()).toEqual(contextData);
      expect(getRequestId()).toBe('req-test-123');
      expect(getTenantId()).toBe('company-abc-456');
      expect(getActor()).toEqual({ id: 'user-789', role: 'admin' });
    });

    // Outside the context, getters return default/undefined
    expect(getContext()).toBeUndefined();
    expect(getRequestId()).toBe('req_untracked');
    expect(getTenantId()).toBeUndefined();
    expect(getActor()).toBeUndefined();
  });

  it('keeps concurrent async requests isolated from each other', async () => {
    const request1 = runWithContext({ requestId: 'req-1', companyId: 'tenant-1' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { id: getRequestId(), tenant: getTenantId() };
    });

    const request2 = runWithContext({ requestId: 'req-2', companyId: 'tenant-2' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { id: getRequestId(), tenant: getTenantId() };
    });

    const [res1, res2] = await Promise.all([request1, request2]);

    expect(res1).toEqual({ id: 'req-1', tenant: 'tenant-1' });
    expect(res2).toEqual({ id: 'req-2', tenant: 'tenant-2' });
  });

  it('middleware creates new UUID if X-Request-Id header is absent', () => {
    const req = { headers: {} };
    const res = { setHeader: vi.fn() };
    let capturedRequestId;

    requestIdMiddleware(req, res, () => {
      capturedRequestId = getRequestId();
    });

    expect(req.requestId).toBeDefined();
    expect(typeof req.requestId).toBe('string');
    expect(req.requestId.length).toBeGreaterThan(10);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    expect(capturedRequestId).toBe(req.requestId);
  });

  it('middleware adopts valid client-provided X-Request-Id header', () => {
    const req = { headers: { 'x-request-id': 'client-custom-id-999' } };
    const res = { setHeader: vi.fn() };
    let capturedRequestId;

    requestIdMiddleware(req, res, () => {
      capturedRequestId = getRequestId();
    });

    expect(req.requestId).toBe('client-custom-id-999');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'client-custom-id-999');
    expect(capturedRequestId).toBe('client-custom-id-999');
  });
});
