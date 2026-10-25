import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCachedUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // INITIALIZE / VALIDATE AUTHENTICATION
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const storedToken = authService.getToken();

      if (!storedToken) {
        if (mounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }

        return;
      }

      try {
        const freshUser = await authService.getMe();

        if (mounted) {
          setUser(freshUser);
          setToken(storedToken);
        }
      } catch (error) {
        console.warn(
          'Session verification failed, clearing invalid session:',
          error
        );

        authService.logout();

        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    if (!data || !data.user) {
      throw new Error('Authentication session error: User profile data is missing.');
    }

    setUser(data.user);
    setToken(data.token);

    return data.user;
  };

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  const register = async (userData) => {
    const data = await authService.register(userData);

    if (!data || !data.user) {
      throw new Error('Registration session error: User profile data is missing.');
    }

    setUser(data.user);
    setToken(data.token);

    return data.user;
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = () => {
    authService.logout();

    setUser(null);
    setToken(null);
  };

  // --------------------------------------------------
  // DASHBOARD ROUTING
  // --------------------------------------------------

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

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    loading,

    login,
    register,
    logout,

    getDashboardRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------------
// USE AUTH HOOK
// --------------------------------------------------

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};

