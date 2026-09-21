/**
 * OptiFlow Deterministic Reference Data Catalogue
 * Contains standard plans, permissions catalogue, role templates, and baseline compliance rules.
 */

export const PLANS = [
  {
    name: 'Starter',
    maxBranches: 2,
    maxUsers: 15,
    maxActiveProcessTemplates: 3,
    maxComplianceRules: 5,
    maxStorageMb: 500,
    auditLogRetentionDays: 30,
    allowsIntegrations: false
  },
  {
    name: 'Professional',
    maxBranches: 10,
    maxUsers: 100,
    maxActiveProcessTemplates: 15,
    maxComplianceRules: 25,
    maxStorageMb: 5000,
    auditLogRetentionDays: 180,
    allowsIntegrations: true
  },
  {
    name: 'Enterprise',
    maxBranches: null, // Unlimited
    maxUsers: null,    // Unlimited
    maxActiveProcessTemplates: null,
    maxComplianceRules: null,
    maxStorageMb: 50000,
    auditLogRetentionDays: 730,
    allowsIntegrations: true
  }
];

export const PERMISSIONS = [
  // Identity & HR
  { slug: 'user:create', module: 'Identity', description: 'Create and invite new employees' },
  { slug: 'user:read', module: 'Identity', description: 'View user profiles and employee directory' },
  { slug: 'user:update', module: 'Identity', description: 'Update user profiles and managers' },
  { slug: 'user:deactivate', module: 'Identity', description: 'Deactivate user accounts and revoke sessions' },
  { slug: 'role:manage', module: 'Identity', description: 'Create and configure custom company roles' },
  { slug: 'role:assign', module: 'Identity', description: 'Grant or revoke scoped role assignments' },

  // Tenancy & Organization
  { slug: 'company:read', module: 'Tenancy', description: 'View company settings and subscriptions' },
  { slug: 'company:update', module: 'Tenancy', description: 'Update company profile and preferences' },
  { slug: 'branch:create', module: 'Tenancy', description: 'Create new organization branches' },
  { slug: 'branch:read', module: 'Tenancy', description: 'View branches and structure' },
  { slug: 'branch:update', module: 'Tenancy', description: 'Modify branch details' },
  { slug: 'branch:delete', module: 'Tenancy', description: 'Delete organization branches' },
  { slug: 'team:create', module: 'Tenancy', description: 'Create new departmental teams' },
  { slug: 'team:read', module: 'Tenancy', description: 'View teams and rosters' },
  { slug: 'team:update', module: 'Tenancy', description: 'Modify team names and branches' },
  { slug: 'team:delete', module: 'Tenancy', description: 'Delete teams' },
  { slug: 'team:member:manage', module: 'Tenancy', description: 'Add or remove members from teams' },

  // Work Management
  { slug: 'project:create', module: 'Work', description: 'Create new projects' },
  { slug: 'project:read', module: 'Work', description: 'View project details and timelines' },
  { slug: 'project:update', module: 'Work', description: 'Modify project details and status' },
  { slug: 'project:delete', module: 'Work', description: 'Soft-delete projects' },
  { slug: 'task:create', module: 'Work', description: 'Create and assign tasks' },
  { slug: 'task:read', module: 'Work', description: 'View task details and assignments' },
  { slug: 'task:update', module: 'Work', description: 'Update task properties' },
  { slug: 'task:transition', module: 'Work', description: 'Execute status transitions on tasks' },
  { slug: 'task:delete', module: 'Work', description: 'Soft-delete tasks' },
  { slug: 'subtask:create', module: 'Work', description: 'Create task subtasks' },
  { slug: 'subtask:read', module: 'Work', description: 'View subtasks' },
  { slug: 'subtask:update', module: 'Work', description: 'Update subtask status and details' },
  { slug: 'subtask:delete', module: 'Work', description: 'Soft-delete subtasks' },
  { slug: 'escalation:create', module: 'Work', description: 'Raise blocker escalations on tasks' },
  { slug: 'escalation:read', module: 'Work', description: 'View escalations' },
  { slug: 'escalation:resolve', module: 'Work', description: 'Resolve and close task escalations' },

  // Process Engine
  { slug: 'process.template:create', module: 'Process', description: 'Create workflow templates' },
  { slug: 'process.template:read', module: 'Process', description: 'View workflow templates and versions' },
  { slug: 'process.template:update', module: 'Process', description: 'Draft and edit workflow template versions' },
  { slug: 'process.template:publish', module: 'Process', description: 'Publish process template versions for execution' },
  { slug: 'process.instance:create', module: 'Process', description: 'Instantiate workflows from published templates' },
  { slug: 'process.instance:read', module: 'Process', description: 'View workflow execution instances' },
  { slug: 'process.instance:action', module: 'Process', description: 'Approve, reject, or action workflow steps' },

  // Compliance Engine
  { slug: 'compliance.category:manage', module: 'Compliance', description: 'Manage compliance categories' },
  { slug: 'compliance.rule:create', module: 'Compliance', description: 'Author compliance rules' },
  { slug: 'compliance.rule:read', module: 'Compliance', description: 'View compliance rules and bindings' },
  { slug: 'compliance.rule:update', module: 'Compliance', description: 'Update compliance rules' },
  { slug: 'compliance.rule:delete', module: 'Compliance', description: 'Delete compliance rules' },
  { slug: 'compliance.binding:manage', module: 'Compliance', description: 'Bind compliance rules to organization scopes' },
  { slug: 'compliance.violation:read', module: 'Compliance', description: 'View compliance violations' },
  { slug: 'compliance.violation:resolve', module: 'Compliance', description: 'Resolve open violations' },
  { slug: 'compliance.evidence:submit', module: 'Compliance', description: 'Upload and submit compliance evidence' },
  { slug: 'compliance.evidence:review', module: 'Compliance', description: 'Approve or reject compliance evidence' },

  // Files & Storage
  { slug: 'file:upload', module: 'Files', description: 'Upload evidence and task attachments' },
  { slug: 'file:read', module: 'Files', description: 'Generate authorised download links for files' },
  { slug: 'file:delete', module: 'Files', description: 'Delete uploaded files' },

  // Cross-Cutting & Governance
  { slug: 'audit:read', module: 'Audit', description: 'Search and inspect immutable audit log records' },
  { slug: 'analytics:read', module: 'Analytics', description: 'View company and branch analytics dashboards' },
  { slug: 'notification:read', module: 'Notifications', description: 'Read and acknowledge in-app notifications' }
];

