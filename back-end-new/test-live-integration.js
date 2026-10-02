import { strict as assert } from 'node:assert';
import { prisma } from './src/config/prisma.js';
import { createApp } from './src/app.js';
import http from 'http';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env.js';

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

async function runLiveIntegrationTests() {
  console.log('======================================================================');
  console.log('          LIVE NEON POSTGRESQL END-TO-END INTEGRATION TESTS           ');
  console.log('======================================================================\n');

  const app = createApp();

  try {
    // 1. Live Public Plans Endpoint against real DB
    await runAsyncTest('Live DB: GET /auth/public-plans queries real plans from PostgreSQL', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/auth/public-plans',
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 1);
      console.log(`    (Live plans retrieved: ${res.body.data.map(p => p.name).join(', ')})`);
    });

    // 2. Fetch live user record and test authenticated /auth/me
    const liveUser = await prisma.user.findFirst({
      include: {
        company: true,
        roleAssignments: { include: { role: true } },
      },
    });

    if (liveUser) {
      const liveToken = jwt.sign(
        { sub: liveUser.id, companyId: liveUser.companyId, email: liveUser.email },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await runAsyncTest('Live DB: GET /auth/me loads actual user and company from PostgreSQL', async () => {
        const res = await makeRequest(app, {
          method: 'GET',
          path: '/auth/me',
          headers: { Authorization: `Bearer ${liveToken}` },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.user.id, liveUser.id);
        assert.equal(res.body.data.user.email, liveUser.email);
        console.log(`    (Authenticated user: ${liveUser.fullName} (${liveUser.email}) @ ${res.body.data.user.companyName || liveUser.company?.legalName})`);
      });

      await runAsyncTest('Live DB: GET /projects queries real company projects with tenant isolation', async () => {
        const res = await makeRequest(app, {
          method: 'GET',
          path: '/projects',
          headers: { Authorization: `Bearer ${liveToken}` },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
      });

      await runAsyncTest('Live DB: GET /compliance-rules queries real compliance rules', async () => {
        const res = await makeRequest(app, {
          method: 'GET',
          path: '/compliance-rules',
          headers: { Authorization: `Bearer ${liveToken}` },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        console.log(`    (Compliance rules found in DB: ${res.body.data.length})`);
      });

      await runAsyncTest('Live DB: GET /process-templates queries real process templates with tenant scoping', async () => {
        const res = await makeRequest(app, {
          method: 'GET',
          path: '/process-templates',
          headers: { Authorization: `Bearer ${liveToken}` },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        console.log(`    (Process templates found in DB: ${res.body.data.length})`);
      });

      await runAsyncTest('Live DB: GET /evidence queries real compliance evidence with tenant scoping', async () => {
        const res = await makeRequest(app, {
          method: 'GET',
          path: '/evidence',
          headers: { Authorization: `Bearer ${liveToken}` },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        console.log(`    (Compliance evidence items found in DB: ${res.body.data.length})`);
      });
    }

    // 3. Platform Admin Live Verification
    const liveAdmin = await prisma.platformAdminUser.findFirst();
    if (liveAdmin) {
      const livePlatformToken = jwt.sign(
        { sub: liveAdmin.id, email: liveAdmin.email, role: 'platform_admin', type: 'platform_admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await runAsyncTest('Live DB: GET /platform/metrics calculates live aggregate statistics', async () => {
        const res = await makeRequest(app, {
          method: 'GET',
          path: '/platform/metrics',
          headers: { Authorization: `Bearer ${livePlatformToken}` },
        });
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(typeof res.body.data.totalCompanies === 'number');
        assert.ok(typeof res.body.data.totalAdmins === 'number');
        console.log(`    (Live SaaS metrics: ${res.body.data.totalCompanies} companies, ${res.body.data.totalAdmins} platform admins)`);
      });
    }

  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nLive Integration Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runLiveIntegrationTests();
