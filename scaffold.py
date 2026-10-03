import os

base_dir = "react_frontend/src"
directories = [
    "app/router",
    "app/paths",
    "app/guards",
    "app/routes",
    "config/nav",
    "context",
    "services/api",
    "layouts",
    "shared/components",
    "shared/hooks",
    "shared/utils",
    "features/platform/pages",
    "features/platform/components",
    "features/executive/pages",
    "features/executive/components",
    "features/compliance/pages",
    "features/compliance/components",
    "features/hr/pages",
    "features/hr/components",
    "features/process-admin/pages",
    "features/process-admin/components",
    "features/work/pm/pages",
    "features/work/pm/components",
    "features/work/team-lead/pages",
    "features/work/team-lead/components",
    "features/work/member/pages",
    "features/work/member/components",
    "features/work/shared/components",
    "features/common/pages",
    "features/common/components"
]

for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

# 1. Paths
paths_js = """export const PATHS = {
  PUBLIC: {
    LOGIN: '/login',
    REGISTER: '/register',
    PLATFORM_LOGIN: '/platform/login'
  },
  COMMON: {
    NOTIFICATIONS: '/notifications',
    PROFILE: '/profile',
    UNAUTHORIZED: '/unauthorized',
    NOT_FOUND: '*'
  },
  PLATFORM: {
    DASHBOARD: '/platform/dashboard',
    COMPANIES: '/platform/companies',
    PLANS: '/platform/plans',
    SUBSCRIPTIONS: '/platform/subscriptions',
    ADMIN_USERS: '/platform/admin-users',
    SUPPORT_ACCESS: '/platform/support-access'
  },
  EXECUTIVE: {
    DASHBOARD: '/executive/dashboard',
    PROJECTS: '/executive/projects',
    AUDIT_LOGS: '/executive/audit-logs'
  },
  COMPLIANCE: {
    DASHBOARD: '/compliance/dashboard',
    RULES: '/compliance/rules',
    CATEGORIES: '/compliance/categories',
    BINDINGS: '/compliance/bindings',
    VIOLATIONS: '/compliance/violations',
    EVIDENCE: '/compliance/evidence',
    AUDIT_LOGS: '/compliance/audit-logs'
  },
  HR: {
    DASHBOARD: '/hr/dashboard',
    USERS: '/hr/users',
    USER_DETAIL: '/hr/users/:id',
    ROLES: '/hr/roles',
    ROLE_ASSIGNMENTS: '/hr/role-assignments',
    BRANCHES: '/hr/branches',
    TEAMS: '/hr/teams'
  },
  PROCESS_ADMIN: {
    DASHBOARD: '/process-admin/dashboard',
    TEMPLATES: '/process-admin/templates',
    TEMPLATE_DETAIL: '/process-admin/templates/:id',
    INSTANCES: '/process-admin/instances',
    INSTANCE_DETAIL: '/process-admin/instances/:id'
  },
  PM: {
    DASHBOARD: '/pm/dashboard',
    PROJECTS: '/pm/projects',
    PROJECT_DETAIL: '/pm/projects/:id',
    TASKS: '/pm/tasks',
    TASK_DETAIL: '/pm/tasks/:id',
    ESCALATIONS: '/pm/escalations'
  },
  TEAM_LEAD: {
    DASHBOARD: '/team-lead/dashboard',
    TASKS: '/team-lead/tasks',
    TASK_DETAIL: '/team-lead/tasks/:id',
    REVIEWS: '/team-lead/reviews',
    ESCALATIONS: '/team-lead/escalations'
  },
  MEMBER: {
    DASHBOARD: '/member/dashboard',
    TASKS: '/member/tasks',
    TASK_DETAIL: '/member/tasks/:id',
    EVIDENCE: '/member/evidence',
    ESCALATIONS: '/member/escalations'
  }
};
"""
with open(os.path.join(base_dir, "app/paths/index.js"), "w") as f:
    f.write(paths_js)