export const ROLE_TEMPLATES = [
  {
    slug: 'company_admin',
    label: 'Company Administrator',
    description: 'Full administrative access across all company resources and operations',
    permissions: PERMISSIONS.map((p) => p.slug)
  },
  {
    slug: 'branch_manager',
    label: 'Branch Manager',
    description: 'Management of teams, projects, and work within an assigned branch',
    permissions: [
      'user:read',
      'branch:read',
      'team:read',
      'team:create',
      'team:update',
      'team:member:manage',
      'project:create',
      'project:read',
      'project:update',
      'task:create',
      'task:read',
      'task:update',
      'task:transition',
      'subtask:read',
      'escalation:read',
      'escalation:resolve',
      'process.instance:read',
      'compliance.violation:read',
      'compliance.evidence:submit',
      'file:upload',
      'file:read',
      'analytics:read',
      'notification:read'
    ]
  },
  {
    slug: 'hr_governance',
    label: 'HR & Access Governance',
    description: 'User management, team assignments, and scoped role grants',
    permissions: [
      'user:create',
      'user:read',
      'user:update',
      'user:deactivate',
      'role:assign',
      'branch:read',
      'team:read',
      'team:member:manage',
      'audit:read',
      'notification:read'
    ]
  },
  {
    slug: 'project_manager',
    label: 'Project Manager',
    description: 'Project planning, task delegation, and escalation handling within assigned scope',
    permissions: [
      'user:read',
      'project:create',
      'project:read',
      'project:update',
      'task:create',
      'task:read',
      'task:update',
      'task:transition',
      'subtask:create',
      'subtask:read',
      'subtask:update',
      'escalation:create',
      'escalation:read',
      'escalation:resolve',
      'compliance.evidence:submit',
      'file:upload',
      'file:read',
      'analytics:read',
      'notification:read'
    ]
  },
  {
    slug: 'compliance_officer',
    label: 'Compliance Officer',
    description: 'Rule authoring, scope binding, violation audits, and evidence reviews',
    permissions: [
      'user:read',
      'compliance.category:manage',
      'compliance.rule:create',
      'compliance.rule:read',
      'compliance.rule:update',
      'compliance.rule:delete',
      'compliance.binding:manage',
      'compliance.violation:read',
      'compliance.violation:resolve',
      'compliance.evidence:review',
      'compliance.evidence:submit',
      'file:upload',
      'file:read',
      'audit:read',
      'analytics:read',
      'notification:read'
    ]
  },
  {
    slug: 'team_leader',
    label: 'Team Leader',
    description: 'Team task coordination, subtask delegation, and review submissions',
    permissions: [
      'user:read',
      'team:read',
      'project:read',
      'task:read',
      'task:update',
      'task:transition',
      'subtask:create',
      'subtask:read',
      'subtask:update',
      'subtask:delete',
      'escalation:create',
      'escalation:read',
      'compliance.evidence:submit',
      'file:upload',
      'file:read',
      'notification:read'
    ]
  },
  {
    slug: 'team_member',
    label: 'Team Member',
    description: 'Working on assigned tasks, subtasks, escalations, and submitting evidence',
    permissions: [
      'user:read',
      'project:read',
      'task:read',
      'task:update',
      'task:transition',
      'subtask:read',
      'subtask:update',
      'escalation:create',
      'compliance.evidence:submit',
      'file:upload',
      'file:read',
      'notification:read'
    ]
  }
];

export const BASELINE_COMPLIANCE_RULES = [
  {
    name: 'Mandatory Peer Review',
    description: 'Tasks in technical/engineering scopes require approved peer review evidence before completion',
    severity: 'High',
    triggerEvent: 'task.completed',
    conditionType: 'EVIDENCE_REQUIRED',
    conditionConfig: { requiredEvidenceType: 'PeerReview' }
  },
  {
    name: 'Security Audit Sign-Off',
    description: 'Production releases require formal compliance sign-off evidence attached',
    severity: 'Critical',
    triggerEvent: 'task.completed',
    conditionType: 'EVIDENCE_REQUIRED',
    conditionConfig: { requiredEvidenceType: 'SecuritySignOff' }
  },
  {
    name: 'Process Approval Verification',
    description: 'Critical process milestones must have verifiable sign-off',
    severity: 'Medium',
    triggerEvent: 'process.step.approved',
    conditionType: 'APPROVAL_VERIFIED',
    conditionConfig: {}
  }
];
