import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Building2,
  CheckCircle2,
  ArrowRightLeft,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function StudentRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/recommendations');
      const list = res.data?.data?.recommendations || res.data?.recommendations || [];
      setRecommendations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Recommendations error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load course recommendations. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Explainable Academic Guidance</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Recommended for You
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Smart course suggestions based on your completed prerequisites, credit gap, and university credit mobility guidelines.
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Recommendations</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchRecommendations} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-52 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-2">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No course recommendations available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You have either completed all available course catalog offerings or no courses match your current prerequisites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((item, idx) => {
            const course = item.course;
            return (
              <div
                key={course._id || idx}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition p-6 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                        {course.courseCode} • {course.department || 'General Academic'}
                      </span>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {course.courseName}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-bold font-mono">
                      {course.credits} Credits
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{course.institution?.name || 'Accredited Partner University'}</span>
                  </div>

                  {/* Why Recommended Explanation Box */}
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-200 text-xs leading-relaxed space-y-1">
                    <span className="font-semibold text-indigo-300 block">Why Recommended:</span>
                    <p className="text-slate-300 text-[11px]">{item.whyRecommended}</p>
                  </div>

                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Prerequisites satisfied: </span>
                      <span className="text-emerald-400 font-mono">
                        ✓ {course.prerequisites.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-mono">
                    Match Score: <strong className="text-indigo-400">{item.matchScore}%</strong>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate('/student/transfers')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center space-x-1"
                    >
                      <span>Request Transfer</span>
                      <ArrowRightLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
