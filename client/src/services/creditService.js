import api from './api';

export const creditService = {
  // Get credits with query filters
  getCredits: async (params = {}) => {
    const response = await api.get('/credits', { params });
    return response;
  },

  // Get single credit record with integrity check
  getCreditById: async (id) => {
    const response = await api.get(`/credits/${id}`);
    return response.data;
  },

  // Award / Record new credit (Institution / Admin)
  createCredit: async (creditData) => {
    const response = await api.post('/credits', creditData);
    return response.data;
  },

  // Update credit record
  updateCredit: async (id, creditData) => {
    const response = await api.put(`/credits/${id}`, creditData);
    return response.data;
  },

  // Get Student Wallet Summary
  getWalletSummary: async () => {
    const response = await api.get('/credits/wallet-summary');
    return response.data;
  },

  // Get Student Credit Timeline
  getTimeline: async () => {
    const response = await api.get('/credits/timeline');
    return response.data;
  },

  // Get credits for a specific student (Admin / Authorized)
  getStudentCredits: async (studentId) => {
    const response = await api.get(`/credits/student/${studentId}`);
    return response.data;
  },

  // Get logged-in student's own semester results and progression
  getSemesterResults: async () => {
    const response = await api.get('/credits/semester-results');
    return response.data;
  },
};
