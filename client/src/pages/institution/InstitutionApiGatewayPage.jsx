import React, { useEffect, useState } from 'react';
import {
  Webhook,
  Key,
  ScrollText,
  PlusCircle,
  Copy,
  Check,
  XCircle,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

export default function InstitutionApiGatewayPage() {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys' or 'logs'
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState([
    'read:credits',
    'submit:credits',
    'verify:certificates',
    'read:students',
  ]);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGatewayData();
  }, []);

  const fetchGatewayData = async () => {
    try {
      setLoading(true);
      setError('');
      const [keysRes, logsRes] = await Promise.all([
        api.get('/gateway/keys'),
        api.get('/gateway/logs'),
      ]);
      setKeys(keysRes.data?.data || keysRes.data || []);
      setLogs(logsRes.data?.data || logsRes.data || []);
    } catch (err) {
      console.error('Fetch gateway data error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load B2B API Gateway records.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    try {
      setCreating(true);
      setError('');
      const res = await api.post('/gateway/keys', {
        name: keyName.trim(),
        scopes: selectedScopes,
      });

      const data = res.data?.data || res.data;
      setCreatedSecret(data.secretKey);
      setShowCreateModal(false);
      setKeyName('');
      setSuccess('API key generated successfully!');
      fetchGatewayData();
    } catch (err) {
      console.error('Generate key error:', err);
      setError(err.response?.data?.message || 'Failed to generate API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? External B2B integrations using this key will immediately lose access.')) {
      return;
    }
    try {
      setLoading(true);
      await api.put(`/gateway/keys/${keyId}/revoke`);
      setSuccess('API key revoked successfully.');
      fetchGatewayData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Revoke key error:', err);
      setError(err.response?.data?.message || 'Failed to revoke API key.');
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <Webhook className="w-4 h-4" />
            <span>Cross-Institutional B2B REST API Node</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            B2B API Gateway & Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage authenticated inter-university API keys, access scopes, and inspect live B2B exchange telemetry.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchGatewayData}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate New API Key</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Secret Key Alert Modal */}
      {createdSecret && (
        <div className="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <Key className="w-5 h-5" />
              <span>Save Your API Secret Key Now</span>
            </div>
            <button
              onClick={() => setCreatedSecret(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-300">
            This secret key will <strong>ONLY be shown ONCE</strong>. Copy and store it securely:
          </p>
          <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 break-all">
            <span className="flex-1">{createdSecret}</span>
            <button
              onClick={handleCopySecret}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            activeTab === 'keys'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Active API Keys ({keys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Live Telemetry Logs ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading API keys...</div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Key className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No API keys generated yet</p>
              <p className="text-xs text-slate-500">
                Click "Generate New API Key" to enable automated B2B credit verification.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                  <tr>
                    <th className="px-6 py-3.5">Key Name / ID</th>
                    <th className="px-6 py-3.5">Key Prefix & Fingerprint</th>
                    <th className="px-6 py-3.5">Granted Scopes</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Last Used</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {keys.map((k) => (
                    <tr key={k._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{k.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{k.keyId}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {k.keyPrefix || 'nep_live_'}••••••••{k.lastFour}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes?.map((sc) => (
                            <span
                              key={sc}
                              className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 font-mono text-[10px]"
                            >
                              {sc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {k.isActive ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[11px] font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 text-[11px] font-medium">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {k.isActive && (
                          <button
                            onClick={() => handleRevokeKey(k._id)}
                            className="px-3 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-400 hover:bg-red-900 font-medium text-[11px]"
                          >
                            Revoke Key
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TELEMETRY LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading B2B telemetry...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ScrollText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No B2B Gateway traffic recorded yet</p>
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
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <span>Generate B2B REST API Key</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Key Identifier / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production B2B Transfer Integration Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select Permission Scopes
                </label>
                <div className="space-y-2">
                  {[
                    { scope: 'read:credits', desc: 'Read student credit records' },
                    { scope: 'submit:credits', desc: 'Award credits via API Gateway' },
                    { scope: 'verify:certificates', desc: 'Verify certificate seals' },
                    { scope: 'read:students', desc: 'Read institution student roster' },
                  ].map((item) => (
                    <label
                      key={item.scope}
                      className="flex items-center space-x-2 cursor-pointer text-xs p-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(item.scope)}
                        onChange={() => toggleScope(item.scope)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-mono text-indigo-300 font-semibold">{item.scope}</span>
                        <p className="text-slate-400 text-[11px]">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !keyName.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-indigo-600/20"
                >
                  {creating ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