# API client
api_client = """export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const token = sessionStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: { ...headers, ...customConfig.headers },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${import.meta.env.VITE_API_URL}${endpoint}`;
  
  let data;
  try {
    const response = await fetch(url, config);
    data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (err) {
    throw err;
  }
}
"""
with open(os.path.join(base_dir, "services/api/client.js"), "w") as f:
    f.write(api_client)

resources = ['users', 'roles', 'branches', 'teams', 'projects', 'tasks', 'subtasks', 'escalations', 'compliance', 'evidence', 'process', 'audit', 'notifications', 'executive', 'platform']
for res in resources:
    with open(os.path.join(base_dir, f"services/api/{res}.js"), "w") as f:
        f.write(f"import {{ apiClient }} from './client';\n\nexport const list = () => apiClient('/api/{res}');\nexport const get = (id) => apiClient(`/api/{res}/${{id}}`);\nexport const create = (data) => apiClient('/api/{res}', {{ body: data }});\nexport const update = (id, data) => apiClient(`/api/{res}/${{id}}`, {{ method: 'PATCH', body: data }});\nexport const remove = (id) => apiClient(`/api/{res}/${{id}}`, {{ method: 'DELETE' }});\n")

# Layouts
dashboard_layout = """import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="dashboard-layout">
      <header>TopBar | User: {user?.fullName} ({user?.roleLabel}) <button onClick={logout}>Logout</button></header>
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '200px', borderRight: '1px solid #ccc' }}>Sidebar</aside>
        <main style={{ padding: '20px', flex: 1 }}><Outlet /></main>
      </div>
    </div>
  );
}
"""
with open(os.path.join(base_dir, "layouts/DashboardLayout.jsx"), "w") as f:
    f.write(dashboard_layout)

platform_layout = """import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function PlatformLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="platform-layout">
      <header>Platform Admin | User: {user?.fullName} <button onClick={logout}>Logout</button></header>
      <div style={{ display: 'flex' }}>
        <aside style={{ width: '200px', borderRight: '1px solid #ccc' }}>Platform Sidebar</aside>
        <main style={{ padding: '20px', flex: 1 }}><Outlet /></main>
      </div>
    </div>
  );
}
"""
with open(os.path.join(base_dir, "layouts/PlatformLayout.jsx"), "w") as f:
    f.write(platform_layout)

# Auth Context
auth_context = """import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      // In a real app, fetch /auth/me or /platform/auth/me depending on token type
      // We simulate success here for layout testing
      setUser({ fullName: 'Test User', role: 'team_member', roleLabel: 'Team Member' });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await apiClient('/auth/login', { body: credentials });
    sessionStorage.setItem('authToken', data.data.token);
    setUser(data.data.user);
  };

  const platformLogin = async (credentials) => {
    const data = await apiClient('/platform/auth/login', { body: credentials });
    sessionStorage.setItem('authToken', data.data.token);
    setUser(data.data.admin);
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, platformLogin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
"""
with open(os.path.join(base_dir, "context/AuthContext.jsx"), "w") as f:
    f.write(auth_context)

# Guards
guards = """import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ allowedRoles, isPlatform }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={isPlatform ? '/platform/login' : '/login'} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return <Outlet />;
}

export function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  const roleMap = {
    company_owner: '/executive/dashboard',
    hr_manager: '/hr/dashboard',
    process_admin: '/process-admin/dashboard',
    compliance_officer: '/compliance/dashboard',
    project_manager: '/pm/dashboard',
    team_leader: '/team-lead/dashboard',
    team_member: '/member/dashboard'
  };
  return <Navigate to={roleMap[user.role] || '/unauthorized'} />;
}
"""
with open(os.path.join(base_dir, "app/guards/index.jsx"), "w") as f:
    f.write(guards)

