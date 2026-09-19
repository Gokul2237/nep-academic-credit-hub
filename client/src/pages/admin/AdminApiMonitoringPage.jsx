import React, { useEffect, useState } from 'react';
import { Activity, ScrollText, RefreshCw, Server, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function AdminApiMonitoringPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/gateway/logs');
      const list = res.data?.data || res.data || [];
      setLogs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch admin API logs error:', err);
      setError('Failed to fetch platform API telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const totalRequests = logs.length;
  const successCount = logs.filter((l) => l.statusCode < 400).length;
  const avgLatency =
    totalRequests > 0
      ? Math.round(logs.reduce((acc, l) => acc + (l.responseTimeMs || 0), 0) / totalRequests)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <Activity className="w-4 h-4" />
            <span>Platform Gateway Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            API Gateway Telemetry & Health
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time inter-institutional B2B API request volume, latency, status codes, and security telemetry.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Total B2B API Requests</span>
          <p className="text-2xl font-bold text-white font-mono">{totalRequests}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Success Rate</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100}%
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400">Average Gateway Latency</span>
          <p className="text-2xl font-bold text-purple-400 font-mono">{avgLatency} ms</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Telemetry Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Live Telemetry Stream</h3>
          <span className="text-xs text-slate-400 font-mono">Latest 100 requests</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading telemetry stream...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No API telemetry recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Institution</th>
                  <th className="px-6 py-3.5">Method & Endpoint</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Latency</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {logs.map((lg) => (
                  <tr key={lg._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 text-slate-200 font-sans">
                      {lg.institutionId?.name || 'External API Client'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-purple-400 mr-2">{lg.method}</span>
                      <span className="text-slate-200">{lg.endpoint}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`font-bold ${
                          lg.statusCode < 300
                            ? 'text-emerald-400'
                            : lg.statusCode < 400
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {lg.statusCode}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">{lg.responseTimeMs} ms</td>
                    <td className="px-6 py-3.5 text-slate-500">{lg.ipAddress}</td>
                    <td className="px-6 py-3.5 text-right text-slate-500">
                      {new Date(lg.createdAt).toLocaleTimeString()}
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
