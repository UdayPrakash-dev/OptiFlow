import { describe, it, expect, vi } from 'vitest';
import { createTenantClient } from '#platform/db/prisma.js';
import { withTenant, runAsSystem, runWithActor, assertTenantAccess } from '#platform/db/tenantScope.js';
import { AppError } from '#platform/errors/AppError.js';
import { requestContextStorage } from '#platform/context/requestContext.js';

describe('Tenancy Execution Scopes & Cross-Tenant Isolation', () => {
  const TENANT_A = 'aaaa1111-0000-0000-0000-000000000001';
  const TENANT_B = 'bbbb2222-0000-0000-0000-000000000002';

  // In-memory data store mimicking database rows for isolation verification
  const databaseRows = [
    { id: 'task-a-1', companyId: TENANT_A, title: 'Tenant A Secret Task', deletedAt: null },
    { id: 'task-a-deleted', companyId: TENANT_A, title: 'Tenant A Deleted Task', deletedAt: new Date() },
    { id: 'task-b-1', companyId: TENANT_B, title: 'Tenant B Confidential Plan', deletedAt: null }
  ];

  function createMockDbClient(resolveTenantId) {
    const rawClient = {
      $extends: (extension) => {
        const op = extension.query.$allModels.$allOperations;
        return {
          task: {
            findMany: (args) => op({
              model: 'Task',
              operation: 'findMany',
              args,
              query: async (modifiedArgs) => {
                return databaseRows.filter((row) => {
                  if (modifiedArgs.where.companyId && row.companyId !== modifiedArgs.where.companyId) {
                    return false;
                  }
                  if (modifiedArgs.where.deletedAt === null && row.deletedAt !== null) {
                    return false;
                  }
                  if (modifiedArgs.where.id && row.id !== modifiedArgs.where.id) {
                    return false;
                  }
                  return true;
                });
              }
            }),
            findFirst: (args) => op({
              model: 'Task',
              operation: 'findFirst',
              args,
              query: async (modifiedArgs) => {
                return databaseRows.find((row) => {
                  if (modifiedArgs.where.companyId && row.companyId !== modifiedArgs.where.companyId) {
                    return false;
                  }
                  if (modifiedArgs.where.deletedAt === null && row.deletedAt !== null) {
                    return false;
                  }
                  if (modifiedArgs.where.id && row.id !== modifiedArgs.where.id) {
                    return false;
                  }
                  return true;
                }) || null;
              }
            }),
            updateMany: (args) => op({
              model: 'Task',
              operation: 'updateMany',
              args,
              query: async (modifiedArgs) => {
                const affected = databaseRows.filter((row) => {
                  if (modifiedArgs.where.companyId && row.companyId !== modifiedArgs.where.companyId) {
                    return false;
                  }
                  if (modifiedArgs.where.id && row.id !== modifiedArgs.where.id) {
                    return false;
                  }
                  return true;
                });
                return { count: affected.length };
              }
            }),
            deleteMany: (args) => op({
              model: 'Task',
              operation: 'deleteMany',
              args,
              query: async (modifiedArgs) => {
                const affected = databaseRows.filter((row) => {
                  if (modifiedArgs.where.companyId && row.companyId !== modifiedArgs.where.companyId) {
                    return false;
                  }
                  if (modifiedArgs.where.id && row.id !== modifiedArgs.where.id) {
                    return false;
                  }
                  return true;
                });
                return { count: affected.length };
              }
            })
          }
        };
      }
    };

    return createTenantClient(rawClient, resolveTenantId);
  }

  it('prevents Tenant A from reading Tenant B records by ID', async () => {
    await withTenant(TENANT_A, async () => {
      const db = createMockDbClient(() => requestContextStorage.getStore()?.companyId);

      // Query Tenant A's own task -> Found
      const ownTask = await db.task.findFirst({ where: { id: 'task-a-1' } });
      expect(ownTask).not.toBeNull();
      expect(ownTask.title).toBe('Tenant A Secret Task');

      // Attempt to query Tenant B's task by ID -> Null (Not found within Tenant A)
      const foreignTask = await db.task.findFirst({ where: { id: 'task-b-1' } });
      expect(foreignTask).toBeNull();
    });
  });

  it('prevents Tenant A from updating or deleting Tenant B records', async () => {
    await withTenant(TENANT_A, async () => {
      const db = createMockDbClient(() => requestContextStorage.getStore()?.companyId);

      // Attempt to update Tenant B's task by ID
      const updateResult = await db.task.updateMany({
        where: { id: 'task-b-1' },
        data: { title: 'Compromised Title' }
      });
      expect(updateResult.count).toBe(0);

      // Attempt to delete Tenant B's task by ID
      const deleteResult = await db.task.deleteMany({
        where: { id: 'task-b-1' }
      });
      expect(deleteResult.count).toBe(0);
    });
  });

  it('assertTenantAccess throws 404 Not Found on cross-tenant resource mismatch to prevent enumeration', () => {
    requestContextStorage.run({ companyId: TENANT_A }, () => {
      // Accessing own tenant resource -> OK
      expect(() => assertTenantAccess(TENANT_A)).not.toThrow();

      // Accessing other tenant resource -> Throws 404
      expect(() => assertTenantAccess(TENANT_B))
        .toThrow(AppError);

      try {
        assertTenantAccess(TENANT_B);
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
      }
    });
  });

  it('runWithActor establishes actor and tenant context', async () => {
    const actor = { id: 'usr-100', email: 'alice@tenant-a.com', role: 'Project Manager' };

    await runWithActor(actor, TENANT_A, async () => {
      const store = requestContextStorage.getStore();
      expect(store.companyId).toBe(TENANT_A);
      expect(store.actor).toEqual(actor);
    });
  });

  it('runAsSystem establishes system actor and target tenant', async () => {
    await runAsSystem(TENANT_B, async () => {
      const store = requestContextStorage.getStore();
      expect(store.companyId).toBe(TENANT_B);
      expect(store.actor.type).toBe('system');
    });
  });

  it('automatically excludes soft-deleted records within the tenant', async () => {
    await withTenant(TENANT_A, async () => {
      const db = createMockDbClient(() => requestContextStorage.getStore()?.companyId);

      const tasks = await db.task.findMany({});
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-a-1');
      expect(tasks.some((t) => t.id === 'task-a-deleted')).toBe(false);
    });
  });
});
