import api from './api';

export const institutionService = {
  // Get live institution overview statistics and metrics
  getOverview: async (params = {}) => {
    const response = await api.get('/institution/overview', { params });
    return response;
  },

  // Get active credit acceptance policy and history
  getPolicy: async (params = {}) => {
    const response = await api.get('/institution/policies', { params });
    return response.data;
  },

  // Update credit acceptance policy and publish new version
  updatePolicy: async (policyData) => {
    const response = await api.put('/institution/policies', policyData);
    return response.data;
  },
};

export default institutionService;
