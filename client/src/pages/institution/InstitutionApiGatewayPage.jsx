import React, { useEffect, useState } from 'react';
import {
  Webhook,
  Key,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Code2,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function InstitutionApiGatewayPage() {
  const [gatewayInfo, setGatewayInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGatewayInfo();
  }, []);

  const fetchGatewayInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/gateway/info');
      const data = res.data?.data || res.data;
      setGatewayInfo(data);
    } catch (err) {
      console.error('Fetch gateway info error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load API Gateway information.'
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
            <Webhook className="w-4 h-4" />
            <span>Cross-Institutional B2B REST API Node</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            API Gateway Integration & Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Documentation, status, endpoint capabilities, and inter-institutional integration details.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchGatewayInfo}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Overview</span>
          </button>
          <Link
            to="/institution/api-keys"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center space-x-2"
          >
            <Key className="w-4 h-4" />
            <span>Manage API Keys</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 h-64 animate-pulse" />
      ) : (
        <>
          {/* Status & Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Gateway Status</span>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-xl font-bold text-emerald-400 font-mono">
                  {gatewayInfo?.gatewayStatus || 'ONLINE'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">API Protocol Version</span>
              <p className="text-xl font-bold text-white font-mono">
                {gatewayInfo?.apiVersion || 'v1'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Active Institutional Keys</span>
              <p className="text-xl font-bold text-indigo-400 font-mono">
                {gatewayInfo?.activeKeysCount ?? 0}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400">Authentication Header</span>
              <p className="text-xs font-mono font-bold text-slate-200 truncate">
                {gatewayInfo?.authHeader || 'X-API-Key: nep_live_...'}
              </p>
            </div>
          </div>

          {/* Integration Capabilities & Scopes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supported Scopes */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Supported Permission Scopes</span>
              </h3>
              <div className="space-y-3">
                {(gatewayInfo?.supportedScopes || [
                  { scope: 'read:credits', description: 'Query credit records belonging to institution students' },
                  { scope: 'submit:credits', description: 'Award academic credits programmatically' },
                  { scope: 'verify:certificates', description: 'Verify certificate authenticity seals' },
                  { scope: 'read:students', description: 'Retrieve institution student roster' },
                ]).map((sc) => (
                  <div key={sc.scope} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/80 font-mono text-xs font-semibold">
                      {sc.scope}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{sc.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick API Key / Quick Link Navigation */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>B2B Trust & Authentication Architecture</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The NEP Academic Hub B2B API Gateway enables authorized partner universities to securely exchange academic records, award credits across institutions, and verify digital certificates programmatically.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1.5">
                  <p className="text-indigo-400 font-bold"># Endpoint Base URL:</p>
                  <p className="text-slate-200">{gatewayInfo?.baseUrl || `${window.location.origin}/api/v1/gateway`}</p>
                  <p className="text-indigo-400 font-bold mt-2"># Authentication:</p>
                  <p className="text-emerald-400">Headers: X-API-Key: nep_live_&lt;secret_key&gt;</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Need to issue B2B API keys?</span>
                <Link
                  to="/institution/api-keys"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>Go to API Keys</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Endpoint Catalog */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Available Gateway Endpoints</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">B2B API Specs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                  <tr>
                    <th className="px-6 py-3.5">Method</th>
                    <th className="px-6 py-3.5">Endpoint Path</th>
                    <th className="px-6 py-3.5">Required Scope</th>
                    <th className="px-6 py-3.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(gatewayInfo?.endpoints || [
                    { method: 'GET', path: '/api/v1/gateway/credits', scope: 'read:credits', description: 'Read student credit ledger' },
                    { method: 'POST', path: '/api/v1/gateway/credits', scope: 'submit:credits', description: 'Award academic credit' },
                    { method: 'POST', path: '/api/v1/gateway/certificates/verify', scope: 'verify:certificates', description: 'Verify certificate seal' },
                    { method: 'GET', path: '/api/v1/gateway/students', scope: 'read:students', description: 'Fetch student roster' },
                  ]).map((ep) => (
                    <tr key={ep.path} className="hover:bg-slate-800/40 transition font-mono">
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            ep.method === 'GET'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-purple-950 text-purple-400 border border-purple-800'
                          }`}
                        >
                          {ep.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{ep.path}</td>
                      <td className="px-6 py-4 text-indigo-300">{ep.scope}</td>
                      <td className="px-6 py-4 font-sans text-slate-400">{ep.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
