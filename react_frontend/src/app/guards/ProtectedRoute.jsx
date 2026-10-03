import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PATHS } from '../../paths';

// WHY: This acts as a security "bouncer" for your routes. 
// You wrap this around your private routes in the router.
// It uses <Outlet /> to render the nested child routes if the user is allowed in.
export const ProtectedRoute = ({ allowedRoles = [], isPlatform = false }) => {
  const { user, loading } = useAuth();

  // If AuthContext is still checking sessionStorage, don't redirect yet
  if (loading) {
    return <div>Loading session...</div>; // You can replace this with your shared <Loader /> later
  }

  // 1. Not logged in at all? Kick to login page.
  if (!user) {
    // If it's a platform route, send to platform login, else standard login
    return <Navigate to={isPlatform ? PATHS.AUTH.PLATFORM_LOGIN : PATHS.AUTH.LOGIN} replace />;
  }

  // 2. Is this a platform route but the user is a standard tenant? Kick them out.
  if (isPlatform && user.role !== 'system_admin') {
    return <Navigate to={PATHS.AUTH.UNAUTHORIZED} replace />;
  }

  // 3. Do they have the right role for this specific route?
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={PATHS.AUTH.UNAUTHORIZED} replace />;
  }

  // 4. Access granted! Render the children routes.
  return <Outlet />;
};
