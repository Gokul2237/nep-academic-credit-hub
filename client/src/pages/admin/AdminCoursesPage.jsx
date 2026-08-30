import React, { useState, useEffect } from 'react';
import { courseService } from '../../services/courseService';
import {
  BookOpen,
  Search,
  Building2,
  Filter,
  AlertCircle,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await courseService.getCourses({
        search: searchTerm || undefined,
        allInstitutions: 'true',
      });
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllCourses();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>National Course Registry</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">National Course Catalog</h1>
            <p className="text-xs text-slate-400 mt-1">
              Cross-institutional registry of all NEP-accredited courses across participating universities
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

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search all courses by code, title, or department..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100">All Registered Courses ({courses.length})</h3>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading catalog...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No courses found in the national registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Course Name</th>
                  <th className="py-2.5 px-3">Institution Node</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {courses.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-purple-400">{c.courseCode}</td>
                    <td className="py-3 px-3 font-medium text-slate-200">{c.courseName}</td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300">{c.institutionId?.name || 'N/A'}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-1">
                        [{c.institutionId?.code}]
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{c.department}</td>
                    <td className="py-3 px-3 font-bold text-slate-100">{c.credits}</td>
                    <td className="py-3 px-3 text-slate-400">{c.courseLevel}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
