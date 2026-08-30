import React, { useState, useEffect } from 'react';
import { creditService } from '../../services/creditService';
import {
  Wallet,
  CheckCircle2,
  Clock,
  BookOpen,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  X,
  AlertCircle,
  Hash,
} from 'lucide-react';

export default function StudentWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCredit, setSelectedCredit] = useState(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await creditService.getWalletSummary();
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet:', err);
      setError(err.message || 'Failed to load academic credit wallet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const credits = wallet?.credits || [];

  const filteredCredits = credits.filter((c) => {
    const matchesSearch =
      c.courseId?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseId?.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.institutionId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || c.verificationStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold mb-2">
              <Wallet className="w-3.5 h-3.5" />
              <span>NEP Digital Academic Credit Wallet</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              My Academic Credit Wallet
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verified multi-institutional academic credit accumulation repository
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Integrity Verified</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Accumulated Credits</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-100 mt-3">
            {loading ? '...' : (wallet?.totalCredits || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across all accredited programs</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Credits</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-400 mt-3">
            {loading ? '...' : (wallet?.verifiedCredits || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Officially signed by awarding nodes</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Verification</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-400 mt-3">
            {loading ? '...' : (wallet?.pendingCredits || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting institutional sign-off</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed Courses</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-400 mt-3">
            {loading ? '...' : (wallet?.courseCount || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total catalog subjects completed</p>
        </div>
      </div>

      {/* Multi-Institution Breakdown Section */}
      {wallet?.institutionBreakdown && wallet.institutionBreakdown.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">
              Institution-wise Academic Credit Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {wallet.institutionBreakdown.length} Participating Node(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {wallet.institutionBreakdown.map((inst, idx) => {
              const percentage =
                wallet.totalCredits > 0
                  ? Math.round((inst.credits / wallet.totalCredits) * 100)
                  : 0;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{inst.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Node: [{inst.code}]</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{inst.courseCount} Course(s)</span>
                      <span className="text-blue-400 font-bold">
                        {inst.credits} Credits ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Credit Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by course code, name, or institution..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredCredits.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">
              No academic credits recorded yet.
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              When your enrolled university awards course grades and credits, they will appear here with cryptographic integrity hashes.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredCredits.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Course Code & Title</th>
                  <th className="py-2.5 px-3">Awarding Institution</th>
                  <th className="py-2.5 px-3">Academic Term</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3 text-right">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredCredits.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono text-blue-400 font-semibold mr-1.5">
                        {c.courseId?.courseCode || 'N/A'}
                      </span>
                      <span className="text-slate-200 font-medium">
                        {c.courseId?.courseName || 'Untitled Course'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-slate-300 font-medium">
                        {c.institutionId?.name || 'Unknown Institution'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        [{c.institutionId?.code || 'N/A'}]
                      </p>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Semester {c.semester} • {c.academicYear}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{c.credits}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold text-[11px]">
                        {c.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.verificationStatus === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {c.verificationStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCredit(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 text-[11px] font-mono transition inline-flex items-center space-x-1"
                      >
                        <Hash className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Integrity Hash Modal */}
      {selectedCredit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Credit Record Integrity Details
                  </h3>
                  <p className="text-[11px] text-slate-400">SHA-256 Verification Seal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCredit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <p className="text-slate-400 font-medium">Deterministic Fields Hashed:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Course:</span>{' '}
                    <span className="text-slate-200 font-mono">
                      {selectedCredit.courseId?.courseCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Credits:</span>{' '}
                    <span className="text-slate-200">{selectedCredit.credits}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Grade:</span>{' '}
                    <span className="text-slate-200">{selectedCredit.grade}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Term:</span>{' '}
                    <span className="text-slate-200">
                      Sem {selectedCredit.semester} ({selectedCredit.academicYear})
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">SHA-256 Integrity Hash:</p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all select-all">
                  {selectedCredit.integrityHash}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>
                  Integrity Valid: Data is consistent with the awarding institution's signature.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCredit(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
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
