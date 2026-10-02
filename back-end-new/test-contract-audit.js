import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

function request(server, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('\n======================================================================');
  console.log('       FINAL API CONTRACT & ENDPOINT ALIAS AUDIT SUITE               ');
  console.log('======================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  const secret = env.JWT_SECRET || 'test-secret';

  // Load actual users from DB
  const liveUser = await prisma.user.findFirst({
    where: { isActive: true },
    include: { company: true },
  });

  const liveAdmin = await prisma.platformAdminUser.findFirst({
    where: { isActive: true },
  });

  const tenantToken = liveUser
    ? jwt.sign(
        { sub: liveUser.id, companyId: liveUser.companyId, email: liveUser.email },
        secret,
        { expiresIn: '1h' }
      )
    : null;

  const platformToken = liveAdmin
    ? jwt.sign(
        { sub: liveAdmin.id, role: 'platform_admin', type: 'platform_admin', email: liveAdmin.email },
        secret,
        { expiresIn: '1h' }
      )
    : null;

  const expiredToken = liveUser
    ? jwt.sign(
        { sub: liveUser.id, companyId: liveUser.companyId, email: liveUser.email },
        secret,
        { expiresIn: '-1s' }
      )
    : null;

  // 1. Health & Meta Endpoints
  console.log('--- 1. Health & Meta Endpoints & Aliases ---');
  let res = await request(server, 'GET', '/health');
  assert(res.status === 200 && res.body.success === true && res.body.data.status === 'healthy', 'GET /health returns healthy envelope');

  res = await request(server, 'GET', '/api/health');
  assert(res.status === 200 && res.body.success === true && res.body.data.status === 'healthy', 'GET /api/health returns healthy envelope');

  res = await request(server, 'GET', '/api');
  assert(res.status === 200 && res.body.success === true && res.body.data.name === 'OptiFlow API', 'GET /api returns central api status');

  res = await request(server, 'GET', '/api/status');
  assert(res.status === 200 && res.body.success === true && res.body.data.name === 'OptiFlow API', 'GET /api/status returns central api status');

  // 2. Error Envelopes & Formatting
  console.log('--- 2. Error Envelopes & Formatting ---');
  res = await request(server, 'GET', '/non-existent-route-endpoint');
  assert(
    res.status === 404 &&
    res.body.success === false &&
    res.body.statusCode === 404 &&
    typeof res.body.message === 'string' &&
    typeof res.body.timestamp === 'string',
    '404 returns standard error envelope with statusCode, message, and timestamp'
  );

  // 3. Authentication & JWT Validation
  console.log('--- 3. Authentication & Token Verification ---');
  res = await request(server, 'GET', '/auth/me');
  assert(res.status === 401 && res.body.success === false, 'GET /auth/me without token returns 401');

  res = await request(server, 'GET', '/api/auth/me');
  assert(res.status === 401 && res.body.success === false, 'GET /api/auth/me without token returns 401');

  if (expiredToken) {
    res = await request(server, 'GET', '/auth/me', { Authorization: `Bearer ${expiredToken}` });
    assert(res.status === 401 && res.body.message.includes('expired'), 'Expired token returns 401 with expired message');
  }

  if (tenantToken) {
    res = await request(server, 'GET', '/auth/me', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true && res.body.data.id === liveUser.id, 'GET /auth/me with valid token returns user identity');

    res = await request(server, 'GET', '/api/auth/me', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true && res.body.data.id === liveUser.id, 'GET /api/auth/me alias returns user identity');
  }

  // Password reset removal verification
  res = await request(server, 'POST', '/auth/forgot-password', {}, { email: 'user@example.com' });
  assert(res.status === 404, 'POST /auth/forgot-password is not exposed (returns 404)');

  res = await request(server, 'POST', '/auth/reset-password', {}, { token: 'sample-token', newPassword: 'NewPassword123!' });
  assert(res.status === 404, 'POST /auth/reset-password is not exposed (returns 404)');

  // 4. Boundary Protection (Tenant vs Platform Admin)
  console.log('--- 4. Domain Boundary Protection ---');
  if (tenantToken) {
    res = await request(server, 'GET', '/platform/metrics', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 403 && res.body.success === false, 'Tenant token cannot access /platform/metrics (403)');
  }

  if (platformToken) {
    res = await request(server, 'GET', '/auth/me', { Authorization: `Bearer ${platformToken}` });
    assert(res.status === 401 && res.body.success === false, 'Platform admin token cannot access tenant /auth/me (401)');
  }

  // 5. Header Spoofing Resistance
  console.log('--- 5. Security Header Spoofing Immunity ---');
  res = await request(server, 'GET', '/auth/me', {
    'x-user-id': 'spoofed-admin',
    'x-user-role': 'company_owner',
    'x-company-id': 'comp-victim',
  });
  assert(res.status === 401, 'Identity headers without JWT are rejected (401)');

  // 6. Public Plans & Aliases
  console.log('--- 6. Public Plans & Aliases ---');
  res = await request(server, 'GET', '/auth/public-plans');
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /auth/public-plans returns plan array');

  res = await request(server, 'GET', '/public/plans');
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /public/plans alias returns plan array');

  res = await request(server, 'GET', '/api/public/plans');
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /api/public/plans alias returns plan array');

  // 7. Branch & Department Aliases
  console.log('--- 7. Organization Branch & Department Aliases ---');
  if (tenantToken) {
    res = await request(server, 'GET', '/departments', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /departments alias works with tenant auth');

    res = await request(server, 'GET', '/api/departments', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /api/departments alias works with tenant auth');
  }

  // 8. Process Engine Aliases
  console.log('--- 8. Process Engine Route Aliases ---');
  if (tenantToken) {
    res = await request(server, 'GET', '/processes/templates', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /processes/templates alias works with tenant auth');

    res = await request(server, 'GET', '/api/process-templates', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /api/process-templates alias works with tenant auth');

    res = await request(server, 'GET', '/processes/instances', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /processes/instances alias works with tenant auth');

    res = await request(server, 'GET', '/api/process-instances', { Authorization: `Bearer ${tenantToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /api/process-instances alias works with tenant auth');
  }

  // 9. Platform Admin Aliases
  console.log('--- 9. Platform Admin Route Aliases ---');
  if (platformToken) {
    res = await request(server, 'GET', '/platform/admin-users', { Authorization: `Bearer ${platformToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /platform/admin-users works with platform token');

    res = await request(server, 'GET', '/api/platform/admin-users', { Authorization: `Bearer ${platformToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /api/platform/admin-users works with platform token');

    res = await request(server, 'GET', '/api/platform-admin-users', { Authorization: `Bearer ${platformToken}` });
    assert(res.status === 200 && res.body.success === true, 'GET /api/platform-admin-users works with platform token');
  }

  server.close();

  console.log(`\nContract Audit Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAudit()
  .catch((err) => {
    console.error('Audit execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
