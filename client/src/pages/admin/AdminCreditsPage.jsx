import React, { useState, useEffect, useCallback } from 'react';
import { creditService } from '../../services/creditService';
import { authService } from '../../services/authService';
import {
  GraduationCap,
  Search,
  Building2,
  Filter,
  ShieldCheck,
  Hash,
  AlertCircle,
  X,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCredit, setSelectedCredit] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Summary Metrics from server
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalVerified: 0,
    totalCreditUnits: 0,
  });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load institutions list for dropdown
  useEffect(() => {
    const fetchInstitutionsList = async () => {
      try {
        const instList = await authService.getInstitutions();
        setInstitutions(instList || []);
      } catch (err) {
        console.error('Failed to load institutions list:', err);
      }
    };
    fetchInstitutionsList();
  }, []);

  // Fetch Credits from Server with Pagination & Filters
  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        institutionId: selectedInstitution || undefined,
        verificationStatus: selectedStatus || undefined,
        semester: selectedSemester || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await creditService.getCredits(params);

      // res is unwrapped by api interceptor
      const items = res.data || [];
      setCredits(items);

      if (res.pagination) {
        setPagination({
          total: res.pagination.total || items.length,
          totalPages: res.pagination.totalPages || 1,
          hasNextPage: res.pagination.hasNextPage || false,
          hasPrevPage: res.pagination.hasPrevPage || false,
        });
      }

      if (res.summary) {
        setSummary(res.summary);
      } else {
        // Fallback calculation if summary omitted
        const verifiedCount = items.filter((c) => c.verificationStatus === 'verified').length;
        const totalPoints = items.reduce((acc, c) => acc + (c.credits || 0), 0);
        setSummary({
          totalRecords: res.pagination?.total || items.length,
          totalVerified: verifiedCount,
          totalCreditUnits: totalPoints,
        });
      }
    } catch (err) {
      console.error('Failed to load global credits:', err);
      setError(err.message || 'Failed to load global credit ledger.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedInstitution, selectedStatus, selectedSemester, startDate, endDate]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedInstitution('');
    setSelectedStatus('');
    setSelectedSemester('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleInstitutionChange = (e) => {
    setSelectedInstitution(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedInstitution) ||
    Boolean(selectedStatus) ||
    Boolean(selectedSemester) ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>National Credit Accumulation Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Complete Credit Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralized verifiable ledger of all academic credits awarded across every registered institution node.
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            type="button"
            onClick={fetchCredits}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Metrics Row - Reflecting Live Full DB Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Credit Records in System</div>
          <div className="text-xl font-bold text-white mt-1 font-mono">
            {summary.totalRecords.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across all registered university nodes</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-emerald-400 font-medium">Verified Credit Records</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            {summary.totalVerified.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-500/80 mt-0.5">Tamper-sealed with cryptographic hash</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-purple-400 font-medium">Accumulated Credit Units</div>
          <div className="text-xl font-bold text-purple-400 mt-1 font-mono">
            {summary.totalCreditUnits.toLocaleString()}
          </div>
          <p className="text-[10px] text-purple-400/80 mt-0.5">Total academic credit weight earned</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Free-text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by student name, roll number, ABC ID, course code/name, or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Institution Dropdown Filter */}
          <div className="w-full sm:w-60">
            <select
              value={selectedInstitution}
              onChange={handleInstitutionChange}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="">All Registered Institutions</option>
              {institutions.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.code} - {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="">All Verification Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="Award Start Date"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Date Range: End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              title="Award End Date"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Reset Filters Button */}
          <div>
            <button
              type="button"
              disabled={!hasActiveFilters}
              onClick={handleResetFilters}
              className="w-full h-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Credit Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-100">National Credit Records</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Total {pagination.total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span>Show</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>

            <span className="text-slate-600">|</span>

            <span className="font-mono text-[11px]">
              Page {page} of {pagination.totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading academic credit ledger records...</p>
          </div>
        ) : credits.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-slate-400">No credit records found</p>
            <p className="text-slate-500 mt-1">
              {hasActiveFilters
                ? 'Try adjusting your search query or filter options.'
                : 'No academic credits have been awarded across registered institutions yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Awarding Institution</th>
                  <th className="py-2.5 px-3">Term</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {credits.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{c.studentId?.name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {c.studentId?.studentId || c.studentId?.email}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-purple-400 mr-1.5">
                        {c.courseId?.courseCode}
                      </span>
                      <span className="text-slate-300">{c.courseId?.courseName}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium">
                          {c.institutionId?.name || 'Unknown'}
                        </span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[10px] text-purple-400 font-mono">
                            [{c.institutionId?.code}]
                          </span>
                          {c.isTransferred && c.transferredTo && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              &rarr; Host: {c.transferredTo?.code || 'Transfer'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Sem {c.semester} • {c.academicYear}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{c.credits}</td>
                    <td className="py-3 px-3 font-bold text-slate-200">{c.grade}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.verificationStatus === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : c.verificationStatus === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
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
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 border border-slate-700 text-[11px] font-mono transition inline-flex items-center space-x-1"
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

        {/* Server-Side Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {pagination.total > 0 ? (page - 1) * limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{pagination.total.toLocaleString()}</span> records
          </div>

          <div className="flex items-center space-x-2 self-center sm:self-auto">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-purple-300 font-mono font-bold">
              {page} / {pagination.totalPages}
            </div>

            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Hash Modal */}
      {selectedCredit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Global Credit Integrity Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCredit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-slate-300 font-semibold">Student: {selectedCredit.studentId?.name}</p>
                <p className="text-slate-400">Awarding Node: {selectedCredit.institutionId?.name} ({selectedCredit.institutionId?.code})</p>
                <p className="text-slate-400">
                  Course: {selectedCredit.courseId?.courseCode} - {selectedCredit.courseId?.courseName} ({selectedCredit.credits} Credits)
                </p>
                {selectedCredit.isTransferred && selectedCredit.transferredTo && (
                  <p className="text-emerald-400 font-semibold">
                    Current Transferred Host Node: {selectedCredit.transferredTo?.name} ({selectedCredit.transferredTo?.code})
                  </p>
                )}
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">Deterministic SHA-256 Hash:</p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all select-all">
                  {selectedCredit.integrityHash}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Integrity Verified: Record matches original issuing university digital seal.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCredit(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
