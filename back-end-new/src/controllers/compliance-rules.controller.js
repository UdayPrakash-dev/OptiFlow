import { runComplianceEngine } from "../engine/compliance.engine.js";
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { prisma } from '../config/prisma.js';
import { requireRoles } from '../middleware/authorize.js';
import { NotFoundError, BadRequestError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { validateRequired, validateEnum } from '../utils/validation.js';
import { ROLES, normalizeRole } from '../utils/roles.js';
import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const ALLOWED_VIOLATION_STATUSES = ['Open', 'Under_Review', 'Resolved', 'Ignored'];
const ALLOWED_EVIDENCE_STATUSES = ['Pending', 'Under_Review', 'Approved', 'Rejected'];


export async function listComplianceRules(req, res, next) {
  try {
    const rules = await prisma.complianceRule.findMany({
      where: {
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
      include: {
        category: true,
        bindings: true,
        violations: { where: { companyId: req.user.companyId, status: 'Open' } },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplianceRuleById(req, res, next) {
  try {
    const { id } = req.params;

    const rule = await prisma.complianceRule.findFirst({
      where: {
        id,
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
      include: {
        category: true,
        bindings: true,
        violations: { where: { companyId: req.user.companyId } },
      },
    });

    if (!rule) {
      throw new NotFoundError(`Compliance rule with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (err) {
    next(err);
  }
}

export async function createComplianceRule(req, res, next) {
  try {
    const body = req.body || {};
    const name = (body.name || body.rule_name || '').trim();
    const description = (body.description || '').trim();
    const severity = body.severity || 'Medium';
    const categoryId = body.categoryId || body.category_id || null;
    const sourceTemplateId = body.sourceTemplateId || body.source_template_id || null;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : (body.is_active !== undefined ? Boolean(body.is_active) : true);

    validateRequired({ name, description }, ['name', 'description']);
    validateEnum(severity, ALLOWED_SEVERITIES, 'severity');

    if (categoryId) {
      const category = await prisma.complianceCategory.findFirst({
        where: { id: categoryId, OR: [{ companyId: null }, { companyId: req.user.companyId }] },
      });
      if (!category) {
        throw new NotFoundError(`Compliance category ${categoryId} not found`);
      }
    }

    const newRule = await prisma.complianceRule.create({
      data: {
        companyId: req.user.companyId,
        name,
        description,
        severity,
        categoryId,
        sourceTemplateId,
        isActive,
      },
      include: { category: true, bindings: true },
    });

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceRule',
        entityId: newRule.id,
        action: AUDIT_ACTIONS.CREATE,
        performedById: req.user.id,
        newValue: { name: newRule.name, severity: newRule.severity },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for compliance rule creation:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Compliance rule created successfully',
      data: newRule,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateComplianceRule(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.complianceRule.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance rule with ID ${id} not found in this company`);
    }

    const updateData = {};
    if (body.name || body.rule_name) {
      updateData.name = (body.name || body.rule_name).trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description.trim();
    }
    if (body.severity) {
      validateEnum(body.severity, ALLOWED_SEVERITIES, 'severity');
      updateData.severity = body.severity;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    } else if (body.is_active !== undefined) {
      updateData.isActive = Boolean(body.is_active);
    }

    const updated = await prisma.complianceRule.update({
      where: { id },
      data: updateData,
      include: { category: true, bindings: true },
    });

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceRule',
        entityId: id,
        action: AUDIT_ACTIONS.UPDATE,
        performedById: req.user.id,
        oldValue: { name: existing.name, severity: existing.severity },
        newValue: updateData,
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for compliance rule update:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Compliance rule updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComplianceRule(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.complianceRule.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance rule with ID ${id} not found in this company`);
    }

    await prisma.complianceRule.delete({
      where: { id },
    });

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceRule',
        entityId: id,
        action: AUDIT_ACTIONS.DELETE,
        performedById: req.user.id,
        oldValue: { name: existing.name },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for compliance rule delete:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Compliance rule deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}


import { runComplianceEngine } from '../engine/compliance.engine.js';

/**
 * POST /api/compliance/rules/run-engine
 * Manually triggers the automated compliance engine for the tenant.
 */
export async function triggerComplianceEngine(req, res, next) {
  try {
    const result = await runComplianceEngine(req.user.companyId);
    res.status(200).json({
      success: true,
      message: `Engine completed. Found ${result.newViolations} new violations.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}
