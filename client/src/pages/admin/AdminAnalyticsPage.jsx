import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Award,
  Users,
  Building2,
  GraduationCap,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      // Dedicated server-side aggregation endpoint for complete system-wide analytics
      const res = await api.get('/admin/analytics/summary');
      const payload = res.data?.data || res.data || {};
      setStats(payload);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to retrieve system analytics.'
      );
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = stats?.totalCredits || 0;

  return (
    <div className="space-y-6">
      {/* 1. Page Heading and Brief Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Academic Intelligence & Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Macro-level trends, credit mobility stats, certificate issuance ratios, and institutional adoption metrics.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Charts</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* 2. Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Credit Records */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Credit Records</span>
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white font-mono">{stats?.totalCredits?.toLocaleString() ?? 0}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Academic Bank of Credits</p>
              </div>
            </div>

            {/* Cumulative Credit Points */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Cumulative Points</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-indigo-400 font-mono">
                  {stats?.totalCumulativePoints?.toLocaleString() ?? 0}{' '}
                  <span className="text-xs font-normal text-indigo-300">pts</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Recognized Credits Sum</p>
              </div>
            </div>

            {/* Active Students */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Active Students</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-emerald-400 font-mono">{stats?.totalStudents?.toLocaleString() ?? 0}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Registered Student Accounts</p>
              </div>
            </div>

            {/* Participating Universities */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Participating Universities</span>
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-blue-400 font-mono">{stats?.totalInstitutions?.toLocaleString() ?? 0}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Accredited University Nodes</p>
              </div>
            </div>

            {/* Issued Certificates */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Issued Certificates</span>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-amber-400 font-mono">{stats?.totalCertificates?.toLocaleString() ?? 0}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Verified Credentials</p>
              </div>
            </div>
          </div>

          {/* 3. Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credit Verification Status Distribution */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">Credit Verification Status Distribution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verification status ratio across all academic credits logged on the platform
                  </p>
                </div>

                {totalCredits === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    No academic credit records recorded in the database yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6 pt-4">
                    {/* Donut Visualization */}
                    <div className="h-56 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.statusDistribution || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            isAnimationActive={true}
                          >
                            {stats?.statusDistribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const { name, value } = payload[0];
                                const pct = totalCredits > 0 ? ((value / totalCredits) * 100).toFixed(1) : 0;
                                return (
                                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                    <div className="font-semibold text-white">{name}</div>
                                    <div className="text-slate-400">
                                      Count: <span className="text-slate-200 font-mono font-bold">{value}</span> ({pct}%)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Metric Label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold font-mono text-white leading-tight">
                          {totalCredits}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          Credits
                        </span>
                      </div>
                    </div>

                    {/* Clean Legend Breakdown Table */}
                    <div className="space-y-3">
                      {stats?.statusDistribution?.map((item) => {
                        return (
                          <div
                            key={item.name}
                            className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="space-y-0.5">
                                <span className="text-xs font-semibold text-slate-200 block">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {item.value} records
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className="text-xs font-bold font-mono"
                                style={{ color: item.color }}
                              >
                                {item.percent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Grade Distribution */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white">Academic Performance Distribution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Frequency distribution of credit grades awarded across participating curricula
                  </p>
                </div>

                {stats?.gradeDistribution?.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    No graded credit records available for performance analysis.
                  </div>
                ) : (
                  <div className="h-56 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.gradeDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                          dataKey="grade"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#334155' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#334155' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const { grade, count } = payload[0].payload;
                              return (
                                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                  <div className="font-semibold text-white">Grade {grade}</div>
                                  <div className="text-slate-400">
                                    Credits Count: <span className="text-purple-300 font-mono font-bold">{count}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Institutional Adoption Summary Table */}
          {stats?.instBreakdown?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Institutional Participation Roster</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Participating university nodes with student enrolment, issued credit records, and cumulative credit points
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {stats?.instBreakdown?.length} Universities
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-4 py-3">Institution Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3 text-center">Enrolled Students</th>
                      <th className="px-4 py-3 text-center">Issued Credit Records</th>
                      <th className="px-4 py-3 text-right">Cumulative Credit Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {stats?.instBreakdown?.map((inst) => (
                      <tr key={inst.code} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5 font-medium text-slate-100">{inst.name}</td>
                        <td className="px-4 py-3.5 font-mono text-purple-400 font-bold">[{inst.code}]</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-200">{inst.students}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-emerald-400 font-bold">{inst.creditsCount}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-300">
                          {inst.totalPoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950/80 font-mono text-xs border-t-2 border-slate-700">
                    <tr>
                      <td className="px-4 py-3.5 font-bold text-white uppercase" colSpan={2}>
                        Total / System-Wide
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-100">
                        {stats?.totalStudents?.toLocaleString() ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                        {stats?.totalCredits?.toLocaleString() ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-purple-300">
                        {stats?.totalCumulativePoints?.toLocaleString() ?? 0} pts
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
