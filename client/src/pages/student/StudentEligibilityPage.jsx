import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  BookOpen,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentEligibilityPage() {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEligibility();
  }, []);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/eligibility');
      setEligibility(res.data?.data || res.data);
    } catch (err) {
      console.error('Eligibility fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Eligibility information is not available yet because your institution has not configured this requirement.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Eligible') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Eligible</span>
        </span>
      );
    }
    if (status === 'Almost Eligible') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-400 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>Almost Eligible</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Not Yet Eligible</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>NEP 2020 Standard Benchmarks</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Academic Eligibility Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time evaluation of earned verified credits against national degree and diploma requirements.
          </p>
        </div>
        <button
          onClick={fetchEligibility}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Evaluate</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs leading-relaxed">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-40 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : eligibility ? (
        <>
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-900/60 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  Overall Academic Progress
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {eligibility.summary?.summaryMessage}
                </h2>
              </div>
              <div>{getStatusBadge(eligibility.summary?.overallStatus)}</div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Bachelor Degree Progress (160 Credits Target)</span>
                <span className="text-blue-400 font-bold">{eligibility.summary?.progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${eligibility.summary?.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-500 text-[11px]">Verified Credits</span>
                <p className="text-lg font-bold text-emerald-400">{eligibility.summary?.verifiedCredits}</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-500 text-[11px]">Pending Credits</span>
                <p className="text-lg font-bold text-amber-400">{eligibility.summary?.pendingCredits}</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-500 text-[11px]">Institutions Attended</span>
                <p className="text-lg font-bold text-blue-400">{eligibility.summary?.institutionsAttended}</p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                <span className="text-slate-500 text-[11px]">Disciplines Covered</span>
                <p className="text-lg font-bold text-indigo-400">{eligibility.summary?.departmentsCovered}</p>
              </div>
            </div>
          </div>

          {/* Requirements Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight">
              NEP Academic Goal Benchmarks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibility.requirements?.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-white">{req.title}</h4>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Required Credits:</span>
                        <span className="text-slate-200 font-mono">{req.requiredCredits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Verified:</span>
                        <span className="text-emerald-400 font-mono font-semibold">{req.currentCredits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Needed:</span>
                        <span className="text-amber-400 font-mono">{req.remainingCredits}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar inside card */}
                  <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        req.status === 'Eligible'
                          ? 'bg-emerald-500'
                          : req.status === 'Almost Eligible'
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((req.currentCredits / req.requiredCredits) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
