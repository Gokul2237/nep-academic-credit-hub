import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { creditService } from '../../services/creditService';
import { transferService } from '../../services/transferService';
import { authService } from '../../services/authService';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  BookOpen,
  Award,
  AlertCircle,
  X,
  Search,
  Filter,
  Ban,
  FileText,
} from 'lucide-react';

export default function StudentTransferPage() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [credits, setCredits] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedCredits, setSelectedCredits] = useState([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [transfersRes, creditsRes, instRes] = await Promise.all([
        transferService.getTransfers(),
        creditService.getCredits(),
        authService.getInstitutions(),
      ]);

      setTransfers(transfersRes.data || []);
      // Filter verified credits belonging to this student
      const verified = (creditsRes.data || []).filter(
        (c) => c.verificationStatus === 'verified'
      );
      setCredits(verified);

      // Exclude student's current institution from destination options
      const availableInsts = (instRes || []).filter(
        (inst) => inst._id !== user?.institutionId
      );
      setInstitutions(availableInsts);
    } catch (err) {
      setError(err.message || 'Failed to load transfer data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditToggle = (creditId) => {
    setSelectedCredits((prev) =>
      prev.includes(creditId)
        ? prev.filter((id) => id !== creditId)
        : [...prev, creditId]
    );
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedDestination) {
      setError('Please select a destination institution.');
      return;
    }
    if (selectedCredits.length === 0) {
      setError('Please select at least one academic credit to transfer.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await transferService.createTransfer({
        destinationInstitutionId: selectedDestination,
        creditIds: selectedCredits,
        reason,
      });

      setSuccess(res.message || 'Transfer request submitted successfully!');
      setIsModalOpen(false);
      setSelectedDestination('');
      setSelectedCredits([]);
      setReason('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit transfer request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTransfer = async (transferId) => {
    if (!window.confirm('Are you sure you want to cancel this transfer request?')) {
      return;
    }
    try {
      await transferService.cancelTransfer(transferId);
      setSuccess('Transfer request cancelled.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to cancel transfer request.');
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
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>NEP Academic Bank of Credits</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Inter-University Credit Transfer</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Request official transfer of verified academic credits to partner institutions. Target universities review applications using NEP credit equivalency rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            setSuccess('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/20 flex items-center space-x-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer Request</span>
        </button>
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

      {/* Transfer History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200">My Transfer Applications</h2>
          <span className="text-xs text-slate-400 font-mono">{transfers.length} Total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading transfer applications...</div>
        ) : transfers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No transfer requests submitted yet</p>
            <p className="text-xs text-slate-500 mt-1">Select verified credits from your wallet to apply for transfer to another university.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Destination Institution</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Submitted On</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transfers.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{item.destinationInstitutionId?.name || 'Destination Institution'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.destinationInstitutionId?.code}</div>
                        </div>
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
                      <button
                        type="button"
                        onClick={() => setSelectedTransfer(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        View Details
                      </button>
                      {['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(item.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelTransfer(item._id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition border border-rose-500/20"
                        >
                          Cancel
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

      {/* New Transfer Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-slate-100">Initiate Credit Transfer Request</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
              {/* Step 1: Select Institution */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  1. Select Destination University / Institution
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Destination Institution --</option>
                  {institutions.map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.code}) - {inst.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Credits */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  2. Select Verified Credits to Transfer ({selectedCredits.length} Selected)
                </label>

                {credits.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                    No verified credits available in your wallet for transfer.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {credits.map((c) => {
                      const isSelected = selectedCredits.includes(c._id);
                      return (
                        <div
                          key={c._id}
                          onClick={() => handleCreditToggle(c._id)}
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-blue-600/10 border-blue-500 text-slate-100'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{c.courseId?.courseName || 'Course'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {c.courseId?.courseCode} • Grade {c.grade} • Semester {c.semester}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-blue-400">{c.credits} Credits</span>
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSelected ? 'bg-blue-600 border-blue-500' : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Reason */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  3. Reason / Transfer Statement
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting credit transfer to the target university..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Controls */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Details Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Transfer Application Details</h3>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Current Status:</span>
                <div>{getStatusBadge(selectedTransfer.status)}</div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Source University:</span>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-200">
                  {selectedTransfer.sourceInstitutionId?.name} ({selectedTransfer.sourceInstitutionId?.code})
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Target University:</span>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-blue-400">
                  {selectedTransfer.destinationInstitutionId?.name} ({selectedTransfer.destinationInstitutionId?.code})
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Academic Credits Included:</span>
                <div className="space-y-1.5">
                  {selectedTransfer.creditIds?.map((cred) => (
                    <div key={cred._id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-200">{cred.courseId?.courseName || 'Course'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{cred.courseId?.courseCode} • Grade {cred.grade}</div>
                      </div>
                      <span className="font-bold text-blue-400">{cred.credits} Credits</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransfer.reason && (
                <div>
                  <span className="text-slate-400 block mb-1">Statement / Reason:</span>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 italic">
                    "{selectedTransfer.reason}"
                  </div>
                </div>
              )}

              {selectedTransfer.remarks && (
                <div>
                  <span className="text-slate-400 block mb-1">Evaluator Remarks:</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    {selectedTransfer.remarks}
                  </div>
                </div>
              )}

              {selectedTransfer.rejectionReason && (
                <div>
                  <span className="text-slate-400 block mb-1">Rejection Rationale:</span>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    {selectedTransfer.rejectionReason}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
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
