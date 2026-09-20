import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Runs a callback within an async request context.
 *
 * @param {object} context - Store object containing requestId, actor, companyId, etc.
 * @param {Function} callback
 * @returns {*}
 */
export function runWithContext(context, callback) {
  return asyncLocalStorage.run(context, callback);
}

/**
 * Returns the current request context store, or undefined if outside a request.
 *
 * @returns {object|undefined}
 */
export function getContext() {
  return asyncLocalStorage.getStore();
}

/**
 * Returns the current request ID, or a fallback string if unavailable.
 *
 * @returns {string}
 */
export function getRequestId() {
  const store = getContext();
  return store?.requestId || 'req_untracked';
}

/**
 * Returns the current tenant company ID from context.
 *
 * @returns {string|undefined}
 */
export function getTenantId() {
  const store = getContext();
  return store?.companyId;
}

/**
 * Returns the current authenticated actor from context.
 *
 * @returns {object|undefined}
 */
export function getActor() {
  const store = getContext();
  return store?.actor;
}
