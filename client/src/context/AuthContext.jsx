import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCachedUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        } catch (error) {
          console.warn('Session verification failed, clearing invalid session');
          authService.logout();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const getDashboardRoute = (role) => {
    const userRole = role || user?.role;
    switch (userRole) {
      case 'student':
        return '/student/dashboard';
      case 'institution':
        return '/institution/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    getDashboardRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
