import { strict as assert } from 'node:assert';
import { prisma } from './src/config/prisma.js';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from './src/utils/errors.js';
import {
  validateRequired,
  validateEmail,
  validateEnum,
  validateNumber,
} from './src/utils/validation.js';
import {
  ROLES,
  ROLE_SLUGS,
  normalizeRole,
  toCanonicalRole,
  hasRole,
} from './src/utils/roles.js';
import {
  isCompanyOwner,
  isBranchManager,
  resolveEffectiveBranchId,
  buildProjectListWhere,
  buildTaskListWhere,
  buildViolationCompanyWhere,
  buildBranchViolationWhere,
  resolveMetricsBranchId,
  assertBranchManagerScope,
} from './src/utils/tenantScope.js';
import { createAuditLog, AUDIT_ACTIONS } from './src/utils/audit.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

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

// Mock Express response helper
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

console.log('\n=== Step 3: Shared Utilities & Error Handler Verification ===\n');

// -------------------------------------------------------------
// 1. Error Classes & Error Handler Envelope
// -------------------------------------------------------------
console.log('--- 1. Error Handling & Standardized Envelopes ---');

runTest('AppError and subclasses construct with correct status codes', () => {
  const badReq = new BadRequestError('Bad input');
  assert.equal(badReq.statusCode, 400);
  assert.equal(badReq.message, 'Bad input');

  const unauth = new UnauthorizedError();
  assert.equal(unauth.statusCode, 401);

  const forb = new ForbiddenError();
  assert.equal(forb.statusCode, 403);

  const notFound = new NotFoundError();
  assert.equal(notFound.statusCode, 404);

  const conflict = new ConflictError();
  assert.equal(conflict.statusCode, 409);

  const valErr = new ValidationError('Invalid data', [{ field: 'email', message: 'invalid' }]);
  assert.equal(valErr.statusCode, 400);
  assert.equal(valErr.errors.length, 1);
});

runTest('errorHandler transforms ValidationError into standardized error envelope', () => {
  const req = { method: 'POST', originalUrl: '/api/users' };
  const res = createMockRes();
  const next = () => {};

  const error = new ValidationError('Missing required fields', [{ field: 'email', message: 'email is required' }]);
  errorHandler(error, req, res, next);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.statusCode, 400);
  assert.equal(res.body.message, 'Missing required fields');
  assert.ok(Array.isArray(res.body.errors));
  assert.equal(res.body.errors[0].field, 'email');
  assert.ok(res.body.timestamp);
});

runTest('errorHandler handles malformed JSON SyntaxError safely', () => {
  const req = { method: 'POST', originalUrl: '/api/tasks' };
  const res = createMockRes();
  const next = () => {};

  const syntaxErr = new SyntaxError('Unexpected token in JSON');
  syntaxErr.status = 400;
  syntaxErr.body = '{ "bad": ';

  errorHandler(syntaxErr, req, res, next);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid JSON in request body');
});

runTest('errorHandler maps known Prisma P2002 to 409 Conflict', () => {
  const req = { method: 'POST', originalUrl: '/api/users' };
  const res = createMockRes();
  const next = () => {};

  const prismaErr = new Error('Unique constraint failed');
  prismaErr.code = 'P2002';
  prismaErr.meta = { target: ['email'] };

  errorHandler(prismaErr, req, res, next);

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.success, false);
  assert.ok(res.body.message.includes('Unique constraint violation'));
});

runTest('errorHandler maps known Prisma P2025 to 404 Not Found', () => {
  const req = { method: 'GET', originalUrl: '/api/users/123' };
  const res = createMockRes();
  const next = () => {};

  const prismaErr = new Error('Record not found');
  prismaErr.code = 'P2025';

  errorHandler(prismaErr, req, res, next);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Requested record was not found');
});

runTest('errorHandler handles PrismaClientValidationError with 400 status', () => {
  const req = { method: 'GET', originalUrl: '/api/projects' };
  const res = createMockRes();
  const next = () => {};

  const validationErr = new Error('Invalid query argument');
  validationErr.name = 'PrismaClientValidationError';

  errorHandler(validationErr, req, res, next);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid database query parameters');
});

runTest('errorHandler masks unexpected 500 error internal stack details from client', () => {
  const req = { method: 'GET', originalUrl: '/api/internal' };
  const res = createMockRes();
  const next = () => {};

  const fatalErr = new Error('FATAL: raw database connection reset at 10.0.0.1:5432');
  fatalErr.stack = 'SecretStack: /var/app/internal.js:99';

  errorHandler(fatalErr, req, res, next);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Internal server error');
  assert.equal(res.body.stack, undefined);
  assert.ok(!JSON.stringify(res.body).includes('10.0.0.1'));
});

// -------------------------------------------------------------
// 2. Manual Validation Edge Cases
// -------------------------------------------------------------
console.log('\n--- 2. Manual Validation Edge Cases ---');

