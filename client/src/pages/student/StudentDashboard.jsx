import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { creditService } from '../../services/creditService';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    creditService
      .getWalletSummary()
      .then((data) => {
        setWallet(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load wallet data:', err);
        setWallet({ totalCredits: 0, verifiedCredits: 0, pendingCredits: 0, courseCount: 0, institutionBreakdown: [], credits: [] });
        setLoading(false);
      });
  }, []);

  const totalCredits = wallet?.totalCredits || 0;
  const verifiedCredits = wallet?.verifiedCredits || 0;
  const pendingCredits = wallet?.pendingCredits || 0;
  const recentCredits = (wallet?.credits || []).slice(0, 5);

  const stats = [
    {
      label: 'Total Accumulated Credits',
      value: loading ? '...' : String(totalCredits),
      target: 'Target: 160 Credits (4-Yr NEP)',
      progress: Math.min(Math.round((totalCredits / 160) * 100), 100),
      icon: Wallet,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      label: 'Verified Academic Credits',
      value: loading ? '...' : String(verifiedCredits),
      target: `${pendingCredits} Pending Review`,
      progress: totalCredits > 0 ? Math.round((verifiedCredits / totalCredits) * 100) : 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      label: 'Completed Courses',
      value: loading ? '...' : String(wallet?.courseCount || 0),
      target: 'Catalog subjects completed',
      icon: BookOpen,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      label: 'Degree Progress',
      value: `${Math.min(Math.round((totalCredits / 160) * 100), 100)}%`,
      target: 'NEP 2020 Standard Framework',
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
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
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified ABC Identity</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              National Student Identity • ABC ID:{' '}
              <span className="text-blue-400 font-mono font-medium">
                {user?.studentId || 'ABC-89421094'}
              </span>{' '}
              • Account: <span className="text-slate-300 font-medium">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/student/wallet"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-2"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Digital Credit Wallet</span>
            </Link>
            <Link
              to="/student/timeline"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Credit Timeline
            </Link>
          </div>
        </div>
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
              {stat.progress !== undefined && (
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

      {/* Multi-Institution Breakdown & Action Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Institution Credit Distribution */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">Cross-Institution Distribution</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {wallet?.institutionBreakdown?.length || 0} Institution Node(s)
            </span>
          </div>

          {wallet?.institutionBreakdown && wallet.institutionBreakdown.length > 0 ? (
            <div className="space-y-3">
              {wallet.institutionBreakdown.map((inst, idx) => {
                const percentage =
                  totalCredits > 0 ? Math.round((inst.credits / totalCredits) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium truncate max-w-[140px]">
                        {inst.name}
                      </span>
                      <span className="text-blue-400 font-bold">
                        {inst.credits} Credits ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              No institution credits recorded yet.
            </p>
          )}

          <div className="pt-3 border-t border-slate-800">
            <Link
              to="/student/wallet"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center justify-between group"
            >
              <span>View Full Wallet Ledger</span>
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
              Test your earned credits against dynamic institutional acceptance policies before officially applying for a transfer.
            </p>
          </div>

          <div className="mt-6 flex items-center space-x-3">
            <Link
              to="/student/simulator"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <span>Transfer Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/student/timeline"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              View Progression Timeline
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Credits Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recent Academic Credit Records</h3>
            <p className="text-xs text-slate-400">Live API-driven cryptographically verified records</p>
          </div>
          <Link
            to="/student/wallet"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Explore All Credits →
          </Link>
        </div>

        {recentCredits.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500">No academic credits recorded in your wallet yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3">Term</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {recentCredits.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono text-blue-400 font-semibold mr-1.5">
                        {c.courseId?.courseCode}
                      </span>
                      <span className="text-slate-200">{c.courseId?.courseName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{c.institutionId?.name}</td>
                    <td className="py-3 px-3 text-slate-400">
                      Sem {c.semester} ({c.academicYear})
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{c.credits}</td>
                    <td className="py-3 px-3">{c.grade}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.verificationStatus === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {c.verificationStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
