import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRoles } from '../middleware/authorize.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';
import { validateRequired, validateEnum } from '../utils/validation.js';
import { ROLES } from '../utils/roles.js';
import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${safeName}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Unsupported file type: ${file.mimetype}`), false);
    }
  },
});

const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const ALLOWED_VIOLATION_STATUSES = ['Open', 'Under_Review', 'Resolved', 'Ignored'];
const ALLOWED_EVIDENCE_STATUSES = ['Pending', 'Under_Review', 'Approved', 'Rejected'];

// ============================================================================
// 1. COMPLIANCE RULES
// ============================================================================

/**
 * GET /compliance-rules & GET /api/compliance-rules
 */
async function listComplianceRules(req, res, next) {
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

/**
 * GET /compliance-rules/:id & GET /api/compliance-rules/:id
 */
async function getComplianceRuleById(req, res, next) {
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

/**
 * POST /compliance-rules & POST /api/compliance-rules
 */
async function createComplianceRule(req, res, next) {
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

/**
 * PATCH /compliance-rules/:id & PATCH /api/compliance-rules/:id
 */
async function updateComplianceRule(req, res, next) {
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

/**
 * DELETE /compliance-rules/:id & DELETE /api/compliance-rules/:id
 */
async function deleteComplianceRule(req, res, next) {
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

// ============================================================================
// 2. COMPLIANCE VIOLATIONS
// ============================================================================

/**
 * GET /compliance-violations & GET /api/compliance-violations
 */
async function listComplianceViolations(req, res, next) {
  try {
    const violations = await prisma.complianceViolation.findMany({
      where: { companyId: req.user.companyId },
      include: {
        rule: true,
        reportedBy: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true, email: true } },
        evidence: true,
      },
      orderBy: { detectedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: violations,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /compliance-violations/:id & GET /api/compliance-violations/:id
 */
async function getComplianceViolationById(req, res, next) {
  try {
    const { id } = req.params;

    const violation = await prisma.complianceViolation.findFirst({
      where: { id, companyId: req.user.companyId },
      include: {
        rule: true,
        reportedBy: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true, email: true } },
        evidence: true,
      },
    });

    if (!violation) {
      throw new NotFoundError(`Compliance violation with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: violation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /compliance-violations & POST /api/compliance-violations
 */
