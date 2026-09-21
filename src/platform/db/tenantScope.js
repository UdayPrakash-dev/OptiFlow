import { requestContextStorage, getCompanyId, getActor } from '#platform/context/requestContext.js';
import { AppError } from '#platform/errors/AppError.js';
import { logger } from '#platform/logging/logger.js';

/**
 * Executes an asynchronous function within an explicit tenant context.
 *
 * @template T
 * @param {string} companyId - The tenant's company UUID
 * @param {() => Promise<T> | T} fn - The callback function to execute
 * @returns {Promise<T>}
 */
export async function withTenant(companyId, fn) {
  if (!companyId || typeof companyId !== 'string') {
    throw AppError.badRequest('A valid string companyId is required for withTenant execution');
  }

  const existingStore = requestContextStorage.getStore() || {};
  return requestContextStorage.run({
    ...existingStore,
    companyId
  }, fn);
}

/**
 * Executes an asynchronous function within a system actor context for a specified tenant.
 * Used for background jobs, automated compliance evaluation, and system events.
 *
 * @template T
 * @param {string} companyId - The target tenant company UUID
 * @param {() => Promise<T> | T} fn - The callback function to execute
 * @returns {Promise<T>}
 */
export async function runAsSystem(companyId, fn) {
  if (!companyId || typeof companyId !== 'string') {
    throw AppError.badRequest('A valid string companyId is required for runAsSystem execution');
  }

  const existingStore = requestContextStorage.getStore() || {};
  return requestContextStorage.run({
    ...existingStore,
    companyId,
    actor: { id: 'SYSTEM', type: 'system', roleTitle: 'System Automation' }
  }, fn);
}

/**
 * Executes an asynchronous function within an explicit actor and tenant context.
 *
 * @template T
 * @param {object} actor - The user actor object ({ id, email, roleIds, ... })
 * @param {string} companyId - The tenant company UUID
 * @param {() => Promise<T> | T} fn - The callback function to execute
 * @returns {Promise<T>}
 */
export async function runWithActor(actor, companyId, fn) {
  if (!actor || !actor.id) {
    throw AppError.badRequest('A valid actor object is required');
  }
  if (!companyId || typeof companyId !== 'string') {
    throw AppError.badRequest('A valid string companyId is required');
  }

  const existingStore = requestContextStorage.getStore() || {};
  return requestContextStorage.run({
    ...existingStore,
    actor,
    companyId
  }, fn);
}

/**
 * Verifies that a given resource's companyId matches the ambient tenant context.
 * Throws AppError.notFound (or forbidden) to prevent information leakage if cross-tenant access is attempted.
 *
 * @param {string} resourceCompanyId - The companyId on the resource being accessed
 * @param {string} [ambientCompanyId] - Optional companyId to test against (defaults to active context)
 * @throws {AppError}
 */
export function assertTenantAccess(resourceCompanyId, ambientCompanyId = getCompanyId()) {
  if (!ambientCompanyId) {
    throw AppError.forbidden('Access denied: No active tenant context');
  }

  if (resourceCompanyId !== ambientCompanyId) {
    logger.warn({
      resourceCompanyId,
      ambientCompanyId,
      actor: getActor()
    }, '[Multi-Tenancy Breach Prevented] Actor attempted cross-tenant resource access');

    // Return 404 Not Found to prevent confirming the existence of another tenant's resource
    throw AppError.notFound('Resource');
  }
}
