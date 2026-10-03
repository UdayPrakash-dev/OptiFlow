# API Routes and Controllers Documentation

This document details the exact HTTP routes, middleware, and the underlying controller logic for every item in the OptiFlow API.

## ATTACHMENTS API

### Routes Defined:
- `router.get(['/attachments', '/api/attachments'], authenticate, listAttachments)`
- `router.get(['/attachments/:id', '/api/attachments/:id'], authenticate, getAttachmentById)`
- `router.post(['/attachments', '/api/attachments'], authenticate, createAttachment)`
- `router.delete(['/attachments/:id', '/api/attachments/:id'], authenticate, deleteAttachment)`

### Controller Logic:
#### `listAttachments`
- **Database Operations:** `prisma.attachment.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getAttachmentById`
- **Database Operations:** `prisma.attachment.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createAttachment`
- **Database Operations:** `prisma.attachment.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `deleteAttachment`
- **Database Operations:** `prisma.attachment.findFirst`, `prisma.attachment.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## AUDIT-LOGS API

### Routes Defined:
- `router.get(['/audit-logs', '/api/audit-logs'], authenticate, listAuditLogs)`
- `router.get(['/audit-logs/by-user/:userId', '/api/audit-logs/by-user/:userId'], authenticate, listAuditLogsByUser)`
- `router.get(['/audit-logs/by-entity/:entityType/:entityId', '/api/audit-logs/by-entity/:entityType/:entityId'], authenticate, listAuditLogsByEntity)`
- `router.post(['/audit-logs', '/api/audit-logs'], authenticate, createAuditLogEndpoint)`

### Controller Logic:
#### `listAuditLogs`
- **Database Operations:** `prisma.auditLog.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `listAuditLogsByUser`
- **Database Operations:** `prisma.auditLog.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `listAuditLogsByEntity`
- **Database Operations:** `prisma.auditLog.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createAuditLogEndpoint`
- **Database Operations:** `None`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

## AUTH API

### Routes Defined:
- `router.post(['/auth/login', '/api/auth/login'], handleLogin)`
- `router.post(['/auth/register-company', '/api/auth/register-company', '/companies/register', '/api/companies/register'], handleRegisterCompany)`
- `router.get(['/auth/me', '/api/auth/me'], authenticate, handleGetMe)`
- `router.get(['/auth/public-plans', '/api/auth/public-plans', '/public/plans', '/api/public/plans'], handleGetPublicPlans)`

### Controller Logic:
#### `handleLogin`
- **Database Operations:** `prisma.user.findFirst`, `prisma.branch.findFirst`
- **Detailed Logic:** Verifies credentials (e.g. bcrypt compare), generates a JWT, and returns the auth token.

#### `handleRegisterCompany`
- **Database Operations:** `prisma.user.findFirst`, `tx.company.create`, `tx.user.create`, `tx.plan.findFirst`, `tx.subscription.create`, `tx.roleTemplate.findMany`, `tx.roleTemplate.create`, `tx.role.create`, `tx.roleAssignment.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object. Transactional wrapper (`prisma.$transaction`) is used for multi-table atomicity.

#### `handleGetPublicPlans`
- **Database Operations:** `prisma.plan.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

## BOOTSTRAP API

### Routes Defined:
- `router.get(['/bootstrap', '/api/bootstrap'], authenticate, getBootstrapState)`

### Controller Logic:
#### `getBootstrapState`
- **Database Operations:** `prisma.user.findUnique`, `prisma.branch.findMany`, `prisma.team.findMany`, `prisma.role.findMany`, `prisma.notification.count`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

## BRANCHES API

