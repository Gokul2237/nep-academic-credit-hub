import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  AlertCircle,
  Shield,
  Activity,
  ScrollText,
  RefreshCw,
  Award,
  ArrowRightLeft,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/overview');
      const overview = res.data || res;
      setData(overview);
    } catch (err) {
      console.error('Fetch admin overview error:', err);
      setError(err.message || 'Failed to load live database telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const totalInst = data?.totalInstitutions ?? 0;
  const totalStud = data?.totalStudents ?? 0;
  const totalCred = data?.totalVerifiedCredits ?? 0;
  const totalCert = data?.totalCertificates ?? 0;
  const pendingInstCount = data?.pendingInstitutionsCount ?? 0;

  const stats = [
    {
      label: 'Participating Universities',
      value: loading ? '...' : totalInst.toLocaleString(),
      subtext: `${pendingInstCount} Pending Accreditation`,
      icon: Building2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      label: 'Total Enrolled Students',
      value: loading ? '...' : totalStud.toLocaleString(),
      subtext: 'National ABC Linked',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      label: 'Total Verified Credit Records',
      value: loading ? '...' : totalCred.toLocaleString(),
      subtext: 'SHA-256 Tamper-Proof',
      icon: GraduationCap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      label: 'Issued Certificates',
      value: loading ? '...' : totalCert.toLocaleString(),
      subtext: 'Verified Credentials',
      icon: Award,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
  ];

  const pendingInstitutions = data?.pendingInstitutions || [];
  const recentAuditLogs = data?.recentAuditLogs || [];

  const formatAuditAction = (action) => {
    if (!action) return 'System Activity';
    const act = String(action).toUpperCase();
    if (act.includes('GENERATE') && act.includes('KEY')) return 'API key generated';
    if (act.includes('REVOKE') && act.includes('KEY')) return 'API key revoked';
    if (act.includes('VERIF') && act.includes('CREDIT')) return 'Credit record verified';
    if (act.includes('AWARD') && act.includes('CREDIT')) return 'Credit record awarded';
    if (act.includes('TRANSFER') && act.includes('APPROV')) return 'Transfer request approved';
    if (act.includes('TRANSFER') && act.includes('REJECT')) return 'Transfer request rejected';
    if (act.includes('TRANSFER') && act.includes('INIT')) return 'Transfer request initiated';
    if (act.includes('CERT') && (act.includes('ISSUE') || act.includes('CREATE'))) return 'Certificate issued';
    if (act.includes('CERT') && act.includes('VERIF')) return 'Certificate verified';
    if (act.includes('CERT') && act.includes('REVOK')) return 'Certificate revoked';
    if (act.includes('TRANSCRIPT') && act.includes('GENERATE')) return 'Transcript generated';
    if (act.includes('POLICY') && (act.includes('UPDATE') || act.includes('PUBLISH'))) return 'Policy updated';
    if (act.includes('INSTITUTION') && act.includes('VERIF')) return 'Institution verified';
    if (act.includes('LOGIN')) return 'Administrative sign in';

    return act
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActorName = (log) => {
    if (log.userId?.name) return log.userId.name;
    if (log.userId?.email) return log.userId.email;
    if (log.institutionId?.name) return log.institutionId.name;
    return 'Administrator';
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
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${timeStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Superadmin Governance Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/60 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>National ABC Governance Control Plane</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>System Operational</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              National Academic Credit Hub Governance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Admin: <span className="text-purple-300 font-semibold">{user?.email || 'admin@nep.gov.in'}</span> • Active Nodes:{' '}
              <span className="text-slate-200 font-semibold">{totalInst} Participating Universities</span> • Status:{' '}
              <span className="text-emerald-400 font-medium">All Services Normal</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchOverview}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
            <Link
              to="/admin/analytics"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition flex items-center space-x-2"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchOverview} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <div className={`p-2 rounded-xl border ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100">{stat.value}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: Pending University Accreditation & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending University Accreditation Queue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  University Accreditation Queue
                </h3>
                <p className="text-xs text-slate-400">Pending NAAC/NIRF credentials verification</p>
              </div>
              <Link
                to="/admin/institutions"
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                View All ({pendingInstitutions.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
                Loading accreditation queue...
              </div>
            ) : pendingInstitutions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pending university accreditation requests in queue.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInstitutions.map((inst) => (
                  <div
                    key={inst._id}
                    className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-200">{inst.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-purple-400">
                          [{inst.code}]
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        NAAC: <span className="text-emerald-400 font-semibold">{inst.naacAccreditation || 'N/A'}</span> • NIRF: #{inst.nirfRank || 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to="/admin/institutions"
                        className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Platform Audit Trail Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Real-Time Platform Audit Stream
                </h3>
                <p className="text-xs text-slate-400">Essential security and administrative activity</p>
              </div>
              <Link
                to="/admin/audit-logs"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1 transition"
              >
                <span>View All Activity</span>
                <span>→</span>
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
                Loading audit trail...
              </div>
            ) : recentAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No administrative audit events recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentAuditLogs.slice(0, 5).map((log) => {
                  const actionLabel = formatAuditAction(log.action);
                  const actor = getActorName(log);
                  const time = formatAuditTime(log.createdAt);

                  return (
                    <div
                      key={log._id || log.logId}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700/80 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-200">
                            {actionLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-4">
                          By: <span className="text-slate-300 font-medium">{actor}</span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
