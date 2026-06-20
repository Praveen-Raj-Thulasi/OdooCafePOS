import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const currentRole = localStorage.getItem('userRole');

  if (!currentRole) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    // Logged in but unauthorized -> Send to their home
    if (currentRole === 'Admin') return <Navigate to="/dashboard" replace />;
    if (currentRole === 'Cashier') return <Navigate to="/floor" replace />;
    if (currentRole === 'Kitchen') return <Navigate to="/kds" replace />;
    if (currentRole === 'Servant') return <Navigate to="/servant" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
