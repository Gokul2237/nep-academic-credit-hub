
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
    let resolvedMessage = error.response?.data?.message;

    if (!resolvedMessage) {
      if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        resolvedMessage =
          'Network connection error: Unable to reach the backend API server. Please verify the server is running on port 5000.';
      } else if (
        [500, 502, 503, 504].includes(error.response?.status) &&
        (typeof error.response?.data === 'string' || !error.response?.data)
      ) {
        resolvedMessage =
          'Backend service unavailable. Please ensure the API server is actively running on port 5000.';
      } else {
        resolvedMessage = error.message || 'An unexpected error occurred';
      }
    }

    const customError = {
      message: resolvedMessage,
      errors: error.response?.data?.errors || null,
      status: error.response?.status || 500,
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
