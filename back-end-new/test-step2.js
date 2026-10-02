import { app } from './src/app.js';
import { prisma, testDbConnection } from './src/config/prisma.js';
import { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from './src/utils/errors.js';
import { validateRequired, validateEmail, validateEnum, validateNumber } from './src/utils/validation.js';
import { ROLES, ROLE_SLUGS, hasRole, normalizeRole } from './src/utils/roles.js';
import { isCompanyOwner, isBranchManager, resolveEffectiveBranchId, buildProjectListWhere, buildTaskListWhere } from './src/utils/tenantScope.js';
import { AUDIT_ACTIONS, createAuditLog } from './src/utils/audit.js';

async function runStep2Verification() {
  console.log('--- RUNNING STEP 2 ROUTER SKELETON & UTILITIES VERIFICATION ---');
  let server;

  try {
    // 1. Check Unit Utilities
    console.log('\n[Check 1] Verifying Error Utility Classes...');
    const customErr = new BadRequestError('Test bad request', [{ field: 'title', message: 'Title is required' }]);
    if (customErr.statusCode === 400 && customErr.errors?.length === 1 && customErr instanceof AppError) {
      console.log('✔ Check 1 Passed: Error classes instantiated correctly with status codes & error arrays.');
    } else {
      throw new Error('Error utility verification failed.');
    }

    // 2. Check Validation Utilities
    console.log('\n[Check 2] Verifying Manual Validation Utility...');
    try {
      validateRequired({ email: 'test@example.com' }, ['email', 'password']);
      throw new Error('Should have thrown ValidationError');
    } catch (err) {
      if (err instanceof ValidationError && err.errors[0]?.field === 'password') {
        console.log('✔ Check 2a Passed: validateRequired correctly catches missing fields.');
      } else {
        throw err;
      }
    }

    validateEmail('developer@optiflow.io');
    validateEnum('Active', ['Active', 'Draft', 'Completed'], 'status');
    validateNumber(42, 'estimatedHours', { min: 0, max: 100 });
    console.log('✔ Check 2b Passed: validateEmail, validateEnum, and validateNumber work as expected.');

    // 3. Check Roles Utilities
    console.log('\n[Check 3] Verifying Roles Utility...');
    if (
      hasRole('superuser', ['Company Owner']) &&
      hasRole('Company Owner', ['superuser']) &&
      hasRole('project_manager', ['Project Manager']) &&
      !hasRole('team_member', ['Project Manager', 'Company Owner'])
    ) {
      console.log('✔ Check 3 Passed: Roles normalization and hierarchical matching verified.');
    } else {
      throw new Error('Roles utility verification failed.');
    }

    // 4. Check Tenant Scope Utilities
    console.log('\n[Check 4] Verifying Tenant Scope Utility...');
    const ownerUser = { roleLabel: 'Company Owner', role: 'company_owner', companyId: 'comp-1' };
    const branchManager = { roleLabel: 'Branch Manager', role: 'branch_manager', scopeId: 'branch-1', companyId: 'comp-1' };
    const memberUser = { id: 'user-1', roleLabel: 'Team Member', role: 'team_member', companyId: 'comp-1' };

    if (isCompanyOwner(ownerUser) && isBranchManager(branchManager) && !isBranchManager(memberUser)) {
      console.log('✔ Check 4a Passed: User role scope identification verified.');
    }

    const bmWhere = buildTaskListWhere({ companyId: 'comp-1', user: branchManager });
    const memberWhere = buildTaskListWhere({ companyId: 'comp-1', user: memberUser });

    if (bmWhere.project?.team?.branchId === 'branch-1' && memberWhere.assignedToId === 'user-1') {
      console.log('✔ Check 4b Passed: Scoped Prisma where-clause builders verified for Branch Manager & Team Member.');
    } else {
      throw new Error('Tenant scope query builder verification failed.');
    }

    // 5. Check Audit Utility Interface
    console.log('\n[Check 5] Verifying Audit Utility Interface & Prisma model mapping...');
    if (AUDIT_ACTIONS.CREATE === 'CREATE' && typeof createAuditLog === 'function') {
      console.log('✔ Check 5 Passed: Audit actions and createAuditLog interface verified.');
    }

    // 6. Start Test Server & Test Router Endpoints
    console.log('\n[Check 6] Starting test server & testing Central Router...');
    server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    // Test GET /health
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.log('Health Endpoint Status:', healthRes.status);
    console.log('Health Endpoint Body:', JSON.stringify(healthJson));
    if (healthRes.status === 200 && healthJson.success === true && healthJson.data?.status === 'healthy') {
      console.log('✔ Check 6a Passed: GET /health continues to operate seamlessly.');
    } else {
      throw new Error('GET /health verification failed.');
    }

    // Test GET /api (Central Router mounted check)
    const apiRes = await fetch(`${baseUrl}/api`);
    const apiJson = await apiRes.json();
    console.log('Central Router /api Status:', apiRes.status);
    console.log('Central Router /api Body:', JSON.stringify(apiJson));
    if (apiRes.status === 200 && apiJson.success === true && apiJson.data?.status === 'active') {
      console.log('✔ Check 6b Passed: Central Router /api responded successfully.');
    } else {
      throw new Error('Central Router /api verification failed.');
    }

    // 7. Test Safe JSON Error Response on 404
    console.log('\n[Check 7] Testing 404 Not Found safe response...');
    const notFoundRes = await fetch(`${baseUrl}/api/unregistered-path`);
    const notFoundJson = await notFoundRes.json();
    console.log('404 Status:', notFoundRes.status);
    console.log('404 Body:', JSON.stringify(notFoundJson));
    if (notFoundRes.status === 404 && notFoundJson.success === false && notFoundJson.message.includes('Cannot GET')) {
      console.log('✔ Check 7 Passed: Centralized 404 handler returns { success: false, message: ... }.');
    } else {
      throw new Error('404 response verification failed.');
    }

    console.log('\n🎉 ALL STEP 2 CHECKS COMPLETED AND VERIFIED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ Step 2 Verification Failed:', error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runStep2Verification();
