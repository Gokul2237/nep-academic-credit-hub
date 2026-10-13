import React, { useState, useEffect } from 'react';
import { transferService } from '../../services/transferService';
import { authService } from '../../services/authService';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Filter,
  Search,
  AlertCircle,
  X,
  Ban,
  BarChart3,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Details Modal
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [transfersRes, statsRes, instRes] = await Promise.all([
        transferService.getTransfers(params),
        transferService.getTransferStats(),
        authService.getInstitutions(),
      ]);

      setTransfers(transfersRes.data || []);
      setStats(statsRes.data || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 });
      setInstitutions(instRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load platform transfer data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const q = searchQuery.toLowerCase();
    const studentName = t.studentId?.name?.toLowerCase() || '';
    const studentEmail = t.studentId?.email?.toLowerCase() || '';
    const sourceCode = t.sourceInstitutionId?.code?.toLowerCase() || '';
    const destCode = t.destinationInstitutionId?.code?.toLowerCase() || '';

    return (
      studentName.includes(q) ||
      studentEmail.includes(q) ||
      sourceCode.includes(q) ||
      destCode.includes(q)
    );
  });

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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>National Credit Flow Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Inter-University Transfer Governance</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Monitor national credit mobility, evaluation throughput, acceptance rates, and inter-institutional transfer agreements across all accredited universities.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2 self-start md:self-center transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Transfers</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Applications</div>
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
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Cancelled</div>
          <div className="text-xl font-bold text-slate-400 mt-1">{stats.cancelled}</div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, email, or institution code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Platform Transfer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading platform credit flows...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No transfer flows found</p>
            <p className="text-xs text-slate-500 mt-1">There are no inter-university transfers matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Source Institution</th>
                  <th className="px-4 py-3">Destination Institution</th>
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransfers.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{item.studentId?.name || 'Student'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.studentId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{item.sourceInstitutionId?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.sourceInstitutionId?.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-blue-400">{item.destinationInstitutionId?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.destinationInstitutionId?.code}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-purple-400">
                      {item.totalCredits} Credits
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTransfer(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Transfer Details Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">National Transfer Record Audit</h3>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Status:</span>
                <div>{getStatusBadge(selectedTransfer.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Student:</span>
                  <div className="font-bold text-slate-200">{selectedTransfer.studentId?.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{selectedTransfer.studentId?.email}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Total Credits:</span>
                  <div className="font-bold text-purple-400">{selectedTransfer.totalCredits} Credits</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedTransfer.creditIds?.length || 0} Courses</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Source Institution:</span>
                  <div className="font-semibold text-slate-200">{selectedTransfer.sourceInstitutionId?.name} ({selectedTransfer.sourceInstitutionId?.code})</div>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <span className="text-slate-400 block text-[10px]">Destination Institution:</span>
                  <div className="font-semibold text-blue-400">{selectedTransfer.destinationInstitutionId?.name} ({selectedTransfer.destinationInstitutionId?.code})</div>
                </div>
              </div>

              {selectedTransfer.reason && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Student Statement:</span>
                  <div className="text-slate-300 italic">"{selectedTransfer.reason}"</div>
                </div>
              )}

              {selectedTransfer.remarks && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <span className="font-semibold block mb-0.5">Evaluator Remarks:</span>
                  <div>{selectedTransfer.remarks}</div>
                </div>
              )}

              {selectedTransfer.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                  <div>{selectedTransfer.rejectionReason}</div>
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
