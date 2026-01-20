// components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isTokenValid } = useAuth();
  
  // No loading check here - AuthLoading handles it
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;  
};

export default AdminRoute;