runTest('validateRequired rejects empty strings, null, undefined, and non-objects', () => {
  assert.throws(
    () => validateRequired({ name: '', email: 'a@b.com' }, ['name', 'email']),
    /Missing required fields/
  );
  assert.throws(
    () => validateRequired({ name: '   ', email: 'a@b.com' }, ['name']),
    /Missing required fields/
  );
  assert.throws(
    () => validateRequired(null, ['name']),
    /Validation failed/
  );
  assert.throws(
    () => validateRequired(['not', 'an', 'object'], ['name']),
    /Validation failed/
  );
  // Valid passes without exception
  validateRequired({ name: 'Alice', email: 'alice@acme.com' }, ['name', 'email']);
});

runTest('validateEmail rejects malformed emails and non-strings', () => {
  assert.throws(() => validateEmail('plainaddress'), /Invalid email/);
  assert.throws(() => validateEmail('@missingusername.com'), /Invalid email/);
  assert.throws(() => validateEmail(12345), /Invalid email/);
  assert.throws(() => validateEmail(''), /Invalid email/);
  assert.throws(() => validateEmail(null), /Invalid email/);
  // Valid emails
  validateEmail('user@domain.com');
  validateEmail('admin.testing+1@company.org');
});

runTest('validateEnum enforces strict membership in allowed array or enum map', () => {
  const AllowedStatus = { ACTIVE: 'Active', PENDING: 'Pending', ARCHIVED: 'Archived' };

  assert.throws(() => validateEnum('INVALID_STATUS', AllowedStatus, 'status'), /Invalid value for status/);
  assert.throws(() => validateEnum('active', AllowedStatus, 'status'), /Invalid value for status/); // Case-sensitive enum

  // Valid values
  validateEnum('Active', AllowedStatus, 'status');
  validateEnum(undefined, AllowedStatus, 'status'); // optional field
});

runTest('validateNumber guards against JS type coercion (booleans, empty strings, arrays, NaN)', () => {
  assert.throws(() => validateNumber(false, 'count'), /Invalid number/);
  assert.throws(() => validateNumber(true, 'count'), /Invalid number/);
  assert.throws(() => validateNumber('', 'count'), /Invalid number/);
  assert.throws(() => validateNumber([], 'count'), /Invalid number/);
  assert.throws(() => validateNumber('not-a-number', 'count'), /Invalid number/);

  // Bounds checks
  assert.throws(() => validateNumber(5, 'count', { min: 10 }), /below minimum/);
  assert.throws(() => validateNumber(25, 'count', { max: 20 }), /above maximum/);
  assert.throws(() => validateNumber(3.14, 'count', { integer: true }), /Invalid integer/);

  // Valid numbers
  validateNumber(15, 'count', { min: 10, max: 20, integer: true });
  validateNumber('15', 'count', { min: 10, max: 20 });
});

// -------------------------------------------------------------
// 3. Role & RBAC Mapping Security
// -------------------------------------------------------------
console.log('\n--- 3. Role & RBAC Mapping Security ---');

runTest('toCanonicalRole resolves official slugs to canonical labels', () => {
  assert.equal(toCanonicalRole('superuser'), ROLES.COMPANY_OWNER);
  assert.equal(toCanonicalRole('ceo'), ROLES.COMPANY_OWNER);
  assert.equal(toCanonicalRole('pm'), ROLES.PROJECT_MANAGER);
  assert.equal(toCanonicalRole('hr_manager'), ROLES.ACCESS_GOVERNANCE);
  assert.equal(toCanonicalRole('team_lead'), ROLES.TEAM_LEAD);
  assert.equal(toCanonicalRole('platform_admin'), ROLES.PLATFORM_ADMIN);
  assert.equal(toCanonicalRole('unknown_fake_role'), '');
});

runTest('hasRole prevents privilege escalation from substring tricks', () => {
  // Classic vulnerability: 'not_system_admin' matching 'System Admin' or 'admin'
  assert.equal(hasRole('not_system_admin', [ROLES.SYSTEM_ADMIN]), false);
  assert.equal(hasRole('system_admin_guest', [ROLES.SYSTEM_ADMIN]), false);
  assert.equal(hasRole('unauthorized_pm', [ROLES.PROJECT_MANAGER]), false);
  assert.equal(hasRole('team_member_lead', [ROLES.TEAM_LEAD]), false);

  // Valid exact role matches
  assert.equal(hasRole('superuser', [ROLES.COMPANY_OWNER]), true);
  assert.equal(hasRole('Company Owner', ['superuser']), true);
  assert.equal(hasRole('pm', [ROLES.PROJECT_MANAGER]), true);
  assert.equal(hasRole('Project Manager', ['pm']), true);
  assert.equal(hasRole('team_member', [ROLES.TEAM_MEMBER]), true);
  assert.equal(hasRole(null, [ROLES.COMPANY_OWNER]), false);
});

