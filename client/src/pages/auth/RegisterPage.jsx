import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  Hash,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    getDashboardRoute,
  } = useAuth();

  // ============================================================
  // ROLE
  // ============================================================

  const [activeTab, setActiveTab] = useState('student');

  // ============================================================
  // INSTITUTIONS
  // ============================================================

  const [institutions, setInstitutions] = useState([]);

  const [institutionsLoading, setInstitutionsLoading] =
    useState(false);

  // ============================================================
  // FORM
  // ============================================================

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',

    studentId: '',

    institutionId: '',
    institutionName: '',
    institutionCode: '',
  });

  // ============================================================
  // UI STATES
  // ============================================================

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  // ============================================================
  // LOAD VERIFIED INSTITUTIONS
  // ============================================================

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setInstitutionsLoading(true);
        setError('');

        const list = await authService.getInstitutions();
        setInstitutions(list || []);
      } catch (err) {
        console.error('Failed to load institutions:', err);

        setError(
          err.message ||
            'Unable to load institutions. Please try again.'
        );
      } finally {
        setInstitutionsLoading(false);
      }
    };

    fetchInstitutions();
  }, []);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // HANDLE INSTITUTION CHANGE
  // ============================================================

  const handleInstitutionChange = (e) => {
    const institutionId = e.target.value;

    const selectedInstitution =
      institutions.find(
        (institution) =>
          institution._id === institutionId
      );

    setFormData((previous) => ({
      ...previous,

      institutionId,

      institutionName:
        selectedInstitution?.name || '',

      institutionCode:
        selectedInstitution?.code || '',
    }));
  };

  // ============================================================
  // HANDLE ROLE CHANGE
  // ============================================================

  const handleStudentTab = () => {
    setActiveTab('student');

    setError('');
  };

  const handleInstitutionTab = () => {
    setActiveTab('institution');

    setError('');
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    // ----------------------------------------------------------
    // Student validation
    // ----------------------------------------------------------

    if (
      activeTab === 'student' &&
      !formData.institutionId
    ) {
      setError(
        'Please select your institution.'
      );

      return;
    }

    // ----------------------------------------------------------
    // Institution validation
    // ----------------------------------------------------------

    if (
      activeTab === 'institution' &&
      (!formData.institutionName ||
        !formData.institutionCode)
    ) {
      setError(
        'Institution name and institution code are required.'
      );

      return;
    }

    setLoading(true);

    try {
      // ========================================================
      // STUDENT PAYLOAD
      // ========================================================

      if (activeTab === 'student') {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,

          role: 'student',

          // Optional ABC ID
          ...(formData.studentId && {
            studentId: formData.studentId,
          }),

          // REQUIRED institution relationship
          institutionId: formData.institutionId,
        };

        const user = await register(payload);

        navigate(
          getDashboardRoute(user.role),
          {
            replace: true,
          }
        );

        return;
      }

      // ========================================================
      // INSTITUTION PAYLOAD
      // ========================================================

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,

        role: 'institution',

        institutionName:
          formData.institutionName,

        institutionCode:
          formData.institutionCode,
      };

      const user = await register(payload);

      navigate(
        getDashboardRoute(user.role),
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        'Registration failed:',
        err
      );

      setError(
        err.message ||
          'Registration failed. Please review your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">

        <Link
          to="/"
          className="inline-flex items-center space-x-3 group"
        >
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

      {/* ======================================================
          FORM CONTAINER
      ======================================================= */}

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">

        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 py-8 px-6 shadow-xl rounded-2xl sm:px-10">

          {/* ==================================================
              ROLE SWITCHER
          =================================================== */}

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl mb-6 border border-slate-700/60">

            {/* STUDENT */}

            <button
              type="button"
              onClick={handleStudentTab}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                activeTab === 'student'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >

              <BookOpen className="w-4 h-4" />

              <span>
                Student Account
              </span>

            </button>

            {/* INSTITUTION */}

            <button
              type="button"
              onClick={handleInstitutionTab}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                activeTab === 'institution'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >

              <Building2 className="w-4 h-4" />

              <span>
                Institution Node
              </span>

            </button>

          </div>

          {/* ==================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">

              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />

              <span>
                {error}
              </span>

            </div>
          )}

          {/* ==================================================
              FORM
          =================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* ==================================================
                NAME
            =================================================== */}

            <div>

              <label className="block text-xs font-semibold text-slate-300 mb-1.5">

                {activeTab === 'student'
                  ? 'Full Legal Name'
                  : 'Authorized Representative Name'}

              </label>

              <div className="relative">

                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">

                  <User className="w-4 h-4" />

                </div>

                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={
                    activeTab === 'student'
                      ? 'e.g. Gokul'
                      : 'e.g. Dr. S. K. Nair'
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />

              </div>

            </div>

            {/* ==================================================
                EMAIL
            =================================================== */}

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
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={
                    activeTab === 'student'
                      ? 'student@university.ac.in'
                      : 'dean@institution.ac.in'
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />

              </div>

            </div>

            {/* ==================================================
                PASSWORD
            =================================================== */}

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
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />

              </div>

            </div>

            {/* ==================================================
                STUDENT FIELDS
            =================================================== */}

            {activeTab === 'student' && (
              <>

                {/* INSTITUTION DROPDOWN */}

                <div>

                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">

                    Institution *

                  </label>

                  <div className="relative">

                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">

                      <Building className="w-4 h-4" />

                    </div>

                    <select
                      name="institutionId"
                      required
                      value={formData.institutionId}
                      onChange={handleInstitutionChange}
                      disabled={institutionsLoading}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
                    >

                      <option value="">

                        {institutionsLoading
                          ? 'Loading institutions...'
                          : 'Select your institution'}

                      </option>

                      {institutions.map(
                        (institution) => (
                          <option
                            key={institution._id}
                            value={institution._id}
                          >
                            {institution.name} (
                            {institution.code})
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {!institutionsLoading &&
                    institutions.length === 0 && (
                      <p className="mt-1 text-[10px] text-amber-400">

                        No verified institutions are currently available.

                      </p>
                    )}

                </div>

                {/* ABC ID */}

                <div>

                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">

                    Academic Bank of Credits (ABC ID / Roll No.)

                    <span className="text-slate-500 font-normal">
                      {' '}(Optional)
                    </span>

                  </label>

                  <div className="relative">

                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">

                      <Hash className="w-4 h-4" />

                    </div>

                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      placeholder="e.g. ABC-12345678"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />

                  </div>

                </div>

              </>
            )}

            {/* ==================================================
                INSTITUTION FIELDS
            =================================================== */}

            {activeTab === 'institution' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* INSTITUTION NAME */}

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
                      name="institutionName"
                      required
                      value={formData.institutionName}
                      onChange={handleInputChange}
                      placeholder="e.g. Bannari Amman Institute of Technology"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />

                  </div>

                </div>

                {/* INSTITUTION CODE */}

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
                      name="institutionCode"
                      required
                      value={formData.institutionCode}
                      onChange={handleInputChange}
                      placeholder="e.g. BITSATHY"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase transition"
                    />

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                SUBMIT
            =================================================== */}

            <button
              type="submit"
              disabled={
                loading ||
                (
                  activeTab === 'student' &&
                  (
                    institutionsLoading ||
                    institutions.length === 0
                  )
                )
              }
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
                  <span>
                    Create{' '}
                    {activeTab === 'student'
                      ? 'Student'
                      : 'Institution'}{' '}
                    Account
                  </span>

                  <ArrowRight className="w-4 h-4" />
                </>
              )}

            </button>

          </form>

          {/* ==================================================
              LOGIN LINK
          =================================================== */}

          <div className="mt-6 text-center">

            <p className="text-xs text-slate-400">

              Already registered?{' '}

              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Sign in here
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}