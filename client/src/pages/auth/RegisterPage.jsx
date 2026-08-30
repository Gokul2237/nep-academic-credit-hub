import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User, Mail, Lock, Building, Hash, AlertCircle, ArrowRight, BookOpen, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, getDashboardRoute } = useAuth();

  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'institution'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    institutionName: '',
    institutionCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: activeTab,
        ...(activeTab === 'student' && { studentId: formData.studentId || undefined }),
        ...(activeTab === 'institution' && {
          institutionName: formData.institutionName,
          institutionCode: formData.institutionCode,
        }),
      };

      const user = await register(payload);
      navigate(getDashboardRoute(user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-100">
          Create an Account
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Join the NEP 2020 Standardized Academic Credit Accumulation Hub
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError(''); }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Student Account</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('institution'); setError(''); }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                activeTab === 'institution'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Institution Node</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'student' ? 'Full Legal Name' : 'Authorized Representative Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={activeTab === 'student' ? 'e.g. Rahul Sharma' : 'e.g. Dr. S. K. Nair'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={activeTab === 'student' ? 'student@university.ac.in' : 'dean@institution.ac.in'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Student Specific Fields */}
            {activeTab === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Academic Bank of Credits (ABC ID / Roll No.) <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="e.g. ABC-12345678"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            {/* Institution Specific Fields */}
            {activeTab === 'institution' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Institution Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      placeholder="e.g. NIT Karnataka"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Institution Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.institutionCode}
                      onChange={(e) => setFormData({ ...formData, institutionCode: e.target.value })}
                      placeholder="e.g. NITK"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase transition"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 ${
                activeTab === 'student'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create {activeTab === 'student' ? 'Student' : 'Institution'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
