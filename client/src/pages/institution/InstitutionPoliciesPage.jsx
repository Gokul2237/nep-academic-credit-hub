import React, { useState } from 'react';
import { Shield, Layers, CheckCircle2, RefreshCw, FileText } from 'lucide-react';

export default function InstitutionPoliciesPage() {
  const [version, setVersion] = useState('v2.0');
  const [minGrade, setMinGrade] = useState('B');
  const [minEquivalency, setMinEquivalency] = useState(80);
  const [maxCredits, setMaxCredits] = useState(60);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <Shield className="w-4 h-4" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Credit Acceptance Policies ({version})
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Versioned rules governing external credit evaluations, minimum grade thresholds, and lab equivalency standards.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Policy configuration updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white">Active Policy Settings</h3>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Minimum Grade Threshold</label>
            <select
              value={minGrade}
              onChange={(e) => setMinGrade(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="O">O (Outstanding)</option>
              <option value="A+">A+ (Excellent)</option>
              <option value="A">A (Very Good)</option>
              <option value="B+">B+ (Good)</option>
              <option value="B">B (Above Average)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Minimum Course Syllabus Equivalency (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              value={minEquivalency}
              onChange={(e) => setMinEquivalency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Maximum Cumulative Transferable Credits</label>
            <input
              type="number"
              min="10"
              max="120"
              value={maxCredits}
              onChange={(e) => setMaxCredits(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Save Policy Changes
          </button>
        </form>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Immutable Policy Version History</span>
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/50">
              <span className="font-mono text-indigo-400 font-bold">v2.0 (Current Active)</span>
              <p className="text-slate-400 text-[11px] mt-1">Updated minimum grade to {minGrade} and equivalency to {minEquivalency}%.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500">
              <span className="font-mono font-bold">v1.0 (Archived)</span>
              <p className="text-[11px] mt-1">Initial NEP alignment policy configuration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
