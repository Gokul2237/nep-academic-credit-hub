import api from './api';

export const authService = {
  // Login existing user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // Backend standard ApiResponse.success wraps payload in { success: true, message: '...', data: { user, token } }
    // After Axios response interceptor unwraps response.data, 'response' contains the parsed JSON body
    const authData = response?.data || response;

    if (!authData || typeof authData !== 'object' || !authData.token || !authData.user) {
      throw new Error(
        response?.message || 'Authentication failed: Server returned an invalid or empty session payload.'
      );
    }

    localStorage.setItem('nep_token', authData.token);
    localStorage.setItem('nep_user', JSON.stringify(authData.user));

    return authData;
  },

  // Register new user (Student or Institution)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const authData = response?.data || response;

    if (!authData || typeof authData !== 'object' || !authData.token || !authData.user) {
      throw new Error(
        response?.message || 'Registration failed: Server returned an invalid or empty session payload.'
      );
    }

    localStorage.setItem('nep_token', authData.token);
    localStorage.setItem('nep_user', JSON.stringify(authData.user));

    return authData;
  },

  // Get current authenticated user profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response?.data?.user || response?.user || null;
  },

  // Logout and clear local storage
  logout: () => {
    localStorage.removeItem('nep_token');
    localStorage.removeItem('nep_user');
  },

  // Get locally cached user
  getCachedUser: () => {
    try {
      const user = localStorage.getItem('nep_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  // Get verified institutions for student registration
  getInstitutions: async () => {
    const response = await api.get('/auth/institutions');
    const list = response.data?.institutions || response.institutions || (Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []));
    return Array.isArray(list) ? list : [];
  },

  // Get locally cached token
  getToken: () => {
    return localStorage.getItem('nep_token');
  },
};
