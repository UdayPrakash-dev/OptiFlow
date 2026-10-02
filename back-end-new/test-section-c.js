import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { ROLES } from './src/utils/roles.js';

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

async function runSectionCTests() {
  console.log('\n======================================================================');
  console.log('       SECTION C: ADVANCED WORKFLOWS, METRICS & RBAC VERIFICATION     ');
  console.log('======================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  const secret = env.JWT_SECRET || 'test-secret';

  // Setup mock user findUnique to provide explicit Company Owner and Platform Admin identities
  const originalUserFindUnique = prisma.user.findUnique;
  const originalPlatformAdminFindUnique = prisma.platformAdminUser.findUnique;

  prisma.user.findUnique = async ({ where }) => {
    if (where.id === 'test-owner-c') {
      return {
        id: 'test-owner-c',
        companyId: 'comp-sec-c',
        email: 'owner@sec-c.com',
        fullName: 'Section C Owner',
        isActive: true,
        company: { id: 'comp-sec-c', legalName: 'Section C Corp', status: 'Active' },
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    return originalUserFindUnique.call(prisma.user, { where });
  };

  prisma.platformAdminUser.findUnique = async ({ where }) => {
    if (where.id === 'test-platform-admin-c') {
      return {
        id: 'test-platform-admin-c',
        email: 'admin@platform-c.com',
        fullName: 'Section C SuperAdmin',
        isActive: true,
      };
    }
    return originalPlatformAdminFindUnique.call(prisma.platformAdminUser, { where });
  };

  const ownerToken = jwt.sign(
    { sub: 'test-owner-c', companyId: 'comp-sec-c', email: 'owner@sec-c.com' },
    secret,
    { expiresIn: '1h' }
  );

  const platformToken = jwt.sign(
    { sub: 'test-platform-admin-c', role: 'platform_admin', type: 'platform_admin', email: 'admin@platform-c.com' },
    secret,
    { expiresIn: '1h' }
  );

  // 1. Executive Branches & Metrics
  console.log('--- 1. Executive Branches & KPI Metrics ---');
  let res = await request(server, 'GET', '/executive/branches', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /executive/branches returns company branches');

  res = await request(server, 'GET', '/executive/metrics', { Authorization: `Bearer ${ownerToken}` });
  assert(
    res.status === 200 &&
    res.body.success === true &&
    typeof res.body.data.totalUsers === 'number' &&
    typeof res.body.data.completionRate === 'number',
    'GET /executive/metrics calculates company KPI metrics & completion rate'
  );

  res = await request(server, 'GET', '/metrics', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true, 'GET /metrics alias resolves correctly');

  // 2. Attachments Management
  console.log('--- 2. Attachments Management ---');
  res = await request(server, 'GET', '/attachments', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /attachments returns company attachments array');

  // 3. Compliance Categories & Bindings
  console.log('--- 3. Compliance Categories & Bindings ---');
  res = await request(server, 'GET', '/compliance-categories', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /compliance-categories returns categories array');

  res = await request(server, 'GET', '/compliance-bindings', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /compliance-bindings returns bindings array');

  // 4. Platform Support Access
  console.log('--- 4. Platform Support Access Management ---');
  res = await request(server, 'GET', '/platform/support-access', { Authorization: `Bearer ${platformToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /platform/support-access returns access records');

  // 5. Permissions, Role Templates, Role Assignments
  console.log('--- 5. RBAC Permissions, Templates & Assignments ---');
  res = await request(server, 'GET', '/permissions', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /permissions returns system permissions');

  res = await request(server, 'GET', '/role-templates', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /role-templates returns predefined role templates');

  res = await request(server, 'GET', '/role-assignments', { Authorization: `Bearer ${ownerToken}` });
  assert(res.status === 200 && res.body.success === true && Array.isArray(res.body.data), 'GET /role-assignments returns company assignments');

  // 6. Bootstrap Aggregator
  console.log('--- 6. Bootstrap State Aggregator ---');
  res = await request(server, 'GET', '/bootstrap', { Authorization: `Bearer ${ownerToken}` });
  assert(
    res.status === 200 &&
    res.body.success === true &&
    res.body.data.currentUser &&
    Array.isArray(res.body.data.branches) &&
    Array.isArray(res.body.data.teams),
    'GET /bootstrap returns consolidated user, company, branches, and teams state'
  );

  // Restore mocks
  prisma.user.findUnique = originalUserFindUnique;
  prisma.platformAdminUser.findUnique = originalPlatformAdminFindUnique;

  server.close();

  console.log(`\nSection C Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSectionCTests()
  .catch((err) => {
    console.error('Section C execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
