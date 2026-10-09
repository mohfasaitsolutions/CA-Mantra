import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

/**
 * Protects nested routes. Usage:
 * <Route element={<ProtectedRoute />}> ...protected child routes... </Route>
 */
export const ProtectedRoute: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // silent while store rehydrates
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

interface RoleRouteProps {
  roles: string[];
}

/**
 * Role based guard. Wrap inside a <ProtectedRoute /> parent or it will also check login.
 */
export const RoleProtectedRoute: React.FC<RoleRouteProps> = ({ roles }) => {
  const { isLoggedIn, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!role || !roles.map(r=>r.toUpperCase()).includes(role.toUpperCase())) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export default ProtectedRoute;