import api from './api';

export const institutionService = {
  // Get live institution overview statistics and metrics
  getOverview: async (params = {}) => {
    const response = await api.get('/institution/overview', { params });
    return response;
  },
};

export default institutionService;
