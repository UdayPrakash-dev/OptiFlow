import { strict as assert } from 'node:assert';
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import notificationsRoutes from './src/routes/notifications.routes.js';
import complianceRoutes from './src/routes/compliance.routes.js';
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
  app.use(notificationsRoutes);
  app.use(complianceRoutes);
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
  console.log('\n--- Running Step 8 Tests: Notifications, Compliance & Evidence ---');
  const app = createTestApp();

  const ownerToken = createToken({
    sub: 'user-owner',
    companyId: 'comp-1',
    role: ROLES.COMPANY_OWNER,
  });

  const memberToken = createToken({
    sub: 'user-member',
    companyId: 'comp-1',
    role: ROLES.TEAM_MEMBER,
  });

  const foreignToken = createToken({
    sub: 'user-foreign',
    companyId: 'comp-2',
    role: ROLES.COMPANY_OWNER,
  });

  // Mock setup
  const originalUserFindUnique = prisma.user.findUnique;
  const originalUserFindFirst = prisma.user.findFirst;
  const originalNotificationFindMany = prisma.notification.findMany;
  const originalNotificationFindUnique = prisma.notification.findUnique;
  const originalNotificationCreate = prisma.notification.create;
  const originalNotificationUpdate = prisma.notification.update;
  const originalNotificationUpdateMany = prisma.notification.updateMany;
  const originalComplianceRuleFindMany = prisma.complianceRule.findMany;
  const originalComplianceRuleFindFirst = prisma.complianceRule.findFirst;
  const originalComplianceRuleCreate = prisma.complianceRule.create;
  const originalComplianceViolationFindFirst = prisma.complianceViolation.findFirst;
  const originalComplianceViolationCreate = prisma.complianceViolation.create;
  const originalComplianceViolationUpdate = prisma.complianceViolation.update;
  const originalComplianceEvidenceFindFirst = prisma.complianceEvidence.findFirst;
  const originalComplianceEvidenceCreate = prisma.complianceEvidence.create;
  const originalComplianceEvidenceUpdate = prisma.complianceEvidence.update;
  const originalAuditLogCreate = prisma.auditLog.create;

  prisma.user.findUnique = async ({ where }) => {
    if (where.id === 'user-owner') {
      return {
        id: 'user-owner',
        companyId: 'comp-1',
        email: 'owner@example.com',
        isActive: true,
        roleAssignments: [{ role: { label: ROLES.COMPANY_OWNER } }],
      };
    }
    if (where.id === 'user-member') {
      return {
        id: 'user-member',
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

  prisma.auditLog.create = async () => ({ id: 'audit-log-1' });

  try {
    // 1. Notification listing scoped to member
    await runAsyncTest('Members list only their own notifications', async () => {
      prisma.notification.findMany = async ({ where }) => {
        assert.equal(where.userId, 'user-member');
        return [{ id: 'notif-1', title: 'Task Assigned', userId: 'user-member', isRead: false }];
      };

      const res = await makeRequest(app, {
        method: 'GET',
        path: '/notifications',
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 1);
    });

    // 2. Notification creation validates recipient belongs to company
    await runAsyncTest('Notification creation rejects foreign tenant recipient', async () => {
      prisma.user.findFirst = async () => null;

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/notifications',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: {
          userId: 'user-foreign',
          title: 'Hello',
          message: 'World',
        },
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    // 3. Mark notification as read verifies ownership/tenant
    await runAsyncTest('Rejects marking notification of another company as read', async () => {
      prisma.notification.findUnique = async () => ({
        id: 'notif-other',
        userId: 'user-other',
        user: { id: 'user-other', companyId: 'comp-2' },
      });

      const res = await makeRequest(app, {
        method: 'PATCH',
        path: '/notifications/notif-other/read',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    // 4. Compliance rule creation with audit
    await runAsyncTest('Creates compliance rule with validation and audit', async () => {
      let auditCalled = false;
      prisma.auditLog.create = async () => {
        auditCalled = true;
        return { id: 'audit-1' };
      };

      prisma.complianceRule.create = async ({ data }) => {
        assert.equal(data.companyId, 'comp-1');
        assert.equal(data.name, 'SOC2 Rule 1');
        assert.equal(data.severity, 'High');
        return { id: 'rule-1', ...data };
      };

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/compliance-rules',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: {
          name: 'SOC2 Rule 1',
          description: 'Ensure all tasks are tracked',
          severity: 'High',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'rule-1');
      assert.equal(auditCalled, true);
    });

    // 5. Compliance violation creation
    await runAsyncTest('Creates compliance violation linked to valid rule', async () => {
      prisma.complianceRule.findFirst = async ({ where }) => {
        if (where.id === 'rule-1') {
          return { id: 'rule-1', name: 'SOC2 Rule 1', companyId: 'comp-1' };
        }
        return null;
      };

      prisma.complianceViolation.create = async ({ data }) => {
        assert.equal(data.companyId, 'comp-1');
        assert.equal(data.ruleId, 'rule-1');
        return { id: 'violation-1', ...data };
      };

      const res = await makeRequest(app, {
        method: 'POST',
        path: '/compliance-violations',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: {
          ruleId: 'rule-1',
          entityType: 'Task',
          entityId: 'task-1',
          severity: 'Critical',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, 'violation-1');
    });

    // 6. Evidence approval auto-resolves linked violation
    await runAsyncTest('Approving evidence auto-resolves linked violation', async () => {
      let violationResolved = false;

      prisma.complianceEvidence.findFirst = async ({ where }) => {
        if (where.id === 'ev-1' && where.companyId === 'comp-1') {
          return {
            id: 'ev-1',
            companyId: 'comp-1',
            title: 'Audit Report PDF',
            violationId: 'violation-1',
            status: 'Pending',
          };
        }
        return null;
      };

      prisma.complianceEvidence.update = async ({ where, data }) => ({
        id: where.id,
        ...data,
      });

      prisma.complianceViolation.update = async ({ where, data }) => {
        assert.equal(where.id, 'violation-1');
        assert.equal(data.status, 'Resolved');
        violationResolved = true;
        return { id: 'violation-1', ...data };
      };

      const res = await makeRequest(app, {
        method: 'PATCH',
        path: '/evidence/ev-1',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: {
          status: 'Approved',
        },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(violationResolved, true);
    });

    // 7. Multipart evidence upload creates attachment and sets fileUrl
    await runAsyncTest('Uploads evidence file, creates Attachment, and updates fileUrl', async () => {
      let attachmentCreated = false;
      let evidenceUpdated = false;

      prisma.complianceEvidence.findFirst = async ({ where }) => {
        if (where.id === 'ev-upload-1' && where.companyId === 'comp-1') {
          return {
            id: 'ev-upload-1',
            companyId: 'comp-1',
            userId: 'user-member',
            title: 'Uploaded Compliance Evidence',
            status: 'Pending',
            fileUrl: '',
          };
        }
        return null;
      };

      prisma.attachment = prisma.attachment || {};
      prisma.attachment.create = async ({ data }) => {
        assert.equal(data.companyId, 'comp-1');
        assert.equal(data.entityType, 'ComplianceEvidence');
        assert.equal(data.entityId, 'ev-upload-1');
        assert.equal(data.fileName, 'audit_report.pdf');
        attachmentCreated = true;
        return { id: 'att-1', ...data };
      };

      prisma.complianceEvidence.update = async ({ where, data }) => {
        assert.equal(where.id, 'ev-upload-1');
        assert.ok(data.fileUrl.startsWith('/uploads/'));
        evidenceUpdated = true;
        return { id: where.id, ...data };
      };

      const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
      const fileData = 'PDF-1.4 mock compliance evidence file content';
      const multipartBody = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audit_report.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
        Buffer.from(fileData),
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const res = await new Promise((resolve, reject) => {
        const server = app.listen(0, () => {
          const port = server.address().port;
          const req = http.request(
            {
              hostname: '127.0.0.1',
              port,
              path: '/evidence/ev-upload-1/upload',
              method: 'POST',
              headers: {
                Authorization: `Bearer ${memberToken}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': multipartBody.length,
              },
            },
            (response) => {
              let data = '';
              response.on('data', (chunk) => { data += chunk; });
              response.on('end', () => {
                server.close();
                resolve({ status: response.statusCode, body: JSON.parse(data) });
              });
            }
          );
          req.on('error', (err) => { server.close(); reject(err); });
          req.write(multipartBody);
          req.end();
        });
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(attachmentCreated, true);
      assert.equal(evidenceUpdated, true);
    });

    // 8. Cross-tenant evidence file access prevention
    await runAsyncTest('Prevents cross-tenant streaming of evidence file', async () => {
      prisma.complianceEvidence.findFirst = async ({ where }) => {
        if (where.companyId === 'comp-2') return null; // Belongs to comp-1
        return {
          id: 'ev-1',
          companyId: 'comp-1',
          fileUrl: '/uploads/sample.pdf',
        };
      };

      const res = await makeRequest(app, {
        method: 'GET',
        path: '/evidence/ev-1/file',
        headers: { Authorization: `Bearer ${foreignToken}` },
      });
      assert.equal(res.status, 404);
    });

  } finally {
    // Restore mocks
    prisma.user.findUnique = originalUserFindUnique;
    prisma.user.findFirst = originalUserFindFirst;
    prisma.notification.findMany = originalNotificationFindMany;
    prisma.notification.findUnique = originalNotificationFindUnique;
    prisma.notification.create = originalNotificationCreate;
    prisma.notification.update = originalNotificationUpdate;
    prisma.notification.updateMany = originalNotificationUpdateMany;
    prisma.complianceRule.findMany = originalComplianceRuleFindMany;
    prisma.complianceRule.findFirst = originalComplianceRuleFindFirst;
    prisma.complianceRule.create = originalComplianceRuleCreate;
    prisma.complianceViolation.findFirst = originalComplianceViolationFindFirst;
    prisma.complianceViolation.create = originalComplianceViolationCreate;
    prisma.complianceViolation.update = originalComplianceViolationUpdate;
    prisma.complianceEvidence.findFirst = originalComplianceEvidenceFindFirst;
    prisma.complianceEvidence.create = originalComplianceEvidenceCreate;
    prisma.complianceEvidence.update = originalComplianceEvidenceUpdate;
    prisma.auditLog.create = originalAuditLogCreate;
  }

  console.log(`\nStep 8 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error in Step 8:', err);
  process.exit(1);
});
