import React, { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  PlusCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import certificateService from '../../services/certificateService';
import api from '../../services/api';

export default function InstitutionCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issue Certificate Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [verifiedCredits, setVerifiedCredits] = useState([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [issueForm, setIssueForm] = useState({
    academicCreditId: '',
    title: '',
    certificateType: 'course_completion',
  });
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Action modals (Review / Revoke)
  const [actionCert, setActionCert] = useState(null);
  const [actionType, setActionType] = useState(null); // 'reject' or 'revoke'
  const [reason, setReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

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
      console.error('Fetch institution certificates error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load certificates for your institution.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openIssueModal = async () => {
    setShowIssueModal(true);
    setIssueError('');
    try {
      setCreditsLoading(true);
      // Fetch verified credits to choose from
      const res = await api.get('/credits', { params: { verificationStatus: 'verified' } });
      const raw = res.data?.data || res.data || [];
      setVerifiedCredits(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Fetch verified credits error:', err);
      setIssueError('Failed to fetch eligible verified credits.');
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!issueForm.academicCreditId || !issueForm.title.trim()) {
      setIssueError('Please select an academic credit and enter a title.');
      return;
    }

    const selectedCredit = verifiedCredits.find(
      (c) => c._id === issueForm.academicCreditId
    );

    if (!selectedCredit) {
      setIssueError('Selected credit was not found.');
      return;
    }

    try {
      setIssuing(true);
      setIssueError('');

      await certificateService.createCertificate({
        studentId: selectedCredit.studentId?._id || selectedCredit.studentId,
        courseId: selectedCredit.courseId?._id || selectedCredit.courseId,
        academicCreditId: selectedCredit._id,
        title: issueForm.title.trim(),
        certificateType: issueForm.certificateType,
      });

      setSuccess('Certificate issued successfully!');
      setShowIssueModal(false);
      setIssueForm({
        academicCreditId: '',
        title: '',
        certificateType: 'course_completion',
      });
      fetchCertificates();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Issue certificate error:', err);
      setIssueError(
        err.response?.data?.message ||
          'Failed to issue certificate. Ensure credit is verified and not already assigned a certificate.'
      );
    } finally {
      setIssuing(false);
    }
  };

  const handleApprove = async (certId) => {
    try {
      setLoading(true);
      await certificateService.reviewCertificate(certId, 'verified');
      setSuccess('Certificate approved & verified!');
      fetchCertificates();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Approve certificate error:', err);
      setError(err.response?.data?.message || 'Failed to approve certificate.');
      setLoading(false);
    }
  };

  const submitActionReason = async () => {
    if (!reason.trim()) return;
    try {
      setSubmittingAction(true);
      if (actionType === 'reject') {
        await certificateService.reviewCertificate(
          actionCert._id,
          'rejected',
          reason.trim()
        );
        setSuccess('Certificate rejected.');
      } else if (actionType === 'revoke') {
        await certificateService.revokeCertificate(actionCert._id, reason.trim());
        setSuccess('Certificate revoked.');
      }
      setActionCert(null);
      setActionType(null);
      setReason('');
      fetchCertificates();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Submit action error:', err);
      setError(err.response?.data?.message || 'Failed to complete action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <Award className="w-4 h-4" />
            <span>Institutional Credentials Node</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Certificate Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Issue, review, verify, and revoke student completion certificates.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCertificates}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openIssueModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Certificates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Issued & Pending Certificates</h3>
          <span className="text-xs text-slate-400 font-mono">
            Total: {certificates.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading certificate records...
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No certificates found</p>
            <p className="text-xs text-slate-500">
              Click "Issue New Certificate" to grant a verified credential to a student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-3.5">Certificate ID / Title</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{cert.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">{cert.certificateId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{cert.studentId?.name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{cert.studentId?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 capitalize font-mono text-[11px] text-indigo-300">
                      {(cert.certificateType || 'course_completion').replace('_', ' ')}
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
                    <td className="px-6 py-4 text-right space-x-2">
                      {cert.verificationStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(cert._id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setActionCert(cert);
                              setActionType('reject');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-400 hover:bg-rose-900 font-medium text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {cert.verificationStatus === 'verified' && !cert.revokedAt && (
                        <button
                          onClick={() => {
                            setActionCert(cert);
                            setActionType('revoke');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-400 hover:bg-red-900 font-medium text-[11px]"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Issue Certificate for Verified Credit</span>
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {issueError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs">
                {issueError}
              </div>
            )}

            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Verified Credit
                </label>
                {creditsLoading ? (
                  <p className="text-xs text-slate-500">Loading eligible verified credits...</p>
                ) : (
                  <select
                    value={issueForm.academicCreditId}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, academicCreditId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Choose a verified credit --</option>
                    {verifiedCredits.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.studentId?.name || 'Student'} - {c.courseId?.courseName || c.courseId?.courseCode || 'Course'} ({c.credits} cr, Grade {c.grade})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Certificate Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Certificate of Achievement in Data Structures"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Certificate Type
                </label>
                <select
                  value={issueForm.certificateType}
                  onChange={(e) =>
                    setIssueForm({ ...issueForm, certificateType: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="course_completion">Course Completion</option>
                  <option value="academic_achievement">Academic Achievement</option>
                  <option value="skill">Skill Badge</option>
                  <option value="participation">Participation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-indigo-600/20"
                >
                  {issuing ? 'Issuing...' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject / Revoke Reason Modal */}
      {actionCert && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-bold text-white capitalize">
              {actionType} Certificate
            </h3>
            <p className="text-xs text-slate-400">
              Please state the official reason for this action for record keeping.
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide clear reason..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setActionCert(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={submitActionReason}
                disabled={submittingAction || !reason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold text-white"
              >
                {submittingAction ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
