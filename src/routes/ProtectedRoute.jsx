import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isTokenValid } = useAuth();
  
  // No loading check here - AuthLoading handles it
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;