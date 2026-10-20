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

  // Download official Excel results template (.xlsx)
  downloadTemplate: async () => {
    const resData = await api.get('/institution/results/template', {
      responseType: 'blob',
    });
    // resData is already the Blob returned by the response interceptor
    const blob =
      resData instanceof Blob
        ? resData
        : new Blob([resData?.data || resData], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'NEP_Semester_Results_Import_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return blob;
  },

  // Get sample template structure & data for in-browser viewing
  getTemplateData: async () => {
    const response = await api.get('/institution/results/template/data');
    return response.data || response;
  },

  // Get template as File object for direct one-click manual testing
  getTemplateFile: async () => {
    const resData = await api.get('/institution/results/template', {
      responseType: 'blob',
    });
    const blob =
      resData instanceof Blob
        ? resData
        : new Blob([resData?.data || resData], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
    return new File([blob], 'NEP_Semester_Results_Import_Template.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },

  // Preview uploaded results Excel spreadsheet
  previewResultsImport: async (formData) => {
    const response = await api.post('/institution/results/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Confirm import and automatically accumulate credits & progression
  confirmResultsImport: async (batchId) => {
    const response = await api.post('/institution/results/confirm', { batchId });
    return response;
  },

  // Get list of previous import batches
  getImportBatches: async (params = {}) => {
    const response = await api.get('/institution/results/batches', { params });
    return response;
  },

  // Get detailed information and errors for a specific batch
  getBatchDetails: async (batchId) => {
    const response = await api.get(`/institution/results/batches/${batchId}`);
    return response;
  },

  // Get semester-wise student results
  getSemesterResults: async (params = {}) => {
    const response = await api.get('/institution/results', { params });
    return response;
  },

  // Correct a previously imported result with audit trail
  correctResult: async (resultId, correctionData) => {
    const response = await api.put(`/institution/results/${resultId}/correct`, correctionData);
    return response;
  },
};

export default institutionService;
