import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../paths';
import { ROLES } from '../../roles';

// WHY: When a user simply visits the root URL ("/"), we don't know where to send them.
// This component looks at their role and automatically routes them to their specific dashboard.
export const RoleRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to={PATHS.PUBLIC.LOGIN} replace />;
  }

  // Map each role to their respective landing page
  switch (user.role) {
    case ROLES.SYSTEM_ADMIN:
      return <Navigate to={PATHS.PLATFORM.DASHBOARD} replace />;
      
    case ROLES.COMPANY_OWNER:
      return <Navigate to={PATHS.EXECUTIVE.DASHBOARD} replace />;
      
    case ROLES.COMPLIANCE_OFFICER:
      return <Navigate to={PATHS.COMPLIANCE.DASHBOARD} replace />;
      
    // TODO: Add the rest of your roles as teammates build those folders!
    // case ROLES.HR_MANAGER: 
    //   return <Navigate to={PATHS.HR.DASHBOARD} replace />;
      
    default:
      // If the role isn't mapped yet, send to a default place or unauthorized
      return <Navigate to={PATHS.COMMON.UNAUTHORIZED} replace />;
  }
};
