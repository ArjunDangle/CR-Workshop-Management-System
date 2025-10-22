// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/authStore';

interface ProtectedRouteProps {
  children?: React.ReactNode; // Allow wrapping routes directly or using Outlet
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation(); // Get current location

  if (!isAuthenticated) {
    // If not authenticated, redirect to the landing page
    // Pass the current location via state so the user can be redirected back after login (optional)
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If authenticated, render the child components (either passed directly or via <Outlet>)
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;