# Stubs & Pages logic
def create_page(path, component_name, owner, endpoints):
    content = f"""import React from 'react';
// Owner: {owner}
// Endpoints: {endpoints}
export default function {component_name}() {{
  return (
    <div>
      <h1>{component_name}</h1>
      <p>Owner: {owner}</p>
      <pre>Endpoints used: {endpoints}</pre>
    </div>
  );
}}
"""
    with open(os.path.join(base_dir, path), "w") as f:
        f.write(content)

pages = [
    ("features/common/pages/Login.jsx", "Login", "M3", "POST /auth/login"),
    ("features/common/pages/Register.jsx", "Register", "M3", "GET /auth/public-plans, POST /auth/register-company"),
    ("features/common/pages/PlatformLogin.jsx", "PlatformLogin", "M3", "POST /platform/auth/login"),
    ("features/common/pages/Notifications.jsx", "Notifications", "M3", "GET /api/notifications"),
    ("features/common/pages/Profile.jsx", "Profile", "M3", "GET /api/auth/me"),
    ("features/common/pages/Unauthorized.jsx", "Unauthorized", "M3", "None"),
    ("features/common/pages/NotFound.jsx", "NotFound", "M3", "None"),
    
    ("features/platform/pages/Dashboard.jsx", "PlatformDashboard", "M5", "GET /platform/metrics"),
    ("features/platform/pages/Companies.jsx", "PlatformCompanies", "M5", "GET /api/companies"),
    ("features/platform/pages/Plans.jsx", "PlatformPlans", "M5", "GET /api/plans"),
    ("features/platform/pages/Subscriptions.jsx", "PlatformSubscriptions", "M5", "GET /api/subscriptions"),
    ("features/platform/pages/AdminUsers.jsx", "PlatformAdminUsers", "M5", "GET /api/platform-admin-users"),
    ("features/platform/pages/SupportAccess.jsx", "PlatformSupportAccess", "M5", "GET /api/platform/support-access"),
    
    ("features/executive/pages/Dashboard.jsx", "ExecutiveDashboard", "M1", "GET /executive/metrics, GET /executive/branches"),
    ("features/executive/pages/Projects.jsx", "ExecutiveProjects", "M1", "GET /api/projects"),
    ("features/executive/pages/AuditLogs.jsx", "ExecutiveAuditLogs", "M1", "GET /api/audit-logs"),
    
    ("features/compliance/pages/Dashboard.jsx", "ComplianceDashboard", "M1", "GET /api/compliance/metrics"),
    ("features/compliance/pages/Rules.jsx", "ComplianceRules", "M1", "GET /api/compliance-rules"),
    ("features/compliance/pages/Categories.jsx", "ComplianceCategories", "M1", "GET /api/compliance-categories"),
    ("features/compliance/pages/Bindings.jsx", "ComplianceBindings", "M1", "GET /api/compliance-bindings"),
    ("features/compliance/pages/Violations.jsx", "ComplianceViolations", "M1", "GET /api/compliance-violations"),
    ("features/compliance/pages/Evidence.jsx", "ComplianceEvidence", "M1", "GET /api/compliance-evidence"),
    ("features/compliance/pages/AuditLogs.jsx", "ComplianceAuditLogs", "M1", "GET /api/audit-logs"),
    
    ("features/hr/pages/Dashboard.jsx", "HrDashboard", "M2", "GET /api/hr/metrics"),
    ("features/hr/pages/Users.jsx", "HrUsers", "M2", "GET /api/users"),
    ("features/hr/pages/UserDetail.jsx", "HrUserDetail", "M2", "GET /api/users/:id"),
    ("features/hr/pages/Roles.jsx", "HrRoles", "M2", "GET /api/roles"),
    ("features/hr/pages/RoleAssignments.jsx", "HrRoleAssignments", "M2", "GET /api/role-assignments"),
    ("features/hr/pages/Branches.jsx", "HrBranches", "M2", "GET /api/branches"),
    ("features/hr/pages/Teams.jsx", "HrTeams", "M2", "GET /api/teams"),
    
    ("features/process-admin/pages/Dashboard.jsx", "ProcessAdminDashboard", "M3", "GET /api/process/metrics"),
    ("features/process-admin/pages/Templates.jsx", "ProcessAdminTemplates", "M3", "GET /api/process-templates"),
    ("features/process-admin/pages/TemplateDetail.jsx", "ProcessAdminTemplateDetail", "M3", "GET /api/process-templates/:id"),
    ("features/process-admin/pages/Instances.jsx", "ProcessAdminInstances", "M3", "GET /api/process-instances"),
    ("features/process-admin/pages/InstanceDetail.jsx", "ProcessAdminInstanceDetail", "M3", "GET /api/process-instances/:id"),
    
    ("features/work/pm/pages/Dashboard.jsx", "PmDashboard", "M4", "GET /api/pm/metrics"),
    ("features/work/pm/pages/Projects.jsx", "PmProjects", "M4", "GET /api/projects"),
    ("features/work/pm/pages/ProjectDetail.jsx", "PmProjectDetail", "M4", "GET /api/projects/:id"),
    ("features/work/pm/pages/Tasks.jsx", "PmTasks", "M4", "GET /api/tasks"),
    ("features/work/pm/pages/TaskDetail.jsx", "PmTaskDetail", "M4", "GET /api/tasks/:id"),
    ("features/work/pm/pages/Escalations.jsx", "PmEscalations", "M4", "GET /api/escalations"),
    
    ("features/work/team-lead/pages/Dashboard.jsx", "TeamLeadDashboard", "M4", "GET /api/team-lead/metrics"),
    ("features/work/team-lead/pages/Tasks.jsx", "TeamLeadTasks", "M4", "GET /api/tasks"),
    ("features/work/team-lead/pages/TaskDetail.jsx", "TeamLeadTaskDetail", "M4", "GET /api/tasks/:id"),
    ("features/work/team-lead/pages/Reviews.jsx", "TeamLeadReviews", "M4", "GET /api/reviews"),
    ("features/work/team-lead/pages/Escalations.jsx", "TeamLeadEscalations", "M4", "GET /api/escalations"),
    
    ("features/work/member/pages/Dashboard.jsx", "MemberDashboard", "M4", "GET /api/member/metrics"),
    ("features/work/member/pages/Tasks.jsx", "MemberTasks", "M4", "GET /api/tasks"),
    ("features/work/member/pages/TaskDetail.jsx", "MemberTaskDetail", "M4", "GET /api/tasks/:id"),
    ("features/work/member/pages/Evidence.jsx", "MemberEvidence", "M4", "GET /api/compliance-evidence"),
    ("features/work/member/pages/Escalations.jsx", "MemberEscalations", "M4", "GET /api/escalations"),
]

