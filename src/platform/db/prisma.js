import { PrismaClient } from '@prisma/client';
import { getCompanyId } from '#platform/context/requestContext.js';
import { AppError } from '#platform/errors/AppError.js';
import { logger } from '#platform/logging/logger.js';

export { withTenant, runAsSystem, runWithActor, assertTenantAccess } from './tenantScope.js';

/**
 * Set of Prisma models that are owned by a tenant and must always be scoped by `companyId`.
 */
export const TENANT_SCOPED_MODELS = new Set([
  'User',
  'Branch',
  'Team',
  'TeamMember',
  'Role',
  'RoleAssignment',
  'Project',
  'Task',
  'Subtask',
  'Escalation',
  'ProcessTemplate',
  'ProcessTemplateStep',
  'ProcessInstance',
  'ProcessInstanceStep',
  'ComplianceCategory',
  'ComplianceRule',
  'ComplianceBinding',
  'ComplianceViolation',
  'ComplianceEvidence',
  'FileObject',
  'Notification',
  'AuditLog'
]);

/**
 * Set of models that implement soft-deletion via `deletedAt`.
 */
export const SOFT_DELETE_MODELS = new Set([
  'Project',
  'Task',
  'Subtask',
  'FileObject'
]);

/**
 * Base unscoped PrismaClient instance.
 * Direct use is restricted to platform administration and system initialization.
 */
export const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

/**
 * Creates the tenant-scoped and soft-delete aware Prisma extension.
 *
 * @param {PrismaClient} client
 * @param {() => string | undefined} [resolveTenantId=getCompanyId]
 */
export function createTenantClient(client = basePrisma, resolveTenantId = getCompanyId) {
  return client.$extends({
    name: 'OptiFlowTenantAndSoftDeleteExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const isTenantModel = TENANT_SCOPED_MODELS.has(model);
          const isSoftDeleteModel = SOFT_DELETE_MODELS.has(model);

          if (!isTenantModel && !isSoftDeleteModel) {
            return query(args);
          }

          args = args || {};

          // Apply Tenant Isolation
          if (isTenantModel) {
            const companyId = resolveTenantId();

            if (!companyId) {
              const errorMessage = `[Multi-Tenancy Violation] Attempted ${operation} on tenant model '${model}' without active companyId context.`;
              logger.error({ model, operation }, errorMessage);
              throw AppError.forbidden(`Access denied: Missing tenant context for operation on '${model}'`);
            }

            // Read operations: inject companyId into where clause
            if ([
              'findFirst',
              'findFirstOrThrow',
              'findMany',
              'count',
              'aggregate',
              'groupBy'
            ].includes(operation)) {
              args.where = { ...args.where, companyId };
            }

            // findUnique / findUniqueOrThrow: convert to findFirst with companyId scope to ensure tenant boundary
            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              if (args.where) {
                args.where = { ...args.where, companyId };
              }
            }

            // Create operations: auto-inject companyId into data payload if not present
            if (operation === 'create') {
              if (args.data) {
                if (!args.data.company && !args.data.companyId) {
                  args.data = { ...args.data, companyId };
                }
              }
            }

            if (operation === 'createMany' || operation === 'createManyAndReturn') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item) => ({
                  ...item,
                  companyId: item.companyId || companyId
                }));
              }
            }

            // Mutation operations: ensure where clause is scoped to tenant
            if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
              if (args.where) {
                args.where = { ...args.where, companyId };
              }
            }
          }

          // Apply Soft-Delete Filtering on read queries
          if (isSoftDeleteModel) {
            if ([
              'findFirst',
              'findFirstOrThrow',
              'findMany',
              'findUnique',
              'findUniqueOrThrow',
              'count',
              'aggregate',
              'groupBy'
            ].includes(operation)) {
              // Only filter deletedAt if caller has not explicitly requested deleted records
              if (args.where && args.where.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              } else if (!args.where) {
                args.where = { deletedAt: null };
              }
            }
          }

          return query(args);
        }
      }
    }
  });
}

/**
 * Standard tenant-scoped Prisma client instance.
 * Automatically derives the current tenant from the active AsyncLocalStorage request context.
 */
export const prisma = createTenantClient(basePrisma);

/**
 * Explicit escape hatch for platform-admin, cross-tenant migrations, or system jobs.
 */
export const unscopedPrisma = basePrisma;
prisma.unscoped = basePrisma;
