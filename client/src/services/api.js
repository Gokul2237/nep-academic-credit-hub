
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// --------------------------------------------------
// REQUEST INTERCEPTOR
// Attach JWT token
// --------------------------------------------------

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nep_token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// RESPONSE INTERCEPTOR
// Return response.data directly
// --------------------------------------------------

api.interceptors.response.use(
  (response) => response.data,

  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',

      errors:
        error.response?.data?.errors ||
        null,

      status:
        error.response?.status ||
        500,

      response: error.response || null,
    };

    console.error('API Error:', customError);

    if (error.response?.status === 401) {
      localStorage.removeItem('nep_token');
      localStorage.removeItem('nep_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(customError);
  }
);

export default api;
