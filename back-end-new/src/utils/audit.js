import { prisma } from '../config/prisma.js';
import { BadRequestError } from './errors.js';

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  LOGIN: 'LOGIN',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
};

const VALID_ACTIONS = new Set(Object.values(AUDIT_ACTIONS));

/**
 * Creates an immutable audit log entry in PostgreSQL using Prisma.
 * Strictly validates company context and schema enum values.
 * Throws on failure so callers can await and handle persistence errors explicitly.
 */
export async function createAuditLog({
  companyId,
  entityType,
  entityId,
  action,
  performedById = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
  usedPermissionSlug = null,
}) {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new BadRequestError('Audit log creation failed: companyId is required');
  }

  if (!entityType || typeof entityType !== 'string' || entityType.trim() === '') {
    throw new BadRequestError('Audit log creation failed: entityType is required');
  }

  if (entityId === undefined || entityId === null || String(entityId).trim() === '') {
    throw new BadRequestError('Audit log creation failed: entityId is required');
  }

  const normalizedAction = (typeof action === 'string' ? action.trim().toUpperCase() : '');
  if (!VALID_ACTIONS.has(normalizedAction)) {
    throw new BadRequestError(
      `Audit log creation failed: action must be one of ${Array.from(VALID_ACTIONS).join(', ')}`
    );
  }

  return await prisma.auditLog.create({
    data: {
      companyId: companyId.trim(),
      entityType: entityType.trim(),
      entityId: String(entityId).trim(),
      action: normalizedAction,
      performedById: performedById ? String(performedById).trim() : null,
      oldValue: oldValue ?? undefined,
      newValue: newValue ?? undefined,
      ipAddress: ipAddress ? String(ipAddress).trim() : null,
      userAgent: userAgent ? String(userAgent).trim() : null,
    },
  });
}

