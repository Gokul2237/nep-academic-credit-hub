import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import api from '../../services/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatAuditAction = (action) => {
    if (!action) return 'System Event';
    const act = String(action).toUpperCase();
    if (act.includes('GENERATE') && act.includes('KEY')) return 'API Key Generated';
    if (act.includes('REVOKE') && act.includes('KEY')) return 'API Key Revoked';
    if (act.includes('VERIF') && act.includes('CREDIT')) return 'Credit Record Verified';
    if (act.includes('AWARD') && act.includes('CREDIT')) return 'Credit Record Awarded';
    if (act.includes('TRANSFER') && act.includes('APPROV')) return 'Transfer Request Approved';
    if (act.includes('TRANSFER') && act.includes('REJECT')) return 'Transfer Request Rejected';
    if (act.includes('TRANSFER') && act.includes('INIT')) return 'Transfer Request Initiated';
    if (act.includes('CERT') && (act.includes('ISSUE') || act.includes('CREATE'))) return 'Certificate Issued';
    if (act.includes('CERT') && act.includes('VERIF')) return 'Certificate Verified';
    if (act.includes('CERT') && act.includes('REVOK')) return 'Certificate Revoked';
    if (act.includes('TRANSCRIPT') && act.includes('GENERATE')) return 'Transcript Generated';
    if (act.includes('POLICY') && (act.includes('UPDATE') || act.includes('PUBLISH'))) return 'Policy Updated';
    if (act.includes('INSTITUTION') && act.includes('VERIF')) return 'Institution Verified';
    if (act.includes('LOGIN')) return 'Administrative Sign In';

    return act
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const sanitizeDetails = (details) => {
    if (!details || typeof details !== 'object') return null;
    const clean = { ...details };
    for (const key of Object.keys(clean)) {
      if (/key|secret|token|password|auth/i.test(key)) {
        clean[key] = '••••••••';
      }
    }
    return JSON.stringify(clean);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const actionMatch = (log.action || '').toLowerCase().includes(q);
    const readableMatch = formatAuditAction(log.action).toLowerCase().includes(q);
    const userMatch = (log.userId?.name || log.userId?.email || '').toLowerCase().includes(q);
    const instMatch = (log.institutionId?.name || '').toLowerCase().includes(q);
    const resourceMatch = (log.resource || '').toLowerCase().includes(q);
    return actionMatch || readableMatch || userMatch || instMatch || resourceMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <ScrollText className="w-4 h-4" />
            <span>Platform Governance Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Platform Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Immutable log of state modifications, administrative security overrides, and credential issuance events.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">System Security Event Log</h3>
            <span className="text-xs text-slate-400">Showing {filteredLogs.length} recorded events</span>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by action, actor, or context..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {searchTerm ? 'No audit events match your search query.' : 'No administrative audit events recorded in database yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-4 py-3">Event / Action</th>
                  <th className="px-4 py-3">Target Context</th>
                  <th className="px-4 py-3">Authorized Actor</th>
                  <th className="px-4 py-3">Network Source</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLogs.map((log) => {
                  const actionLabel = formatAuditAction(log.action);
                  const sanitizedJson = sanitizeDetails(log.details);

                  return (
                    <tr key={log._id || log.logId} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-purple-300">{actionLabel}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.action}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-200">
                        <div className="font-medium text-slate-200">{log.resource || 'System'}</div>
                        {sanitizedJson && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                            {sanitizedJson}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="font-medium text-slate-100">{log.userId?.name || 'Administrator'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.institutionId?.name || log.userId?.email || 'Governance Core'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{log.ipAddress || 'Internal'}</td>
                      <td className="px-4 py-3.5 text-right text-slate-400 font-medium whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
