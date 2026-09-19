import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  ExternalLink,
  FileCheck,
  Download,
  Building2,
  RefreshCw,
} from 'lucide-react';
import certificateService from '../../services/certificateService';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCert, setSelectedCert] = useState(null);

  // Public verify tool state
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await certificateService.getCertificates();
      const list = res?.data || res || [];
      setCertificates(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch certificates error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load your certificates. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLookup = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    try {
      setVerifying(true);
      setVerifyError('');
      setVerifyResult(null);
      const res = await certificateService.verifyCertificate(verifyCode.trim());
      setVerifyResult(res?.data || res);
    } catch (err) {
      console.error('Verify certificate error:', err);
      setVerifyError(
        err.response?.data?.message ||
          'Certificate could not be verified. Please check the Certificate ID.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    if (filterStatus === 'all') return true;
    return cert.verificationStatus === filterStatus;
  });

  const getStatusBadge = (status, revokedAt) => {
    if (revokedAt || status === 'revoked') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 text-xs font-medium">
          <XCircle className="w-3.5 h-3.5" />
          <span>Revoked</span>
        </span>
      );
    }
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 text-xs font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Approval</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
            <Award className="w-4 h-4" />
            <span>Digital Credentials & Micro-Degrees</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Certificates
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cryptographically sealed academic completion certificates and achievements.
          </p>
        </div>
        <button
          onClick={fetchCertificates}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Verify Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Public Certificate Verification Tool</span>
        </h2>
        <form onSubmit={handleVerifyLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. NEP-CERT-XXXX-XXXX)..."
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={verifying || !verifyCode.trim()}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            {verifying ? (
              <span>Verifying...</span>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Verify Now</span>
              </>
            )}
          </button>
        </form>

        {verifyError && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-400 text-xs">
            {verifyError}
          </div>
        )}

        {verifyResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                {verifyResult.title || verifyResult.certificateId}
              </span>
              {getStatusBadge(
                verifyResult.verificationStatus,
                verifyResult.revokedAt
              )}
            </div>
            <div className="text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Institution: </span>
                {verifyResult.institutionId?.name || verifyResult.institution?.name || 'N/A'}
              </div>
              <div>
                <span className="text-slate-500">Issued On: </span>
                {new Date(verifyResult.issueDate || verifyResult.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="text-slate-500">Integrity Check: </span>
                <span className={verifyResult.integrityVerified ? 'text-emerald-400' : 'text-red-400'}>
                  {verifyResult.integrityVerified ? '✓ Valid Cryptographic Seal' : '⚠ Invalid / Mismatched'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {['all', 'verified', 'pending', 'rejected', 'revoked'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
              filterStatus === status
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCertificates} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredCertificates.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No certificates found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Certificates issued by your institution for verified academic credits will appear here.
          </p>
        </div>
      ) : (
        /* Certificates Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCertificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition p-5 rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                      {cert.certificateType ? cert.certificateType.replace('_', ' ') : 'Course Certificate'}
                    </span>
                    <h3 className="text-base font-bold text-white line-clamp-1">
                      {cert.title}
                    </h3>
                  </div>
                  {getStatusBadge(cert.verificationStatus, cert.revokedAt)}
                </div>

                <div className="text-xs text-slate-400 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certificate ID:</span>
                    <span className="text-slate-200 font-semibold">{cert.certificateId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issued By:</span>
                    <span className="text-slate-300">
                      {cert.institutionId?.name || 'Academic Institution'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="text-slate-300">
                      {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {cert.rejectionReason && (
                  <div className="text-xs p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300">
                    <span className="font-semibold">Reason: </span>
                    {cert.rejectionReason}
                  </div>
                )}
                {cert.revocationReason && (
                  <div className="text-xs p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300">
                    <span className="font-semibold">Revocation Reason: </span>
                    {cert.revocationReason}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SHA-256 Verified</span>
                </div>
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-blue-400" />
                <span>Certificate Credentials</span>
              </h3>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-500">Title</p>
                <p className="text-sm font-semibold text-white">{selectedCert.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500">Certificate ID</p>
                  <p className="font-mono text-slate-300">{selectedCert.certificateId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <div>{getStatusBadge(selectedCert.verificationStatus, selectedCert.revokedAt)}</div>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Issuing Institution</p>
                <p className="text-slate-300">{selectedCert.institutionId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500">Cryptographic Integrity Seal (SHA-256)</p>
                <p className="font-mono text-[10px] break-all bg-slate-950 p-2 rounded-xl text-slate-400 border border-slate-800">
                  {selectedCert.integrityHash || 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