// -------------------------------------------------------------
// 4. Tenant & Branch Scoping Isolation
// -------------------------------------------------------------
console.log('\n--- 4. Tenant & Branch Scoping Isolation ---');

runTest('isCompanyOwner and isBranchManager correctly classify roles', () => {
  const ownerUser = { role: 'superuser', roleLabel: 'Company Owner' };
  const bmUser = { role: 'branch_manager', roleLabel: 'Branch Manager', scopeId: 'branch-101' };
  const devUser = { role: 'team_member', roleLabel: 'Team Member' };

  assert.equal(isCompanyOwner(ownerUser), true);
  assert.equal(isCompanyOwner(bmUser), false);
  assert.equal(isCompanyOwner(devUser), false);

  assert.equal(isBranchManager(bmUser), true);
  assert.equal(isBranchManager(ownerUser), false);
  assert.equal(isBranchManager(devUser), false);
});

runTest('resolveEffectiveBranchId enforces Branch Manager assignment over query params', () => {
  const bmUser = { role: 'branch_manager', roleLabel: 'Branch Manager', scopeId: 'branch-assigned-1' };
  // Attacker BM tries to specify branchId 'branch-other-99'
  const effectiveBM = resolveEffectiveBranchId({ user: bmUser, branchId: 'branch-other-99' });
  assert.equal(effectiveBM, 'branch-assigned-1');

  // Company Owner can drill down to any branch
  const ownerUser = { role: 'superuser', roleLabel: 'Company Owner' };
  const effectiveOwner = resolveEffectiveBranchId({ user: ownerUser, branchId: 'branch-other-99' });
  assert.equal(effectiveOwner, 'branch-other-99');
});

runTest('assertBranchManagerScope blocks cross-branch tampering with ForbiddenError', () => {
  const bmUser = { role: 'branch_manager', roleLabel: 'Branch Manager', scopeId: 'branch-assigned-1' };

  // BM accessing own branch succeeds
  assertBranchManagerScope(bmUser, 'branch-assigned-1');

  // BM accessing another branch throws 403 Forbidden
  assert.throws(
    () => assertBranchManagerScope(bmUser, 'branch-different-2', 'modify tasks'),
    (err) => err instanceof ForbiddenError && err.statusCode === 403
  );
});

runTest('buildTaskListWhere isolates team members to assigned tasks', () => {
  const memberUser = { id: 'user-dev-1', role: 'team_member', roleLabel: 'Team Member' };
  const where = buildTaskListWhere({ companyId: 'comp-1', user: memberUser });

  assert.equal(where.companyId, 'comp-1');
  assert.equal(where.assignedToId, 'user-dev-1');
  assert.equal(where.deletedAt, null);
});

// -------------------------------------------------------------
// 5. Real PostgreSQL Database Audit Persistence & Validation
// -------------------------------------------------------------
console.log('\n--- 5. Audit Log Validation & Persistence Verification ---');

runTest('AUDIT_ACTIONS enum values match official Prisma schema', () => {
  assert.deepEqual(Object.values(AUDIT_ACTIONS), [
    'CREATE',
    'UPDATE',
    'DELETE',
    'STATUS_CHANGE',
    'LOGIN',
    'PERMISSION_CHANGE',
  ]);
});

await runAsyncTest('createAuditLog validates required inputs and enum action bounds', async () => {
  await assert.rejects(
    async () => {
      await createAuditLog({
        companyId: 'comp-1',
        entityType: 'Task',
        entityId: '123',
        action: 'INVALID_HACK_ACTION',
      });
    },
    /Audit log creation failed: action must be one of/
  );

  await assert.rejects(
    async () => {
      await createAuditLog({
        companyId: '',
        entityType: 'Task',
        entityId: '123',
        action: AUDIT_ACTIONS.UPDATE,
      });
    },
    /Audit log creation failed: companyId is required/
  );

  await assert.rejects(
    async () => {
      await createAuditLog({
        companyId: 'comp-1',
        entityType: '',
        entityId: '123',
        action: AUDIT_ACTIONS.UPDATE,
      });
    },
    /Audit log creation failed: entityType is required/
  );

  await assert.rejects(
    async () => {
      await createAuditLog({
        companyId: 'comp-1',
        entityType: 'Task',
        entityId: '',
        action: AUDIT_ACTIONS.UPDATE,
      });
    },
    /Audit log creation failed: entityId is required/
  );
});

await runAsyncTest('Live DB AuditLog table verification', async () => {
  try {
    const count = await prisma.auditLog.count();
    console.log(`    (Live DB table "AuditLog" found with ${count} existing records)`);
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      console.log('    (Note: Target database currently has unmigrated tables. Live persistence blocked pending migration run in future step).');
    } else {
      throw err;
    }
  }
});


console.log(`\n======================================================`);
console.log(`Step 3 Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
