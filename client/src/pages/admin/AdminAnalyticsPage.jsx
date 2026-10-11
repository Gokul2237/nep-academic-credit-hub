import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Building2,
  GraduationCap,
  RefreshCw,
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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [creditsRes, studentsRes, instRes, certsRes] = await Promise.all([
        api.get('/credits'),
        api.get('/students'),
        api.get('/auth/institutions'),
        api.get('/certificates'),
      ]);

      const credits = creditsRes.data?.data || creditsRes.data || [];
      const students = studentsRes.data?.data || studentsRes.data || [];
      const rawInst = instRes.data?.institutions || instRes.institutions || (Array.isArray(instRes.data) ? instRes.data : (Array.isArray(instRes) ? instRes : []));
      const institutions = Array.isArray(rawInst) ? rawInst : [];
      const certs = certsRes.data?.data || certsRes.data || [];

      // Process chart data
      const verified = credits.filter((c) => c.verificationStatus === 'verified').length;
      const pending = credits.filter((c) => c.verificationStatus === 'pending').length;
      const rejected = credits.filter((c) => c.verificationStatus === 'rejected').length;

      const statusDistribution = [
        { name: 'Verified', value: verified, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Rejected', value: rejected, color: '#f43f5e' },
      ];

      setStats({
        totalCredits: credits.length,
        totalStudents: students.length,
        totalInstitutions: institutions.length,
        totalCertificates: certs.length,
        statusDistribution,
      });
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>National Credit Accumulation Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System-Wide Analytics & Metrics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Macro-level trends, credit mobility stats, certificate issuance ratios, and institutional adoption metrics.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Charts</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Total Credit Records</span>
              <p className="text-2xl font-bold text-white font-mono">{stats?.totalCredits}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Active Students</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono">{stats?.totalStudents}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Participating Universities</span>
              <p className="text-2xl font-bold text-blue-400 font-mono">{stats?.totalInstitutions}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Issued Certificates</span>
              <p className="text-2xl font-bold text-purple-400 font-mono">{stats?.totalCertificates}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Credit Verification Status Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.statusDistribution || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats?.statusDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
