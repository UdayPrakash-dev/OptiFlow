import { strict as assert } from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import platformRoutes from './src/routes/platform.routes.js';
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

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(authRoutes);
  app.use(platformRoutes);
  app.use(errorHandler);
  return app;
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

function createPlatformToken(payload) {
  return jwt.sign(
    { ...payload, role: 'platform_admin', type: 'platform_admin' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function createTenantToken(payload) {
  return jwt.sign(
    { ...payload, role: ROLES.COMPANY_OWNER },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function main() {
  console.log('\n--- Running Step 9 Tests: Platform-Admin Authentication & CRUD ---');
  const app = createTestApp();

  const originalPlatformAdminFindUnique = prisma.platformAdminUser.findUnique;
  const originalPlatformAdminFindMany = prisma.platformAdminUser.findMany;
  const originalPlatformAdminCreate = prisma.platformAdminUser.create;
  const originalPlatformAdminUpdate = prisma.platformAdminUser.update;
  const originalPlatformAdminCount = prisma.platformAdminUser.count;
  const originalCompanyCount = prisma.company.count;
  const originalCompanyFindMany = prisma.company.findMany;
  const originalSubscriptionGroupBy = prisma.subscription.groupBy;
  const originalPlanFindMany = prisma.plan.findMany;
  const originalPlanCreate = prisma.plan.create;
  const originalPlatformSupportAccessFindMany = prisma.platformSupportAccess.findMany;

  const validPassword = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(validPassword, 10);

  const platformAdminMock = {
    id: 'admin-1',
    email: 'platform@optiflow.com',
    fullName: 'Global Platform Admin',
    passwordHash: hashedPassword,
    isActive: true,
    createdAt: new Date(),
  };

  prisma.platformAdminUser.findUnique = async ({ where }) => {
    if (where.id === 'admin-1' || where.email === 'platform@optiflow.com') {
      return platformAdminMock;
    }
    if (where.id === 'admin-inactive' || where.email === 'inactive@optiflow.com') {
      return { ...platformAdminMock, id: 'admin-inactive', email: 'inactive@optiflow.com', isActive: false };
    }
    return null;
  };

  const platformToken = createPlatformToken({
    sub: 'admin-1',
    email: 'platform@optiflow.com',
  });

  const tenantToken = createTenantToken({
    sub: 'tenant-user-1',
    companyId: 'comp-1',
  });

  try {
    // 1. Platform login success
    await runAsyncTest('Platform admin login succeeds with correct credentials and returns JWT', async () => {
      const res = await makeRequest(app, {
        method: 'POST',
        path: '/platform/auth/login',
        body: {
          email: 'platform@optiflow.com',
          password: validPassword,
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.adminUser.email, 'platform@optiflow.com');
      assert.equal(res.body.data.adminUser.passwordHash, undefined); // Password excluded
    });

    // 2. Platform login failure with invalid password
    await runAsyncTest('Platform admin login rejects invalid password', async () => {
      const res = await makeRequest(app, {
        method: 'POST',
        path: '/platform/auth/login',
        body: {
          email: 'platform@optiflow.com',
          password: 'WrongPassword!',
        },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // 3. Platform login failure with inactive admin
    await runAsyncTest('Platform admin login rejects inactive admin account', async () => {
      const res = await makeRequest(app, {
        method: 'POST',
        path: '/platform/auth/login',
        body: {
          email: 'inactive@optiflow.com',
          password: validPassword,
        },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // 4. Tenant token rejected on platform routes
    await runAsyncTest('Rejects tenant user token on platform protected routes', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/platform/metrics',
        headers: { Authorization: `Bearer ${tenantToken}` },
      });
      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    // 5. Platform metrics retrieval
    await runAsyncTest('Retrieves platform metrics for authorized platform admin', async () => {
      prisma.company.count = async () => 5;
      prisma.platformAdminUser.count = async () => 2;
      prisma.subscription.groupBy = async () => [];
      prisma.plan.findMany = async () => [{ id: 'p-1', name: 'Starter' }];
      prisma.platformSupportAccess.findMany = async () => [];
      prisma.company.findMany = async () => [];

      const res = await makeRequest(app, {
        method: 'GET',
        path: '/platform/metrics',
        headers: { Authorization: `Bearer ${platformToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.totalCompanies, 5);
    });

    // 6. Plan creation with validation
    await runAsyncTest('Creates plan with platform admin token', async () => {
      prisma.plan.create = async ({ data }) => ({
        id: 'plan-enterprise',
        ...data,
      });

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/platform/plans',
        headers: { Authorization: `Bearer ${platformToken}` },
        body: {
          name: 'Enterprise Ultra',
          maxBranches: 50,
          maxUsers: 500,
          auditLogRetentionDays: 365,
          allowsIntegrations: true,
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'plan-enterprise');
      assert.equal(res.body.data.name, 'Enterprise Ultra');
    });

    // 7. Prevent deactivating the last active platform admin
    await runAsyncTest('Prevents deactivating the last active platform admin', async () => {
      prisma.platformAdminUser.count = async ({ where }) => {
        if (where.isActive === true) return 1;
        return 0;
      };

      const res = await makeRequest(app, {
        method: 'PATCH',
        path: '/platform/admin-users/admin-1',
        headers: { Authorization: `Bearer ${platformToken}` },
        body: {
          isActive: false,
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

  } finally {
    prisma.platformAdminUser.findUnique = originalPlatformAdminFindUnique;
    prisma.platformAdminUser.findMany = originalPlatformAdminFindMany;
    prisma.platformAdminUser.create = originalPlatformAdminCreate;
    prisma.platformAdminUser.update = originalPlatformAdminUpdate;
    prisma.platformAdminUser.count = originalPlatformAdminCount;
    prisma.company.count = originalCompanyCount;
    prisma.company.findMany = originalCompanyFindMany;
    prisma.subscription.groupBy = originalSubscriptionGroupBy;
    prisma.plan.findMany = originalPlanFindMany;
    prisma.plan.create = originalPlanCreate;
    prisma.platformSupportAccess.findMany = originalPlatformSupportAccessFindMany;
  }

  console.log(`\nStep 9 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error in Step 9:', err);
  process.exit(1);
});
