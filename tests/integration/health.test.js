import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Health & Application Bootstrap Endpoints', () => {
  const app = createApp();

  it('GET /healthz returns 200 with healthy status and x-request-id', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('healthy');
    expect(typeof response.body.data.uptime).toBe('number');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('GET /readyz returns 200 readiness status', async () => {
    const response = await request(app).get('/readyz');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ready');
  });

  it('GET /api/v1 returns API banner metadata', async () => {
    const response = await request(app).get('/api/v1');

    expect(response.status).toBe(200);
    expect(response.body.data.service).toBe('OptiFlow API');
    expect(response.body.data.version).toBe('1.0.0');
  });

  it('unmapped routes return structured 404 error envelope', async () => {
    const response = await request(app).get('/api/v1/non-existent-endpoint');

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.requestId).toBeDefined();
  });

  it('attaches Helmet security headers', async () => {
    const response = await request(app).get('/healthz');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
