import React, { useEffect, useState } from 'react';
import {
  GitFork,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  Award,
  GraduationCap,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentPathwayPage() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/credits');
      const list = res.data?.data || res.data || [];
      setCredits(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Pathway credits error:', err);
      setError('Failed to load academic pathway records.');
    } finally {
      setLoading(false);
    }
  };

  const verifiedList = credits.filter((c) => c.verificationStatus === 'verified');
  const pendingList = credits.filter((c) => c.verificationStatus === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
            <GitFork className="w-4 h-4" />
            <span>Multi-Disciplinary Academic Roadmap</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Academic Pathway Planner
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visual roadmap of completed core courses, pending credits, and upcoming major/minor requirements.
          </p>
        </div>
        <button
          onClick={fetchCredits}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Pathway</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-48 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-6">
          {/* Phase 1: Completed Core Requirements */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Stage 1: Verified Core Academic Courses</span>
            </h3>
            {verifiedList.length === 0 ? (
              <p className="text-xs text-slate-500">No verified credits completed yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {verifiedList.map((c) => (
                  <div key={c._id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      Semester {c.semester} • Grade {c.grade}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {c.courseId?.courseName || c.courseId?.courseCode || 'Course'}
                    </h4>
                    <p className="text-[11px] text-slate-400">{c.credits} Credits</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase 2: In-Progress Credits */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Stage 2: Pending Institutional Verification</span>
            </h3>
            {pendingList.length === 0 ? (
              <p className="text-xs text-slate-500">No pending credit submissions.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pendingList.map((c) => (
                  <div key={c._id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 uppercase">
                      Pending Approval
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {c.courseId?.courseName || 'Course'}
                    </h4>
                    <p className="text-[11px] text-slate-400">{c.credits} Credits</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