for p, n, o, e in pages:
    create_page(p, n, o, e)

# Routes definitions
common_routes = """import React from 'react';
import { PATHS } from '../paths';
const Login = React.lazy(() => import('../../features/common/pages/Login'));
const Register = React.lazy(() => import('../../features/common/pages/Register'));
const PlatformLogin = React.lazy(() => import('../../features/common/pages/PlatformLogin'));
const Notifications = React.lazy(() => import('../../features/common/pages/Notifications'));
const Profile = React.lazy(() => import('../../features/common/pages/Profile'));
const Unauthorized = React.lazy(() => import('../../features/common/pages/Unauthorized'));
const NotFound = React.lazy(() => import('../../features/common/pages/NotFound'));

export const commonRoutes = [
  { path: PATHS.PUBLIC.LOGIN, element: <Login /> },
  { path: PATHS.PUBLIC.REGISTER, element: <Register /> },
  { path: PATHS.PUBLIC.PLATFORM_LOGIN, element: <PlatformLogin /> },
  { path: PATHS.COMMON.NOTIFICATIONS, element: <Notifications /> },
  { path: PATHS.COMMON.PROFILE, element: <Profile /> },
  { path: PATHS.COMMON.UNAUTHORIZED, element: <Unauthorized /> },
  { path: PATHS.COMMON.NOT_FOUND, element: <NotFound /> }
];
"""
with open(os.path.join(base_dir, "app/routes/common.js"), "w") as f:
    f.write(common_routes)

