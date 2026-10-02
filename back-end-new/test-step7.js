import { strict as assert } from 'node:assert';
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import tasksRoutes from './src/routes/tasks.routes.js';
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
  app.use(tasksRoutes);
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

function createToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
  console.log('\n--- Running Step 7 Tests: Tasks, Subtasks & Escalations ---');
  const app = createTestApp();

  const userToken = createToken({
    sub: 'user-1',
    companyId: 'comp-1',
    role: ROLES.COMPANY_OWNER,
  });

  const memberToken = createToken({
    sub: 'member-1',
    companyId: 'comp-1',
    role: ROLES.TEAM_MEMBER,
  });

  const foreignToken = createToken({
    sub: 'user-foreign',
    companyId: 'comp-2',
    role: ROLES.COMPANY_OWNER,
  });

  // Mock data setup
  const originalUserFindUnique = prisma.user.findUnique;
  const originalTaskFindMany = prisma.task.findMany;
  const originalTaskFindFirst = prisma.task.findFirst;
  const originalTaskCreate = prisma.task.create;
  const originalTaskUpdate = prisma.task.update;
  const originalSubtaskFindFirst = prisma.subtask.findFirst;
  const originalSubtaskCreate = prisma.subtask.create;
  const originalSubtaskUpdate = prisma.subtask.update;
  const originalEscalationFindFirst = prisma.escalation.findFirst;
  const originalEscalationCreate = prisma.escalation.create;
  const originalProjectFindFirst = prisma.project.findFirst;
  const originalAuditLogCreate = prisma.auditLog.create;

  // Setup user lookup mock
  prisma.user.findUnique = async ({ where }) => {
    if (where.id === 'user-1') {
      return {
        id: 'user-1',
        companyId: 'comp-1',
        email: 'owner@example.com',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    if (where.id === 'member-1') {
      return {
        id: 'member-1',
        companyId: 'comp-1',
        email: 'member@example.com',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.TEAM_MEMBER } }],
      };
    }
    if (where.id === 'user-foreign') {
      return {
        id: 'user-foreign',
        companyId: 'comp-2',
        email: 'foreign@example.com',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    return null;
  };

  prisma.auditLog.create = async () => ({ id: 'audit-1' });

  try {
    // 1. Unauthenticated request rejection
    await runAsyncTest('Rejects unauthenticated GET /tasks', async () => {
      const res = await makeRequest(app, {
        method: 'GET',
        path: '/tasks',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    // 2. Listing tasks with company scope
    await runAsyncTest('Lists tasks scoped to authenticated user company', async () => {
      prisma.task.findMany = async ({ where }) => {
        assert.equal(where.companyId, 'comp-1');
        return [
          { id: 'task-1', title: 'Task 1', companyId: 'comp-1', status: 'Active' },
        ];
      };

      const res = await makeRequest(app, {
        method: 'GET',
        path: '/tasks',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].id, 'task-1');
    });

    // 3. Task creation requires valid project
    await runAsyncTest('Rejects task creation without valid project', async () => {
      prisma.project.findFirst = async () => null;

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/tasks',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          title: 'New Task',
          projectId: 'non-existent-proj',
        },
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    // 4. Task creation success with audit
    await runAsyncTest('Creates task successfully when project belongs to company', async () => {
      prisma.project.findFirst = async ({ where }) => {
        if (where.id === 'proj-1') {
          return { id: 'proj-1', team: { branchId: 'b-1', branch: { id: 'b-1', companyId: 'comp-1' } } };
        }
        return null;
      };

      let auditCreated = false;
      prisma.auditLog.create = async () => {
        auditCreated = true;
        return { id: 'audit-log-1' };
      };

      prisma.task.create = async ({ data }) => {
        assert.equal(data.companyId, 'comp-1');
        assert.equal(data.title, 'New Task');
        return {
          id: 'task-new',
          ...data,
          createdAt: new Date(),
        };
      };

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/tasks',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          title: 'New Task',
          projectId: 'proj-1',
          priority: 'High',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'task-new');
      assert.equal(auditCreated, true);
    });

    // 5. Cross-tenant task isolation check
    await runAsyncTest('Prevents cross-tenant access to get task by ID', async () => {
      prisma.task.findFirst = async ({ where }) => {
        if (where.id === 'task-1' && where.companyId === 'comp-1') {
          return { id: 'task-1', companyId: 'comp-1', title: 'Task 1' };
        }
        return null;
      };

      const res = await makeRequest(app, {
        method: 'GET',
        path: '/tasks/task-1',
        headers: { Authorization: `Bearer ${foreignToken}` },
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    // 6. Subtask creation validates parent task
    await runAsyncTest('Subtask creation validates parent task belongs to company', async () => {
      prisma.task.findFirst = async ({ where }) => {
        if (where.id === 'task-1' && where.companyId === 'comp-1') {
          return { id: 'task-1', companyId: 'comp-1' };
        }
        return null;
      };

      prisma.subtask.create = async ({ data }) => {
        assert.equal(data.companyId, 'comp-1');
        assert.equal(data.taskId, 'task-1');
        return { id: 'sub-1', ...data };
      };

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/subtasks',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          taskId: 'task-1',
          title: 'Subtask 1',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'sub-1');
    });

    // 7. Escalation creation validation
    await runAsyncTest('Escalation creation validates task and reason', async () => {
      prisma.task.findFirst = async ({ where }) => {
        if (where.id === 'task-1' && where.companyId === 'comp-1') {
          return { id: 'task-1', companyId: 'comp-1' };
        }
        return null;
      };

      prisma.escalation.create = async ({ data }) => {
        assert.equal(data.companyId, 'comp-1');
        assert.equal(data.taskId, 'task-1');
        assert.equal(data.title, 'Escalation Issue');
        return { id: 'esc-1', ...data };
      };

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/escalations',
        headers: { Authorization: `Bearer ${memberToken}` },
        body: {
          taskId: 'task-1',
          title: 'Escalation Issue',
          description: 'Blocked by upstream',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'esc-1');
    });

    // 8. Invalid status transition rejection
    await runAsyncTest('Rejects invalid status update on task', async () => {
      prisma.task.findFirst = async ({ where }) => {
        if (where.id === 'task-1' && where.companyId === 'comp-1') {
          return { id: 'task-1', companyId: 'comp-1', status: 'Active' };
        }
        return null;
      };

      const res = await makeRequest(app, {
        method: 'PATCH',
        path: '/tasks/task-1',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          status: 'Invalid_Status_Name',
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

  } finally {
    // Restore mocks
    prisma.user.findUnique = originalUserFindUnique;
    prisma.task.findMany = originalTaskFindMany;
    prisma.task.findFirst = originalTaskFindFirst;
    prisma.task.create = originalTaskCreate;
    prisma.task.update = originalTaskUpdate;
    prisma.subtask.findFirst = originalSubtaskFindFirst;
    prisma.subtask.create = originalSubtaskCreate;
    prisma.subtask.update = originalSubtaskUpdate;
    prisma.escalation.findFirst = originalEscalationFindFirst;
    prisma.escalation.create = originalEscalationCreate;
    prisma.project.findFirst = originalProjectFindFirst;
    prisma.auditLog.create = originalAuditLogCreate;
  }

  console.log(`\nStep 7 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error in Step 7:', err);
  process.exit(1);
});
