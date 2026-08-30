import React from 'react';
import { Sparkles, Construction, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description, phase = 'Phase 3' }) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Foundation Active — {phase} Module</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{description}</p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono">
              Status: Ready for Implementation
            </span>
          </div>
        </div>
      </div>

      {/* Module Overview Card */}
      <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <Layers className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">
          {title} Interface
        </h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
          The routing, RBAC protection, layout scaffolding, and API clients for this section are established. Real data integrations will activate in {phase}.
        </p>

        <div className="mt-6 flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>RBAC Guard Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
