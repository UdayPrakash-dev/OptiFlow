import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRoles } from '../middleware/authorize.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors.js';
import { validateRequired } from '../utils/validation.js';
import { ROLES } from '../utils/roles.js';
import {
  isBranchManager,
  resolveEffectiveBranchId,
  assertBranchManagerScope,
} from '../utils/tenantScope.js';
import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';

const router = Router();

// ============================================================================
// 1. ROLES ENDPOINTS
// ============================================================================

/**
 * GET /roles & GET /api/roles
 * Returns all configured roles for the authenticated user's company.
 */
async function listRoles(req, res, next) {
  try {
    const roles = await prisma.role.findMany({
      where: { companyId: req.user.companyId },
      include: {
        roleTemplate: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { label: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/:id & GET /api/roles/:id
 * Retrieves a single role by ID or label within caller's company.
 */
async function getRoleById(req, res, next) {
  try {
    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: {
        OR: [{ id }, { label: id }],
        companyId: req.user.companyId,
      },
      include: {
        roleTemplate: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError(`Role "${id}" not found in this company`);
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// 2. BRANCHES ENDPOINTS
// ============================================================================

/**
 * GET /branches & GET /api/branches
 * Returns branches for the authenticated company, respecting Branch Manager scoping.
 */
async function listBranches(req, res, next) {
  try {
    const effectiveBranchId = resolveEffectiveBranchId({
      user: req.user,
      branchId: req.query.branchId,
    });

    const where = {
      companyId: req.user.companyId,
      ...(effectiveBranchId ? { id: effectiveBranchId } : {}),
    };

    const branches = await prisma.branch.findMany({
      where,
      include: {
        teams: {
          include: {
            _count: { select: { projects: true } },
          },
        },
        company: { select: { id: true, legalName: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: branches,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /branches/:id & GET /api/branches/:id
 * Retrieves a single branch by ID.
 */
async function getBranchById(req, res, next) {
  try {
    const { id } = req.params;

    assertBranchManagerScope(req.user, id, 'view details for this branch');

    const branch = await prisma.branch.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
      },
      include: {
        teams: {
          include: {
            projects: true,
          },
        },
        company: { select: { id: true, legalName: true } },
      },
    });

    if (!branch) {
      throw new NotFoundError(`Branch with ID ${id} not found in this company`);
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /branches & POST /api/branches
 * Creates a new branch for the authenticated company.
 */
async function createBranch(req, res, next) {
  try {
    const body = req.body || {};
    const name = (body.name || '').trim();

    validateRequired({ name }, ['name']);

    const branch = await prisma.branch.create({
      data: {
        name,
        companyId: req.user.companyId,
      },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'Branch',
        entityId: branch.id,
        action: AUDIT_ACTIONS.CREATE,
        performedById: req.user.id,
        newValue: { name: branch.name },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during branch creation:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /branches/:id & PATCH /api/branches/:id
 * Updates branch details.
 */
async function updateBranch(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const name = (body.name || '').trim();

    validateRequired({ name }, ['name']);

    const existing = await prisma.branch.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Branch with ID ${id} not found in this company`);
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: { name },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'Branch',
        entityId: id,
        action: AUDIT_ACTIONS.UPDATE,
        performedById: req.user.id,
        oldValue: { name: existing.name },
        newValue: { name: updated.name },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during branch update:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /branches/:id & DELETE /api/branches/:id
 * Deletes a branch if no active teams depend on it.
 */
async function deleteBranch(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.branch.findFirst({
      where: { id, companyId: req.user.companyId },
    });

    if (!existing) {
      throw new NotFoundError(`Branch with ID ${id} not found in this company`);
    }

    const teamsCount = await prisma.team.count({
      where: { branchId: id },
    });

    if (teamsCount > 0) {
      throw new ConflictError(`Cannot delete branch: ${teamsCount} team(s) are currently assigned to this branch`);
    }

    await prisma.branch.delete({
      where: { id },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'Branch',
        entityId: id,
        action: AUDIT_ACTIONS.DELETE,
        performedById: req.user.id,
        oldValue: { name: existing.name },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during branch deletion:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// 3. TEAMS ENDPOINTS
// ============================================================================

/**
 * GET /teams & GET /api/teams
 * Returns teams within the caller's company.
 */
async function listTeams(req, res, next) {
  try {
    const effectiveBranchId = resolveEffectiveBranchId({
      user: req.user,
      branchId: req.query.branchId,
    });

    const where = {
      branch: {
        companyId: req.user.companyId,
        ...(effectiveBranchId ? { id: effectiveBranchId } : {}),
      },
    };

    const teams = await prisma.team.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, companyId: true } },
        projects: { select: { id: true, name: true, status: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /teams/:id & GET /api/teams/:id
 * Retrieves a single team by ID.
 */
async function getTeamById(req, res, next) {
  try {
    const { id } = req.params;

    const team = await prisma.team.findFirst({
      where: {
        id,
        branch: { companyId: req.user.companyId },
      },
      include: {
        branch: { select: { id: true, name: true, companyId: true } },
        projects: {
          include: {
            tasks: { where: { deletedAt: null }, select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError(`Team with ID ${id} not found in this company`);
    }

    if (isBranchManager(req.user)) {
      assertBranchManagerScope(req.user, team.branchId, 'view details for this team');
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /teams & POST /api/teams
 * Creates a new team under a verified company branch.
 */
async function createTeam(req, res, next) {
  try {
    const body = req.body || {};
    const name = (body.name || body.team_name || '').trim();
    const branchId = (body.branchId || body.branch_id || '').trim();

    validateRequired({ name, branchId }, ['name', 'branchId']);

    // Verify branch belongs to caller's company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId: req.user.companyId },
    });

    if (!branch) {
      throw new BadRequestError('The specified branch does not exist in this company');
    }

    if (isBranchManager(req.user)) {
      assertBranchManagerScope(req.user, branchId, 'create teams in this branch');
    }

    const team = await prisma.team.create({
      data: {
        name,
        branchId,
      },
      include: {
        branch: { select: { id: true, name: true, companyId: true } },
      },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'Team',
        entityId: team.id,
        action: AUDIT_ACTIONS.CREATE,
        performedById: req.user.id,
        newValue: { name: team.name, branchId },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during team creation:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /teams/:id & PATCH /api/teams/:id
 * Updates team name or reassigns branch within company.
 */
async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.team.findFirst({
      where: { id, branch: { companyId: req.user.companyId } },
    });

    if (!existing) {
      throw new NotFoundError(`Team with ID ${id} not found in this company`);
    }

    if (isBranchManager(req.user)) {
      assertBranchManagerScope(req.user, existing.branchId, 'modify this team');
    }

    const updateData = {};
    if (body.name || body.team_name) {
      updateData.name = String(body.name || body.team_name).trim();
    }

    const newBranchId = body.branchId || body.branch_id;
    if (newBranchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: newBranchId, companyId: req.user.companyId },
      });
      if (!branch) {
        throw new BadRequestError('The target branch does not exist in this company');
      }

      if (isBranchManager(req.user)) {
        assertBranchManagerScope(req.user, newBranchId, 'reassign teams to this branch');
      }

      updateData.branchId = newBranchId;
    }

    const updated = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, companyId: true } },
      },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'Team',
        entityId: id,
        action: AUDIT_ACTIONS.UPDATE,
        performedById: req.user.id,
        oldValue: { name: existing.name, branchId: existing.branchId },
        newValue: updateData,
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during team update:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /teams/:id & DELETE /api/teams/:id
 * Deletes a team if no active projects depend on it.
 */
async function deleteTeam(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.team.findFirst({
      where: { id, branch: { companyId: req.user.companyId } },
    });

    if (!existing) {
      throw new NotFoundError(`Team with ID ${id} not found in this company`);
    }

    if (isBranchManager(req.user)) {
      assertBranchManagerScope(req.user, existing.branchId, 'delete this team');
    }

    const projectsCount = await prisma.project.count({
      where: { teamId: id },
    });

    if (projectsCount > 0) {
      throw new ConflictError(`Cannot delete team: ${projectsCount} project(s) are currently assigned to this team`);
    }

    await prisma.team.delete({
      where: { id },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'Team',
        entityId: id,
        action: AUDIT_ACTIONS.DELETE,
        performedById: req.user.id,
        oldValue: { name: existing.name },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during team deletion:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// 4. AUDIT LOGS ENDPOINTS
// ============================================================================

/**
 * GET /audit-logs & GET /api/audit-logs
 * Returns audit logs scoped to caller's company.
 */
async function listAuditLogs(req, res, next) {
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

/**
 * GET /audit-logs/by-user/:userId
 */
async function listAuditLogsByUser(req, res, next) {
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

/**
 * GET /audit-logs/by-entity/:entityType/:entityId
 */
async function listAuditLogsByEntity(req, res, next) {
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

/**
 * POST /audit-logs & POST /api/audit-logs
 */
async function createAuditLogEndpoint(req, res, next) {
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

// Roles Routes
router.get(['/roles', '/api/roles'], authenticate, listRoles);
router.get(['/roles/:id', '/api/roles/:id'], authenticate, getRoleById);

// Branches Routes (with /departments alias for frontend helper compatibility)
router.get(['/branches', '/api/branches', '/departments', '/api/departments'], authenticate, listBranches);
router.get(['/branches/:id', '/api/branches/:id', '/departments/:id', '/api/departments/:id'], authenticate, getBranchById);
router.post(
  ['/branches', '/api/branches', '/departments', '/api/departments'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER),
  createBranch
);
router.patch(
  ['/branches/:id', '/api/branches/:id', '/departments/:id', '/api/departments/:id'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER),
  updateBranch
);
router.delete(
  ['/branches/:id', '/api/branches/:id', '/departments/:id', '/api/departments/:id'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER),
  deleteBranch
);

// Teams Routes
router.get(['/teams', '/api/teams'], authenticate, listTeams);
router.get(['/teams/:id', '/api/teams/:id'], authenticate, getTeamById);
router.post(
  ['/teams', '/api/teams'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER, ROLES.PROJECT_MANAGER, ROLES.ACCESS_GOVERNANCE, 'hr_manager', 'branch_manager'),
  createTeam
);
router.patch(
  ['/teams/:id', '/api/teams/:id'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER, ROLES.PROJECT_MANAGER, ROLES.ACCESS_GOVERNANCE, 'hr_manager', 'branch_manager'),
  updateTeam
);
router.delete(
  ['/teams/:id', '/api/teams/:id'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER, ROLES.ACCESS_GOVERNANCE, 'hr_manager'),
  deleteTeam
);

// Audit Logs Routes
router.get(['/audit-logs', '/api/audit-logs'], authenticate, listAuditLogs);
router.get(['/audit-logs/by-user/:userId', '/api/audit-logs/by-user/:userId'], authenticate, listAuditLogsByUser);
router.get(['/audit-logs/by-entity/:entityType/:entityId', '/api/audit-logs/by-entity/:entityType/:entityId'], authenticate, listAuditLogsByEntity);
router.post(['/audit-logs', '/api/audit-logs'], authenticate, createAuditLogEndpoint);

// ============================================================================
// 5. PERMISSIONS, ROLE TEMPLATES & ROLE ASSIGNMENTS
// ============================================================================

/**
 * GET /permissions & GET /api/permissions
 */
async function listPermissions(req, res, next) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { slug: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /role-templates & GET /api/role-templates
 */
async function listRoleTemplates(req, res, next) {
  try {
    const templates = await prisma.roleTemplate.findMany({
      include: {
        defaultPermissions: {
          include: { permission: true },
        },
      },
      orderBy: { label: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /role-assignments & GET /api/role-assignments
 */
async function listRoleAssignments(req, res, next) {
  try {
    const { userId, roleId } = req.query;

    const where = {
      user: { companyId: req.user.companyId },
      ...(userId ? { userId: String(userId) } : {}),
      ...(roleId ? { roleId: String(roleId) } : {}),
    };

    const assignments = await prisma.roleAssignment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        role: true,
        grantedByUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { grantedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /role-assignments & POST /api/role-assignments
 */
async function createRoleAssignment(req, res, next) {
  try {
    const body = req.body || {};
    const userId = body.userId || body.user_id;
    const roleId = body.roleId || body.role_id;
    const scopeType = body.scopeType || body.scope_type || 'Company';
    const scopeId = body.scopeId || body.scope_id || req.user.companyId;

    validateRequired({ userId, roleId }, ['userId', 'roleId']);

    // Ensure target user belongs to caller's company
    const targetUser = await prisma.user.findFirst({
      where: { id: String(userId), companyId: req.user.companyId },
    });
    if (!targetUser) {
      throw new NotFoundError(`User ${userId} not found in this company`);
    }

    // Ensure role belongs to caller's company
    const role = await prisma.role.findFirst({
      where: { id: String(roleId), companyId: req.user.companyId },
    });
    if (!role) {
      throw new NotFoundError(`Role ${roleId} not found in this company`);
    }

    const assignment = await prisma.roleAssignment.create({
      data: {
        companyId: req.user.companyId,
        userId: String(userId),
        roleId: String(roleId),
        scopeType,
        scopeId: String(scopeId),
        grantedById: req.user.id,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        role: true,
      },
    });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'RoleAssignment',
        entityId: assignment.id,
        action: AUDIT_ACTIONS.ROLE_ASSIGNED,
        performedById: req.user.id,
        newValue: { userId, roleId: role.id, roleLabel: role.label },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during role assignment:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Role assigned successfully',
      data: assignment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /role-assignments/:id & DELETE /api/role-assignments/:id
 */
async function deleteRoleAssignment(req, res, next) {
  try {
    const { id } = req.params;

    const assignment = await prisma.roleAssignment.findFirst({
      where: { id, user: { companyId: req.user.companyId } },
      include: { role: true },
    });

    if (!assignment) {
      throw new NotFoundError(`Role assignment ${id} not found in this company`);
    }

    await prisma.roleAssignment.delete({ where: { id } });

    // Record audit log
    try {
      await createAuditLog({
        companyId: req.user.companyId,
        entityType: 'RoleAssignment',
        entityId: id,
        action: AUDIT_ACTIONS.ROLE_REVOKED,
        performedById: req.user.id,
        oldValue: { userId: assignment.userId, roleLabel: assignment.role?.label },
      });
    } catch (auditErr) {
      console.warn('[AuditLog] Notice: Audit record logging during role revocation:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Role assignment revoked successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /bootstrap & GET /api/bootstrap
 * Returns aggregated initialization state for fast frontend bootstrapping.
 */
async function getBootstrapState(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const [user, branches, teams, roles, unreadNotificationsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          company: true,
          roleAssignments: { include: { role: true } },
        },
      }),
      prisma.branch.findMany({
        where: { companyId },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      prisma.team.findMany({
        where: { branch: { companyId } },
        select: { id: true, name: true, branchId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.role.findMany({
        where: { companyId },
        select: { id: true, label: true, isSystem: true },
        orderBy: { label: 'asc' },
      }),
      prisma.notification.count({
        where: { userId: req.user.id, readAt: null },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        currentUser: req.user,
        userProfile: user,
        company: user?.company || null,
        branches,
        teams,
        roles,
        unreadNotificationsCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Permissions Routes
router.get(['/permissions', '/api/permissions'], authenticate, listPermissions);

// Role Templates Routes
router.get(['/role-templates', '/api/role-templates'], authenticate, listRoleTemplates);

// Role Assignments Routes
router.get(['/role-assignments', '/api/role-assignments'], authenticate, listRoleAssignments);
router.post(
  ['/role-assignments', '/api/role-assignments'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER, ROLES.ACCESS_GOVERNANCE, 'hr_manager'),
  createRoleAssignment
);
router.delete(
  ['/role-assignments/:id', '/api/role-assignments/:id'],
  authenticate,
  requireRoles(ROLES.SYSTEM_ADMIN, ROLES.COMPANY_OWNER, ROLES.ACCESS_GOVERNANCE, 'hr_manager'),
  deleteRoleAssignment
);

// Bootstrap Aggregator Route
router.get(['/bootstrap', '/api/bootstrap'], authenticate, getBootstrapState);

export default router;
