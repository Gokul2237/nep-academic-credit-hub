import api from './api';

/*
|--------------------------------------------------------------------------
| Certificate Service
|--------------------------------------------------------------------------
| Handles all frontend communication with the Certificate APIs.
|--------------------------------------------------------------------------
*/

/**
 * Get certificates
 *
 * Students automatically receive only their own certificates.
 * Institution/Admin can use optional filters.
 */
const getCertificates = async (params = {}) => {
  const response = await api.get('/certificates', {
    params,
  });

  return response.data;
};

/**
 * Get a single certificate by MongoDB ID
 */
const getCertificateById = async (id) => {
  const response = await api.get(`/certificates/${id}`);

  return response.data;
};

/**
 * Issue a new certificate
 *
 * Institution/Admin only.
 */
const createCertificate = async (certificateData) => {
  const response = await api.post(
    '/certificates',
    certificateData
  );

  return response.data;
};

/**
 * Review / verify a certificate
 *
 * verificationStatus:
 * - verified
 * - rejected
 */
const reviewCertificate = async (
  id,
  verificationStatus,
  rejectionReason = ''
) => {
  const response = await api.put(
    `/certificates/${id}/verify`,
    {
      verificationStatus,
      rejectionReason,
    }
  );

  return response.data;
};

/**
 * Revoke a verified certificate
 */
const revokeCertificate = async (
  id,
  revocationReason
) => {
  const response = await api.put(
    `/certificates/${id}/revoke`,
    {
      revocationReason,
    }
  );

  return response.data;
};

/**
 * Public certificate verification
 *
 * This endpoint does NOT require JWT authentication.
 */
const verifyCertificate = async (certificateId) => {
  const response = await api.get(
    `/certificates/verify/${encodeURIComponent(
      certificateId
    )}`
  );

  return response.data;
};

const certificateService = {
  getCertificates,
  getCertificateById,
  createCertificate,
  reviewCertificate,
  revokeCertificate,
  verifyCertificate,
};

export default certificateService;