platform_routes = """import React from 'react';
import { PATHS } from '../paths';
const PlatformDashboard = React.lazy(() => import('../../features/platform/pages/Dashboard'));
const PlatformCompanies = React.lazy(() => import('../../features/platform/pages/Companies'));
const PlatformPlans = React.lazy(() => import('../../features/platform/pages/Plans'));
const PlatformSubscriptions = React.lazy(() => import('../../features/platform/pages/Subscriptions'));
const PlatformAdminUsers = React.lazy(() => import('../../features/platform/pages/AdminUsers'));
const PlatformSupportAccess = React.lazy(() => import('../../features/platform/pages/SupportAccess'));

export const platformRoutes = [
  { path: PATHS.PLATFORM.DASHBOARD, element: <PlatformDashboard /> },
  { path: PATHS.PLATFORM.COMPANIES, element: <PlatformCompanies /> },
  { path: PATHS.PLATFORM.PLANS, element: <PlatformPlans /> },
  { path: PATHS.PLATFORM.SUBSCRIPTIONS, element: <PlatformSubscriptions /> },
  { path: PATHS.PLATFORM.ADMIN_USERS, element: <PlatformAdminUsers /> },
  { path: PATHS.PLATFORM.SUPPORT_ACCESS, element: <PlatformSupportAccess /> }
];
"""
with open(os.path.join(base_dir, "app/routes/platform.js"), "w") as f:
    f.write(platform_routes)

executive_routes = """import React from 'react';
import { PATHS } from '../paths';
const ExecutiveDashboard = React.lazy(() => import('../../features/executive/pages/Dashboard'));
const ExecutiveProjects = React.lazy(() => import('../../features/executive/pages/Projects'));
const ExecutiveAuditLogs = React.lazy(() => import('../../features/executive/pages/AuditLogs'));

export const executiveRoutes = [
  { path: PATHS.EXECUTIVE.DASHBOARD, element: <ExecutiveDashboard /> },
  { path: PATHS.EXECUTIVE.PROJECTS, element: <ExecutiveProjects /> },
  { path: PATHS.EXECUTIVE.AUDIT_LOGS, element: <ExecutiveAuditLogs /> }
];
"""
with open(os.path.join(base_dir, "app/routes/executive.js"), "w") as f:
    f.write(executive_routes)

compliance_routes = """import React from 'react';
import { PATHS } from '../paths';
const ComplianceDashboard = React.lazy(() => import('../../features/compliance/pages/Dashboard'));
const ComplianceRules = React.lazy(() => import('../../features/compliance/pages/Rules'));
const ComplianceCategories = React.lazy(() => import('../../features/compliance/pages/Categories'));
const ComplianceBindings = React.lazy(() => import('../../features/compliance/pages/Bindings'));
const ComplianceViolations = React.lazy(() => import('../../features/compliance/pages/Violations'));
const ComplianceEvidence = React.lazy(() => import('../../features/compliance/pages/Evidence'));
const ComplianceAuditLogs = React.lazy(() => import('../../features/compliance/pages/AuditLogs'));

export const complianceRoutes = [
  { path: PATHS.COMPLIANCE.DASHBOARD, element: <ComplianceDashboard /> },
  { path: PATHS.COMPLIANCE.RULES, element: <ComplianceRules /> },
  { path: PATHS.COMPLIANCE.CATEGORIES, element: <ComplianceCategories /> },
  { path: PATHS.COMPLIANCE.BINDINGS, element: <ComplianceBindings /> },
  { path: PATHS.COMPLIANCE.VIOLATIONS, element: <ComplianceViolations /> },
  { path: PATHS.COMPLIANCE.EVIDENCE, element: <ComplianceEvidence /> },
  { path: PATHS.COMPLIANCE.AUDIT_LOGS, element: <ComplianceAuditLogs /> }
];
"""
with open(os.path.join(base_dir, "app/routes/compliance.js"), "w") as f:
    f.write(compliance_routes)

