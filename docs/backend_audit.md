Listed directory 2_OptiFlow
Listed directory Database
Listed directory back-end
Listed directory prisma
Listed directory src
Listed directory core
Listed directory modules
Listed directory front-end
Viewed schema.prisma:1-250
Viewed schema.prisma:251-500
Viewed schema.prisma:501-731
Viewed main.ts:1-142
Viewed app.module.ts:1-122
Listed directory guards
Listed directory middleware
Viewed tenant.middleware.ts:1-200
Viewed roles.guard.ts:1-90
Viewed company-id.guard.ts:1-26
Viewed platform-admin.guard.ts:1-40
Listed directory interceptors
Viewed transform.interceptor.ts:1-43
Listed directory filters
Viewed global-exception.filter.ts:1-100
Viewed global-exception.filter.ts:101-139
Listed directory services
Viewed plan-limit.service.ts:1-98
Searched for "@Controller"
Listed directory js
Listed directory modules
Listed directory utils
Viewed auth.js:1-150
Viewed helpers.js:1-150
Viewed helpers.js:151-300
Searched for "/"
Searched for "Helpers.api.request"
Searched for "fetch("
Listed directory auth
Viewed auth.controller.ts:1-46
Viewed auth.service.ts:1-250
Viewed auth.service.ts:251-381
Viewed companies.controller.ts:1-77
Viewed companies.service.ts:1-150
Viewed platform.controller.ts:1-91
Viewed plans.controller.ts:1-60
Viewed subscriptions.controller.ts:1-53
Viewed platform-admin-users.controller.ts:1-48
Viewed platform-support-access.controller.ts:1-69
Viewed executive.controller.ts:1-296
Viewed governance.controller.ts:1-215
Viewed metrics.controller.ts:1-72
Viewed process.controller.ts:1-121
Viewed users.controller.ts:1-104
Viewed users.service.ts:1-150
Viewed users.service.ts:151-225
Viewed branches.controller.ts:1-77
Viewed teams.controller.ts:1-82
Viewed roles.controller.ts:1-80
Viewed role-templates.controller.ts:1-75
Viewed role-assignments.controller.ts:1-59
Viewed permissions.controller.ts:1-75
Viewed projects.controller.ts:1-127
Viewed tasks.controller.ts:1-165
Viewed subtasks.controller.ts:1-121
Viewed escalations.controller.ts:1-114
Viewed process-templates.controller.ts:1-80
Viewed process-instances.controller.ts:1-85
Viewed process-instance-steps.controller.ts:1-76
Viewed compliance-categories.controller.ts:1-76
Viewed compliance-rules.controller.ts:1-73
Viewed compliance-bindings.controller.ts:1-68
Viewed compliance-violations.controller.ts:1-99
Viewed evidence.controller.ts:1-231
Viewed comments.controller.ts:1-106
Viewed attachments.controller.ts:1-176
Viewed audit-logs.controller.ts:1-62
Viewed notifications.controller.ts:1-87
Viewed app.controller.ts:1-13
Viewed tenant-scope.util.ts:1-194
Viewed package.json:1-89
Searched for "rate"
Viewed compliance-observer.service.ts:1-74
Viewed tasks.service.ts:1-120
Viewed tasks.service.ts:121-293
Viewed projects.service.ts:1-150
Viewed projects.service.ts:151-216
Searched for "class "
Viewed create-task.dto.ts:1-79
Viewed create-team.dto.ts:1-15
Viewed create-project.dto.ts:1-45
Viewed create-user.dto.ts:1-55

Here is the comprehensive audit and inspection report of the existing NestJS backend and its frontend integration. **No files have been modified.**

---

### 1. Prisma Schema & Database Inventory

