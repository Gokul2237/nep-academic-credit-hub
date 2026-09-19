import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function InstitutionApiLogsPage() {
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
      const data = res.data?.data || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch API logs error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load institution API gateway logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <ScrollText className="w-4 h-4" />
            <span>Inter-University Traffic Stream</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            API Gateway Request & Telemetry Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time inter-institutional REST API exchange logs, HTTP response status codes, latency, and client IPs.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Traffic Logs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Telemetry Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Live B2B Exchange Log</h3>
          <span className="text-xs text-slate-400 font-mono">Latest 100 requests</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading B2B telemetry logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ScrollText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No B2B Gateway traffic recorded yet</p>
            <p className="text-xs text-slate-500">
              When partner institutions query student credits or verify certificates via API Keys, requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Method & Endpoint</th>
                  <th className="px-6 py-3.5">HTTP Status</th>
                  <th className="px-6 py-3.5">Response Time</th>
                  <th className="px-6 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {logs.map((lg) => (
                  <tr key={lg._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-indigo-400 mr-2">{lg.method}</span>
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
