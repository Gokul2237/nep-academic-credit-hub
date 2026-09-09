import api from './api';

export const transferService = {
  // Get transfers with filters (status, type, page, limit)
  getTransfers: async (params = {}) => {
    const response = await api.get('/transfers', { params });
    return response;
  },

  // Create new credit transfer request
  createTransfer: async (transferData) => {
    const response = await api.post('/transfers', transferData);
    return response;
  },

  // Get transfer request by ID
  getTransferById: async (id) => {
    const response = await api.get(`/transfers/${id}`);
    return response;
  },

  // Review transfer request (Approve / Reject) - Institution / Admin
  reviewTransfer: async (id, reviewData) => {
    const response = await api.put(`/transfers/${id}/review`, reviewData);
    return response;
  },

  // Cancel pending transfer request - Student / Admin
  cancelTransfer: async (id) => {
    const response = await api.put(`/transfers/${id}/cancel`);
    return response;
  },

  // Get transfer statistics
  getTransferStats: async () => {
    const response = await api.get('/transfers/stats');
    return response;
  },
};

export default transferService;
