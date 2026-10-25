
import axios from 'axios';

// --------------------------------------------------
// BASE URL RESOLUTION
// --------------------------------------------------

const resolveBaseUrl = () => {
  let rawUrl = import.meta.env.VITE_API_URL;
  if (!rawUrl || rawUrl.trim() === '') {
    // In production, default directly to the designated Render backend service
    if (import.meta.env.PROD) {
      return 'https://nep-academic-credit-hub-api.onrender.com/api/v1';
    }
    return '/api/v1';
  }

  let cleaned = rawUrl.trim().replace(/\/+$/, '');
  // Ensure absolute domain configurations include the API prefix if omitted
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    if (!cleaned.endsWith('/api/v1') && !cleaned.endsWith('/api')) {
      cleaned = `${cleaned}/api/v1`;
    }
  }
  return cleaned;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
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
// Return response.data directly with validation
// --------------------------------------------------

api.interceptors.response.use(
  (response) => {
    // Catch empty response body on HTTP 200 (such as static server fallback returning Content-Length: 0)
    if (
      response.status === 200 &&
      (response.data === '' || response.data === undefined || response.data === null)
    ) {
      return Promise.reject({
        message:
          'Empty response received from server. The API base URL may be misconfigured or pointing to a static host.',
        status: response.status,
        response,
      });
    }
    return response.data;
  },

  (error) => {
    let resolvedMessage = error.response?.data?.message;

    if (!resolvedMessage) {
      if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        resolvedMessage =
          'Network connection error: Unable to reach the backend API server. Please check your network and verify the backend service is running.';
      } else if (
        [500, 502, 503, 504].includes(error.response?.status) &&
        (typeof error.response?.data === 'string' || !error.response?.data)
      ) {
        resolvedMessage =
          'Backend service unavailable. Please ensure the API server is actively running.';
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
