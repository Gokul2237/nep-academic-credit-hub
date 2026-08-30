import React from 'react';
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
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Demo Platform Governance Metrics (Identified as demo dataset for Phase 2 UI)
  const stats = [
    {
      label: 'Participating Universities',
      value: '48',
      subtext: 'Central & State Institutes',
      icon: Building2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      label: 'Total Enrolled Students',
      value: '38,200',
      subtext: 'National ABC Linked',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      label: 'Total Verified Credit Records',
      value: '142,800',
      subtext: 'SHA-256 Tamper-Proof',
      icon: GraduationCap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      label: 'Pending University Verifications',
      value: '6',
      subtext: 'Accreditation Review',
      icon: AlertCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
  ];

  const pendingInstitutions = [
    {
      name: 'BITS Pilani',
      code: 'BITS',
      type: 'DEEMED_UNIVERSITY',
      naac: 'A++',
      nirf: 20,
      contact: 'dean.academic@bits-pilani.ac.in',
      status: 'PENDING_VERIFICATION',
    },
    {
      name: 'Jadavpur University',
      code: 'JU',
      type: 'STATE_UNIVERSITY',
      naac: 'A+',
      nirf: 12,
      contact: 'registrar@jadavpuruniversity.in',
      status: 'PENDING_VERIFICATION',
    },
    {
      name: 'Vellore Institute of Technology',
      code: 'VIT',
      type: 'DEEMED_UNIVERSITY',
      naac: 'A++',
      nirf: 17,
      contact: 'academic.transfer@vit.ac.in',
      status: 'PENDING_VERIFICATION',
    },
  ];

  const recentAuditLogs = [
    {
      action: 'POLICY_VERSION_PUBLISHED',
      actor: 'Dr. S. K. Nair (IIT Bombay)',
      target: 'Credit Acceptance Policy v2.0',
      ip: '192.168.1.104',
      time: '12 mins ago',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      action: 'CREDIT_AWARDED',
      actor: 'Academic Officer (NITK)',
      target: 'CS304: Algorithms (Student: ABC-9821)',
      ip: '10.0.4.22',
      time: '28 mins ago',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      action: 'API_KEY_GENERATED',
      actor: 'Dean (Anna University)',
      target: 'Production ERP Gateway Key',
      ip: '172.16.0.8',
      time: '1 hour ago',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    {
      action: 'TRANSFER_APPROVED',
      actor: 'Academic Board (IITB)',
      target: 'Request TR-2026-089 (4 Credits)',
      ip: '192.168.1.104',
      time: '2 hours ago',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Superadmin Governance Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/60 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>National ABC Superadmin Control Plane</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>Gateway 99.98% Operational</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              National Academic Credit Hub Governance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Admin: <span className="text-purple-300 font-semibold">{user?.email || 'admin@nep.gov.in'}</span> • Active Nodes:{' '}
              <span className="text-slate-200 font-semibold">48 Participating Universities</span> • Telemetry:{' '}
              <span className="text-emerald-400 font-medium">All Services Normal</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/analytics"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition flex items-center space-x-2"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Platform Analytics</span>
            </Link>
            <Link
              to="/admin/audit-logs"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Audit Trail Explorer
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between text-xs text-purple-300">
        <span className="font-mono text-[11px]">ℹ️ Demo Dataset Active for UI Scaffolding</span>
        <span className="text-[11px] text-slate-400">All data integrates with live MongoDB models in Phase 3-8</span>
      </div>

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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
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
              View All (6) →
            </Link>
          </div>

          <div className="space-y-3">
            {pendingInstitutions.map((inst, idx) => (
              <div
                key={idx}
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
                    NAAC: <span className="text-emerald-400 font-semibold">{inst.naac}</span> • NIRF: #{inst.nirf}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition"
                  >
                    Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Audit Trail Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Real-Time Platform Audit Stream
              </h3>
              <p className="text-xs text-slate-400">Immutable security and state change log</p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Full Log Explorer →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAuditLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/60 flex items-start justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${log.badge}`}>
                      {log.action}
                    </span>
                    <span className="text-slate-300 text-[11px]">{log.target}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    By {log.actor} • IP: <span className="font-mono text-slate-400">{log.ip}</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
