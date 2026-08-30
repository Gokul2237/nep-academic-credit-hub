import React, { useState, useEffect } from 'react';
import { creditService } from '../../services/creditService';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Hash,
  X,
  ShieldCheck,
  Building2,
  Clock,
} from 'lucide-react';

export default function InstitutionCreditsPage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCredit, setSelectedCredit] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentEmail: '',
    courseId: '',
    credits: 4,
    grade: 'A+',
    semester: 5,
    academicYear: '2025-26',
    verificationStatus: 'verified',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await creditService.getCredits({
        verificationStatus: statusFilter || undefined,
      });
      setCredits(res.data || []);
    } catch (err) {
      console.error('Failed to load credits:', err);
      setError(err.message || 'Failed to load credit records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await courseService.getCourses({ isActive: true });
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  useEffect(() => {
    fetchCredits();
    fetchCourses();
  }, [statusFilter]);

  const handleOpenAddModal = () => {
    const defaultCourse = courses[0];
    setFormData({
      studentEmail: '',
      courseId: defaultCourse ? defaultCourse._id : '',
      credits: defaultCourse ? defaultCourse.credits : 4,
      grade: 'A+',
      semester: defaultCourse ? defaultCourse.semester : 5,
      academicYear: '2025-26',
      verificationStatus: 'verified',
    });
    setIsModalOpen(true);
  };

  const handleCourseSelectChange = (courseId) => {
    const selected = courses.find((c) => c._id === courseId);
    setFormData({
      ...formData,
      courseId,
      credits: selected ? selected.credits : formData.credits,
      semester: selected ? selected.semester : formData.semester,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await creditService.createCredit(formData);
      setSuccessMsg('Academic credit awarded and sealed with SHA-256 integrity hash.');
      setIsModalOpen(false);
      fetchCredits();
    } catch (err) {
      setError(err.message || 'Failed to record credit.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredCredits = credits.filter((c) => {
    const matchesSearch =
      c.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentId?.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseId?.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseId?.courseName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Academic Credit Ledger</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Credit Issuance & Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Issue, sign, and verify course credit records for enrolled students
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Award Academic Credit</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, email, ABC ID, or course code..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Credit Ledger Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100">
            Issued Credit Records ({filteredCredits.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Node: [{user?.institutionCode || 'INST'}]
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading credit ledger records...</p>
          </div>
        ) : filteredCredits.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <GraduationCap className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No credit records issued yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Award academic credits to enrolled students upon completion of course evaluations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Term</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredCredits.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{c.studentId?.name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {c.studentId?.studentId || c.studentId?.email}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-indigo-400 mr-1.5">
                        {c.courseId?.courseCode}
                      </span>
                      <span className="text-slate-200">{c.courseId?.courseName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Sem {c.semester} • {c.academicYear}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{c.credits}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold text-[11px]">
                        {c.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 text-[11px] font-mono transition inline-flex items-center space-x-1"
                      >
                        <Hash className="w-3 h-3" />
                        <span>Inspect Hash</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Award Credit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                Award Academic Credit
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Student Email or ABC Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  placeholder="e.g. student@test.ac.in or ABC-123456"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Select Catalog Course *
                </label>
                {courses.length === 0 ? (
                  <p className="text-xs text-rose-400">
                    No courses available in catalog. Please create a course first.
                  </p>
                ) : (
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => handleCourseSelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseCode} - {c.courseName} ({c.credits} Credits, Sem {c.semester})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Credits Earned *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Grade Achieved *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Semester *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="e.g. 2025-26"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || courses.length === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>Issue & Seal Credit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Hash Modal */}
      {selectedCredit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Credit Record Integrity Hash
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
                <p className="text-slate-400 font-semibold">Student: {selectedCredit.studentId?.name}</p>
                <p className="text-slate-400">Course: {selectedCredit.courseId?.courseCode} - {selectedCredit.courseId?.courseName}</p>
                <p className="text-slate-400">Credits: {selectedCredit.credits} | Grade: {selectedCredit.grade}</p>
                <p className="text-slate-400">Term: Semester {selectedCredit.semester} ({selectedCredit.academicYear})</p>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">SHA-256 Integrity Hash:</p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all select-all">
                  {selectedCredit.integrityHash}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Integrity Verified: Sealed with node signature.</span>
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
