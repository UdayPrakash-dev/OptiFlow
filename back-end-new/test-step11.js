import { strict as assert } from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { createApp } from './src/app.js';
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

function createPlatformToken(payload) {
  return jwt.sign(
    { ...payload, role: 'platform_admin', type: 'platform_admin' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function main() {
  console.log('\n--- Running Step 11 Tests: End-to-End Integration & Multi-Tenant Workflows ---');
  const app = createApp();

  // Test setup for mock db fixtures
  const tenantA_OwnerToken = createToken({ sub: 'user-a1', companyId: 'comp-alpha' });
  const tenantA_MemberToken = createToken({ sub: 'user-a2', companyId: 'comp-alpha' });
  const tenantB_OwnerToken = createToken({ sub: 'user-b1', companyId: 'comp-beta' });
  const platformAdminToken = createPlatformToken({ sub: 'platform-admin-root' });

  const originalUserFindUnique = prisma.user.findUnique;
  const originalPlatformAdminFindUnique = prisma.platformAdminUser.findUnique;
  const originalProjectFindFirst = prisma.project.findFirst;
  const originalTaskFindFirst = prisma.task.findFirst;
  const originalTaskCreate = prisma.task.create;
  const originalComplianceRuleFindFirst = prisma.complianceRule.findFirst;
  const originalComplianceViolationCreate = prisma.complianceViolation.create;

  prisma.user.findUnique = async ({ where }) => {
    if (where.id === 'user-a1') {
      return {
        id: 'user-a1',
        companyId: 'comp-alpha',
        email: 'owner@alpha.com',
        fullName: 'Alpha Owner',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    if (where.id === 'user-a2') {
      return {
        id: 'user-a2',
        companyId: 'comp-alpha',
        email: 'member@alpha.com',
        fullName: 'Alpha Member',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.TEAM_MEMBER } }],
      };
    }
    if (where.id === 'user-b1') {
      return {
        id: 'user-b1',
        companyId: 'comp-beta',
        email: 'owner@beta.com',
        fullName: 'Beta Owner',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    return null;
  };

  prisma.platformAdminUser.findUnique = async ({ where }) => {
    if (where.id === 'platform-admin-root') {
      return {
        id: 'platform-admin-root',
        email: 'root@optiflow.com',
        fullName: 'Root Admin',
        isActive: true,
      };
    }
    return null;
  };

  prisma.auditLog.create = async () => ({ id: 'mock-audit-1' });

  try {
    // Flow 1: Complete Tenant Auth & Me flow
    await runAsyncTest('Integration Flow 1: Tenant user authentication and /auth/me profile verification', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/auth/me',
        headers: { Authorization: `Bearer ${tenantA_OwnerToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, 'owner@alpha.com');
      assert.equal(res.body.data.user.companyId, 'comp-alpha');
      assert.equal(res.body.data.user.role, 'company_owner');
    });

    // Flow 2: Multi-Tenant Isolation (Tenant B cannot read or modify Tenant A project)
    await runAsyncTest('Integration Flow 2: Multi-tenant strict isolation between Tenant A and Tenant B', async () => {
      // Mock Project belonging to Tenant A (comp-alpha)
      prisma.project.findFirst = async ({ where }) => {
        if (where.id === 'proj-alpha-100' && (where.companyId === 'comp-alpha' || where.team?.branch?.companyId === 'comp-alpha')) {
          return {
            id: 'proj-alpha-100',
            name: 'Alpha Confidential Project',
            companyId: 'comp-alpha',
            team: { branch: { companyId: 'comp-alpha' } },
          };
        }
        return null;
      };

      // Tenant A requests -> Success 200
      const resA = await makeRequest(app, {
        method: 'GET',
        path: '/projects/proj-alpha-100',
        headers: { Authorization: `Bearer ${tenantA_OwnerToken}` },
      });
      assert.equal(resA.status, 200);
      assert.equal(resA.body.success, true);
      assert.equal(resA.body.data.id, 'proj-alpha-100');

      // Tenant B requests same ID -> Rejected 404 (isolated)
      const resB = await makeRequest(app, {
        method: 'GET',
        path: '/projects/proj-alpha-100',
        headers: { Authorization: `Bearer ${tenantB_OwnerToken}` },
      });
      assert.equal(resB.status, 404);
      assert.equal(resB.body.success, false);
    });

    // Flow 3: Core Business Workflow (Task -> Violation -> Compliance)
    await runAsyncTest('Integration Flow 3: End-to-end task creation and compliance workflow', async () => {
      prisma.project.findFirst = async () => ({
        id: 'proj-1',
        companyId: 'comp-alpha',
        team: { branchId: 'b-1', branch: { id: 'b-1', companyId: 'comp-alpha' } },
      });

      prisma.task.create = async ({ data }) => ({
        id: 'task-e2e-1',
        ...data,
      });

      // Create Task under Project
      const taskRes = await makeRequest(app, {
        method: 'POST',
        path: '/tasks',
        headers: { Authorization: `Bearer ${tenantA_OwnerToken}` },
        body: {
          title: 'Deploy Production Pipeline',
          projectId: 'proj-1',
          priority: 'High',
        },
      });
      assert.equal(taskRes.status, 201);
      assert.equal(taskRes.body.data.id, 'task-e2e-1');

      // Raise Compliance Violation for the task
      prisma.complianceRule.findFirst = async () => ({
        id: 'rule-pipeline-sec',
        name: 'CI/CD Pipeline Security',
        companyId: 'comp-alpha',
      });

      prisma.complianceViolation.create = async ({ data }) => ({
        id: 'viol-e2e-1',
        ...data,
      });

      const violRes = await makeRequest(app, {
        method: 'POST',
        path: '/compliance-violations',
        headers: { Authorization: `Bearer ${tenantA_OwnerToken}` },
        body: {
          ruleId: 'rule-pipeline-sec',
          entityType: 'Task',
          entityId: 'task-e2e-1',
          severity: 'High',
        },
      });
      assert.equal(violRes.status, 201);
      assert.equal(violRes.body.data.id, 'viol-e2e-1');
    });

    // Flow 4: Platform Admin Boundary Verification
    await runAsyncTest('Integration Flow 4: Platform admin boundary protection against tenant tokens', async () => {
      // Platform Admin accessing /platform/metrics
      prisma.company.count = async () => 10;
      prisma.platformAdminUser.count = async () => 3;
      prisma.subscription.groupBy = async () => [];
      prisma.plan.findMany = async () => [];
      prisma.platformSupportAccess.findMany = async () => [];
      prisma.company.findMany = async () => [];

      const platRes = await makeRequest(app, {
        method: 'GET',
        path: '/platform/metrics',
        headers: { Authorization: `Bearer ${platformAdminToken}` },
      });
      assert.equal(platRes.status, 200);
      assert.equal(platRes.body.success, true);

      // Tenant Owner attempting to access /platform/metrics -> Rejected with 403
      const tenantForbiddenRes = await makeRequest(app, {
        method: 'GET',
        path: '/platform/metrics',
        headers: { Authorization: `Bearer ${tenantA_OwnerToken}` },
      });
      assert.equal(tenantForbiddenRes.status, 403);
      assert.equal(tenantForbiddenRes.body.success, false);
    });

  } finally {
    prisma.user.findUnique = originalUserFindUnique;
    prisma.platformAdminUser.findUnique = originalPlatformAdminFindUnique;
    prisma.project.findFirst = originalProjectFindFirst;
    prisma.task.findFirst = originalTaskFindFirst;
    prisma.task.create = originalTaskCreate;
    prisma.complianceRule.findFirst = originalComplianceRuleFindFirst;
    prisma.complianceViolation.create = originalComplianceViolationCreate;
  }

  console.log(`\nStep 11 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error in Step 11:', err);
  process.exit(1);
});
