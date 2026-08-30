import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  BookOpen,
  ArrowRightLeft,
  GraduationCap,
  Shield,
  Key,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { user } = useAuth();

  // Demo Institution Metrics (Identified as demo dataset for Phase 2 UI)
  const stats = [
    {
      label: 'Enrolled Students',
      value: '1,420',
      subtext: '+48 this semester',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      label: 'Active Catalog Courses',
      value: '86',
      subtext: 'NEP 2020 Standardized',
      icon: BookOpen,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
    },
    {
      label: 'Pending Transfer Evaluations',
      value: '14',
      subtext: '4 require officer review',
      icon: ArrowRightLeft,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      label: 'Verified Credits Issued',
      value: '18,450',
      subtext: 'Cryptographically Sealed',
      icon: GraduationCap,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  const pendingTransfers = [
    {
      requestId: 'TR-2026-089',
      studentName: 'Aarav Patel',
      abcId: 'ABC-10293847',
      sourceInst: 'NIT Karnataka (NITK)',
      sourceCourse: 'CS204: Data Structures & OOP',
      targetCourse: 'CS201: Data Structures',
      credits: 4,
      verdict: 'ACCEPTED',
      confidence: '94%',
      reasons: '✓ 82% Syllabus Match • ✓ Lab Component Valid • ✓ No Duplicate',
    },
    {
      requestId: 'TR-2026-092',
      studentName: 'Sneha Roy',
      abcId: 'ABC-56473829',
      sourceInst: 'Anna University (AU)',
      sourceCourse: 'EC302: Microprocessor Architecture',
      targetCourse: 'CS306: Computer Architecture',
      credits: 3,
      verdict: 'CONDITIONAL',
      confidence: '68%',
      reasons: '⚠ Practical lab component missing in syllabus • Review required',
    },
    {
      requestId: 'TR-2026-095',
      studentName: 'Karan Mehra',
      abcId: 'ABC-99281736',
      sourceInst: 'Delhi Technological Univ (DTU)',
      sourceCourse: 'IT401: Cloud Infrastructure',
      targetCourse: 'CS408: Distributed Systems',
      credits: 4,
      verdict: 'ACCEPTED',
      confidence: '88%',
      reasons: '✓ Policy v2.0 satisfied • ✓ Grade A achieved',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold flex items-center space-x-1">
                <Building2 className="w-3 h-3" />
                <span>Authorized Institution Node</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                NAAC A++ Accredited
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              {user?.institutionName || 'Indian Institute of Technology Bombay'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Node Code: <span className="text-indigo-400 font-mono font-bold">{user?.institutionCode || 'IITB'}</span> • Active Policy:{' '}
              <span className="text-slate-200 font-semibold">Policy v2.0 (70% Eqv, Lab Req)</span> • API Gateway:{' '}
              <span className="text-emerald-400 font-medium">Online (60 req/min)</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/institution/policies"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Manage Transfer Policies</span>
            </Link>
            <Link
              to="/institution/api-gateway"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              API Gateway Keys
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs text-indigo-300">
        <span className="font-mono text-[11px]">ℹ️ Demo Dataset Active for UI Scaffolding</span>
        <span className="text-[11px] text-slate-400">All data integrates with live MongoDB models in Phase 3-5</span>
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

      {/* Transfer Decisions Queue Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Incoming Credit Transfer Evaluation Queue
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated in real-time by Policy Engine against Active Policy Version (v2.0)
            </p>
          </div>
          <Link
            to="/institution/transfers"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            View All Transfer Requests →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Source Course</th>
                <th className="py-2.5 px-3">Equated Course</th>
                <th className="py-2.5 px-3">Decision Verdict</th>
                <th className="py-2.5 px-3">Evaluation Details</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pendingTransfers.map((req, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono text-slate-400">{req.requestId}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-200">{req.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{req.abcId}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-slate-300">{req.sourceCourse}</p>
                    <p className="text-[10px] text-slate-400">{req.sourceInst}</p>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-200">{req.targetCourse}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                        req.verdict === 'ACCEPTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {req.verdict === 'ACCEPTED' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      <span>{req.verdict} ({req.confidence})</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs truncate">
                    {req.reasons}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to="/institution/decisions"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