### Routes Defined:
- `router.get(['/branches', '/api/branches', '/departments', '/api/departments'], authenticate, listBranches)`
- `router.get(['/branches/:id', '/api/branches/:id', '/departments/:id', '/api/departments/:id'], authenticate, getBranchById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listBranches`
- **Database Operations:** `prisma.branch.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getBranchById`
- **Database Operations:** `prisma.branch.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createBranch`
- **Database Operations:** `prisma.branch.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateBranch`
- **Database Operations:** `prisma.branch.findFirst`, `prisma.branch.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteBranch`
- **Database Operations:** `prisma.branch.findFirst`, `prisma.team.count`, `prisma.branch.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## COMPLIANCE-BINDINGS API

### Routes Defined:
- `router.get(['/compliance-bindings', '/api/compliance-bindings'], authenticate, listComplianceBindings)`
- `router.get(['/compliance-bindings/:id', '/api/compliance-bindings/:id'], authenticate, getComplianceBindingById)`
- `router.post(`
- `router.delete(`

### Controller Logic:
#### `listComplianceBindings`
- **Database Operations:** `prisma.complianceBinding.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getComplianceBindingById`
- **Database Operations:** `prisma.complianceBinding.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createComplianceBinding`
- **Database Operations:** `prisma.complianceRule.findFirst`, `prisma.complianceBinding.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `deleteComplianceBinding`
- **Database Operations:** `prisma.complianceBinding.findFirst`, `prisma.complianceBinding.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## COMPLIANCE-CATEGORIES API

### Routes Defined:
- `router.get(['/compliance-categories', '/api/compliance-categories'], authenticate, listComplianceCategories)`
- `router.get(['/compliance-categories/:id', '/api/compliance-categories/:id'], authenticate, getComplianceCategoryById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listComplianceCategories`
- **Database Operations:** `prisma.complianceCategory.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getComplianceCategoryById`
- **Database Operations:** `prisma.complianceCategory.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createComplianceCategory`
- **Database Operations:** `prisma.complianceCategory.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateComplianceCategory`
- **Database Operations:** `prisma.complianceCategory.findFirst`, `prisma.complianceCategory.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteComplianceCategory`
- **Database Operations:** `prisma.complianceCategory.findFirst`, `prisma.complianceCategory.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## COMPLIANCE-EVIDENCE API

### Routes Defined:
- `router.get(['/evidence', '/api/evidence'], authenticate, listEvidence)`
- `router.get(['/evidence/:id', '/api/evidence/:id'], authenticate, getEvidenceById)`
- `router.get(['/evidence/:id/file', '/api/evidence/:id/file'], authenticate, streamEvidenceFile)`
- `router.post(`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listEvidence`
- **Database Operations:** `prisma.complianceEvidence.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getEvidenceById`
- **Database Operations:** `prisma.complianceEvidence.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createEvidence`
- **Database Operations:** `prisma.task.findFirst`, `prisma.complianceViolation.findFirst`, `prisma.complianceEvidence.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateEvidence`
- **Database Operations:** `prisma.complianceEvidence.findFirst`, `prisma.complianceEvidence.update`, `prisma.complianceViolation.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteEvidence`
- **Database Operations:** `prisma.complianceEvidence.findFirst`, `prisma.complianceEvidence.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

#### `uploadEvidenceFile`
- **Database Operations:** `prisma.complianceEvidence.findFirst`, `prisma.attachment.create`, `prisma.complianceEvidence.update`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

#### `streamEvidenceFile`
- **Database Operations:** `prisma.complianceEvidence.findFirst`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

## COMPLIANCE-RULES API

### Routes Defined:
- `router.get(['/compliance-rules', '/api/compliance-rules'], authenticate, listComplianceRules)`
- `router.get(['/compliance-rules/:id', '/api/compliance-rules/:id'], authenticate, getComplianceRuleById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listComplianceRules`
- **Database Operations:** `prisma.complianceRule.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getComplianceRuleById`
- **Database Operations:** `prisma.complianceRule.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createComplianceRule`
- **Database Operations:** `prisma.complianceCategory.findFirst`, `prisma.complianceRule.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateComplianceRule`
- **Database Operations:** `prisma.complianceRule.findFirst`, `prisma.complianceRule.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteComplianceRule`
- **Database Operations:** `prisma.complianceRule.findFirst`, `prisma.complianceRule.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## COMPLIANCE-VIOLATIONS API

### Routes Defined:
- `router.get(['/compliance-violations', '/api/compliance-violations'], authenticate, listComplianceViolations)`
- `router.get(['/compliance-violations/:id', '/api/compliance-violations/:id'], authenticate, getComplianceViolationById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listComplianceViolations`
- **Database Operations:** `prisma.complianceViolation.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getComplianceViolationById`
- **Database Operations:** `prisma.complianceViolation.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createComplianceViolation`
- **Database Operations:** `prisma.complianceRule.findFirst`, `prisma.complianceViolation.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateComplianceViolation`
- **Database Operations:** `prisma.complianceViolation.findFirst`, `prisma.complianceViolation.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteComplianceViolation`
- **Database Operations:** `prisma.complianceViolation.findFirst`, `prisma.complianceViolation.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## EXECUTIVE API

### Routes Defined:
- `router.get(`
- `router.get(`

### Controller Logic:
#### `getExecutiveBranches`
- **Database Operations:** `prisma.branch.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getExecutiveMetrics`
- **Database Operations:** `prisma.user.count`, `prisma.team.count`, `prisma.branch.count`, `prisma.project.count`, `prisma.task.count`, `prisma.escalation.count`, `prisma.complianceViolation.count`, `prisma.subscription.findFirst`, `prisma.task.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

## HEALTH API

### Routes Defined:
- `router.get(['/health', '/api/health'], getHealth)`

### Controller Logic:
*No standard async route handler functions extracted from controller.*

## NOTIFICATIONS API

### Routes Defined:
- `router.get(['/notifications', '/api/notifications'], authenticate, listNotifications)`
- `router.post(`
- `router.patch(['/notifications/:id/read', '/api/notifications/:id/read'], authenticate, markNotificationAsRead)`
- `router.post(['/notifications/read-all', '/api/notifications/read-all'], authenticate, markAllNotificationsAsRead)`

### Controller Logic:
#### `listNotifications`
- **Database Operations:** `prisma.user.findFirst`, `prisma.notification.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createNotification`
- **Database Operations:** `prisma.user.findFirst`, `prisma.notification.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `markNotificationAsRead`
- **Database Operations:** `prisma.notification.findUnique`, `prisma.notification.update`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

#### `markAllNotificationsAsRead`
- **Database Operations:** `prisma.user.findFirst`, `prisma.notification.updateMany`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

## PERMISSIONS API

### Routes Defined:
- `router.get(['/permissions', '/api/permissions'], authenticate, listPermissions)`

### Controller Logic:
#### `listPermissions`
- **Database Operations:** `prisma.permission.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

## PLATFORM API

### Routes Defined:
- `router.post(['/platform/auth/login', '/api/platform/auth/login'], platformLogin)`
- `router.get(['/platform/auth/me', '/api/platform/auth/me'], authenticatePlatformAdmin, platformAuthMe)`
- `router.get(['/platform/metrics', '/api/platform/metrics'], authenticatePlatformAdmin, getPlatformMetrics)`
- `router.get(['/platform/companies', '/api/platform/companies'], authenticatePlatformAdmin, listPlatformCompanies)`
- `router.get(['/platform/companies/:id', '/api/platform/companies/:id'], authenticatePlatformAdmin, getPlatformCompanyById)`
- `router.patch(['/platform/companies/:id', '/api/platform/companies/:id'], authenticatePlatformAdmin, updatePlatformCompany)`
- `router.get(['/platform/plans', '/api/platform/plans'], authenticatePlatformAdmin, listPlans)`
- `router.get(['/platform/plans/:id', '/api/platform/plans/:id'], authenticatePlatformAdmin, getPlanById)`
- `router.post(['/platform/plans', '/api/platform/plans'], authenticatePlatformAdmin, createPlan)`
- `router.patch(['/platform/plans/:id', '/api/platform/plans/:id'], authenticatePlatformAdmin, updatePlan)`
- `router.get(['/platform/subscriptions', '/api/platform/subscriptions'], authenticatePlatformAdmin, listSubscriptions)`
- `router.post(['/platform/subscriptions', '/api/platform/subscriptions'], authenticatePlatformAdmin, createSubscription)`
- `router.get(['/platform/admin-users', '/api/platform/admin-users', '/api/platform-admin-users'], authenticatePlatformAdmin, listPlatformAdminUsers)`
- `router.get(['/platform/admin-users/:id', '/api/platform/admin-users/:id', '/api/platform-admin-users/:id'], authenticatePlatformAdmin, getPlatformAdminUserById)`
- `router.post(['/platform/admin-users', '/api/platform/admin-users', '/api/platform-admin-users'], authenticatePlatformAdmin, createPlatformAdminUser)`
- `router.patch(['/platform/admin-users/:id', '/api/platform/admin-users/:id', '/api/platform-admin-users/:id'], authenticatePlatformAdmin, updatePlatformAdminUser)`
- `router.delete(['/platform/admin-users/:id', '/api/platform/admin-users/:id', '/api/platform-admin-users/:id'], authenticatePlatformAdmin, deletePlatformAdminUser)`
- `router.get(`
- `router.get(`
- `router.post(`
- `router.delete(`

### Controller Logic:
#### `platformLogin`
- **Database Operations:** `prisma.platformAdminUser.findUnique`
- **Detailed Logic:** Verifies credentials (e.g. bcrypt compare), generates a JWT, and returns the auth token.

#### `platformAuthMe`
- **Database Operations:** `None`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

#### `getPlatformMetrics`
- **Database Operations:** `prisma.company.count`, `prisma.platformAdminUser.count`, `prisma.subscription.groupBy`, `prisma.plan.findMany`, `prisma.platformSupportAccess.findMany`, `prisma.company.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `listPlatformCompanies`
- **Database Operations:** `prisma.company.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getPlatformCompanyById`
- **Database Operations:** `prisma.company.findUnique`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `updatePlatformCompany`
- **Database Operations:** `prisma.company.findUnique`, `prisma.company.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `listPlans`
- **Database Operations:** `prisma.plan.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getPlanById`
- **Database Operations:** `prisma.plan.findUnique`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createPlan`
- **Database Operations:** `prisma.plan.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updatePlan`
- **Database Operations:** `prisma.plan.findUnique`, `prisma.plan.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `listSubscriptions`
- **Database Operations:** `prisma.subscription.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createSubscription`
- **Database Operations:** `prisma.company.findUnique`, `prisma.plan.findUnique`, `prisma.subscription.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `listPlatformAdminUsers`
- **Database Operations:** `prisma.platformAdminUser.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getPlatformAdminUserById`
- **Database Operations:** `prisma.platformAdminUser.findUnique`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createPlatformAdminUser`
- **Database Operations:** `prisma.platformAdminUser.findUnique`, `prisma.platformAdminUser.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updatePlatformAdminUser`
- **Database Operations:** `prisma.platformAdminUser.findUnique`, `prisma.platformAdminUser.count`, `prisma.platformAdminUser.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deletePlatformAdminUser`
- **Database Operations:** `prisma.platformAdminUser.findUnique`, `prisma.platformAdminUser.count`, `prisma.platformAdminUser.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

#### `listPlatformSupportAccesses`
- **Database Operations:** `prisma.platformSupportAccess.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getPlatformSupportAccessById`
- **Database Operations:** `prisma.platformSupportAccess.findUnique`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createPlatformSupportAccess`
- **Database Operations:** `prisma.company.findUnique`, `prisma.platformSupportAccess.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `revokePlatformSupportAccess`
- **Database Operations:** `prisma.platformSupportAccess.findUnique`, `prisma.platformSupportAccess.delete`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

## PROCESS API

### Routes Defined:
- `router.get('/process-templates', authenticate, listTemplates)`
- `router.get('/processes/templates', authenticate, listTemplates)`
- `router.get('/api/process-templates', authenticate, listTemplates)`
- `router.get('/api/processes/templates', authenticate, listTemplates)`
- `router.get('/process-templates/:id', authenticate, getTemplate)`
- `router.get('/processes/templates/:id', authenticate, getTemplate)`
- `router.get('/api/process-templates/:id', authenticate, getTemplate)`
- `router.get('/api/processes/templates/:id', authenticate, getTemplate)`
- `router.post('/process-templates', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createTemplate)`
- `router.post('/processes/templates', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createTemplate)`
- `router.post('/api/process-templates', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createTemplate)`
- `router.post('/api/processes/templates', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createTemplate)`
- `router.patch('/process-templates/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateTemplate)`
- `router.patch('/processes/templates/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateTemplate)`
- `router.patch('/api/process-templates/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateTemplate)`
- `router.patch('/api/processes/templates/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateTemplate)`
- `router.delete('/process-templates/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteTemplate)`
- `router.delete('/processes/templates/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteTemplate)`
- `router.delete('/api/process-templates/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteTemplate)`
- `router.delete('/api/processes/templates/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteTemplate)`
- `router.get('/processes/templates/:id/steps', authenticate, listTemplateSteps)`
- `router.get('/api/processes/templates/:id/steps', authenticate, listTemplateSteps)`
- `router.post('/processes/templates/:id/steps', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), addTemplateStep)`
- `router.post('/api/processes/templates/:id/steps', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), addTemplateStep)`
- `router.get('/process-instances', authenticate, listInstances)`
- `router.get('/processes/instances', authenticate, listInstances)`
- `router.get('/api/process-instances', authenticate, listInstances)`
- `router.get('/api/processes/instances', authenticate, listInstances)`
- `router.get('/process-instances/:id', authenticate, getInstance)`
- `router.get('/processes/instances/:id', authenticate, getInstance)`
- `router.get('/api/process-instances/:id', authenticate, getInstance)`
- `router.get('/api/processes/instances/:id', authenticate, getInstance)`
- `router.post('/process-instances', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createInstance)`
- `router.post('/processes/instances', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createInstance)`
- `router.post('/api/process-instances', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createInstance)`
- `router.post('/api/processes/instances', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createInstance)`
- `router.patch('/process-instances/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateInstance)`
- `router.patch('/processes/instances/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateInstance)`
- `router.patch('/api/process-instances/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateInstance)`
- `router.patch('/api/processes/instances/:id', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), updateInstance)`
- `router.delete('/process-instances/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteInstance)`
- `router.delete('/processes/instances/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteInstance)`
- `router.delete('/api/process-instances/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteInstance)`
- `router.delete('/api/processes/instances/:id', authenticate, requireRoles(...PROCESS_ADMIN_ROLES), deleteInstance)`
- `router.get('/process-instance-steps', authenticate, listSteps)`
- `router.get('/processes/steps', authenticate, listSteps)`
- `router.get('/api/process-instance-steps', authenticate, listSteps)`
- `router.get('/api/processes/steps', authenticate, listSteps)`
- `router.get('/process-instance-steps/:id', authenticate, getStep)`
- `router.get('/processes/steps/:id', authenticate, getStep)`
- `router.get('/api/process-instance-steps/:id', authenticate, getStep)`
- `router.get('/api/processes/steps/:id', authenticate, getStep)`
- `router.post('/process-instance-steps', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createStep)`
- `router.post('/processes/steps', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createStep)`
- `router.post('/api/process-instance-steps', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createStep)`
- `router.post('/api/processes/steps', authenticate, requireRoles(...PROCESS_MANAGER_ROLES), createStep)`
- `router.patch('/process-instance-steps/:id', authenticate, actionStep)`
- `router.patch('/process-instance-steps/:id/action', authenticate, actionStep)`
- `router.patch('/processes/steps/:id/action', authenticate, actionStep)`
- `router.patch('/api/process-instance-steps/:id', authenticate, actionStep)`
- `router.patch('/api/process-instance-steps/:id/action', authenticate, actionStep)`
- `router.patch('/api/processes/steps/:id/action', authenticate, actionStep)`

### Controller Logic:
#### `listTemplates`
- **Database Operations:** `prisma.processTemplate.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getTemplate`
- **Database Operations:** `prisma.processTemplate.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createTemplate`
- **Database Operations:** `prisma.processTemplate.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateTemplate`
- **Database Operations:** `prisma.processTemplate.findFirst`, `tx.processTemplateStep.deleteMany`, `tx.processTemplateStep.createMany`, `tx.processTemplate.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state. Transactional wrapper (`prisma.$transaction`) is used for multi-table atomicity.

#### `deleteTemplate`
- **Database Operations:** `prisma.processTemplate.findFirst`, `prisma.processTemplate.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

#### `listTemplateSteps`
- **Database Operations:** `prisma.processTemplate.findFirst`, `prisma.processTemplateStep.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `addTemplateStep`
- **Database Operations:** `prisma.processTemplate.findFirst`, `prisma.processTemplateStep.create`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

#### `listInstances`
- **Database Operations:** `prisma.processInstance.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getInstance`
- **Database Operations:** `prisma.processInstance.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createInstance`
- **Database Operations:** `prisma.processTemplate.findFirst`, `prisma.project.findFirst`, `tx.processInstance.create`, `tx.processInstanceStep.create`, `tx.processInstance.update`, `tx.processInstance.findUnique`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object. Transactional wrapper (`prisma.$transaction`) is used for multi-table atomicity.

#### `updateInstance`
- **Database Operations:** `prisma.processInstance.findFirst`, `prisma.project.findFirst`, `prisma.processInstance.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteInstance`
- **Database Operations:** `prisma.processInstance.findFirst`, `prisma.processInstanceStep.deleteMany`, `prisma.processInstance.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

#### `listSteps`
- **Database Operations:** `prisma.processInstanceStep.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getStep`
- **Database Operations:** `prisma.processInstanceStep.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createStep`
- **Database Operations:** `prisma.processInstance.findFirst`, `prisma.processTemplateStep.findFirst`, `prisma.user.findFirst`, `prisma.processInstanceStep.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `actionStep`
- **Database Operations:** `prisma.processInstanceStep.findFirst`, `prisma.user.findFirst`, `tx.processInstanceStep.update`, `tx.processInstanceStep.findFirst`, `tx.processInstance.update`, `tx.processTemplateStep.findFirst`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state. Transactional wrapper (`prisma.$transaction`) is used for multi-table atomicity.

## PROJECTS API

### Routes Defined:
- `router.get(['/projects', '/api/projects'], authenticate, listProjects)`
- `router.get(['/projects/:id', '/api/projects/:id'], authenticate, getProjectById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listProjects`
- **Database Operations:** `prisma.project.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getProjectById`
- **Database Operations:** `prisma.project.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createProject`
- **Database Operations:** `prisma.team.findFirst`, `prisma.project.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateProject`
- **Database Operations:** `prisma.project.findFirst`, `prisma.team.findFirst`, `prisma.project.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteProject`
- **Database Operations:** `prisma.project.findFirst`, `prisma.project.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## ROLE-ASSIGNMENTS API

### Routes Defined:
- `router.get(['/role-assignments', '/api/role-assignments'], authenticate, listRoleAssignments)`
- `router.post(`
- `router.delete(`

### Controller Logic:
#### `listRoleAssignments`
- **Database Operations:** `prisma.roleAssignment.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createRoleAssignment`
- **Database Operations:** `prisma.user.findFirst`, `prisma.role.findFirst`, `prisma.roleAssignment.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `deleteRoleAssignment`
- **Database Operations:** `prisma.roleAssignment.findFirst`, `prisma.roleAssignment.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## ROLE-TEMPLATES API

### Routes Defined:
- `router.get(['/role-templates', '/api/role-templates'], authenticate, listRoleTemplates)`

### Controller Logic:
#### `listRoleTemplates`
- **Database Operations:** `prisma.roleTemplate.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

## ROLES API

### Routes Defined:
- `router.get(['/roles', '/api/roles'], authenticate, listRoles)`
- `router.get(['/roles/:id', '/api/roles/:id'], authenticate, getRoleById)`

### Controller Logic:
#### `listRoles`
- **Database Operations:** `prisma.role.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getRoleById`
- **Database Operations:** `prisma.role.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

## TASKS API

### Routes Defined:
- `router.get(['/tasks', '/api/tasks'], authenticate, listTasks)`
- `router.get(['/tasks/assignee/:userId', '/api/tasks/assignee/:userId'], authenticate, listTasksByAssignee)`
- `router.get(['/tasks/:id', '/api/tasks/:id'], authenticate, getTaskById)`
- `router.post(`
- `router.patch(`
- `router.delete(`
- `router.get(['/subtasks', '/api/subtasks'], authenticate, listSubtasks)`
- `router.get(['/subtasks/by-task/:taskId', '/api/subtasks/by-task/:taskId'], authenticate, listSubtasksByTask)`
- `router.get(['/subtasks/:id', '/api/subtasks/:id'], authenticate, getSubtaskById)`
- `router.post(`
- `router.patch(`
- `router.delete(`
- `router.get(['/escalations', '/api/escalations'], authenticate, listEscalations)`
- `router.get(['/escalations/:id', '/api/escalations/:id'], authenticate, getEscalationById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listTasks`
- **Database Operations:** `prisma.task.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `listTasksByAssignee`
- **Database Operations:** `prisma.task.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getTaskById`
- **Database Operations:** `prisma.task.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createTask`
- **Database Operations:** `prisma.project.findFirst`, `prisma.user.findFirst`, `prisma.task.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateTask`
- **Database Operations:** `prisma.task.findFirst`, `prisma.user.findFirst`, `prisma.task.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteTask`
- **Database Operations:** `prisma.task.findFirst`, `prisma.task.update`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

#### `listSubtasks`
- **Database Operations:** `prisma.subtask.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `listSubtasksByTask`
- **Database Operations:** `prisma.subtask.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getSubtaskById`
- **Database Operations:** `prisma.subtask.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createSubtask`
- **Database Operations:** `prisma.task.findFirst`, `prisma.subtask.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateSubtask`
- **Database Operations:** `prisma.subtask.findFirst`, `prisma.subtask.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteSubtask`
- **Database Operations:** `prisma.subtask.findFirst`, `prisma.subtask.update`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

#### `listEscalations`
- **Database Operations:** `prisma.escalation.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getEscalationById`
- **Database Operations:** `prisma.escalation.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createEscalation`
- **Database Operations:** `prisma.task.findFirst`, `prisma.project.findFirst`, `prisma.escalation.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateEscalation`
- **Database Operations:** `prisma.escalation.findFirst`, `prisma.escalation.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteEscalation`
- **Database Operations:** `prisma.escalation.findFirst`, `prisma.escalation.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## TEAMS API

### Routes Defined:
- `router.get(['/teams', '/api/teams'], authenticate, listTeams)`
- `router.get(['/teams/:id', '/api/teams/:id'], authenticate, getTeamById)`
- `router.post(`
- `router.patch(`
- `router.delete(`

### Controller Logic:
#### `listTeams`
- **Database Operations:** `prisma.team.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getTeamById`
- **Database Operations:** `prisma.team.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createTeam`
- **Database Operations:** `prisma.branch.findFirst`, `prisma.team.create`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object.

#### `updateTeam`
- **Database Operations:** `prisma.team.findFirst`, `prisma.branch.findFirst`, `prisma.team.update`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state.

#### `deleteTeam`
- **Database Operations:** `prisma.team.findFirst`, `prisma.project.count`, `prisma.team.delete`
- **Detailed Logic:** Verifies existence and ownership, performs a hard/soft delete in the database, and returns a success envelope.

## USERS API

### Routes Defined:
- `router.get(['/users', '/api/users'], authenticate, listUsers)`
- `router.get(['/users/roles/mapping', '/api/users/roles/mapping'], authenticate, listUserRoleMappings)`
- `router.get(['/users/:id', '/api/users/:id'], authenticate, getUserById)`
- `router.post(`
- `router.patch(['/users/:id', '/api/users/:id'], authenticate, updateUser)`
- `router.delete(`

### Controller Logic:
#### `listUsers`
- **Database Operations:** `prisma.user.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `listUserRoleMappings`
- **Database Operations:** `prisma.roleAssignment.findMany`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `getUserById`
- **Database Operations:** `prisma.user.findFirst`
- **Detailed Logic:** Executes a read query against the database, applying tenant isolation (`companyId`) and pagination/filters, returning the dataset.

#### `createUser`
- **Database Operations:** `prisma.user.findFirst`, `prisma.role.findMany`, `tx.user.create`, `tx.roleAssignment.create`, `tx.user.findUnique`
- **Detailed Logic:** Validates input schema, inserts a new record into the database, and returns the created object. Transactional wrapper (`prisma.$transaction`) is used for multi-table atomicity.

#### `updateUser`
- **Database Operations:** `prisma.user.findFirst`, `prisma.role.findMany`, `tx.user.update`, `tx.roleAssignment.deleteMany`, `tx.roleAssignment.create`, `tx.user.findUnique`
- **Detailed Logic:** Validates updates, modifies the existing database record, and returns the updated state. Transactional wrapper (`prisma.$transaction`) is used for multi-table atomicity.

#### `deactivateUser`
- **Database Operations:** `prisma.user.findFirst`, `prisma.user.update`
- **Detailed Logic:** Executes specific domain logic, manipulates records, and returns standard JSON payload.

