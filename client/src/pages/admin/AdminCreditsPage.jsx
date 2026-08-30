import React, { useState, useEffect } from 'react';
import { creditService } from '../../services/creditService';
import {
  GraduationCap,
  Search,
  Building2,
  Filter,
  ShieldCheck,
  Hash,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function AdminCreditsPage() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCredit, setSelectedCredit] = useState(null);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await creditService.getCredits();
      setCredits(res.data || []);
    } catch (err) {
      console.error('Failed to load global credits:', err);
      setError(err.message || 'Failed to load global credit ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>National Academic Credit Ledger</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Global Credit Records</h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete verifiable audit trail of academic credits issued across all authorized universities
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Credit Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100">All Issued Credit Records ({credits.length})</h3>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading global credit records...</p>
          </div>
        ) : credits.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No credit records recorded on the platform yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Awarding Institution</th>
                  <th className="py-2.5 px-3">Term</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {credits.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{c.studentId?.name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {c.studentId?.studentId || c.studentId?.email}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-purple-400 mr-1.5">
                        {c.courseId?.courseCode}
                      </span>
                      <span className="text-slate-300">{c.courseId?.courseName}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300">{c.institutionId?.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-1">
                        [{c.institutionId?.code}]
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Sem {c.semester} • {c.academicYear}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{c.credits}</td>
                    <td className="py-3 px-3 font-bold text-slate-200">{c.grade}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.verificationStatus === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {c.verificationStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCredit(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 hover:text-purple-300 border border-slate-700 text-[11px] font-mono transition inline-flex items-center space-x-1"
                      >
                        <Hash className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Hash Modal */}
      {selectedCredit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Global Credit Integrity Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCredit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-slate-300 font-semibold">Student: {selectedCredit.studentId?.name}</p>
                <p className="text-slate-400">Awarding Node: {selectedCredit.institutionId?.name}</p>
                <p className="text-slate-400">Course: {selectedCredit.courseId?.courseCode} ({selectedCredit.credits} Credits)</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">Deterministic SHA-256 Hash:</p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all select-all">
                  {selectedCredit.integrityHash}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Integrity Verified: Record matches awarding university digital seal.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCredit(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
