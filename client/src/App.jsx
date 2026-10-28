
import React, { useState, useEffect, lazy, Suspense } from 'react';
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

// Public Views
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const PublicTranscriptVerificationPage = lazy(() => import('./pages/public/PublicTranscriptVerificationPage'));
const PublicCertificateVerificationPage = lazy(() => import('./pages/public/PublicCertificateVerificationPage'));

// Student Views
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentWalletPage = lazy(() => import('./pages/student/StudentWalletPage'));
const StudentTimelinePage = lazy(() => import('./pages/student/StudentTimelinePage'));
const StudentTransferPage = lazy(() => import('./pages/student/StudentTransferPage'));
const StudentPassportPage = lazy(() => import('./pages/student/StudentPassportPage'));
const StudentTranscriptPage = lazy(() => import('./pages/student/StudentTranscriptPage'));
const StudentCertificatesPage = lazy(() => import('./pages/student/StudentCertificatesPage'));
const StudentEligibilityPage = lazy(() => import('./pages/student/StudentEligibilityPage'));
const StudentPathwayPage = lazy(() => import('./pages/student/StudentPathwayPage'));
const StudentRoadmapPage = lazy(() => import('./pages/student/StudentRoadmapPage'));
const StudentRecommendationsPage = lazy(() => import('./pages/student/StudentRecommendationsPage'));
const StudentSimulatorPage = lazy(() => import('./pages/student/StudentSimulatorPage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));

// Institution Views
const InstitutionDashboard = lazy(() => import('./pages/institution/InstitutionDashboard'));
const InstitutionCoursesPage = lazy(() => import('./pages/institution/InstitutionCoursesPage'));
const InstitutionCreditsPage = lazy(() => import('./pages/institution/InstitutionCreditsPage'));
const InstitutionStudentsPage = lazy(() => import('./pages/institution/InstitutionStudentsPage'));
const InstitutionTransfersPage = lazy(() => import('./pages/institution/InstitutionTransfersPage'));
const InstitutionCertificatesPage = lazy(() => import('./pages/institution/InstitutionCertificatesPage'));
const InstitutionApiGatewayPage = lazy(() => import('./pages/institution/InstitutionApiGatewayPage'));
const InstitutionApiKeysPage = lazy(() => import('./pages/institution/InstitutionApiKeysPage'));
const InstitutionApiLogsPage = lazy(() => import('./pages/institution/InstitutionApiLogsPage'));
const InstitutionPoliciesPage = lazy(() => import('./pages/institution/InstitutionPoliciesPage'));
const InstitutionResultsImportPage = lazy(() => import('./pages/institution/InstitutionResultsImportPage'));

// Admin Views
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminCreditsPage = lazy(() => import('./pages/admin/AdminCreditsPage'));
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage'));
const AdminTransfersPage = lazy(() => import('./pages/admin/AdminTransfersPage'));
const AdminCertificatesPage = lazy(() => import('./pages/admin/AdminCertificatesPage'));
const AdminInstitutionsPage = lazy(() => import('./pages/admin/AdminInstitutionsPage'));
const AdminApiMonitoringPage = lazy(() => import('./pages/admin/AdminApiMonitoringPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/admin/AdminAuditLogsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));

// Loading Fallback Component
function PageLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs text-slate-400 font-medium">Loading view...</p>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-blue-600/30 selection:text-blue-200">

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>

            <div>
              <span className="font-bold text-base tracking-tight text-slate-100 block leading-tight">
                NEP Academic Credit Hub
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                National Academic Bank of Credits Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex-1 flex flex-col justify-center items-center text-center">

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-medium mb-6 backdrop-blur-sm shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>
            Aligned with National Education Policy (NEP 2020) & Academic Bank of Credits
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] text-slate-100">
          Standardized Academic Credit Hub with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Cross-Institutional Mobility
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          A centralized academic credit ecosystem where students accumulate and transfer verified course credits across universities, while authorized institutions evaluate equivalency and manage credentials under the NEP 2020 framework.
        </p>

        {/* 3 User Role Card Previews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl text-left">

          {/* Student Card */}
          <Link
            to="/login"
            className="group flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 transition duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition duration-200">
                <BookOpen className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Student Portal
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Digital Credit Wallet, chronological credit timeline, NEP multi-exit eligibility tracker, transfer simulator, and verifiable transcripts.
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs text-blue-400 font-semibold">
              <span>Sign in as Student</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition duration-200" />
            </div>
          </Link>

          {/* Institution Card */}
          <Link
            to="/login"
            className="group flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition duration-200">
                <Building2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Institution Gateway
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Course catalog management, student credit awards, inter-university transfer evaluation, credential verification, and authenticated B2B APIs.
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs text-indigo-400 font-semibold">
              <span>Sign in as Institution</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition duration-200" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            to="/login"
            className="group flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition duration-300"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition duration-200">
                <Key className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Governance & Admin
              </h3>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Accreditation node management, nationwide credit flow oversight, immutable system audit logs, and platform telemetry monitoring.
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs text-purple-400 font-semibold">
              <span>Sign in as Superadmin</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition duration-200" />
            </div>
          </Link>

        </div>

        {/* Feature Badges */}
        <div className="mt-14 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Digital Credit Wallet & ABC Ledger</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SHA-256 Tamper-Proof Cryptographic Seals</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Inter-University Credit Transfer Mobility</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Role-Based Access Control</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NEP Academic Credit Hub. All rights reserved.</p>
          <div className="flex items-center space-x-3 text-slate-500 text-xs">
            <span>National Academic Bank of Credits Platform</span>
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

        <Suspense fallback={<PageLoadingFallback />}>

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

            {/* Public Verification Routes */}
            <Route
              path="/verify/transcript/:code"
              element={<PublicTranscriptVerificationPage />}
            />

            <Route
              path="/verify/certificate/:id"
              element={<PublicCertificateVerificationPage />}
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
              element={<Navigate to="/student/dashboard" replace />}
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
              path="roadmap"
              element={<Navigate to="/student/dashboard" replace />}
            />

            <Route
              path="readiness-roadmap"
              element={<Navigate to="/student/dashboard" replace />}
            />

            <Route
              path="recommendations"
              element={<StudentRecommendationsPage />}
            />

            <Route
              path="simulator"
              element={<Navigate to="/student/dashboard" replace />}
            />

            <Route
              path="certificates"
              element={<StudentCertificatesPage />}
            />

            <Route
              path="profile"
              element={<StudentProfilePage />}
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
              path="results-import"
              element={<InstitutionResultsImportPage />}
            />

            <Route
              path="results"
              element={<InstitutionResultsImportPage />}
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
              element={<InstitutionApiKeysPage />}
            />

            <Route
              path="api-logs"
              element={<InstitutionApiLogsPage />}
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

        </Suspense>

      </BrowserRouter>

    </AuthProvider>
  );
}