**Database Provider:** PostgreSQL (`DATABASE_URL`)  
**Client:** `@prisma/client` (Prisma JS Client)  
**Schema File:** [schema.prisma](file:///d:/Codes/FDFED/2_OptiFlow/back-end/prisma/schema.prisma)

#### Models & Relational Architecture
* **Platform Layer (SaaS Management)**
  * `Plan`: Subscription tiers (`maxBranches`, `maxUsers`, `maxActiveProcessTemplates`, `maxComplianceRules`, `auditLogRetentionDays`, `allowsIntegrations`, `monthlyPrice`, `annualPrice`, `currency`).
  * `Subscription`: Links `Company` to `Plan` with `SubscriptionStatus` (`Active`, `PastDue`, `Cancelled`) and `currentPeriodEnd`.
  * `PlatformAdminUser`: Super-admin accounts (`email`, `passwordHash`, `fullName`, `isActive`).
  * `PlatformSupportAccess`: Ephemeral support access granted to platform admins for a specific company with append-only JSON `actionLog`.

* **Tenant & Identity Layer**
  * `Company`: Root tenant entity (`legalName`, `status`: `Active`, `Suspended`, `Closed`).
  * `User`: Multi-tenant user (`companyId`, `email`, `fullName`, `passwordHash`, `jobTitle`, `managerUserId` self-relation, `isActive`, `deactivatedAt`). Unique on `[companyId, email]`.
  * `Permission`: Granular permissions (`slug`, `module`, `description`, optional `companyId`). Unique on `[companyId, slug]`.
  * `RoleTemplate`: Base role templates (`origin`: `platform_predefined` vs `company_custom`, `label`).
  * `RoleTemplatePermission`: Many-to-many join between `RoleTemplate` and `Permission`.
  * `Role`: Concrete tenant role (`companyId`, `roleTemplateId`, `label`, `isSystem`).
  * `RolePermission`: Many-to-many join between `Role` and `Permission`.
  * `RoleAssignment`: Assigns a `Role` to a `User` with a hierarchical scope (`scopeType`: `Company`, `Branch`, `Team`, `Project`, `scopeId`, `grantedById`, `revokedAt`).
  * `PermissionGrant`: Direct user permission overrides with scope and expiration.

* **Org Hierarchy Layer**
  * `Branch`: Physical/logical business location (`companyId`, `name`).
  * `Team`: Operational group (`branchId`, `name`).
  * `Project`: Project container (`teamId`, `name`, `status`, `startDate`, `endDate`, `createdById`).

* **Work & Tasks Layer**
  * `Task`: Core task model (`companyId`, `projectId`, `title`, `description`, `status`: `Draft`, `Active`, `In_Review`, `Blocked`, `Completed`, `Cancelled`, `priority`: `Low`, `Medium`, `High`, `Urgent`, `assignedToId`, `createdById`, `dueDate`, `completedAt`, `estimatedHours`, `actualHours`, `deletedAt` for soft deletes).
  * `Subtask`: Task checklist item (`companyId`, `taskId`, `title`, `status`, `assignedToId`, `createdById`, `dueDate`, `deletedAt`).

* **Process Management Layer**
  * `ProcessTemplate`: Workflow blueprint (`companyId`, `name`, `category`, `compliance` JSON, `version`, `isActive`). Unique on `[companyId, name, version]`.
  * `ProcessTemplateStep`: Workflow step (`templateId`, `stepOrder`, `name`, `stepType`: `Approval`, `Input_Required`, `Automated_Task`, `requiredPermissionId`, `escalationTimeoutHours`, `onRejectGotoStepId`).
  * `ProcessInstance`: Instantiated workflow execution (`companyId`, `templateId`, `projectId`, `title`, `status`: `Draft`, `Active`, `Completed`, `Cancelled`, `Rejected`, `currentStepId`).
  * `ProcessInstanceStep`: Active/completed instance steps (`processInstanceId`, `templateStepId`, `assignedToId`, `actionedById`, `status`: `Pending`, `Approved`, `Rejected`, `Skipped`, `remarks`, `actionedAt`).

* **Compliance & Governance Layer**
  * `ComplianceCategory`: Policy categories (`name`, `description`, `ownerId`).
  * `ComplianceRule`: Governance rules (`companyId`, `name`, `description`, `severity`: `Low`, `Medium`, `High`, `Critical`, `categoryId`, `isActive`, `sourceTemplateId`).
  * `ComplianceBinding`: Binds a rule to a scope (`ruleId`, `scopeType`, `scopeId`). Unique on `[ruleId, scopeType, scopeId]`.
  * `ComplianceViolation`: Detected breaches (`companyId`, `ruleId`, `entityType`, `entityId`, `status`: `Open`, `Under_Review`, `Resolved`, `Ignored`, `severity`, `reportedById`, `resolvedById`, `dueDate`, `resolutionRemarks`).
  * `ComplianceEvidence`: Auditable proof (`companyId`, `userId`, `taskId`, `violationId`, `title`, `evidenceType`, `fileUrl`, `status`: `Pending`, `Under_Review`, `Approved`, `Rejected`, `reviewedById`).
  * `Escalation`: Blockers raised to managers (`companyId`, `taskId`, `projectId`, `reportedById`, `targetManagerId`, `title`, `description`, `blockerType`, `priority`, `status`: `Open`, `Reviewed`, `Resolved`, `Closed`).

* **Cross-Cutting Services**
  * `Comment`: Polymorphic commenting (`companyId`, `entityType`, `entityId`, `userId`, `commentText`, `deletedAt`).
  * `Attachment`: Polymorphic file metadata (`companyId`, `entityType`, `entityId`, `fileName`, `fileType`, `fileSizeBytes`, `fileUrl`, `uploadedById`).
  * `AuditLog`: Immutable action audit log (`companyId`, `entityType`, `entityId`, `action`: `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOGIN`, `PERMISSION_CHANGE`, `performedById`, `usedPermissionSlug`, `ipAddress`, `userAgent`, `oldValue`, `newValue`).
  * `Notification`: System/in-app alert (`userId`, `title`, `message`, `type`, `isRead`, `link`).

---

### 2. Existing API Endpoints, Methods & Formats

The existing backend wraps all standard responses via [TransformInterceptor](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/interceptors/transform.interceptor.ts) into:
```json
{
  "success": true,
  "data": { ... }
}
```
And error responses via [GlobalExceptionFilter](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/filters/global-exception.filter.ts):
```json
{
  "statusCode": 400,
  "timestamp": "2026-10-02T12:00:00.000Z",
  "path": "/api/endpoint",
  "message": "Error details"
}
```

#### Complete Endpoint Inventory

| Module / Prefix | Method | Route | Description / Purpose | Key Guards & Roles |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | Authenticates user; resolves role hierarchy & target route | Public |
| | `POST` | `/auth/register-company` | Self-serve company registration + creates owner user + default subscription | Public |
| | `GET` | `/auth/public-plans` | Public plan listings for registration checkout | Public |
| **Companies** | `POST` | `/companies/register` | Secondary/legacy registration endpoint with template cloning | Public |
| | `GET` | `/companies` | List all companies (Platform Admin) | `PlatformAdminGuard` |
| | `GET` | `/companies/:id` | Get company details | `PlatformAdminGuard` |
| | `POST` | `/companies` | Create company | `PlatformAdminGuard` |
| | `PATCH` | `/companies/:id` | Update company | `PlatformAdminGuard` |
| | `DELETE` | `/companies/:id` | Delete company | `PlatformAdminGuard` |
| **Platform** | `GET` | `/platform/metrics` | SaaS dashboard KPI counts, distribution & active support | `PlatformAdminGuard` |
| | `GET` | `/platform/companies` | List tenant companies with subscription details & user counts | `PlatformAdminGuard` |
| **Platform Admin Users** | `GET` | `/platform-admin-users` | List platform admins | `PlatformAdminGuard` |
| | `POST` | `/platform-admin-users` | Create platform admin | `PlatformAdminGuard` |
| | `PATCH` | `/platform-admin-users/:id`| Update platform admin | `PlatformAdminGuard` |
| | `DELETE`| `/platform-admin-users/:id`| Delete platform admin | `PlatformAdminGuard` |
| **Platform Support** | `GET` | `/platform-support-access` | List support access sessions | `PlatformAdminGuard` |
| | `POST` | `/platform-support-access` | Grant support access session | `PlatformAdminGuard` |
| | `DELETE`| `/platform-support-access/:id`| Revoke support access session | `PlatformAdminGuard` |
| **Plans & Billing** | `GET` | `/plans` | List SaaS plans | `PlatformAdminGuard` |
| | `POST` | `/plans` | Create SaaS plan | `PlatformAdminGuard` |
| | `PATCH` | `/plans/:id` | Update SaaS plan | `PlatformAdminGuard` |
| | `DELETE`| `/plans/:id` | Delete SaaS plan | `PlatformAdminGuard` |
| | `GET` | `/subscriptions` | List subscriptions (filter by `companyId`) | `PlatformAdminGuard` |
| | `POST` | `/subscriptions` | Create subscription | `PlatformAdminGuard` |
| | `PATCH` | `/subscriptions/:id` | Update subscription | `PlatformAdminGuard` |
| | `DELETE`| `/subscriptions/:id` | Delete subscription | `PlatformAdminGuard` |
| **Executive** | `GET` | `/executive/branches` | List branches (filtered if Branch Manager) | `Company Owner`, `Branch Manager`, `superuser` |
| | `GET` | `/executive/metrics` | Executive KPIs, task trend, team breakdown, branch comparisons | `Company Owner`, `Branch Manager`, `superuser` |
| **Governance** | `GET` | `/governance/users` | List tenant users with role assignments | `Access Governance`, `Company Owner`, `System Admin` |
| | `GET` | `/governance/roles` | List tenant roles with default permissions | `Access Governance`, `Company Owner`, `System Admin` |
| | `GET` | `/governance/billing` | Get subscription plan usage & limit checks | `System Admin` |
| | `POST` | `/governance/invite` | Invite/create employee with role & branch assignment | `Access Governance`, `Company Owner`, `System Admin`, `Branch Manager` |
| | `POST` | `/governance/roles/clone` | Create custom role with selected permissions | `Access Governance`, `Company Owner`, `System Admin` |
| **Metrics** | `GET` | `/dashboard/metrics` | Basic dashboard KPIs (tasks by status, active projects, violations) | `Company Owner` |
| **Process Admin** | `GET` | `/processes/templates` | List process templates | `Process Admin`, `Company Owner` |
| | `POST` | `/processes/templates` | Create process template | `Process Admin` |
| | `PATCH` | `/processes/templates/:id`| Update process template | `Process Admin` |
| | `DELETE`| `/processes/templates/:id`| Delete process template | `Company Owner` |
| | `GET` | `/processes/templates/:id/steps` | List steps for template | `Process Admin`, `Company Owner` |
| | `POST` | `/processes/templates/:id/steps` | Add step to template | `Process Admin` |
| **Users** | `GET` | `/users` | List tenant users | Tenant Roles |
| | `GET` | `/users/roles/mapping`| List user-to-role assignment mappings | Tenant Roles |
| | `GET` | `/users/:id` | Get user details by ID | Tenant Roles |
| | `GET` | `/users/:id/activities` | Get audit activity log for user | Tenant Roles |
| | `POST` | `/users` | Create user directly | `superuser`, `hr_manager` |
| | `PATCH` | `/users/:id` | Update user details / active status | `superuser`, `hr_manager` |
| | `DELETE`| `/users/:id` | Soft deactivate user | `superuser`, `hr_manager` |
| **Branches** | `GET` | `/branches` | List branches | Tenant Roles |
| | `POST` | `/branches` | Create branch (checks `PlanLimitService`) | `System Admin` |
| | `PATCH` | `/branches/:id` | Update branch | `System Admin` |
| | `DELETE`| `/branches/:id` | Delete branch | `System Admin` |
| **Teams** | `GET` | `/teams` | List teams | Tenant Roles |
| | `POST` | `/teams` | Create team | `superuser`, `hr_manager`, `project_manager`, `System Admin` |
| | `PATCH` | `/teams/:id` | Update team | `superuser`, `hr_manager`, `project_manager`, `System Admin` |
| | `DELETE`| `/teams/:id` | Delete team | `superuser`, `hr_manager`, `System Admin` |
| **Roles & Permissions** | `GET` | `/roles` | List roles | Tenant Roles |
| | `POST` | `/roles` | Create role | `superuser`, `hr_manager` |
| | `PATCH` | `/roles/:id` | Update role | `superuser`, `hr_manager` |
| | `DELETE`| `/roles/:id` | Delete role | `superuser`, `hr_manager` |
| | `GET` | `/role-templates` | List role templates | Tenant & Platform Roles |
| | `GET` | `/role-assignments` | List role assignments (query `userId`, `roleId`)| `superuser`, `hr_manager` |
| | `POST` | `/role-assignments` | Grant role assignment | `superuser`, `hr_manager` |
| | `DELETE`| `/role-assignments/:id`| Revoke role assignment | `superuser`, `hr_manager` |
| | `GET` | `/permissions` | List permissions | Tenant & Platform Roles |
| **Projects** | `GET` | `/projects` | List projects (scoped by company/branch/role) | Tenant Roles |
| | `GET` | `/projects/:id` | Get project by ID | Tenant Roles |
| | `POST` | `/projects` | Create project (triggers template automation if `template_id`) | `superuser`, `project_manager`, `Branch Manager` |
| | `PATCH` | `/projects/:id` | Update project | `superuser`, `project_manager`, `Branch Manager` |
| | `DELETE`| `/projects/:id` | Delete project | `superuser`, `project_manager`, `Branch Manager` |
| **Tasks** | `GET` | `/tasks` | List tasks (scoped by company/branch/assignee) | Tenant Roles |
| | `GET` | `/tasks/assignee/:userId` | List tasks assigned to user | Tenant Roles |
| | `GET` | `/tasks/:id` | Get task details (includes subtasks, escalations, evidence) | Tenant Roles |
| | `POST` | `/tasks` | Create task (PM can only assign to TL) | `team_leader`, `project_manager`, `Branch Manager` |
| | `PATCH` | `/tasks/:id` | Update task (emits `task.completed` event on completion) | `team_member`, `team_leader`, `project_manager`, `Branch Manager` |
| | `DELETE`| `/tasks/:id` | Soft delete task (`deletedAt`) | `project_manager`, `team_leader`, `Branch Manager` |
| **Subtasks** | `GET` | `/subtasks` | List subtasks | Tenant Roles |
| | `GET` | `/subtasks/by-task/:taskId` | List subtasks for a task | Tenant Roles |
| | `POST` | `/subtasks` | Create subtask | `team_leader`, `project_manager` |
| | `PATCH` | `/subtasks/:id` | Update subtask | `team_member`, `team_leader` |
| | `DELETE`| `/subtasks/:id` | Soft delete subtask | `team_leader`, `project_manager` |
| **Escalations** | `GET` | `/escalations` | List escalations for tenant | Tenant Roles |
| | `GET` | `/escalations/:id` | Get escalation details | Tenant Roles |
| | `POST` | `/escalations` | Create escalation | `team_member`, `team_leader` |
| | `PATCH` | `/escalations/:id` | Update escalation | `team_leader`, `project_manager` |
| | `DELETE`| `/escalations/:id` | Delete escalation | `team_leader`, `project_manager` |
| **Process Instances** | `GET` | `/process-instances` | List process instances | Tenant Roles |
| | `GET` | `/process-instances/:id` | Get process instance details | Tenant Roles |
| | `POST` | `/process-instances` | Create process instance | `superuser`, `process_admin`, `project_manager` |
| | `PATCH` | `/process-instances/:id` | Update process instance | `superuser`, `process_admin`, `project_manager` |
| | `DELETE`| `/process-instances/:id` | Delete process instance | `superuser`, `process_admin` |
| **Process Instance Steps** | `GET` | `/process-instance-steps` | List steps (query `processInstanceId`)| Tenant Roles |
| | `GET` | `/process-instance-steps/:id`| Get step details | Tenant Roles |
| | `POST` | `/process-instance-steps` | Create instance step | `superuser`, `project_manager` |
| | `PATCH` | `/process-instance-steps/:id`| Update step status/action | `superuser`, `project_manager`, `team_leader`, `team_member` |
| **Compliance** | `GET` | `/compliance-categories` | List compliance categories | Tenant Roles |
| | `POST` | `/compliance-categories` | Create compliance category | `superuser`, `compliance_officer` |
| | `GET` | `/compliance-rules` | List compliance rules | Tenant Roles |
| | `POST` | `/compliance-rules` | Create compliance rule | `superuser`, `compliance_officer` |
| | `PATCH` | `/compliance-rules/:id` | Update compliance rule | `superuser`, `compliance_officer` |
| | `DELETE`| `/compliance-rules/:id` | Delete compliance rule | `superuser` |
| | `GET` | `/compliance-bindings` | List bindings (query `ruleId`) | Tenant Roles |
| | `POST` | `/compliance-bindings` | Bind rule to scope | `superuser`, `compliance_officer` |
| | `DELETE`| `/compliance-bindings/:id` | Remove binding | `superuser`, `compliance_officer` |
| | `GET` | `/compliance-violations` | List violations (scoped by branch if query provided) | Tenant Roles |
| | `POST` | `/compliance-violations` | Create violation | `superuser`, `compliance_officer` |
| | `PATCH` | `/compliance-violations/:id`| Update violation status & resolution | `superuser`, `compliance_officer`, `project_manager` |
| **Evidence & Attachments** | `GET` | `/evidence` | List evidence records | Tenant Roles |
| | `POST` | `/evidence` | Create evidence record | Tenant Roles |
| | `PATCH` | `/evidence/:id` | Review/update evidence status | Tenant Roles |
| | `DELETE`| `/evidence/:id` | Delete evidence record | Tenant Roles |
| | `POST` | `/evidence/:id/upload` | Multer physical file upload (`multipart/form-data`) | Tenant Roles |
| | `GET` | `/attachments` | List attachments | Tenant Roles |
| | `POST` | `/attachments` | Create attachment record | Tenant Roles |
| | `POST` | `/attachments/upload` | Multer physical file upload (`multipart/form-data`) | Tenant Roles |
| | `DELETE`| `/attachments/:id` | Delete attachment | Tenant Roles |
| **Audit Logs & Notifications** | `GET` | `/audit-logs` | List audit logs for tenant | Tenant Roles |
| | `GET` | `/audit-logs/by-user/:userId` | Logs by user | `superuser`, `compliance_officer`, `hr_manager` |
| | `GET` | `/audit-logs/by-entity/:entityType/:entityId` | Logs by entity | `superuser`, `compliance_officer` |
| | `POST` | `/audit-logs` | Manually insert audit log entry | Tenant Roles |
| | `GET` | `/notifications` | List notifications (query `userId`) | Tenant Roles |
| | `POST` | `/notifications` | Create notification | `superuser`, `project_manager`, `team_leader`, `compliance_officer` |
| | `PATCH` | `/notifications/:id/read`| Mark single notification as read | Tenant Roles |
| | `POST` | `/notifications/read-all` | Mark all notifications read for user | Tenant Roles |

---

### 3. Authentication, JWT Claims, Roles & Tenant Isolation

1. **Client Identity Headers:**
   * The frontend passes headers via [helpers.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js):
     * `Authorization: Bearer <token_or_actor_id>`
     * `x-user-role`: string role slug (`superuser`, `project_manager`, `team_leader`, `team_member`, `hr_manager`, `compliance_officer`, `platform_admin`, `guest`)
     * `x-user-id` / `x-user-email`: identifying the active actor
     * `x-company-id`: tenant UUID
     * `x-platform-admin-id`: platform admin user UUID
2. **Tenant Middleware ([tenant.middleware.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/middleware/tenant.middleware.ts)):**
   * Resolves user from database via `x-user-id` / `x-user-email` or fallback to `x-company-id`.
   * Loads `RoleAssignment` and maps to canonical `roleLabel` (`Company Owner`, `Access Governance`, `Branch Manager`, `Process Admin`, `Project Manager`, `Team Leader`, `Team Member`, etc.).
   * Injects `req.user: RequestUser` with `{ id, companyId, role, roleLabel, email, fullName, scopeType, scopeId }`.
3. **Role Checks ([roles.guard.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/guards/roles.guard.ts)):**
   * Multi-surface check: grants access if any of `req.user.roleLabel`, `req.user.role`, or `x-user-role` matches the route's allowed list (case-insensitive).
4. **JWT Implementation:**
   * Handled in [auth.service.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/auth/auth.service.ts) using `jsonwebtoken`.
   * Claims: `{ sub: user.id, companyId: company.id, role: roleLabel }` with 24h expiration.

---

### 4. Tenant Registration & Platform Administration

* **Tenant Registration Flow ([auth.service.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/auth/auth.service.ts)):**
  1. Creates `Company` with `Active` status.
  2. Hashes password using `bcryptjs` and creates the owner `User`.
  3. Creates `Subscription` for the selected `Plan` (`billingCycle`: `MONTHLY` / `YEARLY`).
  4. Ensures predefined platform `RoleTemplate`s exist, then clones them into concrete `Role` records for the new company.
  5. Assigns the owner user to `System Admin` / `Company Owner` role at `ScopeType.Company`.
  6. Clones platform-level `ComplianceRule`s to the company.
  7. Issues JWT and returns target route redirect.
* **Platform Admin CRUD:**
  * Guarded by [platform-admin.guard.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/guards/platform-admin.guard.ts) requiring valid `x-platform-admin-id` (or development `bootstrap` bypass).
  * Manages global SaaS plans, tenant companies, platform admin accounts, and time-bounded support access sessions.

---

### 5. Org Hierarchy, Work, Compliance & Cross-Cutting Features

* **Org Hierarchy & Scope Rules ([tenant-scope.util.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/utils/tenant-scope.util.ts)):**
  * `Company` $\rightarrow$ `Branch` $\rightarrow$ `Team` $\rightarrow$ `Project` $\rightarrow$ `Task` $\rightarrow$ `Subtask`.
  * `Branch Manager`: Stored with `scopeType: Branch` and `scopeId: branchId`. Queries are strictly forced to their branch; cannot create or update resources in other branches.
  * `Company Owner`: Global visibility across all branches with optional branch drill-down query parameter (`?branchId=...`).
* **Task Assignment Business Rules ([tasks.service.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/tasks/tasks.service.ts)):**
  * Project Managers can **only assign tasks to Team Leaders** (`assertProjectManagerAssigneeIsTeamLeader`).
  * Only `team_leader`, `project_manager`, `superuser`, and `branch_manager` can delegate/reassign tasks.
  * Team Members only see their assigned tasks when fetching `/tasks`.
* **Automated Compliance Engine ([compliance-observer.service.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/compliance-violations/compliance-observer.service.ts)):**
  * Listens to `task.completed` event when a task is updated to `Completed`.
  * Checks if the task has uploaded `ComplianceEvidence`.
  * If no evidence exists and the team is bound to a rule like "Mandatory Code Review", automatically creates an `Open` `ComplianceViolation` with `entityType: 'Task'`.
* **Plan Limits ([plan-limit.service.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/services/plan-limit.service.ts)):**
  * Checks `maxBranches` and `maxUsers` before creating branches or inviting users. Throws 403 `ForbiddenException` if exceeded.
* **Evidence & Attachment Uploads:**
  * Real Multer file interceptor saving to `./uploads`, returning `/uploads/<filename>`.
* **Audit Logging:**
  * Emits logs for `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOGIN`, `PERMISSION_CHANGE` with `oldValue` and `newValue` diff snapshots.

---

### 6. Security, Rate Limiting & Middleware Audit

* **Implemented Security Middleware:**
  * **Helmet:** Configured in [main.ts](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts) with CSP, cross-origin resource policy, and HSTS.
  * **CORS:** Configured with explicit origin whitelist (`localhost:5500`, `3000`, `64064`) and credentials.
  * **Static Asset Serving:** Uploads folder served securely at `/uploads`.
  * **Global Exception Filter:** Intercepts Prisma and HTTP errors, sanitizing internal database error details before sending to client.
* **Rate Limiting Status:**
  * ⚠️ **Rate limiting is NOT implemented** in the existing codebase (no throttler middleware exists).

---

### 7. Frontend Endpoints & Integration Map

The frontend (HTML/JS + React apps in `front-end/`) consumes the following backend endpoints via `window.Helpers.api.request` and `fetch`:

* **Authentication & Registration:**
  * `POST /auth/login` ([auth-flows.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/auth-flows.js#L88))
  * `GET /auth/public-plans` ([register.html](file:///d:/Codes/FDFED/2_OptiFlow/front-end/register.html#L411))
  * `POST /auth/register-company` ([register.html](file:///d:/Codes/FDFED/2_OptiFlow/front-end/register.html#L547))
  * `POST /companies/register` ([auth-flows.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/auth-flows.js#L257))
* **Batch State Sync (`Helpers.getState` in [helpers.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L285-L300)):**
  * `GET /users`, `GET /tasks`, `GET /projects`, `GET /escalations`, `GET /evidence`, `GET /branches`, `GET /roles`, `GET /subtasks`, `GET /audit-logs`, `GET /compliance-rules`, `GET /compliance-violations`, `GET /users/roles/mapping`, `GET /process-instances`, `GET /process-templates`, `GET /process-instance-steps`.
* **Governance & Executive:**
  * `GET /governance/roles`, `POST /governance/invite`, `POST /governance/roles/clone`, `GET /governance/billing`
  * `GET /executive/branches`, `GET /executive/metrics`
* **Resource Mutations & Uploads:**
  * `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id`
  * `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`
  * `POST /subtasks`, `PATCH /subtasks/:id`, `DELETE /subtasks/:id`
  * `POST /escalations`, `PATCH /escalations/:id`, `DELETE /escalations/:id`
  * `POST /compliance-rules`, `PATCH /compliance-rules/:id`, `POST /compliance-bindings`
  * `POST /evidence`, `PATCH /evidence/:id`, `POST /evidence/:id/upload`
  * `POST /teams`, `DELETE /teams/:id`
  * `GET /processes/templates`, `GET /processes/templates/:id/steps`, `POST /processes/templates/:id/steps`
* **Platform Admin Console:**
  * `GET /platform/metrics`, `GET /platform/companies`, `GET /platform-admin-users`, `POST /platform-admin-users`, `PATCH /platform-admin-users/:id`, `DELETE /platform-admin-users/:id`, `GET /plans`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`, `GET /subscriptions`, `POST /subscriptions`, `PATCH /subscriptions/:id`, `DELETE /subscriptions/:id`, `GET /platform-support-access`, `POST /platform-support-access`, `DELETE /platform-support-access/:id`.

---

### 8. Confirmed Problems vs. Unresolved Questions

#### Confirmed Problems in Old Backend & Inconsistencies
1. **Request Body Parameter Casing Inconsistency:**
   * NestJS DTOs use a mix of snake_case (`project_id`, `created_by`, `assigned_to`, `estimated_hours`, `actual_hours`, `due_date`, `team_name`, `project_name`, `start_date`, `end_date`, `template_id`) and camelCase (`companyId`, `branchId`, `managerUserId`, `createdById`, `stepOrder`).
   * The new Express backend needs explicit body normalization to accept both `snake_case` and `camelCase` gracefully.
2. **Duplicate Company Registration Endpoints:**
   * `POST /auth/register-company` accepts `companyLegalName`, `ownerFullName`, `ownerEmail`, `password`, `planId`, `billingCycle` and returns `{ success: true, token, targetRoute, roleSlug, user }`.
   * `POST /companies/register` accepts `companyLegalName`, `ownerFullName`, `ownerEmail`, `ownerPassword`, `planName` and returns the created company/user object.
   * Both are called by different frontend pages (`register.html` vs `auth-flows.js`).
3. **Duplicate Route Paths for Same Resources:**
   * Process templates are accessible under both `/processes/templates` (used by [process-builder.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin/processes/process-builder.js)) and `/process-templates` (used by [helpers.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js)).
   * Metrics are under both `/executive/metrics` (executive dashboard) and `/dashboard/metrics` (metrics controller).
4. **Missing Rate Limiting:**
   * Despite requirement specifications, no rate limiting middleware was attached.

#### Unresolved Questions & Clarifications Needed
* **Numeric vs UUID IDs:** Frontend [helpers.js](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js) maps legacy numeric aliases (e.g. `userId`, `taskId`, `id` stripped of non-digits) alongside string UUIDs. Does the Express rewrite need to maintain UUID string primary keys exclusively while preserving frontend response compatibility? *(Recommended: keep standard UUIDs in DB and output formatted objects as the current NestJS does).*
* **JWT vs Header-Only Auth in Local Dev:** The frontend currently sends both `Authorization: Bearer <token>` and direct actor headers (`x-user-id`, `x-user-role`, `x-company-id`). Should Express strictly authenticate via JWT when provided, while falling back to headers for mock presets? *(Recommended: support JWT validation with header fallback for seamless frontend development and testing).*

---

