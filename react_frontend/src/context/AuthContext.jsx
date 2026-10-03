import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api/client';

// 1. Create the Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Restore session on refresh
  useEffect(() => {
    const restoreSession = async () => {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        try {
          // Assuming your backend has a /auth/me route to get current user details
          const userData = await apiClient('/auth/me'); 
          setUser(userData);
        } catch (error) {
          sessionStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    sessionStorage.setItem('authToken', response.token);
    setUser({ ...response.user, role: response.role }); 
    return response;
  };

  const platformLogin = async (credentials) => {
    // Platform admins might have a different login endpoint
    const response = await apiClient('/auth/platform-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    sessionStorage.setItem('authToken', response.token);
    // Hardcode system_admin role or take it from response
    setUser({ ...response.user, role: 'system_admin', isPlatform: true }); 
    return response;
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, platformLogin, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
