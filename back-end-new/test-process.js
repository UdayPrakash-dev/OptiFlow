import { strict as assert } from 'node:assert';
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import processRoutes from './src/routes/process.routes.js';
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
  app.use(processRoutes);
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

      if (payload) req.write(payload);
      req.end();
    });
  });
}

function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

console.log('--- Running Process Engine Tests: Templates, Instances, Steps & Transitions ---');

const companyA = 'comp-a-uuid-1111';
const companyB = 'comp-b-uuid-2222';

const pmToken = generateToken({
  sub: 'user-pm-1',
  companyId: companyA,
  role: ROLES.PROJECT_MANAGER,
  email: 'pm@company-a.com',
});

const memberToken = generateToken({
  sub: 'user-member-1',
  companyId: companyA,
  role: ROLES.TEAM_MEMBER,
  email: 'member@company-a.com',
});

const tenantBToken = generateToken({
  sub: 'user-b-pm',
  companyId: companyB,
  role: ROLES.PROJECT_MANAGER,
  email: 'pm@company-b.com',
});

// Mock state store for unit testing
const memoryDb = {
  users: [
    {
      id: 'user-pm-1',
      companyId: companyA,
      status: 'Active',
      roleAssignments: [{ role: { label: ROLES.PROJECT_MANAGER } }],
      company: { id: companyA, status: 'Active' },
    },
    {
      id: 'user-member-1',
      companyId: companyA,
      status: 'Active',
      roleAssignments: [{ role: { label: ROLES.TEAM_MEMBER } }],
      company: { id: companyA, status: 'Active' },
    },
    {
      id: 'user-b-pm',
      companyId: companyB,
      status: 'Active',
      roleAssignments: [{ role: { label: ROLES.PROJECT_MANAGER } }],
      company: { id: companyB, status: 'Active' },
    },
  ],
  templates: [],
  templateSteps: [],
  instances: [],
  instanceSteps: [],
  auditLogs: [],
};

// Prisma user hooks for authenticate middleware
prisma.user.findUnique = async ({ where }) => {
  return memoryDb.users.find((u) => u.id === where.id) || null;
};

prisma.user.findFirst = async ({ where }) => {
  return (
    memoryDb.users.find((u) => {
      if (where.id && u.id !== where.id) return false;
      if (where.companyId && u.companyId !== where.companyId) return false;
      return true;
    }) || null
  );
};

// Intercept Prisma methods for testing process logic
prisma.processTemplate.create = async ({ data }) => {
  const tId = `pt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const template = {
    id: tId,
    companyId: data.companyId,
    name: data.name,
    version: data.version ?? 1,
    isActive: data.isActive ?? true,
    createdById: data.createdById,
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [],
    instances: [],
  };

  if (data.steps?.create) {
    template.steps = data.steps.create.map((s, idx) => {
      const stepObj = {
        id: `pts-${Date.now()}-${idx}`,
        companyId: data.companyId,
        templateId: tId,
        stepOrder: s.stepOrder,
        name: s.name,
        stepType: s.stepType,
        onRejectGotoStepId: s.onRejectGotoStepId ?? null,
        onRejectGotoStep: null,
      };
      memoryDb.templateSteps.push(stepObj);
      return stepObj;
    });
  }

  memoryDb.templates.push(template);
  return template;
};

prisma.processTemplate.findFirst = async ({ where }) => {
  const found = memoryDb.templates.find((t) => {
    if (where.id && t.id !== where.id) return false;
    if (where.companyId && t.companyId !== where.companyId) return false;
    return true;
  });
  if (!found) return null;
  const steps = memoryDb.templateSteps.filter((s) => s.templateId === found.id);
  return { ...found, steps };
};

prisma.processTemplate.findMany = async ({ where }) => {
  return memoryDb.templates
    .filter((t) => !where.companyId || t.companyId === where.companyId)
    .map((t) => {
      const steps = memoryDb.templateSteps.filter((s) => s.templateId === t.id);
      return { ...t, steps, instances: [] };
    });
};

prisma.processTemplateStep.findFirst = async ({ where }) => {
  return (
    memoryDb.templateSteps.find((s) => {
      if (where.id && s.id !== where.id) return false;
      if (where.templateId && s.templateId !== where.templateId) return false;
      if (where.stepOrder?.gt !== undefined && !(s.stepOrder > where.stepOrder.gt)) return false;
      return true;
    }) || null
  );
};

prisma.processInstance.create = async ({ data }) => {
  const instId = `pi-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const inst = {
    id: instId,
    companyId: data.companyId,
    templateId: data.templateId,
    projectId: data.projectId ?? null,
    status: data.status ?? 'Draft',
    currentStepId: null,
    initiatedById: data.initiatedById,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [],
  };
  memoryDb.instances.push(inst);
  return inst;
};

