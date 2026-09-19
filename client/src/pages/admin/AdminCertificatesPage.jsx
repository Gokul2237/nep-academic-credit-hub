import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  Building2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import certificateService from '../../services/certificateService';

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);

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
      console.error('Fetch admin certificates error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load global certificate registry.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = certificates.filter((cert) => {
    if (statusFilter !== 'all' && cert.verificationStatus !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const titleMatch = (cert.title || '').toLowerCase().includes(q);
      const idMatch = (cert.certificateId || '').toLowerCase().includes(q);
      const studentMatch = (cert.studentId?.name || '').toLowerCase().includes(q);
      const instMatch = (cert.institutionId?.name || '').toLowerCase().includes(q);
      return titleMatch || idMatch || studentMatch || instMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <Award className="w-4 h-4" />
            <span>National Governance Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Certificate Registry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global monitoring of academic completion credentials across participating institutions.
          </p>
        </div>
        <button
          onClick={fetchCertificates}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student, institution, certificate ID, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'verified', 'pending', 'rejected', 'revoked'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchCertificates} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Registered Credentials</h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filtered.length} of {certificates.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading certificate registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No matching certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3.5">Certificate ID / Title</th>
                  <th className="px-6 py-3.5">Institution</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{cert.title}</div>
                      <div className="text-[11px] font-mono text-purple-400">{cert.certificateId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{cert.institutionId?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{cert.studentId?.name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{cert.studentId?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      {cert.revokedAt ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 text-[11px] font-medium">
                          Revoked
                        </span>
                      ) : cert.verificationStatus === 'verified' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[11px] font-medium">
                          Verified
                        </span>
                      ) : cert.verificationStatus === 'rejected' ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 text-[11px] font-medium">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-400 text-[11px] font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="text-purple-400 hover:text-purple-300 font-medium text-xs inline-flex items-center space-x-1"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <span>Certificate Telemetry & Integrity</span>
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
                  <p className="font-mono text-purple-400">{selectedCert.certificateId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-semibold capitalize text-slate-200">{selectedCert.verificationStatus}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Institution</p>
                <p className="text-slate-300">{selectedCert.institutionId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500">Student</p>
                <p className="text-slate-300">{selectedCert.studentId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500">SHA-256 Integrity Seal</p>
                <p className="font-mono text-[10px] break-all bg-slate-950 p-2 rounded-xl text-slate-400 border border-slate-800">
                  {selectedCert.integrityHash || 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
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
