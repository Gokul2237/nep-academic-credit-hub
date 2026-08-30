import React, { useState, useEffect } from 'react';
import { creditService } from '../../services/creditService';
import {
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  Hash,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export default function StudentTimelinePage() {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await creditService.getTimeline();
      setTimeline(data);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      setError(err.message || 'Failed to load credit timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const academicYears = timeline ? Object.keys(timeline) : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Chronological Credit Progression</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Cross-Institution Academic Timeline
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Historical progression of credits awarded across recognized academic terms
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono">
              Ordered by Academic Term
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400">Loading academic progression...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && academicYears.length === 0 && (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-300">
            No chronological credit history recorded.
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            As credits are officially issued each semester, your academic progression timeline will assemble here automatically.
          </p>
        </div>
      )}

      {/* Timeline Progression Layout */}
      {!loading && academicYears.length > 0 && (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-slate-800">
          {academicYears.map((yearKey) => {
            const yearNode = timeline[yearKey];
            const semesterKeys = Object.keys(yearNode.semesters || {});

            return (
              <div key={yearKey} className="relative pl-10 sm:pl-14 space-y-6">
                {/* Year Header Marker */}
                <div className="absolute -left-1.5 sm:-left-0.5 top-0 w-8 h-8 rounded-full bg-indigo-600 border-4 border-slate-950 flex items-center justify-center text-white shadow-md">
                  <Calendar className="w-3.5 h-3.5" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider">
                      Academic Year
                    </span>
                    <h2 className="text-lg font-bold text-slate-100">{yearKey}</h2>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200">
                    {yearNode.yearCredits} Total Credits
                  </span>
                </div>

                {/* Semesters in this Year */}
                <div className="space-y-4">
                  {semesterKeys.map((semKey) => {
                    const semNode = yearNode.semesters[semKey];

                    return (
                      <div
                        key={semKey}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-200">{semKey}</h3>
                          </div>
                          <span className="text-xs font-semibold text-blue-400">
                            {semNode.semesterCredits} Credits
                          </span>
                        </div>

                        {/* Course Cards in this Semester */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {semNode.records.map((record) => (
                            <div
                              key={record._id}
                              className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-mono text-xs font-bold text-blue-400">
                                    {record.courseId?.courseCode}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                                    Grade: {record.grade}
                                  </span>
                                </div>
                                <h4 className="text-xs font-semibold text-slate-200 leading-snug">
                                  {record.courseId?.courseName}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                  <span>{record.institutionId?.name}</span>
                                </p>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-300">
                                  {record.credits} Credits
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    record.verificationStatus === 'verified'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {record.verificationStatus.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
