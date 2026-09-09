import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { transferService } from '../../services/transferService';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  BookOpen,
  Filter,
  Search,
  AlertCircle,
  X,
  FileCheck,
  Ban,
} from 'lucide-react';

export default function InstitutionTransfersPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'outgoing' | 'all'
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Review Modal State
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const typeParam = activeTab === 'outgoing' ? 'outgoing' : activeTab === 'all' ? 'all' : 'incoming';
      const params = { type: typeParam };
      if (statusFilter) params.status = statusFilter;

      const [transfersRes, statsRes] = await Promise.all([
        transferService.getTransfers(params),
        transferService.getTransferStats(),
      ]);

      setTransfers(transfersRes.data || []);
      setStats(statsRes.data || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load transfer requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransfer) return;

    if (reviewAction === 'REJECTED' && !rejectionReason.trim()) {
      setError('Please specify a rejection reason.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        status: reviewAction,
        remarks: remarks.trim(),
        rejectionReason: reviewAction === 'REJECTED' ? rejectionReason.trim() : '',
      };

      const res = await transferService.reviewTransfer(selectedTransfer._id, payload);

      setSuccess(res.message || `Transfer request ${reviewAction.toLowerCase()} successfully.`);
      setSelectedTransfer(null);
      setRemarks('');
      setRejectionReason('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit transfer evaluation decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center space-x-1">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{status || 'Pending'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Institutional Credit Evaluation Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Inter-University Credit Transfers</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluate incoming transfer applications from external universities based on NEP credit equivalency rules, or track outgoing credit mobility of your enrolled students.
          </p>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Volume</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-amber-400 font-medium">Pending Review</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{stats.pending}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-emerald-400 font-medium">Approved</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{stats.approved}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-rose-400 font-medium">Rejected</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Controls & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'incoming'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Incoming Applications (Evaluation Queue)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'outgoing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Outgoing Student Applications
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading transfer queue...</div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No transfer applications found</p>
            <p className="text-xs text-slate-500 mt-1">There are no transfer records matching the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">{activeTab === 'outgoing' ? 'Destination Institution' : 'Source Institution'}</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transfers.map((item) => {
                  const isDestination = item.destinationInstitutionId?._id?.toString() === user?.institutionId?.toString();
                  const canEvaluate = isDestination && ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(item.status);

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-medium text-slate-200">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <div>
                            <div className="font-semibold">{item.studentId?.name || 'Student'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.studentId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">
                          {activeTab === 'outgoing'
                            ? item.destinationInstitutionId?.name
                            : item.sourceInstitutionId?.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {activeTab === 'outgoing'
                            ? item.destinationInstitutionId?.code
                            : item.sourceInstitutionId?.code}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-400">
                        {item.totalCredits} Credits ({item.creditIds?.length || 0} courses)
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {canEvaluate ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransfer(item);
                              setReviewAction('APPROVED');
                              setRemarks('');
                              setRejectionReason('');
                              setError('');
                            }}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/20"
                          >
                            Evaluate Request
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransfer(item);
                              setReviewAction('VIEW_ONLY');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluation & Review Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-100">
                  {reviewAction === 'VIEW_ONLY' ? 'Transfer Request Summary' : 'Evaluate Incoming Transfer Request'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Applicant Student:</span>
                  <div className="font-bold text-slate-200">{selectedTransfer.studentId?.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedTransfer.studentId?.email}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Source University:</span>
                  <div className="font-bold text-slate-200">{selectedTransfer.sourceInstitutionId?.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedTransfer.sourceInstitutionId?.code}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Academic Credits Requested for Transfer ({selectedTransfer.totalCredits} Credits Total):</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {selectedTransfer.creditIds?.map((c) => (
                    <div key={c._id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-200">{c.courseId?.courseName || 'Course'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.courseId?.courseCode} • Dept: {c.courseId?.department} • Grade: {c.grade}
                        </div>
                      </div>
                      <span className="font-bold text-blue-400">{c.credits} Credits</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransfer.reason && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Student Transfer Statement:</span>
                  <div className="text-slate-300 italic">"{selectedTransfer.reason}"</div>
                </div>
              )}
            </div>

            {/* Evaluation Decision Controls (if editable) */}
            {reviewAction !== 'VIEW_ONLY' ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs pt-3 border-t border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Decision Choice</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewAction('APPROVED')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition ${
                        reviewAction === 'APPROVED'
                          ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Transfer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction('REJECTED')}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition ${
                        reviewAction === 'REJECTED'
                          ? 'bg-rose-600/10 border-rose-500 text-rose-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Transfer</span>
                    </button>
                  </div>
                </div>

                {reviewAction === 'APPROVED' ? (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Approval Remarks / Equivalency Notes</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Approved under NEP 2020 course equivalency guidelines."
                      rows={2}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Rejection Rationale (Required)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="State the academic or policy reason for rejecting credit transfer..."
                      rows={2}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTransfer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 rounded-xl text-white font-semibold shadow-lg transition ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    }`}
                  >
                    {submitting ? 'Processing...' : `Confirm ${reviewAction}`}
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTransfer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
