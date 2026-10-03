import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      // In a real app, fetch /auth/me or /platform/auth/me depending on token type
      // We simulate success here for layout testing
      setUser({ fullName: 'Test User', role: 'team_member', roleLabel: 'Team Member' });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await apiClient('/auth/login', { body: credentials });
    sessionStorage.setItem('authToken', data.data.token);
    setUser(data.data.user);
  };

  const platformLogin = async (credentials) => {
    const data = await apiClient('/platform/auth/login', { body: credentials });
    sessionStorage.setItem('authToken', data.data.token);
    setUser(data.data.admin);
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
}

export const useAuth = () => useContext(AuthContext);
