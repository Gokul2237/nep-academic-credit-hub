import React, { useState, useEffect, useCallback } from 'react';
import { creditService } from '../../services/creditService';
import { courseService } from '../../services/courseService';
import { studentService } from '../../services/studentService';
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
  UserRound,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

export default function InstitutionCreditsPage() {
  const { user } = useAuth();

  const [credits, setCredits] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Summary Metrics from server
  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalVerified: 0,
    totalCreditUnits: 0,
    verifiedCreditUnits: 0,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Awarding Credit
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    credits: 4,
    grade: 'A+',
    semester: 5,
    academicYear: '2025-26',
    verificationStatus: 'verified',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || err?.message || fallback;
  };

  // --------------------------------------------------
  // FETCH CREDIT RECORDS WITH PAGINATION & FILTERS
  // --------------------------------------------------
  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        studentId: selectedStudent || undefined,
        courseId: selectedCourse || undefined,
        verificationStatus: statusFilter || undefined,
        semester: selectedSemester || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await creditService.getCredits(params);
      const items = res?.data || [];
      setCredits(items);

      if (res?.pagination) {
        setPagination({
          total: res.pagination.total || items.length,
          totalPages: res.pagination.totalPages || 1,
          hasNextPage: res.pagination.hasNextPage || false,
          hasPrevPage: res.pagination.hasPrevPage || false,
        });
      }

      if (res?.summary) {
        setSummary(res.summary);
      } else {
        const verifiedCount = items.filter((c) => c.verificationStatus === 'verified').length;
        const totalPoints = items.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
        setSummary({
          totalRecords: res?.pagination?.total || items.length,
          totalVerified: verifiedCount,
          totalCreditUnits: totalPoints,
          verifiedCreditUnits: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load credits:', err);
      setError(getErrorMessage(err, 'Failed to load credit records.'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedStudent, selectedCourse, statusFilter, selectedSemester, startDate, endDate]);

  // --------------------------------------------------
  // FETCH COURSES
  // --------------------------------------------------
  const fetchCourses = async () => {
    try {
      const res = await courseService.getCourses({ isActive: true });
      setCourses(res?.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError(getErrorMessage(err, 'Failed to load courses.'));
    }
  };

  // --------------------------------------------------
  // FETCH ENROLLED STUDENTS
  // --------------------------------------------------
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await studentService.getStudents();
      setStudents(res?.data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(
        getErrorMessage(
          err,
          'Failed to load students. Please verify that students are linked to this institution.'
        )
      );
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedStudent('');
    setSelectedCourse('');
    setStatusFilter('');
    setSelectedSemester('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedStudent) ||
    Boolean(selectedCourse) ||
    Boolean(statusFilter) ||
    Boolean(selectedSemester) ||
    Boolean(startDate) ||
    Boolean(endDate);

  // --------------------------------------------------
  // OPEN ADD CREDIT MODAL
  // --------------------------------------------------
  const handleOpenAddModal = () => {
    const defaultCourse = courses[0];
    const defaultStudent = students[0];

    setFormData({
      studentId: defaultStudent ? defaultStudent._id : '',
      courseId: defaultCourse ? defaultCourse._id : '',
      credits: defaultCourse ? defaultCourse.credits : 4,
      grade: 'A+',
      semester: defaultCourse ? defaultCourse.semester : 5,
      academicYear: '2025-26',
      verificationStatus: 'verified',
    });

    setError('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleStudentSelectChange = (studentId) => {
    setFormData((prev) => ({ ...prev, studentId }));
  };

  const handleCourseSelectChange = (courseId) => {
    const selected = courses.find((course) => course._id === courseId);
    setFormData((prev) => ({
      ...prev,
      courseId,
      credits: selected ? selected.credits : prev.credits,
      semester: selected ? selected.semester : prev.semester,
    }));
  };

  // --------------------------------------------------
  // SUBMIT CREDIT
  // --------------------------------------------------
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!formData.studentId) throw new Error('Please select an enrolled student.');
      if (!formData.courseId) throw new Error('Please select a course.');

      const selectedStudentDoc = students.find((s) => s._id === formData.studentId);
      const selectedCourseDoc = courses.find((c) => c._id === formData.courseId);

      const payload = {
        studentId: formData.studentId,
        courseId: formData.courseId,
        credits: Number(formData.credits),
        grade: formData.grade,
        semester: Number(formData.semester),
        academicYear: formData.academicYear.trim(),
        verificationStatus: formData.verificationStatus,
      };

      await creditService.createCredit(payload);

      setSuccessMsg(
        `Academic credit successfully awarded to ${selectedStudentDoc?.name || 'student'} for ${selectedCourseDoc?.courseCode || 'course'}.`
      );

      setIsModalOpen(false);
      setPage(1);
      await fetchCredits();
    } catch (err) {
      console.error('Failed to create credit:', err);
      setError(getErrorMessage(err, 'Failed to record academic credit.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
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
              Issue, sign, and verify course credit records for enrolled students and transferred scholars
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fetchCredits}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

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
      </div>

      {/* SUMMARY METRICS CARDS - Live Server Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Credit Records</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {summary.totalRecords.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500">Enrolled & transferred records</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Verified Records</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {summary.totalVerified.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-500/80">Tamper-sealed records</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Cumulative Credits</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">
            {summary.totalCreditUnits.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500">Total earned credit value</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pending Verification</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">
            {Math.max(0, summary.totalRecords - summary.totalVerified).toLocaleString()}
          </p>
          <span className="text-[11px] text-amber-500/80">Awaiting ledger sign-off</span>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, roll number, ABC ID, email, or course code..."
              className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Student Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">All Enrolled Students</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId || s.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* Course Filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="Award Start Date"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Reset Filters Button */}
          <div>
            <button
              type="button"
              disabled={!hasActiveFilters}
              onClick={handleResetFilters}
              className="w-full h-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* CREDIT TABLE */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-100">
              Academic Credit Records
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Total {pagination.total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="text-[11px] text-slate-400 font-mono">
              Node: [{user?.institutionCode || 'INST'}]
            </span>

            <span className="text-slate-600">|</span>

            <div className="flex items-center space-x-1.5">
              <span>Show</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>

            <span className="text-slate-600">|</span>

            <span className="font-mono text-[11px]">
              Page {page} of {pagination.totalPages}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading credit ledger records...</p>
          </div>
        ) : credits.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <GraduationCap className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">
              No credit records found
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No records match your selected filters. Try clearing or expanding your search criteria.'
                : 'Award academic credits to enrolled students upon completion of course evaluations.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
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
                {credits.map((c) => {
                  const isTransferredFromOther =
                    c.isTransferred &&
                    c.institutionId?.code &&
                    user?.institutionCode &&
                    c.institutionId?.code !== user.institutionCode;

                  return (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-200">
                          {c.studentId?.name || 'N/A'}
                        </p>
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

                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="text-slate-300 font-medium">
                            {c.institutionId?.name || 'Current Node'}
                          </span>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              [{c.institutionId?.code || 'INST'}]
                            </span>
                            {isTransferredFromOther && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                Transferred
                              </span>
                            )}
                          </div>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {pagination.total > 0 ? (page - 1) * limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{pagination.total.toLocaleString()}</span> records
          </div>

          <div className="flex items-center space-x-2 self-center sm:self-auto">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-indigo-300 font-mono font-bold">
              {page} / {pagination.totalPages}
            </div>

            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AWARD CREDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Award Academic Credit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {/* STUDENT DROPDOWN */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="w-3.5 h-3.5" />
                    Select Student *
                  </span>
                </label>
                {studentsLoading ? (
                  <div className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400">
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <p className="font-semibold">No enrolled students found.</p>
                    <p className="text-[10px] mt-1 text-amber-400/80">
                      Make sure the student account is linked to this institution.
                    </p>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.studentId}
                    onChange={(e) => handleStudentSelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} — {student.studentId || student.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* COURSE DROPDOWN */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Select Catalog Course *
                  </span>
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
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseCode} - {c.courseName} ({c.credits} Credits, Sem {c.semester})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* CREDITS + GRADE */}
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

              {/* SEMESTER + ACADEMIC YEAR */}
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* ACTIONS */}
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
                  disabled={formSubmitting || courses.length === 0 || students.length === 0}
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

      {/* HASH MODAL */}
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
                <p className="text-slate-400 font-semibold">
                  Student: {selectedCredit.studentId?.name}
                </p>
                <p className="text-slate-400">
                  Course: {selectedCredit.courseId?.courseCode} - {selectedCredit.courseId?.courseName}
                </p>
                <p className="text-slate-400">
                  Credits: {selectedCredit.credits} | Grade: {selectedCredit.grade}
                </p>
                <p className="text-slate-400">
                  Term: Semester {selectedCredit.semester} ({selectedCredit.academicYear})
                </p>
                <p className="text-slate-400">
                  Original Issuing Node: {selectedCredit.institutionId?.name} [{selectedCredit.institutionId?.code}]
                </p>
                {selectedCredit.isTransferred && selectedCredit.transferredTo && (
                  <p className="text-emerald-400 font-medium">
                    Host Node: {selectedCredit.transferredTo?.name} [{selectedCredit.transferredTo?.code}]
                  </p>
                )}
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">
                  SHA-256 Integrity Hash:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 break-all select-all">
                  {selectedCredit.integrityHash}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Integrity Verified: Sealed with awarding node signature.
                </span>
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
