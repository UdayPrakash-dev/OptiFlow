import { prisma } from '../config/prisma.js';
import { requireRoles } from '../middleware/authorize.js';
import { NotFoundError, BadRequestError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { validateRequired, validateEmail } from '../utils/validation.js';
import { ROLES, normalizeRole } from '../utils/roles.js';
import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';

export async function listAuditLogs(req, res, next) {
  try {
    const { entityType, entityId } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        companyId: req.user.companyId,
        ...(entityType ? { entityType: String(entityType) } : {}),
        ...(entityId ? { entityId: String(entityId) } : {}),
      },
      include: {
        performedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { performedAt: 'desc' },
      take: 100,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogsByUser(req, res, next) {
  try {
    const { userId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: {
        companyId: req.user.companyId,
        performedById: userId,
      },
      include: {
        performedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { performedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogsByEntity(req, res, next) {
  try {
    const { entityType, entityId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: {
        companyId: req.user.companyId,
        entityType,
        entityId: String(entityId),
      },
      include: {
        performedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { performedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

export async function createAuditLogEndpoint(req, res, next) {
  try {
    const { action, entityType, entityId, oldValue, newValue } = req.body;
    validateRequired(req.body, ['entityType', 'entityId']);

    const validAction = action && Object.values(AUDIT_ACTIONS).includes(action.toUpperCase())
      ? action.toUpperCase()
      : AUDIT_ACTIONS.UPDATE;

    const created = await createAuditLog({
      companyId: req.user.companyId,
      entityType: String(entityType),
      entityId: String(entityId),
      action: validAction,
      performedById: req.user.id,
      ipAddress: req.ip || req.socket?.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    });

    res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
}

