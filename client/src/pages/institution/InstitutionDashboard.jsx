import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { institutionService } from '../../services/institutionService';
import { transferService } from '../../services/transferService';
import {
  Building2,
  Users,
  BookOpen,
  ArrowRightLeft,
  GraduationCap,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Inbox,
  FileCheck,
  Award,
  Key,
  Activity,
  RefreshCw,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch live overview statistics and fallback transfers queue in parallel
      const [overviewRes, transfersRes] = await Promise.allSettled([
        institutionService.getOverview(),
        transferService.getTransfers({ type: 'incoming', limit: 5 }),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
        setOverview(overviewRes.value.data);
        // If overview already contains recentTransfers, prioritize it, else use transfersRes
        if (overviewRes.value.data.recentTransfers && overviewRes.value.data.recentTransfers.length > 0) {
          setIncomingTransfers(overviewRes.value.data.recentTransfers);
        } else if (transfersRes.status === 'fulfilled' && transfersRes.value?.data) {
          setIncomingTransfers(transfersRes.value.data);
        } else {
          setIncomingTransfers([]);
        }
      } else {
        const failureReason =
          overviewRes.status === 'rejected'
            ? overviewRes.reason?.message || 'Failed to connect to Institution API'
            : overviewRes.value?.message || 'Failed to retrieve institution data';
        throw new Error(failureReason);
      }
    } catch (err) {
      console.error('Failed to load institution dashboard data:', err);
      setError(err.message || 'Unable to load real-time platform statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const profile = overview?.institutionProfile;
  const studentsCount = overview?.students?.enrolled ?? 0;
  const totalStudents = overview?.students?.total ?? 0;
  const activeCoursesCount = overview?.courses?.active ?? 0;
  const totalCoursesCount = overview?.courses?.total ?? 0;
  const creditPoints = overview?.credits?.totalPoints ?? 0;
  const verifiedCreditsCount = overview?.credits?.verifiedRecords ?? 0;
  const pendingCreditsCount = overview?.credits?.pendingRecords ?? 0;
  const pendingTransfersCount = overview?.transfers?.incoming?.pending ?? 0;
  const incomingTotal = overview?.transfers?.incoming?.total ?? 0;
  const outgoingTotal = overview?.transfers?.outgoing?.total ?? 0;

  const formatAuditAction = (action) => {
    if (!action) return 'Institutional Activity';
    const act = String(action).toUpperCase();
    if (act.includes('GENERATE') && act.includes('KEY')) return 'API key generated';
    if (act.includes('REVOKE') && act.includes('KEY')) return 'API key revoked';
    if (act.includes('POLICY') && (act.includes('PUBLISH') || act.includes('UPDATE'))) return 'Credit policy published';
    if (act.includes('TRANSFER') && act.includes('APPROV')) return 'Transfer request approved';
    if (act.includes('TRANSFER') && act.includes('REJECT')) return 'Transfer request rejected';
    if (act.includes('TRANSFER') && act.includes('INIT')) return 'Transfer request initiated';
    if (act.includes('VERIF') && act.includes('CREDIT')) return 'Credit record verified';
    if (act.includes('AWARD') && act.includes('CREDIT')) return 'Credit record awarded';
    if (act.includes('CERT') && (act.includes('ISSUE') || act.includes('CREATE'))) return 'Certificate issued';
    if (act.includes('CERT') && act.includes('VERIF')) return 'Certificate verified';
    if (act.includes('CERT') && act.includes('REVOK')) return 'Certificate revoked';
    if (act.includes('TRANSCRIPT')) return 'Transcript generated';
    if (act.includes('LOGIN')) return 'Institutional sign in';

    return act
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActionCategory = (action) => {
    const act = String(action).toUpperCase();
    if (act.includes('KEY')) return { label: 'Security & API', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
    if (act.includes('POLICY')) return { label: 'Governance', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    if (act.includes('TRANSFER')) return { label: 'Credit Mobility', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (act.includes('CREDIT')) return { label: 'Academic', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (act.includes('CERT')) return { label: 'Credentials', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'System', color: 'text-slate-400 bg-slate-800 border-slate-700' };
  };

  const getActorName = (log) => {
    if (log.userId?.name) return log.userId.name;
    if (log.userId?.email) return log.userId.email;
    return 'Authorized administrator';
  };

  const formatAuditTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeStr}`;
  };

  // Primary 4 live metrics
  const stats = [
    {
      label: 'Enrolled Students',
      value: loading ? '...' : String(studentsCount),
      subtext: `${totalStudents} Registered • Active Node`,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      link: '/institution/students',
    },
    {
      label: 'Active Catalog Courses',
      value: loading ? '...' : String(activeCoursesCount),
      subtext: `${totalCoursesCount} Total Courses in Catalog`,
      icon: BookOpen,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      link: '/institution/courses',
    },
    {
      label: 'Verified Academic Credits',
      value: loading ? '...' : `${creditPoints} Pts`,
      subtext: `${verifiedCreditsCount} Verified Records • ${pendingCreditsCount} Pending`,
      icon: Award,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      link: '/institution/credits',
    },
    {
      label: 'Pending Transfer Evaluations',
      value: loading ? '...' : String(pendingTransfersCount),
      subtext: pendingTransfersCount > 0 ? `${pendingTransfersCount} require evaluation` : 'Queue cleared',
      icon: ArrowRightLeft,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      link: '/institution/transfers',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold flex items-center space-x-1">
                <Building2 className="w-3 h-3" />
                <span>Authorized Institution Node</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>
                  {profile?.naacAccreditation ? `NAAC ${profile.naacAccreditation} Accredited` : 'Accredited Institution'}
                </span>
              </span>
              {profile?.nirfRank && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold">
                  NIRF Rank #{profile.nirfRank}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              {profile?.name || user?.institutionName || 'Institution Node'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Node Code: <span className="text-indigo-400 font-mono font-bold">{profile?.code || user?.institutionCode || 'NODE'}</span> • NEP Credit Mobility Engine • API Gateway:{' '}
              <span className="text-emerald-400 font-medium">
                {overview?.apiGateway?.activeKeys > 0
                  ? `${overview.apiGateway.activeKeys} Active Keys • ${overview.apiGateway.totalLogs} Logs`
                  : 'Online (60 req/min)'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center space-x-1.5 disabled:opacity-50"
              title="Refresh Live Statistics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/institution/results-import"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Results Import</span>
            </Link>
            <Link
              to="/institution/transfers"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-2"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer Portal</span>
            </Link>
            <Link
              to="/institution/policies"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-2"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Transfer Policies</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              to={stat.link}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl border ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 font-mono">{stat.value}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.subtext}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Credit Mobility & Infrastructure Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel 1: Incoming Credit Mobility */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">Incoming Mobility</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-blue-400">
                {incomingTotal} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Requests received from external universities for credit evaluation
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending</span>
                <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                  {overview?.transfers?.incoming?.pending ?? 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Approved</span>
                <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {overview?.transfers?.incoming?.approved ?? 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Rejected</span>
                <p className="text-base font-bold text-rose-400 font-mono mt-0.5">
                  {overview?.transfers?.incoming?.rejected ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Awaiting Evaluation</span>
            <span className="font-semibold text-amber-400">
              {overview?.transfers?.incoming?.pending ?? 0} Requests
            </span>
          </div>
        </div>

        {/* Panel 2: Outgoing Credit Mobility */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">Outgoing Mobility</h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-400">
                {outgoingTotal} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Requests initiated by your enrolled students to transfer out
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending</span>
                <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                  {overview?.transfers?.outgoing?.pending ?? 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Approved</span>
                <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {overview?.transfers?.outgoing?.approved ?? 0}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Rejected</span>
                <p className="text-base font-bold text-rose-400 font-mono mt-0.5">
                  {overview?.transfers?.outgoing?.rejected ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Transferred-In Credits</span>
            <span className="font-semibold text-emerald-400">
              {overview?.credits?.transferredIn ?? 0} Courses
            </span>
          </div>
        </div>

        {/* Panel 3: Verification & API Node Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-200">Node Infrastructure</h3>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Operational</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Cryptographic integrity, certificate issuance, and gateway metrics
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Certificates Issued</span>
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {overview?.certificates?.total ?? 0} ({overview?.certificates?.verified ?? 0} Verified)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>B2B API Gateway</span>
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {overview?.apiGateway?.activeKeys ?? 0} Active / {overview?.apiGateway?.totalKeys ?? 0} Total
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gateway Invocations</span>
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {overview?.apiGateway?.totalLogs ?? 0} Calls
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Official Contact</span>
            <span className="font-mono text-slate-300 truncate max-w-[160px]">
              {profile?.contactEmail || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Transfer Decisions Queue Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-100">
                Incoming Credit Transfer Evaluation Queue
              </h3>
              {pendingTransfersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                  {pendingTransfersCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Cross-institutional transfer requests submitted to your institution for equivalency evaluation
            </p>
          </div>
          <Link
            to="/institution/transfers"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
          >
            <span>Credit Transfer Requests Portal</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading live transfer queue...</span>
          </div>
        ) : incomingTransfers.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
            <Inbox className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300">No incoming transfer requests awaiting decision</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Transfer applications submitted by partner institutions and students will appear here.
            </p>
            <Link
              to="/institution/transfers"
              className="mt-3 inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              <span>Open Credit Transfer Requests</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Source University</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {incomingTransfers.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">
                      #{req._id?.slice(-6)?.toUpperCase()}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{req.studentId?.name || 'Student'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{req.studentId?.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-slate-300 font-medium">{req.sourceInstitutionId?.name || 'Partner University'}</p>
                      <p className="text-[10px] text-indigo-400 font-mono">{req.sourceInstitutionId?.code}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-blue-400">
                      {req.totalCredits} Credits ({req.creditIds?.length || 0} course{req.creditIds?.length === 1 ? '' : 's'})
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                          req.status === 'APPROVED' || req.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {req.status === 'APPROVED' || req.status === 'COMPLETED' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : req.status === 'REJECTED' ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        <span>{req.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/institution/transfers"
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium shadow-md shadow-blue-600/20 transition inline-flex items-center space-x-1"
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>Review</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Institutional Audit Activity Feed (if available) */}
      {overview?.recentActivity && overview.recentActivity.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Recent Institutional Audit Trail</h3>
                <p className="text-xs text-slate-400">Authenticated administrative activity and governance events</p>
              </div>
            </div>
            <Link
              to="/institution/api-logs"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 transition"
            >
              <span>View All Activity</span>
              <span>→</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {overview.recentActivity.slice(0, 5).map((log) => {
              const actionLabel = formatAuditAction(log.action);
              const category = getActionCategory(log.action);
              const actor = getActorName(log);
              const time = formatAuditTime(log.createdAt);

              return (
                <div
                  key={log._id || log.logId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs hover:border-slate-700/80 transition gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200">{actionLabel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${category.color}`}>
                        {category.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Performed by: <span className="text-slate-300 font-medium">{actor}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
