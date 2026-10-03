import { Navigate, Outlet } from 'react-router-dom';
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
