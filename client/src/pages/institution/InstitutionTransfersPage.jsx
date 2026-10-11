import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { transferService } from '../../services/transferService';
import { studentService } from '../../services/studentService';
import { creditService } from '../../services/creditService';
import { authService } from '../../services/authService';
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
  Plus,
  Send,
  History,
  FileText,
  ShieldCheck,
  Info,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function InstitutionTransfersPage() {
  const { user } = useAuth();
  
  // Section Navigation: 'incoming' | 'outgoing' | 'details' | 'history'
  const [activeSection, setActiveSection] = useState('incoming');
  
  // Data state
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [historyDirection, setHistoryDirection] = useState('all'); // 'all' | 'incoming' | 'outgoing'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected Transfer for Details Section & Evaluation
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Outgoing Transfer Creation Modal State (Institution Initiating on behalf of student)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentCredits, setStudentCredits] = useState([]);
  const [selectedCreditIds, setSelectedCreditIds] = useState([]);
  const [institutionsList, setInstitutionsList] = useState([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [createReason, setCreateReason] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSection, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      let typeParam = 'incoming';
      if (activeSection === 'outgoing') typeParam = 'outgoing';
      else if (activeSection === 'history') typeParam = 'history';
      else if (activeSection === 'details') typeParam = 'all';

      const params = { type: typeParam };
      if (statusFilter) params.status = statusFilter;

      const [transfersRes, statsRes] = await Promise.all([
        transferService.getTransfers(params),
        transferService.getTransferStats(),
      ]);

      const dataList = transfersRes.data || [];
      setTransfers(dataList);
      setStats(statsRes.data || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 });

      // If viewing details and we have an ID selected, refresh the selected record
      if (selectedTransfer) {
        const found = dataList.find((t) => t._id === selectedTransfer._id);
        if (found) setSelectedTransfer(found);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transfer requests.');
    } finally {
      setLoading(false);
    }
  };

  // Open Outgoing Request Creation Modal
  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateLoading(true);
    setError('');
    setSelectedStudentId('');
    setSelectedCreditIds([]);
    setSelectedDestinationId('');
    setCreateReason('');
    setStudentCredits([]);

    try {
      const [studentsRes, instsRes] = await Promise.all([
        studentService.getStudents(),
        authService.getInstitutions(),
      ]);

      const allStudents = studentsRes.data || [];
      // Only students enrolled in this institution
      const enrolled = allStudents.filter(
        (s) => s.institutionId?._id?.toString() === user?.institutionId?.toString() ||
               s.institutionId?.toString() === user?.institutionId?.toString()
      );
      setStudentsList(enrolled);

      // Other verified institutions (exclude this institution)
      const currentInstId = user?.institutionId?._id || user?.institutionId;
      const otherInsts = (instsRes || []).filter(
        (i) => i._id?.toString() !== currentInstId?.toString()
      );
      setInstitutionsList(otherInsts);
    } catch (err) {
      setError(err.message || 'Failed to initialize request form.');
    } finally {
      setCreateLoading(false);
    }
  };

  // When a student is selected in create modal, load their verified credits
  const handleStudentChange = async (studentId) => {
    setSelectedStudentId(studentId);
    setSelectedCreditIds([]);
    if (!studentId) {
      setStudentCredits([]);
      return;
    }

    try {
      const res = await creditService.getCredits({ studentId, verificationStatus: 'verified' });
      const credits = res.data || [];
      // Filter out credits already transferred
      const transferable = credits.filter((c) => !c.isTransferred);
      setStudentCredits(transferable);
    } catch (err) {
      console.error('Failed to load student credits:', err);
    }
  };

  const toggleCreditSelection = (creditId) => {
    setSelectedCreditIds((prev) =>
      prev.includes(creditId) ? prev.filter((id) => id !== creditId) : [...prev, creditId]
    );
  };

  // Submit New Transfer Request (Institution-initiated on behalf of enrolled student)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select an enrolled student.');
      return;
    }
    if (!selectedDestinationId) {
      setError('Please select a destination partner institution.');
      return;
    }
    if (selectedCreditIds.length === 0) {
      setError('Please select at least one academic credit to transfer.');
      return;
    }

    setSubmittingCreate(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        studentId: selectedStudentId,
        destinationInstitutionId: selectedDestinationId,
        creditIds: selectedCreditIds,
        reason: createReason.trim() || 'Institution-initiated academic credit transfer request.',
      };

      const res = await transferService.createTransfer(payload);
      setSuccess(res.message || 'Credit transfer request submitted successfully.');
      setIsCreateModalOpen(false);
      setActiveSection('outgoing');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit credit transfer request.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Submit Review Decision (Approve / Reject)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransfer) return;

    if (reviewAction === 'REJECTED' && !rejectionReason.trim()) {
      setError('Please provide a decision rejection rationale.');
      return;
    }

    setSubmittingReview(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        status: reviewAction,
        remarks: remarks.trim(),
        rejectionReason: reviewAction === 'REJECTED' ? rejectionReason.trim() : '',
      };

      const res = await transferService.reviewTransfer(selectedTransfer._id, payload);
      setSuccess(res.message || `Transfer request has been ${reviewAction.toLowerCase()} successfully.`);
      
      // Update local selected record
      if (res.data) {
        setSelectedTransfer(res.data);
      }
      setRemarks('');
      setRejectionReason('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit transfer evaluation decision.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center space-x-1">
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
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{status || 'Pending'}</span>
          </span>
        );
    }
  };

  // Filter transfers for Search & History Direction
  const filteredTransfers = transfers.filter((t) => {
    if (activeSection === 'history' && historyDirection !== 'all') {
      const isDestination = t.destinationInstitutionId?._id?.toString() === user?.institutionId?.toString();
      if (historyDirection === 'incoming' && !isDestination) return false;
      if (historyDirection === 'outgoing' && isDestination) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentName = t.studentId?.name?.toLowerCase() || '';
      const studentEmail = t.studentId?.email?.toLowerCase() || '';
      const sourceName = t.sourceInstitutionId?.name?.toLowerCase() || '';
      const destName = t.destinationInstitutionId?.name?.toLowerCase() || '';
      const idStr = t._id?.toLowerCase() || '';
      return (
        studentName.includes(q) ||
        studentEmail.includes(q) ||
        sourceName.includes(q) ||
        destName.includes(q) ||
        idStr.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Institutional Credit Mobility Gateway</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Credit Transfer Requests</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluate incoming transfer applications from partner institutions, track outgoing student mobility, inspect request details, and review transfer history under NEP 2020 guidelines.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Transfer Request</span>
        </button>
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
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Incoming Requests Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('incoming');
              setStatusFilter('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSection === 'incoming'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Incoming Requests</span>
            {stats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-400 text-slate-950 font-bold text-[10px]">
                {stats.pending}
              </span>
            )}
          </button>

          {/* 2. Outgoing Requests Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('outgoing');
              setStatusFilter('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSection === 'outgoing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Outgoing Requests</span>
          </button>

          {/* 3. Request Details Tab */}
          <button
            type="button"
            onClick={() => setActiveSection('details')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSection === 'details'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Request Details</span>
            {selectedTransfer && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          {/* 4. Transfer History Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveSection('history');
              setStatusFilter('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSection === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transfer History</span>
          </button>
        </div>

        {/* Section Filters */}
        {activeSection !== 'details' && (
          <div className="flex items-center space-x-2">
            {activeSection === 'history' && (
              <select
                value={historyDirection}
                onChange={(e) => setHistoryDirection(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Directions</option>
                <option value="incoming">Incoming Transferred</option>
                <option value="outgoing">Outgoing Transferred</option>
              </select>
            )}

            <div className="flex items-center space-x-1.5 text-xs">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: INCOMING REQUESTS                                   */}
      {/* ============================================================== */}
      {activeSection === 'incoming' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-400" />
                <span>Incoming Evaluation Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Transfer requests addressed to your institution. Evaluate and decide on credit acceptance.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading incoming transfer requests...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ArrowDownLeft className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No incoming transfer requests found</p>
              <p className="text-xs text-slate-500 mt-1">There are no incoming requests matching the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Source University</th>
                    <th className="px-4 py-3">Credits Requested</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransfers.map((item) => {
                    const isPending = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(item.status);
                    return (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          #{item._id?.slice(-6)?.toUpperCase()}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-200">{item.studentId?.name || 'Student'}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.studentId?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{item.sourceInstitutionId?.name}</div>
                          <div className="text-[10px] text-indigo-400 font-mono">{item.sourceInstitutionId?.code}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-400">
                          {item.totalCredits} Credits ({item.creditIds?.length || 0} course{item.creditIds?.length === 1 ? '' : 's'})
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransfer(item);
                              setActiveSection('details');
                              setReviewAction('APPROVED');
                              setRemarks('');
                              setRejectionReason('');
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              isPending
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {isPending ? 'Evaluate' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: OUTGOING REQUESTS                                   */}
      {/* ============================================================== */}
      {activeSection === 'outgoing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                <span>Outgoing Student Applications</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Credit transfer requests originating from your enrolled students to other institutions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Submit Request for Student</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading outgoing transfer requests...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ArrowUpRight className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No outgoing transfer requests found</p>
              <p className="text-xs text-slate-500 mt-1">Submit an outgoing request for an enrolled student using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Destination University</th>
                    <th className="px-4 py-3">Credits Requested</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Decision Reason / Remarks</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransfers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        #{item._id?.slice(-6)?.toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{item.studentId?.name || 'Student'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.studentId?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{item.destinationInstitutionId?.name}</div>
                        <div className="text-[10px] text-indigo-400 font-mono">{item.destinationInstitutionId?.code}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-400">
                        {item.totalCredits} Credits ({item.creditIds?.length || 0} course{item.creditIds?.length === 1 ? '' : 's'})
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                        {item.status === 'REJECTED'
                          ? item.rejectionReason || 'No reason provided'
                          : item.remarks || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTransfer(item);
                            setActiveSection('details');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: REQUEST DETAILS                                     */}
      {/* ============================================================== */}
      {activeSection === 'details' && (
        <div>
          {!selectedTransfer ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200">No Transfer Request Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Please select any transfer application from Incoming Requests, Outgoing Requests, or Transfer History to inspect full details and take action.
              </p>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('incoming')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                >
                  View Incoming Requests
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('outgoing')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  View Outgoing Requests
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-6 p-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-slate-100">
                        Transfer Request #{selectedTransfer._id}
                      </h2>
                      {getStatusBadge(selectedTransfer.status)}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Submitted on {new Date(selectedTransfer.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('incoming')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Back to Incoming
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('outgoing')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Back to Outgoing
                  </button>
                </div>
              </div>

              {/* 3-Column Profile Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Applicant Student */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
                    <User className="w-3.5 h-3.5" />
                    <span>Applicant Student</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{selectedTransfer.studentId?.name || 'Student'}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{selectedTransfer.studentId?.email}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    Student / ABC ID: {selectedTransfer.studentId?.studentId || 'ABC-REGISTERED'}
                  </div>
                </div>

                {/* Source Institution */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400 font-semibold uppercase tracking-wider text-[10px]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Source Institution</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{selectedTransfer.sourceInstitutionId?.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    Code: <span className="text-indigo-400 font-bold">{selectedTransfer.sourceInstitutionId?.code}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Type: {selectedTransfer.sourceInstitutionId?.type || 'COLLEGE'}
                  </div>
                </div>

                {/* Destination Institution */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Destination Institution</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{selectedTransfer.destinationInstitutionId?.name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    Code: <span className="text-emerald-400 font-bold">{selectedTransfer.destinationInstitutionId?.code}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Type: {selectedTransfer.destinationInstitutionId?.type || 'UNIVERSITY'}
                  </div>
                </div>
              </div>

              {/* Academic Courses & Credits Table */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    Courses & Academic Credits Requested for Transfer ({selectedTransfer.totalCredits} Credits Total)
                  </span>
                  <span className="text-slate-400 font-mono">
                    Policy Version: {selectedTransfer.policyVersionUsed || '1.0'}
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Course Code</th>
                        <th className="px-4 py-2.5">Course Name</th>
                        <th className="px-4 py-2.5">Department</th>
                        <th className="px-4 py-2.5">Grade</th>
                        <th className="px-4 py-2.5 text-right">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedTransfer.creditIds?.map((c) => (
                        <tr key={c._id}>
                          <td className="px-4 py-3 font-mono text-indigo-400 font-semibold">
                            {c.courseId?.courseCode || 'CRS-01'}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {c.courseId?.courseName || 'Course Name'}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {c.courseId?.department || 'Engineering'}
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-400">
                            {c.grade || 'A'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-blue-400">
                            {c.credits} Credits
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Statement / Reason */}
              {selectedTransfer.reason && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-semibold text-slate-400 block mb-1">Student Transfer Statement:</span>
                  <p className="text-slate-300 italic">"{selectedTransfer.reason}"</p>
                </div>
              )}

              {/* Decision Verdict Information (If already decided) */}
              {['APPROVED', 'REJECTED', 'CONDITIONAL_APPROVAL', 'CANCELLED'].includes(selectedTransfer.status) && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-slate-200 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Evaluation Decision Record</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Decision Status:</span>
                      <span className="font-bold">{selectedTransfer.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Decision Date:</span>
                      <span className="font-mono">
                        {selectedTransfer.reviewedAt ? new Date(selectedTransfer.reviewedAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  {selectedTransfer.remarks && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">Approval Remarks / Equivalency Notes:</span>
                      <p className="text-slate-300 mt-0.5">{selectedTransfer.remarks}</p>
                    </div>
                  )}

                  {selectedTransfer.rejectionReason && (
                    <div>
                      <span className="text-rose-400 block text-[10px] font-bold">Rejection Rationale:</span>
                      <p className="text-rose-300 mt-0.5">{selectedTransfer.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation Controls (Only if destination institution and currently pending) */}
              {selectedTransfer.destinationInstitutionId?._id?.toString() === user?.institutionId?.toString() &&
                ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(selectedTransfer.status) && (
                  <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                      <FileCheck className="w-5 h-5" />
                      <span>Take Evaluation Decision on this Incoming Request</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-2">Decision Choice</label>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
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
                        <label className="block font-semibold text-slate-300 mb-1">
                          Approval Remarks / Course Equivalency Rationale
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Verified syllabus equivalency meets NEP 2020 transfer threshold (>70%). Transferred to host institution."
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-semibold text-rose-300 mb-1">
                          Rejection Rationale (Mandatory)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Specify reasons for credit rejection (e.g., syllabus overlap < 70%, lab requirement missing, credit deficit)..."
                          rows={3}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className={`px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg transition ${
                          reviewAction === 'APPROVED'
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                            : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                        }`}
                      >
                        {submittingReview ? 'Processing Decision...' : `Confirm & Save ${reviewAction}`}
                      </button>
                    </div>
                  </form>
                )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: TRANSFER HISTORY                                    */}
      {/* ============================================================== */}
      {activeSection === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Credit Transfer History Ledger</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Archival record of finalized credit transfer evaluations (Approved, Rejected, and Cancelled).
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search student or request ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading transfer history ledger...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No transfer history records found</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed decisions and finalized transfer applications will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Decision Date</th>
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Counterparty Institution</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3">Verdict</th>
                    <th className="px-4 py-3">Decision Remarks / Reason</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransfers.map((item) => {
                    const isDestination = item.destinationInstitutionId?._id?.toString() === user?.institutionId?.toString();
                    return (
                      <tr key={item._id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          #{item._id?.slice(-6)?.toUpperCase()}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {item.reviewedAt
                            ? new Date(item.reviewedAt).toLocaleDateString()
                            : new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {isDestination ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center space-x-1">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>Incoming</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center space-x-1">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>Outgoing</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{item.studentId?.name || 'Student'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.studentId?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200">
                            {isDestination ? item.sourceInstitutionId?.name : item.destinationInstitutionId?.name}
                          </div>
                          <div className="text-[10px] text-indigo-400 font-mono">
                            {isDestination ? item.sourceInstitutionId?.code : item.destinationInstitutionId?.code}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-400">
                          {item.totalCredits} Credits
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                          {item.status === 'REJECTED'
                            ? item.rejectionReason || 'Rejected'
                            : item.remarks || 'Accepted'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransfer(item);
                              setActiveSection('details');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: INITIATE TRANSFER REQUEST FOR ENROLLED STUDENT           */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-slate-100">
                  Initiate Outgoing Credit Transfer Request
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading institution students and catalogs...</div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                {/* Enrolled Student Selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Enrolled Student (Source: {user?.institutionName})
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Enrolled Student --</option>
                    {studentsList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.email}) — ID: {s.studentId || s._id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Partner Institution Selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Select Destination Partner Institution
                  </label>
                  <select
                    value={selectedDestinationId}
                    onChange={(e) => setSelectedDestinationId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Destination University --</option>
                    {institutionsList.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.name} [{inst.code}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Credits Selection */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Academic Credits to Transfer (Verified Records)
                  </label>
                  {!selectedStudentId ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-center">
                      Select a student above to view transferable verified academic credits.
                    </div>
                  ) : studentCredits.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 text-center">
                      This student has no untransferred verified credits available.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {studentCredits.map((c) => {
                        const isChecked = selectedCreditIds.includes(c._id);
                        return (
                          <div
                            key={c._id}
                            onClick={() => toggleCreditSelection(c._id)}
                            className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                              isChecked
                                ? 'bg-blue-600/10 border-blue-500 text-blue-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                              <div>
                                <div className="font-semibold">{c.courseId?.courseName || 'Course'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {c.courseId?.courseCode} • Grade: {c.grade} • Sem: {c.semester}
                                </div>
                              </div>
                            </div>
                            <span className="font-bold text-blue-400">{c.credits} Credits</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Transfer Statement */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Transfer Statement / Mobility Rationale
                  </label>
                  <textarea
                    value={createReason}
                    onChange={(e) => setCreateReason(e.target.value)}
                    placeholder="Enter details regarding this inter-university credit transfer..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreate || selectedCreditIds.length === 0}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
                  >
                    {submittingCreate ? 'Submitting...' : 'Submit Transfer Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
