import React, { useEffect, useState } from 'react';
import { ScrollText, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/gateway/audit-logs');
      const data = res.data?.data || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError(err.response?.data?.message || 'Failed to fetch platform audit logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <ScrollText className="w-4 h-4" />
            <span>Immutable Governance Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Platform Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Immutable log of state modifications, administrative security overrides, and API key generation events.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">System Security Event Log</h3>
          <span className="text-xs text-slate-400 font-mono">Real-time DB Audit Telemetry</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No administrative audit events recorded in database yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource / Details</th>
                  <th className="px-4 py-3">User / Institution</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id || log.logId} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-purple-400 font-bold">{log.action}</td>
                    <td className="px-4 py-3 text-slate-200">
                      <div>{log.resource}</div>
                      {log.details && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans">
                      <div>{log.userId?.name || 'System User'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.institutionId?.name || 'Global'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
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
