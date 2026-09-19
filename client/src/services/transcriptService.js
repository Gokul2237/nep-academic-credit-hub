import api from './api';

/**
 * Transcript Service for frontend API communication
 */

const getTranscripts = async (params = {}) => {
  const response = await api.get('/transcripts', { params });
  return response.data;
};

const getTranscriptById = async (id) => {
  const response = await api.get(`/transcripts/${id}`);
  return response.data;
};

const generateTranscript = async (data = {}) => {
  const response = await api.post('/transcripts', data);
  return response.data;
};

const verifyTranscript = async (verificationCode) => {
  const response = await api.get(`/transcripts/verify/${encodeURIComponent(verificationCode)}`);
  return response.data;
};

const revokeTranscript = async (id, revocationReason) => {
  const response = await api.put(`/transcripts/${id}/revoke`, { revocationReason });
  return response.data;
};

const transcriptService = {
  getTranscripts,
  getTranscriptById,
  generateTranscript,
  verifyTranscript,
  revokeTranscript,
};

export default transcriptService;