hr_routes = """import React from 'react';
import { PATHS } from '../paths';
const HrDashboard = React.lazy(() => import('../../features/hr/pages/Dashboard'));
const HrUsers = React.lazy(() => import('../../features/hr/pages/Users'));
const HrUserDetail = React.lazy(() => import('../../features/hr/pages/UserDetail'));
const HrRoles = React.lazy(() => import('../../features/hr/pages/Roles'));
const HrRoleAssignments = React.lazy(() => import('../../features/hr/pages/RoleAssignments'));
const HrBranches = React.lazy(() => import('../../features/hr/pages/Branches'));
const HrTeams = React.lazy(() => import('../../features/hr/pages/Teams'));

export const hrRoutes = [
  { path: PATHS.HR.DASHBOARD, element: <HrDashboard /> },
  { path: PATHS.HR.USERS, element: <HrUsers /> },
  { path: PATHS.HR.USER_DETAIL, element: <HrUserDetail /> },
  { path: PATHS.HR.ROLES, element: <HrRoles /> },
  { path: PATHS.HR.ROLE_ASSIGNMENTS, element: <HrRoleAssignments /> },
  { path: PATHS.HR.BRANCHES, element: <HrBranches /> },
  { path: PATHS.HR.TEAMS, element: <HrTeams /> }
];
"""
with open(os.path.join(base_dir, "app/routes/hr.js"), "w") as f:
    f.write(hr_routes)

process_admin_routes = """import React from 'react';
import { PATHS } from '../paths';
const ProcessAdminDashboard = React.lazy(() => import('../../features/process-admin/pages/Dashboard'));
const ProcessAdminTemplates = React.lazy(() => import('../../features/process-admin/pages/Templates'));
const ProcessAdminTemplateDetail = React.lazy(() => import('../../features/process-admin/pages/TemplateDetail'));
const ProcessAdminInstances = React.lazy(() => import('../../features/process-admin/pages/Instances'));
const ProcessAdminInstanceDetail = React.lazy(() => import('../../features/process-admin/pages/InstanceDetail'));

export const processAdminRoutes = [
  { path: PATHS.PROCESS_ADMIN.DASHBOARD, element: <ProcessAdminDashboard /> },
  { path: PATHS.PROCESS_ADMIN.TEMPLATES, element: <ProcessAdminTemplates /> },
  { path: PATHS.PROCESS_ADMIN.TEMPLATE_DETAIL, element: <ProcessAdminTemplateDetail /> },
  { path: PATHS.PROCESS_ADMIN.INSTANCES, element: <ProcessAdminInstances /> },
  { path: PATHS.PROCESS_ADMIN.INSTANCE_DETAIL, element: <ProcessAdminInstanceDetail /> }
];
"""
with open(os.path.join(base_dir, "app/routes/process-admin.js"), "w") as f:
    f.write(process_admin_routes)

pm_routes = """import React from 'react';
import { PATHS } from '../paths';
const PmDashboard = React.lazy(() => import('../../features/work/pm/pages/Dashboard'));
const PmProjects = React.lazy(() => import('../../features/work/pm/pages/Projects'));
const PmProjectDetail = React.lazy(() => import('../../features/work/pm/pages/ProjectDetail'));
const PmTasks = React.lazy(() => import('../../features/work/pm/pages/Tasks'));
const PmTaskDetail = React.lazy(() => import('../../features/work/pm/pages/TaskDetail'));
const PmEscalations = React.lazy(() => import('../../features/work/pm/pages/Escalations'));

export const pmRoutes = [
  { path: PATHS.PM.DASHBOARD, element: <PmDashboard /> },
  { path: PATHS.PM.PROJECTS, element: <PmProjects /> },
  { path: PATHS.PM.PROJECT_DETAIL, element: <PmProjectDetail /> },
  { path: PATHS.PM.TASKS, element: <PmTasks /> },
  { path: PATHS.PM.TASK_DETAIL, element: <PmTaskDetail /> },
  { path: PATHS.PM.ESCALATIONS, element: <PmEscalations /> }
];
"""
with open(os.path.join(base_dir, "app/routes/pm.js"), "w") as f:
    f.write(pm_routes)

