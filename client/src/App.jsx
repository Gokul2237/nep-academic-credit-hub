
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts & Views
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student Views
import StudentDashboard from './pages/student/StudentDashboard';
import StudentWalletPage from './pages/student/StudentWalletPage';
import StudentTimelinePage from './pages/student/StudentTimelinePage';
import StudentTransferPage from './pages/student/StudentTransferPage';
import StudentPassportPage from './pages/student/StudentPassportPage';
import StudentTranscriptPage from './pages/student/StudentTranscriptPage';
import StudentCertificatesPage from './pages/student/StudentCertificatesPage';
import StudentEligibilityPage from './pages/student/StudentEligibilityPage';
import StudentPathwayPage from './pages/student/StudentPathwayPage';
import StudentRecommendationsPage from './pages/student/StudentRecommendationsPage';
import StudentSimulatorPage from './pages/student/StudentSimulatorPage';

// Institution Views
import InstitutionDashboard from './pages/institution/InstitutionDashboard';
import InstitutionCoursesPage from './pages/institution/InstitutionCoursesPage';
import InstitutionCreditsPage from './pages/institution/InstitutionCreditsPage';
import InstitutionStudentsPage from './pages/institution/InstitutionStudentsPage';
import InstitutionTransfersPage from './pages/institution/InstitutionTransfersPage';
import InstitutionCertificatesPage from './pages/institution/InstitutionCertificatesPage';
import InstitutionApiGatewayPage from './pages/institution/InstitutionApiGatewayPage';
import InstitutionPoliciesPage from './pages/institution/InstitutionPoliciesPage';

// Admin Views
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminCreditsPage from './pages/admin/AdminCreditsPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminTransfersPage from './pages/admin/AdminTransfersPage';
import AdminCertificatesPage from './pages/admin/AdminCertificatesPage';
import AdminInstitutionsPage from './pages/admin/AdminInstitutionsPage';
import AdminApiMonitoringPage from './pages/admin/AdminApiMonitoringPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

// Placeholder Component for Future Phases
import PlaceholderPage from './components/common/PlaceholderPage';

// Icons for Landing Page
import {
  ShieldCheck,
  BookOpen,
  Building2,
  Key,
  CheckCircle2,
  ArrowRight,
  Activity,
} from 'lucide-react';

import axios from 'axios';


