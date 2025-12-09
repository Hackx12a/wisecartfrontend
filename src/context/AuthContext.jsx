// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Function to check and validate token on app load
  const validateToken = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      setUser(null);
      return false;
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return false;
    }

    setUser(JSON.parse(userData));
    return true;
  };

  useEffect(() => {
    validateToken();
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const checkTokenValid = () => {
    const token = localStorage.getItem('authToken');
    return token && !isTokenExpired(token);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      isTokenValid: checkTokenValid
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);

// Loading wrapper component
export const AuthLoading = ({ children }) => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-2xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }
  
  return children;
};

// Protected Route Component
export const ProtectedRoute = ({ children }) => {
  const { isTokenValid } = useAuth();
  return isTokenValid() ? children : <Navigate to="/login" replace />;
};

// Admin Route Component
export const AdminRoute = ({ children }) => {
  const { user, isTokenValid } = useAuth();
  
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  
  return (user && user.role === 'ADMIN') ? children : <Navigate to="/dashboard" replace />;
};