team_lead_routes = """import React from 'react';
import { PATHS } from '../paths';
const TeamLeadDashboard = React.lazy(() => import('../../features/work/team-lead/pages/Dashboard'));
const TeamLeadTasks = React.lazy(() => import('../../features/work/team-lead/pages/Tasks'));
const TeamLeadTaskDetail = React.lazy(() => import('../../features/work/team-lead/pages/TaskDetail'));
const TeamLeadReviews = React.lazy(() => import('../../features/work/team-lead/pages/Reviews'));
const TeamLeadEscalations = React.lazy(() => import('../../features/work/team-lead/pages/Escalations'));

export const teamLeadRoutes = [
  { path: PATHS.TEAM_LEAD.DASHBOARD, element: <TeamLeadDashboard /> },
  { path: PATHS.TEAM_LEAD.TASKS, element: <TeamLeadTasks /> },
  { path: PATHS.TEAM_LEAD.TASK_DETAIL, element: <TeamLeadTaskDetail /> },
  { path: PATHS.TEAM_LEAD.REVIEWS, element: <TeamLeadReviews /> },
  { path: PATHS.TEAM_LEAD.ESCALATIONS, element: <TeamLeadEscalations /> }
];
"""
with open(os.path.join(base_dir, "app/routes/team-lead.js"), "w") as f:
    f.write(team_lead_routes)

member_routes = """import React from 'react';
import { PATHS } from '../paths';
const MemberDashboard = React.lazy(() => import('../../features/work/member/pages/Dashboard'));
const MemberTasks = React.lazy(() => import('../../features/work/member/pages/Tasks'));
const MemberTaskDetail = React.lazy(() => import('../../features/work/member/pages/TaskDetail'));
const MemberEvidence = React.lazy(() => import('../../features/work/member/pages/Evidence'));
const MemberEscalations = React.lazy(() => import('../../features/work/member/pages/Escalations'));

export const memberRoutes = [
  { path: PATHS.MEMBER.DASHBOARD, element: <MemberDashboard /> },
  { path: PATHS.MEMBER.TASKS, element: <MemberTasks /> },
  { path: PATHS.MEMBER.TASK_DETAIL, element: <MemberTaskDetail /> },
  { path: PATHS.MEMBER.EVIDENCE, element: <MemberEvidence /> },
  { path: PATHS.MEMBER.ESCALATIONS, element: <MemberEscalations /> }
];
"""
with open(os.path.join(base_dir, "app/routes/member.js"), "w") as f:
    f.write(member_routes)