async function createComplianceViolation(req, res, next) {
  try {
    const body = req.body || {};
    const ruleId = body.ruleId || body.rule_id;
    const entityType = (body.entityType || body.entity_type || '').trim();
    const entityId = (body.entityId || body.entity_id || '').trim();
    const severity = body.severity || 'Medium';
    const dueDate = body.dueDate || body.due_date || null;

    validateRequired({ ruleId, entityType, entityId }, ['ruleId', 'entityType', 'entityId']);
    validateEnum(severity, ALLOWED_SEVERITIES, 'severity');

    const rule = await prisma.complianceRule.findFirst({
      where: {
        id: ruleId,
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
    });

    if (!rule) {
      throw new NotFoundError(`Compliance rule with ID ${ruleId} not found`);
    }

    const newViolation = await prisma.complianceViolation.create({
      data: {
        companyId: req.user.companyId,
        ruleId,
        entityType,
        entityId,
        severity,
        status: 'Open',
        reportedById: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { rule: true },
    });

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceViolation',
        entityId: newViolation.id,
        action: AUDIT_ACTIONS.CREATE,
        performedById: req.user.id,
        newValue: { ruleId, entityType, entityId, severity },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for violation create:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Compliance violation created successfully',
      data: newViolation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /compliance-violations/:id & PATCH /api/compliance-violations/:id
 */
async function updateComplianceViolation(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.complianceViolation.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance violation with ID ${id} not found`);
    }

    const updateData = {};
    if (body.status) {
      validateEnum(body.status, ALLOWED_VIOLATION_STATUSES, 'status');
      updateData.status = body.status;
      if (body.status === 'Resolved') {
        updateData.resolvedById = req.user.id;
        updateData.resolvedAt = new Date();
      }
    }
    if (body.resolutionRemarks !== undefined || body.resolution_remarks !== undefined) {
      updateData.resolutionRemarks = body.resolutionRemarks || body.resolution_remarks;
    }
    if (body.severity) {
      validateEnum(body.severity, ALLOWED_SEVERITIES, 'severity');
      updateData.severity = body.severity;
    }

    const updated = await prisma.complianceViolation.update({
      where: { id },
      data: updateData,
      include: { rule: true },
    });

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceViolation',
        entityId: id,
        action: AUDIT_ACTIONS.STATUS_CHANGE,
        performedById: req.user.id,
        oldValue: { status: existing.status },
        newValue: updateData,
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for violation update:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Compliance violation updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /compliance-violations/:id & DELETE /api/compliance-violations/:id
 */
async function deleteComplianceViolation(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.complianceViolation.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance violation with ID ${id} not found`);
    }

    await prisma.complianceViolation.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Compliance violation deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// 3. COMPLIANCE EVIDENCE
// ============================================================================

/**
 * GET /evidence & GET /api/evidence
 */
async function listEvidence(req, res, next) {
  try {
    const evidenceList = await prisma.complianceEvidence.findMany({
      where: { companyId: req.user.companyId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true } },
        violation: { include: { rule: true } },
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: evidenceList,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /evidence/:id & GET /api/evidence/:id
 */
async function getEvidenceById(req, res, next) {
  try {
    const { id } = req.params;

    const evidence = await prisma.complianceEvidence.findFirst({
      where: { id, companyId: req.user.companyId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true } },
        violation: { include: { rule: true } },
        reviewedBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!evidence) {
      throw new NotFoundError(`Compliance evidence with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: evidence,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /evidence & POST /api/evidence
 */
async function createEvidence(req, res, next) {
  try {
    const body = req.body || {};
    const title = (body.title || '').trim();
    const taskId = body.taskId || body.task_id || null;
    const violationId = body.violationId || body.violation_id || null;
    const evidenceType = body.evidenceType || body.evidence_type || 'Document';
    const fileUrl = body.fileUrl || body.file_url || '';
    const notes = body.notes || '';

    validateRequired({ title }, ['title']);

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, companyId: req.user.companyId },
      });
      if (!task) throw new NotFoundError(`Task ${taskId} not found in this company`);
    }

    if (violationId) {
      const violation = await prisma.complianceViolation.findFirst({
        where: { id: violationId, companyId: req.user.companyId },
      });
      if (!violation) throw new NotFoundError(`Violation ${violationId} not found in this company`);
    }

    const newEvidence = await prisma.complianceEvidence.create({
      data: {
        companyId: req.user.companyId,
        userId: req.user.id,
        taskId: taskId ? String(taskId) : null,
        violationId: violationId ? String(violationId) : null,
        title,
        evidenceType,
        fileUrl,
        notes,
        status: 'Pending',
      },
      include: { user: true, violation: true },
    });

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceEvidence',
        entityId: newEvidence.id,
        action: AUDIT_ACTIONS.CREATE,
        performedById: req.user.id,
        newValue: { title, status: 'Pending' },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for evidence create:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Evidence submitted successfully',
      data: newEvidence,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /evidence/:id & PATCH /api/evidence/:id
 */
async function updateEvidence(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.complianceEvidence.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance evidence with ID ${id} not found`);
    }

    const updateData = {};
    if (body.status) {
      validateEnum(body.status, ALLOWED_EVIDENCE_STATUSES, 'status');
      updateData.status = body.status;
      updateData.reviewedById = req.user.id;
      updateData.reviewedAt = new Date();
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await prisma.complianceEvidence.update({
      where: { id },
      data: updateData,
    });

    // Auto-resolve violation if evidence is Approved and violation exists
    if (body.status === 'Approved' && existing.violationId) {
      await prisma.complianceViolation.update({
        where: { id: existing.violationId },
        data: {
          status: 'Resolved',
          resolvedById: req.user.id,
          resolvedAt: new Date(),
          resolutionRemarks: `Auto-resolved via approved evidence "${existing.title}"`,
        },
      });
    }

    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'ComplianceEvidence',
        entityId: id,
        action: AUDIT_ACTIONS.STATUS_CHANGE,
        performedById: req.user.id,
        oldValue: { status: existing.status },
        newValue: updateData,
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit logging for evidence update:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Evidence updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /evidence/:id & DELETE /api/evidence/:id
 */
async function deleteEvidence(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.complianceEvidence.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance evidence with ID ${id} not found`);
    }

    await prisma.complianceEvidence.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Evidence deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /evidence/:id/upload & POST /api/evidence/:id/upload
 * Handles real validated multipart file upload via Multer.
 * Creates an Attachment record and updates the ComplianceEvidence.
 */
async function uploadEvidenceFile(req, res, next) {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new BadRequestError('No file attached. Include a "file" field in the multipart/form-data body.');
    }

    const evidence = await prisma.complianceEvidence.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!evidence) {
      // Remove uploaded file if evidence doesn't exist
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
      throw new NotFoundError(`Compliance evidence with ID ${id} not found`);
    }

    const fileUrl = `/uploads/${file.filename}`;

    // Create Attachment record
    let attachment = null;
    try {
      attachment = await prisma.attachment.create({
        data: {
          companyId: req.user.companyId,
          entityType: 'ComplianceEvidence',
          entityId: evidence.id,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSizeBytes: file.size,
          uploadedById: req.user.id,
        },
      });
    } catch (attErr) {
      console.warn('[Attachment] Could not persist attachment record:', attErr.message);
    }

    const updatedEvidence = await prisma.complianceEvidence.update({
      where: { id },
      data: { fileUrl },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, title: true } },
        violation: { include: { rule: true } },
      },
    });

    await createAuditLog({
      companyId: req.user.companyId,
      entityType: 'ComplianceEvidence',
      entityId: id,
      action: AUDIT_ACTIONS.UPDATE,
      performedById: req.user.id,
      newValue: { fileUrl, originalName: file.originalname, sizeBytes: file.size },
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fileUrl,
        evidence: updatedEvidence,
        attachment,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /evidence/:id/file & GET /api/evidence/:id/file
 * Safely streams the uploaded evidence file for authorized tenant users.
 * Enforces tenant isolation and prevents arbitrary filesystem path traversal.
 */
async function streamEvidenceFile(req, res, next) {
  try {
    const { id } = req.params;

    const evidence = await prisma.complianceEvidence.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!evidence || !evidence.fileUrl) {
      throw new NotFoundError(`Evidence file for ID ${id} not found`);
    }

    const filename = path.basename(evidence.fileUrl);
    const safeFilePath = path.join(uploadDir, filename);

    // Verify resolved path stays strictly within uploadDir
    if (!safeFilePath.startsWith(uploadDir)) {
      throw new ForbiddenError('Access to the requested file path is restricted');
    }

    if (!fs.existsSync(safeFilePath)) {
      throw new NotFoundError('Physical evidence file not found on disk');
    }

    res.sendFile(safeFilePath);
  } catch (err) {
    next(err);
  }
}

// Route Registrations
// Rules
router.get(['/compliance-rules', '/api/compliance-rules'], authenticate, listComplianceRules);
router.get(['/compliance-rules/:id', '/api/compliance-rules/:id'], authenticate, getComplianceRuleById);
router.post(
  ['/compliance-rules', '/api/compliance-rules'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  createComplianceRule
);
router.patch(
  ['/compliance-rules/:id', '/api/compliance-rules/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  updateComplianceRule
);
router.delete(
  ['/compliance-rules/:id', '/api/compliance-rules/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, 'superuser'),
  deleteComplianceRule
);

// Violations
router.get(['/compliance-violations', '/api/compliance-violations'], authenticate, listComplianceViolations);
router.get(['/compliance-violations/:id', '/api/compliance-violations/:id'], authenticate, getComplianceViolationById);
router.post(
  ['/compliance-violations', '/api/compliance-violations'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  createComplianceViolation
);
router.patch(
  ['/compliance-violations/:id', '/api/compliance-violations/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.PROJECT_MANAGER, 'superuser', 'compliance_officer', 'project_manager'),
  updateComplianceViolation
);
router.delete(
  ['/compliance-violations/:id', '/api/compliance-violations/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, 'superuser'),
  deleteComplianceViolation
);

// Evidence
router.get(['/evidence', '/api/evidence'], authenticate, listEvidence);
router.get(['/evidence/:id', '/api/evidence/:id'], authenticate, getEvidenceById);
router.get(['/evidence/:id/file', '/api/evidence/:id/file'], authenticate, streamEvidenceFile);
router.post(
  ['/evidence', '/api/evidence'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER, 'superuser', 'compliance_officer', 'project_manager', 'team_leader', 'team_lead', 'team_member'),
  createEvidence
);
router.post(
  ['/evidence/:id/upload', '/api/evidence/:id/upload'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.PROJECT_MANAGER, ROLES.TEAM_LEAD, ROLES.TEAM_MEMBER, 'superuser', 'compliance_officer', 'project_manager', 'team_leader', 'team_lead', 'team_member'),
  upload.single('file'),
  uploadEvidenceFile
);
router.patch(
  ['/evidence/:id', '/api/evidence/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, ROLES.PROJECT_MANAGER, 'superuser', 'compliance_officer', 'project_manager'),
  updateEvidence
);
router.delete(
  ['/evidence/:id', '/api/evidence/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  deleteEvidence
);

// ============================================================================
// 4. COMPLIANCE CATEGORIES
// ============================================================================

/**
 * GET /compliance-categories & GET /api/compliance-categories
 */
async function listComplianceCategories(req, res, next) {
  try {
    const categories = await prisma.complianceCategory.findMany({
      where: {
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { rules: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /compliance-categories/:id & GET /api/compliance-categories/:id
 */
async function getComplianceCategoryById(req, res, next) {
  try {
    const { id } = req.params;

    const category = await prisma.complianceCategory.findFirst({
      where: {
        id,
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        rules: true,
      },
    });

    if (!category) {
      throw new NotFoundError(`Compliance category with ID ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /compliance-categories & POST /api/compliance-categories
 */
async function createComplianceCategory(req, res, next) {
  try {
    const body = req.body || {};
    const name = (body.name || '').trim();
    const description = (body.description || '').trim();

    validateRequired({ name }, ['name']);

    const category = await prisma.complianceCategory.create({
      data: {
        companyId: req.user.companyId,
        name,
        description: description || null,
        ownerId: req.user.id,
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Compliance category created successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /compliance-categories/:id & PATCH /api/compliance-categories/:id
 */
async function updateComplianceCategory(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.complianceCategory.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance category ${id} not found in this company`);
    }

    const updateData = {};
    if (body.name) updateData.name = String(body.name).trim();
    if (body.description !== undefined) updateData.description = String(body.description).trim();

    const updated = await prisma.complianceCategory.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Compliance category updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /compliance-categories/:id & DELETE /api/compliance-categories/:id
 */
async function deleteComplianceCategory(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.complianceCategory.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Compliance category ${id} not found in this company`);
    }

    await prisma.complianceCategory.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Compliance category deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// 5. COMPLIANCE BINDINGS
// ============================================================================

/**
 * GET /compliance-bindings & GET /api/compliance-bindings
 */
async function listComplianceBindings(req, res, next) {
  try {
    const { ruleId } = req.query;

    const where = {
      rule: {
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
      ...(ruleId ? { ruleId: String(ruleId) } : {}),
    };

    const bindings = await prisma.complianceBinding.findMany({
      where,
      include: {
        rule: true,
      },
    });

    res.status(200).json({
      success: true,
      data: bindings,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /compliance-bindings/:id & GET /api/compliance-bindings/:id
 */
async function getComplianceBindingById(req, res, next) {
  try {
    const { id } = req.params;

    const binding = await prisma.complianceBinding.findFirst({
      where: {
        id,
        rule: {
          OR: [{ companyId: null }, { companyId: req.user.companyId }],
        },
      },
      include: {
        rule: true,
      },
    });

    if (!binding) {
      throw new NotFoundError(`Compliance binding ${id} not found`);
    }

    res.status(200).json({
      success: true,
      data: binding,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /compliance-bindings & POST /api/compliance-bindings
 */
async function createComplianceBinding(req, res, next) {
  try {
    const body = req.body || {};
    const ruleId = body.ruleId || body.rule_id;
    const scopeType = body.scopeType || body.scope_type || 'Company';
    const scopeId = body.scopeId || body.scope_id || req.user.companyId;

    validateRequired({ ruleId, scopeType, scopeId }, ['ruleId', 'scopeType', 'scopeId']);
    validateEnum(scopeType, ['Company', 'Branch', 'Team', 'Project'], 'scopeType');

    const rule = await prisma.complianceRule.findFirst({
      where: {
        id: String(ruleId),
        OR: [{ companyId: null }, { companyId: req.user.companyId }],
      },
    });

    if (!rule) {
      throw new NotFoundError(`Compliance rule ${ruleId} not found`);
    }

    const binding = await prisma.complianceBinding.create({
      data: {
        ruleId: String(ruleId),
        scopeType,
        scopeId: String(scopeId),
      },
      include: {
        rule: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Compliance binding created successfully',
      data: binding,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /compliance-bindings/:id & DELETE /api/compliance-bindings/:id
 */
async function deleteComplianceBinding(req, res, next) {
  try {
    const { id } = req.params;

    const binding = await prisma.complianceBinding.findFirst({
      where: {
        id,
        rule: {
          OR: [{ companyId: null }, { companyId: req.user.companyId }],
        },
      },
    });

    if (!binding) {
      throw new NotFoundError(`Compliance binding ${id} not found`);
    }

    await prisma.complianceBinding.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Compliance binding deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// Categories routes
router.get(['/compliance-categories', '/api/compliance-categories'], authenticate, listComplianceCategories);
router.get(['/compliance-categories/:id', '/api/compliance-categories/:id'], authenticate, getComplianceCategoryById);
router.post(
  ['/compliance-categories', '/api/compliance-categories'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  createComplianceCategory
);
router.patch(
  ['/compliance-categories/:id', '/api/compliance-categories/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  updateComplianceCategory
);
router.delete(
  ['/compliance-categories/:id', '/api/compliance-categories/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, 'superuser'),
  deleteComplianceCategory
);

// Bindings routes
router.get(['/compliance-bindings', '/api/compliance-bindings'], authenticate, listComplianceBindings);
router.get(['/compliance-bindings/:id', '/api/compliance-bindings/:id'], authenticate, getComplianceBindingById);
router.post(
  ['/compliance-bindings', '/api/compliance-bindings'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  createComplianceBinding
);
router.delete(
  ['/compliance-bindings/:id', '/api/compliance-bindings/:id'],
  authenticate,
  requireRoles(ROLES.COMPANY_OWNER, ROLES.SYSTEM_ADMIN, ROLES.COMPLIANCE_OFFICER, 'superuser', 'compliance_officer'),
  deleteComplianceBinding
);

export default router;

