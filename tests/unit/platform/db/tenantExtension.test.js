import { describe, it, expect, vi } from 'vitest';
import { createTenantClient, withTenant, runAsSystem, TENANT_SCOPED_MODELS, SOFT_DELETE_MODELS } from '#platform/db/prisma.js';
import { AppError } from '#platform/errors/AppError.js';
import { requestContextStorage } from '#platform/context/requestContext.js';

describe('Prisma Tenant & Soft-Delete Extension', () => {
  const fakeTenantId = '11111111-2222-3333-4444-555555555555';

  it('correctly classifies tenant-scoped and soft-delete models', () => {
    expect(TENANT_SCOPED_MODELS.has('User')).toBe(true);
    expect(TENANT_SCOPED_MODELS.has('Task')).toBe(true);
    expect(TENANT_SCOPED_MODELS.has('Project')).toBe(true);
    expect(TENANT_SCOPED_MODELS.has('Plan')).toBe(false);
    expect(TENANT_SCOPED_MODELS.has('PlatformAdminUser')).toBe(false);

    expect(SOFT_DELETE_MODELS.has('Task')).toBe(true);
    expect(SOFT_DELETE_MODELS.has('Project')).toBe(true);
    expect(SOFT_DELETE_MODELS.has('User')).toBe(false);
  });

  it('throws AppError with 403 when a tenant model is queried without tenant context', async () => {
    // Mock base PrismaClient
    const mockQuery = vi.fn().mockResolvedValue([]);
    const mockClient = {
      $extends: (extension) => {
        const op = extension.query.$allModels.$allOperations;
        return {
          task: {
            findMany: (args) => op({ model: 'Task', operation: 'findMany', args, query: mockQuery })
          }
        };
      }
    };

    const client = createTenantClient(mockClient, () => undefined);

    await expect(client.task.findMany({}))
      .rejects
      .toThrow(AppError);

    await expect(client.task.findMany({}))
      .rejects
      .toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN'
      });

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('injects companyId and deletedAt: null when querying a tenant & soft-delete model', async () => {
    let passedArgs = null;
    const mockQuery = vi.fn().mockImplementation((args) => {
      passedArgs = args;
      return Promise.resolve([{ id: 'task-1', title: 'Test Task' }]);
    });

    const mockClient = {
      $extends: (extension) => {
        const op = extension.query.$allModels.$allOperations;
        return {
          task: {
            findMany: (args) => op({ model: 'Task', operation: 'findMany', args, query: mockQuery })
          }
        };
      }
    };

    const client = createTenantClient(mockClient, () => fakeTenantId);

    const result = await client.task.findMany({
      where: { status: 'Active' }
    });

    expect(result).toHaveLength(1);
    expect(passedArgs).toEqual({
      where: {
        status: 'Active',
        companyId: fakeTenantId,
        deletedAt: null
      }
    });
  });

  it('does not alter queries on non-tenant, non-soft-delete models (e.g. Plan)', async () => {
    let passedArgs = null;
    const mockQuery = vi.fn().mockImplementation((args) => {
      passedArgs = args;
      return Promise.resolve([{ id: 'plan-1', name: 'Enterprise' }]);
    });

    const mockClient = {
      $extends: (extension) => {
        const op = extension.query.$allModels.$allOperations;
        return {
          plan: {
            findMany: (args) => op({ model: 'Plan', operation: 'findMany', args, query: mockQuery })
          }
        };
      }
    };

    // Even with no tenant context
    const client = createTenantClient(mockClient, () => undefined);

    const result = await client.plan.findMany({ where: { allowsIntegrations: true } });

    expect(result).toHaveLength(1);
    expect(passedArgs).toEqual({ where: { allowsIntegrations: true } });
  });

  it('auto-injects companyId into create operations if missing', async () => {
    let passedArgs = null;
    const mockQuery = vi.fn().mockImplementation((args) => {
      passedArgs = args;
      return Promise.resolve({ id: 'task-123', ...args.data });
    });

    const mockClient = {
      $extends: (extension) => {
        const op = extension.query.$allModels.$allOperations;
        return {
          task: {
            create: (args) => op({ model: 'Task', operation: 'create', args, query: mockQuery })
          }
        };
      }
    };

    const client = createTenantClient(mockClient, () => fakeTenantId);

    const created = await client.task.create({
      data: {
        title: 'New Task',
        createdById: 'user-1'
      }
    });

    expect(created.id).toBe('task-123');
    expect(passedArgs.data.companyId).toBe(fakeTenantId);
  });

  it('withTenant sets ambient tenant context properly', async () => {
    const contextResults = await withTenant(fakeTenantId, async () => {
      const store = requestContextStorage.getStore();
      return store?.companyId;
    });

    expect(contextResults).toBe(fakeTenantId);
  });

  it('runAsSystem sets system actor and target companyId', async () => {
    const contextResults = await runAsSystem(fakeTenantId, async () => {
      const store = requestContextStorage.getStore();
      return {
        companyId: store?.companyId,
        actor: store?.actor
      };
    });

    expect(contextResults.companyId).toBe(fakeTenantId);
    expect(contextResults.actor).toEqual({ id: 'SYSTEM', type: 'system', roleTitle: 'System Automation' });
  });
});