# Main router
router_jsx = """import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PlatformLayout from '../../layouts/PlatformLayout';
import { ProtectedRoute, RoleRedirect } from '../guards';

import { commonRoutes } from '../routes/common';
import { platformRoutes } from '../routes/platform';
import { executiveRoutes } from '../routes/executive';
import { complianceRoutes } from '../routes/compliance';
import { hrRoutes } from '../routes/hr';
import { processAdminRoutes } from '../routes/process-admin';
import { pmRoutes } from '../routes/pm';
import { teamLeadRoutes } from '../routes/team-lead';
import { memberRoutes } from '../routes/member';

const wrapSuspense = (routes) => 
  routes.map(r => ({ ...r, element: <Suspense fallback={<div>Loading...</div>}>{r.element}</Suspense> }));

export const router = createBrowserRouter([
  ...commonRoutes.filter(r => !r.path.startsWith('/profile') && !r.path.startsWith('/notifications') && r.path !== '*'),
  {
    path: '/',
    element: <RoleRedirect />
  },
  {
    element: <ProtectedRoute allowedRoles={['company_owner', 'hr_manager', 'process_admin', 'compliance_officer', 'project_manager', 'team_leader', 'team_member']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          ...wrapSuspense(commonRoutes.filter(r => r.path.startsWith('/profile') || r.path.startsWith('/notifications'))),
          ...wrapSuspense(executiveRoutes),
          ...wrapSuspense(complianceRoutes),
          ...wrapSuspense(hrRoutes),
          ...wrapSuspense(processAdminRoutes),
          ...wrapSuspense(pmRoutes),
          ...wrapSuspense(teamLeadRoutes),
          ...wrapSuspense(memberRoutes)
        ]
      }
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['system_admin']} isPlatform={true} />,
    children: [
      {
        element: <PlatformLayout />,
        children: wrapSuspense(platformRoutes)
      }
    ]
  },
  {
    path: '*',
    element: <Suspense fallback={<div>Loading...</div>}>{commonRoutes.find(r => r.path === '*').element}</Suspense>
  }
]);
"""
with open(os.path.join(base_dir, "app/router/index.jsx"), "w") as f:
    f.write(router_jsx)

app_jsx = """import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './app/router';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
"""
with open(os.path.join(base_dir, "App.jsx"), "w") as f:
    f.write(app_jsx)

main_jsx = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
"""
with open(os.path.join(base_dir, "main.jsx"), "w") as f:
    f.write(main_jsx)

# Shared components
shared_comps = ["Button", "FormField", "Table", "Modal", "StatCard", "Badge", "Loader", "EmptyState", "ErrorBoundary"]
for sc in shared_comps:
    with open(os.path.join(base_dir, f"shared/components/{sc}.jsx"), "w") as f:
        f.write(f"import React from 'react';\n\nexport const {sc} = (props) => <div className='{sc.lower()}' {{...props}}>{sc} component</div>;\n")

# Env file
with open("react_frontend/.env.example", "w") as f:
    f.write("VITE_API_URL=http://localhost:5500\n")

with open("react_frontend/.env", "w") as f:
    f.write("VITE_API_URL=http://localhost:5500\n")

# Readme
readme = """# OptiFlow Frontend

This is the Vite React frontend for OptiFlow.

## Folder Map
- `src/app/`: Routing logic, guards, path constants, and feature route arrays.
- `src/config/nav/`: Navigation configuration (sidebars).
- `src/context/`: Global React contexts (AuthContext).
- `src/services/api/`: API client wrappers matching backend endpoints.
- `src/layouts/`: Dashboard and Platform layouts.
- `src/shared/`: Shared components, hooks, and utilities.
- `src/features/`: Isolated feature modules.
  - `platform/`: M5 (Platform Admin)
  - `executive/`: M1 (Executive/CEO)
  - `compliance/`: M1 (Compliance)
  - `hr/`: M2 (HR/Access Governance)
  - `process-admin/`: M3 (Process Admin)
  - `work/pm/`: M4 (Project Manager)
  - `work/team-lead/`: M4 (Team Leader)
  - `work/member/`: M4 (Team Member)
  - `common/`: M3 (Shared/Public)

## Rules
- Each member edits **only** their own features/ folders and their own `app/routes/` file.
- Changes to `shared/`, `layouts/`, `services/api/client.js`, or `paths.js` go through the **M3 owner by PR**.
- `paths.js` exports every URL as a constant. No hardcoded path strings elsewhere.
- The `services/api/client.js` module automatically unwraps {success, data} and handles 401 unauth redirect mapping.
"""
with open("react_frontend/README.md", "w") as f:
    f.write(readme)
