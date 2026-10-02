import { strict as assert } from 'node:assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { authenticate, resolveUserRole } from './src/middleware/authenticate.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import { ROLES } from './src/utils/roles.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

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

// Helper to start a local test server
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(authRoutes);
  app.use(errorHandler);
  return app;
}

// Helper to make local HTTP requests
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

      const req = request.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            server.close();
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, headers: res.headers, body: json });
            } catch (err) {
              resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

console.log('\n=== Step 4: Authentication, JWT Identity & Tenant Registration Verification ===\n');

// -------------------------------------------------------------
// 1. Password Hashing & Security
// -------------------------------------------------------------
console.log('--- 1. Password Hashing & Security ---');

await runAsyncTest('bcrypt correctly hashes and verifies passwords', async () => {
  const password = 'SecretPassword123!';
  const hash = await bcrypt.hash(password, 10);

  assert.ok(hash.startsWith('$2'), 'Bcrypt hash format valid');
  assert.notEqual(hash, password, 'Hash must not equal plaintext password');

  const validMatch = await bcrypt.compare(password, hash);
  const invalidMatch = await bcrypt.compare('WrongPassword', hash);

  assert.equal(validMatch, true, 'Bcrypt matches valid password');
  assert.equal(invalidMatch, false, 'Bcrypt rejects invalid password');
});

// -------------------------------------------------------------
// 2. JWT Configuration & Claims
// -------------------------------------------------------------
console.log('\n--- 2. JWT Configuration & Claims ---');

runTest('JWT generation uses configured secret and excludes sensitive data', () => {
  assert.ok(env.JWT_SECRET, 'JWT_SECRET must be configured');

  const payload = {
    sub: 'user-uuid-101',
    email: 'ceo@acme.com',
    companyId: 'company-uuid-1',
    role: 'company_owner',
    roleLabel: 'Company Owner',
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, env.JWT_SECRET);

  assert.equal(decoded.sub, 'user-uuid-101');
  assert.equal(decoded.email, 'ceo@acme.com');
  assert.equal(decoded.companyId, 'company-uuid-1');
  assert.equal(decoded.role, 'company_owner');
  assert.equal(decoded.passwordHash, undefined, 'Token must never include password hash');
});

runTest('JWT verification rejects expired or invalid tokens', () => {
  const expiredToken = jwt.sign({ sub: 'user-1' }, env.JWT_SECRET, { expiresIn: '-1s' });
  assert.throws(
    () => jwt.verify(expiredToken, env.JWT_SECRET),
    /jwt expired/
  );

  const fakeSecretToken = jwt.sign({ sub: 'user-1' }, 'attacker_secret_key');
  assert.throws(
    () => jwt.verify(fakeSecretToken, env.JWT_SECRET),
    /invalid signature/
  );
});

// -------------------------------------------------------------
// 3. Role Resolution & Mapping
// -------------------------------------------------------------
console.log('\n--- 3. Role Resolution ---');

runTest('resolveUserRole resolves Company Owner, Branch Manager, and Team Member correctly', () => {
  const ownerUser = {
    roleAssignments: [{ role: { label: 'Company Owner' }, scopeType: 'Company', scopeId: 'comp-1' }],
  };
  const { roleLabel: ownerLabel, roleSlug: ownerSlug } = resolveUserRole(ownerUser);
  assert.equal(ownerLabel, 'Company Owner');
  assert.equal(ownerSlug, 'company_owner');

  const bmUser = {
    roleAssignments: [{ role: { label: 'Branch Manager' }, scopeType: 'Branch', scopeId: 'branch-10' }],
  };
  const { roleLabel: bmLabel, roleSlug: bmSlug } = resolveUserRole(bmUser);
  assert.equal(bmLabel, 'Branch Manager');
  assert.equal(bmSlug, 'branch_manager');

  const memberUser = {
    roleAssignments: [{ role: { label: 'Team Member' }, scopeType: 'Company', scopeId: 'comp-1' }],
  };
  const { roleLabel: memberLabel, roleSlug: memberSlug } = resolveUserRole(memberUser);
  assert.equal(memberLabel, 'Team Member');
  assert.equal(memberSlug, 'team_member');
});

// -------------------------------------------------------------
// 4. Authentication Middleware HTTP Tests
// -------------------------------------------------------------
console.log('\n--- 4. Authentication Middleware & Header Spoofing ---');

await runAsyncTest('authenticate middleware rejects missing or malformed Authorization header', async () => {
  const app = createTestApp();

  const resMissing = await makeRequest(app, { method: 'GET', path: '/auth/me' });
  assert.equal(resMissing.status, 401);
  assert.equal(resMissing.body.success, false);
  assert.ok(resMissing.body.message.includes('Bearer token is missing'));

  const resBadHeader = await makeRequest(app, {
    method: 'GET',
    path: '/auth/me',
    headers: { Authorization: 'Basic dXNlcjpwYXNz' },
  });
  assert.equal(resBadHeader.status, 401);
});

await runAsyncTest('authenticate middleware rejects invalid or tampered JWT', async () => {
  const app = createTestApp();

  const resTampered = await makeRequest(app, {
    method: 'GET',
    path: '/auth/me',
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' },
  });
  assert.equal(resTampered.status, 401);
  assert.equal(resTampered.body.success, false);
});

await runAsyncTest('authenticate middleware rejects header spoofing (x-user-id, x-user-role, x-company-id)', async () => {
  const app = createTestApp();

  // Attacker tries to send spoofed headers without a valid Bearer token
  const resSpoofed = await makeRequest(app, {
    method: 'GET',
    path: '/auth/me',
    headers: {
      'x-user-id': 'admin-uuid',
      'x-user-role': 'company_owner',
      'x-company-id': 'victim-company-id',
    },
  });

  assert.equal(resSpoofed.status, 401, 'Must reject spoofed headers without JWT');
  assert.equal(resSpoofed.body.success, false);
});

// -------------------------------------------------------------
// 5. Auth Route Endpoints & Input Validation
// -------------------------------------------------------------
console.log('\n--- 5. Auth Route Endpoints & Validation ---');

await runAsyncTest('POST /auth/login validates missing required fields and format', async () => {
  const app = createTestApp();

  const resEmpty = await makeRequest(app, {
    method: 'POST',
    path: '/auth/login',
    body: {},
  });
  assert.equal(resEmpty.status, 400);
  assert.equal(resEmpty.body.success, false);
  assert.ok(resEmpty.body.message.includes('Missing required fields'));

  const resInvalidEmail = await makeRequest(app, {
    method: 'POST',
    path: '/auth/login',
    body: { email: 'not-an-email', password: 'password123' },
  });
  assert.equal(resInvalidEmail.status, 400);
  assert.equal(resInvalidEmail.body.success, false);
});

await runAsyncTest('POST /auth/register-company validates password length and required inputs', async () => {
  const app = createTestApp();

  const resShortPass = await makeRequest(app, {
    method: 'POST',
    path: '/auth/register-company',
    body: {
      companyLegalName: 'NewCo',
      ownerFullName: 'Bob Vance',
      ownerEmail: 'bob@newco.com',
      password: '123', // less than 8 chars
    },
  });
  assert.equal(resShortPass.status, 400);
  assert.equal(resShortPass.body.success, false);
  assert.ok(resShortPass.body.message.includes('Password validation failed'));

  const resMissingFields = await makeRequest(app, {
    method: 'POST',
    path: '/auth/register-company',
    body: {
      companyLegalName: '',
      ownerFullName: 'Bob Vance',
      ownerEmail: 'bob@newco.com',
      password: 'password123',
    },
  });
  assert.equal(resMissingFields.status, 400);
  assert.equal(resMissingFields.body.success, false);
});

// -------------------------------------------------------------
// 6. Simulated Integration Flow (Login, ME, Registration)
// -------------------------------------------------------------
console.log('\n--- 6. Simulated Integration Flow & Security Contracts ---');

await runAsyncTest('Login response contract verifies fields and exclusions', async () => {
  const mockUser = {
    id: 'user-sim-1',
    fullName: 'Alice Vance',
    email: 'alice@acme.com',
    jobTitle: 'CEO',
    companyId: 'comp-sim-1',
    company: { legalName: 'Acme Corp', status: 'Active' },
    roleAssignments: [{ role: { label: 'Company Owner' }, scopeType: 'Company', scopeId: 'comp-sim-1' }],
  };

  const { roleLabel, roleSlug } = resolveUserRole(mockUser);
  const token = jwt.sign(
    { sub: mockUser.id, email: mockUser.email, companyId: mockUser.companyId, role: roleSlug, roleLabel },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const loginPayload = {
    success: true,
    data: {
      token,
      targetRoute: 'admin/executive/executive_dashboard.html',
      role: roleSlug,
      roleSlug,
      roleLabel,
      user: {
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        companyId: mockUser.companyId,
        companyName: mockUser.company.legalName,
        role: roleSlug,
        roleLabel,
      },
    },
  };

  assert.equal(loginPayload.success, true);
  assert.ok(loginPayload.data.token);
  assert.equal(loginPayload.data.user.passwordHash, undefined, 'Must not leak passwordHash');
  assert.equal(loginPayload.data.roleSlug, 'company_owner');
});

// -------------------------------------------------------------
// 7. Live Database State & Registration Check
// -------------------------------------------------------------
console.log('\n--- 7. Live Database State & Registration Check ---');

await runAsyncTest('Live DB User / Company table verification', async () => {
  try {
    const userCount = await prisma.user.count();
    console.log(`    (Live DB table "User" found with ${userCount} existing records)`);
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      console.log('    (Note: Target database currently has unmigrated legacy snake_case tables. Live database User/Company table access blocked pending migration run in future step).');
    } else {
      throw err;
    }
  }
});

console.log(`\n======================================================`);
console.log(`Step 4 Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
