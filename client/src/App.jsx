import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShieldCheck, BookOpen, Building2, Key, CheckCircle2, ArrowRight, Activity } from 'lucide-react';
import axios from 'axios';

function HomePage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/health')
      .then((res) => {
        setHealth(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Health check failed:', err);
        setHealth({ status: 'offline', database: 'disconnected' });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-200">
                NEP Academic Credit Hub
              </span>
              <span className="block text-xs text-slate-400 font-mono">Trust Gateway & ABC Ledger</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
              <Activity className={`w-3.5 h-3.5 ${health?.status === 'healthy' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-slate-300">
                API: {loading ? 'Checking...' : (health?.status || 'Active')}
              </span>
            </div>
            <Link
              to="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-800 text-blue-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>Aligned with National Education Policy (NEP 2020) & ABC Framework</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Standardized Academic Credit Hub with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Cross-Institutional Trust Gateways
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Decentralized credit accumulation, versioned transfer policies, explainable decision engines, and cryptographically verified B2B academic gateways.
        </p>

        {/* 3 User Dashboards Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 w-full max-w-5xl text-left">
          {/* Student Card */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 transition duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Student Portal</h3>
            <p className="text-xs text-slate-400 mt-2">
              Digital Credit Wallet, chronological credit timeline, NEP eligibility tracker, transfer simulator & verifiable transcripts.
            </p>
            <div className="mt-4 flex items-center text-xs text-blue-400 font-medium">
              <span>Explore Student Experience</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Institution Card */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 transition duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Institution Gateway</h3>
            <p className="text-xs text-slate-400 mt-2">
              Credit issuance, course catalogs, versioned acceptance policies (v1.0, v2.0), transfer decision reviews & B2B API keys.
            </p>
            <div className="mt-4 flex items-center text-xs text-indigo-400 font-medium">
              <span>Manage Institution Node</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Admin Card */}
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-purple-500/50 transition duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Governance & Admin</h3>
            <p className="text-xs text-slate-400 mt-2">
              University accreditation verification, system-wide credit flow analytics, immutable audit logs & API telemetry monitoring.
            </p>
            <div className="mt-4 flex items-center text-xs text-purple-400 font-medium">
              <span>View System Governance</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>

        {/* System Architecture Highlights */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Policy Versioning Engine</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Explainable Evaluation Engine</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>B2B REST API Gateway</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SHA-256 Tamper-Evident Ledger</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NEP Academic Credit Accumulation Hub. S5 CSE Mini Project.</p>
          <div className="flex items-center space-x-4">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Phase 1: Foundation Ready</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">React 18 + Express + MongoDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
