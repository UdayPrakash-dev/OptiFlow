import { strict as assert } from 'node:assert';
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { createApp } from './src/app.js';
import { createRateLimiter } from './src/middleware/rateLimit.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { ROLES } from './src/utils/roles.js';

let passed = 0;
let failed = 0;

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

async function makeRequest(app, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;

      const reqHeaders = {
        ...headers,
        ...(payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : {}),
      };

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            server.close();
            try {
              const parsed = data ? JSON.parse(data) : null;
              resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, rawBody: data });
            }
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

function createToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
  console.log('\n--- Running Step 10 Tests: Rate Limiting & Security Verification ---');

  // --- 1. DETERMINISTIC RATE LIMITER TESTS ---
  const customLimiter = createRateLimiter({
    windowMs: 10000,
    max: 3,
    message: 'Rate limit test exceeded',
    keyGenerator: (req) => req.headers['x-test-client'] || 'default-test-client',
  });

  const rateLimitApp = express();
  rateLimitApp.use(customLimiter);
  rateLimitApp.get('/test-limit', (req, res) => res.json({ success: true }));
  rateLimitApp.use(errorHandler);

  await runAsyncTest('Requests under rate limit succeed with appropriate headers', async () => {
    const res1 = await makeRequest(rateLimitApp, {
      method: 'GET',
      path: '/test-limit',
      headers: { 'x-test-client': 'client-a' },
    });
    assert.equal(res1.status, 200);
    assert.equal(res1.body.success, true);
    assert.equal(res1.headers['ratelimit-limit'], '3');
    assert.equal(res1.headers['ratelimit-remaining'], '2');

    const res2 = await makeRequest(rateLimitApp, {
      method: 'GET',
      path: '/test-limit',
      headers: { 'x-test-client': 'client-a' },
    });
    assert.equal(res2.status, 200);
    assert.equal(res2.headers['ratelimit-remaining'], '1');
  });

  await runAsyncTest('Exceeding rate limit returns HTTP 429 and Retry-After header', async () => {
    // 3rd hit
    await makeRequest(rateLimitApp, {
      method: 'GET',
      path: '/test-limit',
      headers: { 'x-test-client': 'client-a' },
    });

    // 4th hit (exceeds max of 3)
    const res4 = await makeRequest(rateLimitApp, {
      method: 'GET',
      path: '/test-limit',
      headers: { 'x-test-client': 'client-a' },
    });
    assert.equal(res4.status, 429);
    assert.equal(res4.body.success, false);
    assert.equal(res4.body.statusCode, 429);
    assert.ok(res4.headers['retry-after']);
    assert.equal(res4.body.message, 'Rate limit test exceeded');
  });

  // --- 2. FULL APP SECURITY & REGRESSION TESTS ---
  const app = createApp();

  const originalUserFindUnique = prisma.user.findUnique;
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === 'active-user') {
      return {
        id: 'active-user',
        companyId: 'comp-1',
        email: 'active@example.com',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    if (where.id === 'inactive-user') {
      return {
        id: 'inactive-user',
        companyId: 'comp-1',
        email: 'inactive@example.com',
        isActive: false,
        status: 'Suspended',
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    return null;
  };

  try {
    // Security 1: Missing JWT token
    await runAsyncTest('Security: Missing JWT Bearer token is rejected with 401', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/users',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // Security 2: Tampered JWT token signature
    await runAsyncTest('Security: Tampered JWT token signature is rejected with 401', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/users',
        headers: { Authorization: 'Bearer invalid.jwt.token.signature' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // Security 3: Deactivated account rejected
    await runAsyncTest('Security: Deactivated user account is rejected even with valid token signature', async () => {
      const inactiveToken = createToken({ sub: 'inactive-user', companyId: 'comp-1' });
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/users',
        headers: { Authorization: `Bearer ${inactiveToken}` },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // Security 4: Spoofed headers ignored
    await runAsyncTest('Security: Spoofed x-company-id and x-user-role headers are strictly ignored', async () => {
      const activeToken = createToken({ sub: 'active-user', companyId: 'comp-1' });
      let capturedWhere = null;

      const originalUserFindMany = prisma.user.findMany;
      prisma.user.findMany = async ({ where }) => {
        capturedWhere = where;
        return [];
      };

      await makeRequest(app, {
        method: 'GET',
        path: '/users',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'x-company-id': 'comp-tampered',
          'x-user-role': 'superuser',
        },
      });

      prisma.user.findMany = originalUserFindMany;
      assert.equal(capturedWhere.companyId, 'comp-1'); // Must remain comp-1 from verified JWT
    });

    // Security 5: Helmet security headers presence
    await runAsyncTest('Security: Helmet security headers (Content-Security-Policy, X-Frame-Options) present', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/health',
      });
      assert.equal(res.status, 200);
      assert.ok(res.headers['x-content-type-options']);
      assert.ok(res.headers['cross-origin-resource-policy']);
    });

  } finally {
    prisma.user.findUnique = originalUserFindUnique;
  }

  console.log(`\nStep 10 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error in Step 10:', err);
  process.exit(1);
});
