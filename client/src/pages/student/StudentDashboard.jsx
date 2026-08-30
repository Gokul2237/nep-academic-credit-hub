import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

  // Demo NEP Student Metrics (Identified as demo dataset for Phase 2 UI)
  const stats = [
    {
      label: 'Total Accumulated Credits',
      value: '74',
      target: '160 Credits Required',
      progress: 46.25,
      icon: Wallet,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      label: 'Verified Academic Credits',
      value: '68',
      target: '6 Pending Verification',
      progress: 91.8,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      label: 'Current Academic Term',
      value: 'Semester 5',
      target: 'Academic Year 2026-2027',
      icon: Calendar,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      label: 'Degree Pathway Progress',
      value: '46.2%',
      target: 'On Track for 4-Yr Honours',
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
  ];

  const recentCredits = [
    {
      code: 'CS301',
      title: 'Database Management Systems & Distributed DBs',
      institution: 'IIT Bombay (IITB)',
      credits: 4,
      grade: 'A+ (9.0)',
      semester: 'Semester 4',
      status: 'VERIFIED',
      hash: 'sha256:8f4c...3e1a',
    },
    {
      code: 'CS304',
      title: 'Design and Analysis of Algorithms',
      institution: 'NIT Karnataka (NITK)',
      credits: 4,
      grade: 'O (10.0)',
      semester: 'Semester 4',
      status: 'VERIFIED',
      hash: 'sha256:b21a...99f4',
    },
    {
      code: 'AI201',
      title: 'Applied Machine Learning & Neural Systems',
      institution: 'SWAYAM / NPTEL Hub',
      credits: 3,
      grade: 'A (8.0)',
      semester: 'Semester 3',
      status: 'VERIFIED',
      hash: 'sha256:44cd...112e',
    },
    {
      code: 'CS308',
      title: 'Computer Networks & Distributed Protocols',
      institution: 'IIT Bombay (IITB)',
      credits: 4,
      grade: 'A+ (9.0)',
      semester: 'Semester 5',
      status: 'AWARDED',
      hash: 'sha256:77ae...bb20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Profile Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold">
                NEP 2020 Academic Bank of Credits (ABC)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified ABC Identity</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              B.Tech in Computer Science & Engineering • Primary Node:{' '}
              <span className="text-slate-300 font-medium">IIT Bombay</span> • ABC ID:{' '}
              <span className="text-blue-400 font-mono font-medium">
                {user?.studentId || 'ABC-89421094'}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/student/simulator"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Credit Transfer Simulator</span>
            </Link>
            <Link
              to="/student/transcript"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              View Official Transcript
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Data Notice */}
      <div className="px-4 py-2 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between text-xs text-blue-300">
        <span className="font-mono text-[11px]">ℹ️ Demo Dataset Active for UI Scaffolding</span>
        <span className="text-[11px] text-slate-400">All data integrates with live MongoDB models in Phase 3</span>
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
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.target}</p>
              </div>
              {stat.progress && (
                <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Grid: Multi-Institutional Breakdown & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Institution Credit Distribution */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">Cross-Institution Credits</h3>
            <span className="text-[10px] text-slate-400 font-mono">3 Institutions</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">IIT Bombay</span>
                <span className="text-blue-400 font-bold">32 Credits (43%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full w-[43%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">NIT Karnataka</span>
                <span className="text-indigo-400 font-bold">26 Credits (35%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full w-[35%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">SWAYAM / NPTEL</span>
                <span className="text-purple-400 font-bold">16 Credits (22%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full w-[22%]"></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <Link
              to="/student/wallet"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center justify-between group"
            >
              <span>Explore Digital Credit Wallet</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>

        {/* Quick Action Simulator Banner */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/60 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Policy Evaluation Engine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              Simulate Credit Transfer to Another University
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Test your earned credits against dynamic institutional acceptance policies (v1.0 / v2.0) before officially applying for a credit transfer.
            </p>
          </div>

          <div className="mt-6 flex items-center space-x-3">
            <Link
              to="/student/simulator"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/student/pathway"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              View NEP Pathway
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Credits Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recent Academic Credit Ledger</h3>
            <p className="text-xs text-slate-400">Cryptographically verifiable course records</p>
          </div>
          <Link
            to="/student/timeline"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View Full Timeline →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Awarding Institution</th>
                <th className="py-2.5 px-3">Credits</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Term</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentCredits.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <span className="font-mono text-blue-400 font-semibold mr-1.5">{c.code}</span>
                    <span className="text-slate-200">{c.title}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{c.institution}</td>
                  <td className="py-3 px-3 font-semibold text-slate-100">{c.credits}</td>
                  <td className="py-3 px-3 text-slate-200">{c.grade}</td>
                  <td className="py-3 px-3 text-slate-400">{c.semester}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.status}
                    </span>
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
