import React, { useEffect, useState } from 'react';
import {
  Activity,
  ScrollText,
  RefreshCw,
  Server,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminApiMonitoringPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const filteredLogs = logs.filter((lg) => {
    if (statusFilter === '2xx' && (lg.statusCode < 200 || lg.statusCode >= 300)) return false;
    if (statusFilter === '4xx' && (lg.statusCode < 400 || lg.statusCode >= 500)) return false;
    if (statusFilter === '5xx' && lg.statusCode < 500) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const instName = (lg.institutionId?.name || '').toLowerCase();
      const endpoint = (lg.endpoint || '').toLowerCase();
      const method = (lg.method || '').toLowerCase();
      return instName.includes(q) || endpoint.includes(q) || method.includes(q);
    }
    return true;
  });

  const totalRequests = logs.length;
  const successCount = logs.filter((l) => l.statusCode < 400).length;
  const errorCount = totalRequests - successCount;
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
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2 self-start sm:self-center transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total B2B Requests</span>
          <p className="text-xl font-bold text-white font-mono">{totalRequests}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-emerald-400 font-medium">Success Rate</span>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100}%
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-purple-400 font-medium">Average Latency</span>
          <p className="text-xl font-bold text-purple-400 font-mono">{avgLatency} ms</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-rose-400 font-medium">Client / Server Errors</span>
          <p className="text-xl font-bold text-rose-400 font-mono">{errorCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by institution, endpoint, or HTTP method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {[
            { id: 'all', label: 'All' },
            { id: '2xx', label: '2xx OK' },
            { id: '4xx', label: '4xx Errors' },
            { id: '5xx', label: '5xx Errors' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                statusFilter === st.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
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
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredLogs.length} of {logs.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading telemetry stream...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No matching API telemetry records found.
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
                  <th className="px-6 py-3.5">Client IP</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {filteredLogs.map((lg) => (
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
