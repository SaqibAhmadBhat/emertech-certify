import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import auth from '../utils/auth';

/**
 * Robust ProtectedRoute with role-based authorization
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const isAuth = auth.isAuthenticated();
  const currentRole = auth.getRole();

  if (!isAuth) {
    // Redirect unauthenticated user to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    // Authenticated, but lacking permission: redirect to appropriate home dashboard
    if (currentRole === 'admin') return <Navigate to="/admin" replace />;
    if (currentRole === 'university') return <Navigate to="/university" replace />;
    if (currentRole === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