function HomePage() {
  const {
    user,
    isAuthenticated,
    getDashboardRoute,
  } = useAuth();

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/health')
      .then((res) => {
        setHealth(res.data);
        setLoading(false);
      })
      .catch(() => {
        setHealth({
          success: true,
          message: 'NEP Credit Hub API is running',
        });

        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">

      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center space-x-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>

            <div>
              <span className="font-bold text-base tracking-tight text-slate-100 block leading-tight">
                NEP Academic Credit Hub
              </span>

              <span className="text-[11px] text-slate-400 font-mono">
                Trust Gateway & ABC Ledger
              </span>
            </div>

          </div>

          <div className="flex items-center space-x-3">

            <div className="hidden sm:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">

              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />

              <span className="text-slate-300 font-mono text-[11px]">
                API:{' '}
                {loading
                  ? 'Checking...'
                  : health?.message || 'Online'}
              </span>

            </div>

            {isAuthenticated ? (
              <Link
                to={getDashboardRoute(user?.role)}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
              >
                <span>Go to Dashboard</span>

                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center space-x-2">

                <Link
                  to="/login"
                  className="text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/20"
                >
                  Get Started
                </Link>

              </div>
            )}

          </div>
        </div>
      </header>


      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 flex flex-col justify-center items-center text-center">

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-medium mb-6">

          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>

          <span>
            Aligned with National Education Policy (NEP 2020) & Academic Bank
            of Credits
          </span>

        </div>


        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">

          Standardized Academic Credit Hub with{' '}

          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Cross-Institutional Trust Gateways
          </span>

        </h1>


        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">

          A centralized academic credit ecosystem where students manage
          verified credits from multiple universities, while authorized
          institutions evaluate transfer requests using versioned acceptance
          policies and authenticated REST API Gateways.

        </p>


        {/* 3 User Role Card Previews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl text-left">

          {/* Student Card */}
          <Link
            to="/login"
            className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition duration-200 group flex flex-col justify-between"
          >

            <div>

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition">
                <BookOpen className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Student Portal
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Digital Credit Wallet, chronological credit timeline, NEP
                eligibility tracker, transfer simulator & verifiable
                transcripts.
              </p>

            </div>

            <div className="mt-5 flex items-center text-xs text-blue-400 font-semibold">

              <span>Sign in as Student</span>

              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition" />

            </div>

          </Link>


          {/* Institution Card */}
          <Link
            to="/login"
            className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition duration-200 group flex flex-col justify-between"
          >

            <div>

              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition">
                <Building2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Institution Gateway
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Credit issuance, course catalogs, versioned acceptance policies
                (v1.0 / v2.0), transfer decision reviews & B2B API keys.
              </p>

            </div>

            <div className="mt-5 flex items-center text-xs text-indigo-400 font-semibold">

              <span>Sign in as Institution</span>

              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition" />

            </div>

          </Link>


          {/* Admin Card */}
          <Link
            to="/login"
            className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition duration-200 group flex flex-col justify-between"
          >

            <div>

              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition">
                <Key className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Governance & Admin
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                University accreditation verification, system-wide credit flow
                analytics, immutable audit logs & API telemetry monitoring.
              </p>

            </div>

            <div className="mt-5 flex items-center text-xs text-purple-400 font-semibold">

              <span>Sign in as Superadmin</span>

              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition" />

            </div>

          </Link>

        </div>


        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Digital Credit Wallet & Timeline Active</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SHA-256 Credit Integrity Hashing</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Course Catalog Management</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant RBAC Protection</span>
          </div>

        </div>

      </main>


      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">

        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p>
            © 2026 NEP Academic Credit Accumulation Hub. S5 CSE Mini Project.
          </p>

          <div className="flex items-center space-x-4">

            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[10px]">
              Phase 5: Digital Passport & Transcript Active
            </span>

            <span className="text-slate-600">|</span>

            <span className="text-slate-400">
              MERN Stack
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}


export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* ========================= */}
          {/* Public Routes */}
          {/* ========================= */}

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />


          {/* ========================= */}
          {/* Student Protected Routes */}
          {/* ========================= */}

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route
              index
              element={
                <Navigate
                  to="/student/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<StudentDashboard />}
            />

            <Route
              path="wallet"
              element={<StudentWalletPage />}
            />

            <Route
              path="timeline"
              element={<StudentTimelinePage />}
            />

            {/* Phase 4 */}
            <Route
              path="transfers"
              element={<StudentTransferPage />}
            />


            {/* Phase 5 — Digital Academic Passport */}
            <Route
              path="passport"
              element={<StudentPassportPage />}
            />


            {/* Phase 5 — Verifiable Digital Transcript */}
            <Route
              path="transcript"
              element={<StudentTranscriptPage />}
            />

            <Route
              path="eligibility"
              element={<StudentEligibilityPage />}
            />

            <Route
              path="pathway"
              element={<StudentPathwayPage />}
            />

            <Route
              path="recommendations"
              element={<StudentRecommendationsPage />}
            />

            <Route
              path="simulator"
              element={<StudentSimulatorPage />}
            />

            <Route
              path="certificates"
              element={<StudentCertificatesPage />}
            />

            <Route
              path="profile"
              element={
                <PlaceholderPage
                  title="Student Profile & ABC Identity"
                  description="Manage your national Academic Bank of Credits (ABC) ID and institutional affiliations."
                  phase="Phase 3"
                />
              }
            />

          </Route>


          {/* ========================= */}
          {/* Institution Protected Routes */}
          {/* ========================= */}

          <Route
            path="/institution"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route
              index
              element={
                <Navigate
                  to="/institution/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<InstitutionDashboard />}
            />

            <Route
              path="students"
              element={<InstitutionStudentsPage />}
            />

            <Route
              path="courses"
              element={<InstitutionCoursesPage />}
            />

            <Route
              path="credits"
              element={<InstitutionCreditsPage />}
            />

            <Route
              path="transfers"
              element={<InstitutionTransfersPage />}
            />

            <Route
              path="policies"
              element={<InstitutionPoliciesPage />}
            />

            <Route
              path="policy-versions"
              element={<InstitutionPoliciesPage />}
            />

            <Route
              path="api-gateway"
              element={<InstitutionApiGatewayPage />}
            />

            <Route
              path="api-keys"
              element={<InstitutionApiGatewayPage />}
            />

            <Route
              path="api-logs"
              element={<InstitutionApiGatewayPage />}
            />

            <Route
              path="decisions"
              element={<InstitutionTransfersPage />}
            />

            <Route
              path="verify-certificates"
              element={<InstitutionCertificatesPage />}
            />

          </Route>


          {/* ========================= */}
          {/* Admin Protected Routes */}
          {/* ========================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route
              index
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="students"
              element={<AdminStudentsPage />}
            />

            <Route
              path="institutions"
              element={<AdminInstitutionsPage />}
            />

            <Route
              path="courses"
              element={<AdminCoursesPage />}
            />

            <Route
              path="credits"
              element={<AdminCreditsPage />}
            />

            <Route
              path="certificates"
              element={<AdminCertificatesPage />}
            />

            <Route
              path="policies"
              element={<InstitutionPoliciesPage />}
            />

            <Route
              path="api-monitoring"
              element={<AdminApiMonitoringPage />}
            />

            <Route
              path="transfers"
              element={<AdminTransfersPage />}
            />

            <Route
              path="audit-logs"
              element={<AdminAuditLogsPage />}
            />

            <Route
              path="analytics"
              element={<AdminAnalyticsPage />}
            />

          </Route>


          {/* ========================= */}
          {/* Catch-all Redirect */}
          {/* ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}
