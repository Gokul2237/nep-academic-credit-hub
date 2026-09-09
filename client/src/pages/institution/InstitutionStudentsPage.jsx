import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/studentService';
import {
  Users,
  Search,
  UserCheck,
  Building2,
  Mail,
  Award,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function InstitutionStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studentService.getStudents();
      setStudents(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch student directory.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Enrolled Student Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {user?.institutionName || 'Institution'} Students
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Directory of enrolled students affiliated with your institution node. Use this directory when awarding academic credits.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-bold">
          {students.length} Enrolled Students
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by name, email, or ABC ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Students Directory Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No student records found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search query.' : 'No students are currently linked to this institution.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">ABC ID / Roll No</th>
                  <th className="px-4 py-3">Official Email</th>
                  <th className="px-4 py-3">Affiliated Institution</th>
                  <th className="px-4 py-3">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-semibold text-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div>{student.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">Active Student</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-400">
                      {student.studentId || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {student.email}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="font-medium">{student.institutionName || user?.institutionName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{student.institutionCode || user?.institutionCode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
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
