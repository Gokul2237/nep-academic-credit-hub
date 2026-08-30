import api from './api';

export const authService = {
  // Login existing user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      localStorage.setItem('nep_token', response.data.token);
      localStorage.setItem('nep_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Register new user (Student or Institution)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data?.token) {
      localStorage.setItem('nep_token', response.data.token);
      localStorage.setItem('nep_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current authenticated user profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data?.user;
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

  // Get locally cached token
  getToken: () => {
    return localStorage.getItem('nep_token');
  },
};