prisma.processInstance.update = async ({ where, data }) => {
  const inst = memoryDb.instances.find((i) => i.id === where.id);
  if (!inst) throw new Error('Instance not found');
  Object.assign(inst, data, { updatedAt: new Date() });
  inst.steps = memoryDb.instanceSteps.filter((s) => s.processInstanceId === inst.id);
  return inst;
};

prisma.processInstance.findFirst = async ({ where }) => {
  const inst = memoryDb.instances.find((i) => {
    if (where.id && i.id !== where.id) return false;
    if (where.companyId && i.companyId !== where.companyId) return false;
    return true;
  });
  if (!inst) return null;
  const steps = memoryDb.instanceSteps.filter((s) => s.processInstanceId === inst.id);
  return { ...inst, steps };
};

prisma.processInstanceStep.create = async ({ data }) => {
  const stepId = `pis-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tStep = memoryDb.templateSteps.find((ts) => ts.id === data.templateStepId);
  const step = {
    id: stepId,
    companyId: data.companyId,
    processInstanceId: data.processInstanceId,
    templateStepId: data.templateStepId,
    templateStep: tStep || { id: data.templateStepId, stepOrder: 1, name: 'Step', stepType: 'Approval' },
    status: data.status ?? 'Pending',
    assignedToId: data.assignedToId ?? null,
    actionedById: null,
    actionedAt: null,
    assignedTo: null,
    actionedBy: null,
  };
  memoryDb.instanceSteps.push(step);
  return step;
};

prisma.processInstanceStep.findFirst = async ({ where }) => {
  const step = memoryDb.instanceSteps.find((s) => {
    if (where.id && s.id !== where.id) return false;
    if (where.processInstanceId && s.processInstanceId !== where.processInstanceId) return false;
    if (where.templateStepId && s.templateStepId !== where.templateStepId) return false;
    if (where.processInstance?.companyId) {
      const inst = memoryDb.instances.find((i) => i.id === s.processInstanceId);
      if (!inst || inst.companyId !== where.processInstance.companyId) return false;
    }
    return true;
  });
  if (!step) return null;
  const tStep = memoryDb.templateSteps.find((ts) => ts.id === step.templateStepId);
  return { ...step, templateStep: tStep || step.templateStep };
};

prisma.processInstanceStep.update = async ({ where, data }) => {
  const step = memoryDb.instanceSteps.find((s) => s.id === where.id);
  if (!step) throw new Error('Step not found');
  Object.assign(step, data);
  const tStep = memoryDb.templateSteps.find((ts) => ts.id === step.templateStepId);
  return { ...step, templateStep: tStep || step.templateStep };
};

prisma.auditLog.create = async ({ data }) => {
  memoryDb.auditLogs.push(data);
  return data;
};

// Transaction wrapper helper
prisma.$transaction = async (fn) => {
  return fn(prisma);
};

const app = createTestApp();

let createdTemplateId = null;
let createdInstanceId = null;
let step1Id = null;
let step2Id = null;

// 1. Rejects unauthenticated request
await runAsyncTest('Rejects unauthenticated GET /process-templates', async () => {
  const res = await makeRequest(app, {
    method: 'GET',
    path: '/process-templates',
  });
  assert.equal(res.status, 401);
});

// 2. Member cannot create template (Requires PM/Admin/Owner)
await runAsyncTest('Rejects unauthorized role creating process template with 403', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/process-templates',
    headers: { Authorization: `Bearer ${memberToken}` },
    body: { name: 'Unauthorized Process' },
  });
  assert.equal(res.status, 403);
});

// 3. Project Manager creates template with 2 steps and rejection loopback
await runAsyncTest('Creates process template with ordered steps and rejection target', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/process-templates',
    headers: { Authorization: `Bearer ${pmToken}` },
    body: {
      name: 'Standard Approval Process',
      version: 1,
      steps: [
        { name: 'Initial Review', stepOrder: 1, stepType: 'Approval' },
        { name: 'Final Approval', stepOrder: 2, stepType: 'Approval' },
      ],
    },
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.name, 'Standard Approval Process');
  assert.equal(res.body.data.steps.length, 2);
  createdTemplateId = res.body.data.id;
  // Link step 2 rejection back to step 1 template step ID
  res.body.data.steps[1].onRejectGotoStepId = res.body.data.steps[0].id;
  const s2InDb = memoryDb.templateSteps.find((s) => s.id === res.body.data.steps[1].id);
  if (s2InDb) s2InDb.onRejectGotoStepId = res.body.data.steps[0].id;
});

// 4. Cross-tenant template isolation
await runAsyncTest('Prevents cross-tenant retrieval of process template', async () => {
  const res = await makeRequest(app, {
    method: 'GET',
    path: `/process-templates/${createdTemplateId}`,
    headers: { Authorization: `Bearer ${tenantBToken}` },
  });
  assert.equal(res.status, 404);
});

// 5. Instantiates process from template
await runAsyncTest('Instantiates process instance and sets initial step to Active', async () => {
  const res = await makeRequest(app, {
    method: 'POST',
    path: '/process-instances',
    headers: { Authorization: `Bearer ${pmToken}` },
    body: {
      templateId: createdTemplateId,
    },
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'Active');
  assert.ok(res.body.data.currentStepId);
  createdInstanceId = res.body.data.id;

  const steps = memoryDb.instanceSteps.filter((s) => s.processInstanceId === createdInstanceId);
  assert.equal(steps.length, 2);
  step1Id = steps[0].id;
  step2Id = steps[1].id;
});

// 6. Action step 1: Approve advances currentStepId to step 2
await runAsyncTest('Approving step 1 advances process instance to step 2', async () => {
  const res = await makeRequest(app, {
    method: 'PATCH',
    path: `/process-instance-steps/${step1Id}/action`,
    headers: { Authorization: `Bearer ${pmToken}` },
    body: { status: 'Approved' },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'Approved');

  const instance = memoryDb.instances.find((i) => i.id === createdInstanceId);
  assert.equal(instance.currentStepId, step2Id);
  assert.equal(instance.status, 'Active');
});

// 7. Action step 2: Reject loops back to step 1 because of onRejectGotoStepId
await runAsyncTest('Rejecting step 2 loops back to step 1 and resets status to Pending', async () => {
  const res = await makeRequest(app, {
    method: 'PATCH',
    path: `/process-instance-steps/${step2Id}/action`,
    headers: { Authorization: `Bearer ${pmToken}` },
    body: { status: 'Rejected' },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'Rejected');

  const instance = memoryDb.instances.find((i) => i.id === createdInstanceId);
  assert.equal(instance.currentStepId, step1Id);
  assert.equal(instance.status, 'Active');

  const step1 = memoryDb.instanceSteps.find((s) => s.id === step1Id);
  assert.equal(step1.status, 'Pending');
});

// 8. Re-approve step 1 and approve step 2 -> Completes process
await runAsyncTest('Approving all steps marks process instance as Completed', async () => {
  // Approve step 1 again
  await makeRequest(app, {
    method: 'PATCH',
    path: `/process-instance-steps/${step1Id}/action`,
    headers: { Authorization: `Bearer ${pmToken}` },
    body: { status: 'Approved' },
  });

  // Approve step 2
  const res = await makeRequest(app, {
    method: 'PATCH',
    path: `/process-instance-steps/${step2Id}/action`,
    headers: { Authorization: `Bearer ${pmToken}` },
    body: { status: 'Approved' },
  });

  assert.equal(res.status, 200);

  const instance = memoryDb.instances.find((i) => i.id === createdInstanceId);
  assert.equal(instance.status, 'Completed');
  assert.ok(instance.completedAt);
});

// 9. Cross-tenant step action isolation
await runAsyncTest('Tenant B cannot action Tenant A process step', async () => {
  const res = await makeRequest(app, {
    method: 'PATCH',
    path: `/process-instance-steps/${step1Id}/action`,
    headers: { Authorization: `Bearer ${tenantBToken}` },
    body: { status: 'Approved' },
  });
  assert.equal(res.status, 404);
});

// 10. Rejects invalid step status
await runAsyncTest('Rejects invalid step status transition with 400', async () => {
  const res = await makeRequest(app, {
    method: 'PATCH',
    path: `/process-instance-steps/${step1Id}/action`,
    headers: { Authorization: `Bearer ${pmToken}` },
    body: { status: 'INVALID_STATUS' },
  });
  assert.equal(res.status, 400);
});

console.log(`\nProcess Engine Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
