import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface font-body-md text-on-surface">
        <div className="flex flex-col items-center gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-bold text-secondary uppercase tracking-widest text-xs">Authenticating Station...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRole = (role || 'customer').toLowerCase();
  const normalizedAllowedRoles = (allowedRoles || []).map((r) => r.toLowerCase());

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
    const fallbackPath = currentRole === 'customer' ? '/customer/equipment' : '/employee/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
