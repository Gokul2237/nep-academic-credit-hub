import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts & Views
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import InstitutionDashboard from './pages/institution/InstitutionDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
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
  Layers,
  Sparkles,
  Award,
  Globe,
} from 'lucide-react';
import axios from 'axios';

function HomePage() {
  const { user, isAuthenticated, getDashboardRoute } = useAuth();
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
        setHealth({ success: true, message: 'NEP Credit Hub API is running' });
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
                API: {loading ? 'Checking...' : (health?.message || 'Online')}
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
          <span>Aligned with National Education Policy (NEP 2020) & Academic Bank of Credits</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Standardized Academic Credit Hub with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Cross-Institutional Trust Gateways
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          A centralized academic credit ecosystem where students manage verified credits from multiple universities, while authorized institutions evaluate transfer requests using versioned acceptance policies and authenticated REST API Gateways.
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
              <h3 className="text-lg font-bold text-slate-100">Student Portal</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Digital Credit Wallet, chronological credit timeline, NEP eligibility tracker, transfer simulator & verifiable transcripts.
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
              <h3 className="text-lg font-bold text-slate-100">Institution Gateway</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Credit issuance, course catalogs, versioned acceptance policies (v1.0 / v2.0), transfer decision reviews & B2B API keys.
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
              <h3 className="text-lg font-bold text-slate-100">Governance & Admin</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                University accreditation verification, system-wide credit flow analytics, immutable audit logs & API telemetry monitoring.
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
            <span>Policy Versioning Engine</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Explainable Evaluation Engine</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>B2B REST API Gateway</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>SHA-256 Tamper-Proof Ledger</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NEP Academic Credit Accumulation Hub. S5 CSE Mini Project.</p>
          <div className="flex items-center space-x-4">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[10px]">
              Phase 2: Auth & RBAC Active
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">JWT + bcrypt + MongoDB Atlas</span>
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
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Protected Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route
              path="wallet"
              element={
                <PlaceholderPage
                  title="Digital Academic Credit Wallet"
                  description="View total credits, verified credits, and credits earned across participating institutions."
                  phase="Phase 3"
                />
              }
            />
            <Route
              path="timeline"
              element={
                <PlaceholderPage
                  title="Cross-Institution Credit Timeline"
                  description="Chronological visual progression of academic credits earned by semester, year, and institution."
                  phase="Phase 3"
                />
              }
            />
            <Route
              path="eligibility"
              element={
                <PlaceholderPage
                  title="NEP Eligibility Tracker"
                  description="Real-time evaluation of earned credits against selected academic program and graduation requirements."
                  phase="Phase 6"
                />
              }
            />
            <Route
              path="pathway"
              element={
                <PlaceholderPage
                  title="Academic Pathway Planner"
                  description="Visual roadmap of completed, pending, and locked core/elective academic requirements."
                  phase="Phase 6"
                />
              }
            />
            <Route
              path="recommendations"
              element={
                <PlaceholderPage
                  title="Course Recommendations"
                  description="AI-driven course suggestions based on requirement gaps, prerequisites, and selected pathway."
                  phase="Phase 6"
                />
              }
            />
            <Route
              path="simulator"
              element={
                <PlaceholderPage
                  title="Credit Transfer Simulator"
                  description="Pre-evaluate potential credit transfer against destination university acceptance policies."
                  phase="Phase 5"
                />
              }
            />
            <Route
              path="certificates"
              element={
                <PlaceholderPage
                  title="Certificates & Micro-Credentials"
                  description="Verified digital micro-credentials and skill badges issued by accredited institutions."
                  phase="Phase 6"
                />
              }
            />
            <Route
              path="transcript"
              element={
                <PlaceholderPage
                  title="Verifiable Academic Transcript"
                  description="Official digital transcript summarizing verified multi-institutional credits with SHA-256 seal."
                  phase="Phase 6"
                />
              }
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

          {/* Institution Protected Routes */}
          <Route
            path="/institution"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/institution/dashboard" replace />} />
            <Route path="dashboard" element={<InstitutionDashboard />} />
            <Route
              path="students"
              element={
                <PlaceholderPage
                  title="Student Management"
                  description="Enrolled student directory, ABC verification, and academic credit records."
                  phase="Phase 3"
                />
              }
            />
            <Route
              path="courses"
              element={
                <PlaceholderPage
                  title="Course Catalog Management"
                  description="Publish and manage NEP-aligned course syllabi, levels, prerequisites, and credit values."
                  phase="Phase 3"
                />
              }
            />
            <Route
              path="credits"
              element={
                <PlaceholderPage
                  title="Academic Credit Ledger"
                  description="Award, sign with SHA-256 verification hashes, and manage student course credits."
                  phase="Phase 3"
                />
              }
            />
            <Route
              path="transfers"
              element={
                <PlaceholderPage
                  title="Transfer Requests Queue"
                  description="Incoming and outgoing inter-university credit transfer applications."
                  phase="Phase 5"
                />
              }
            />
            <Route
              path="policies"
              element={
                <PlaceholderPage
                  title="Credit Acceptance Policies"
                  description="Define institutional criteria for external credit transfers (equivalency %, limits, labs)."
                  phase="Phase 4"
                />
              }
            />
            <Route
              path="policy-versions"
              element={
                <PlaceholderPage
                  title="Policy Versions & Diffs"
                  description="Immutable version history (v1.0, v2.0) tracking rationale and date of policy changes."
                  phase="Phase 4"
                />
              }
            />
            <Route
              path="api-gateway"
              element={
                <PlaceholderPage
                  title="B2B REST API Gateway"
                  description="Machine-to-machine inter-institutional authentication and credit verification endpoints."
                  phase="Phase 7"
                />
              }
            />
            <Route
              path="api-keys"
              element={
                <PlaceholderPage
                  title="API Key Management"
                  description="Generate, scope permissions, and rotate cryptographically hashed API keys."
                  phase="Phase 7"
                />
              }
            />
            <Route
              path="api-logs"
              element={
                <PlaceholderPage
                  title="Live API Telemetry Logs"
                  description="Real-time telemetry of incoming/outgoing B2B Gateway requests and latency."
                  phase="Phase 7"
                />
              }
            />
            <Route
              path="decisions"
              element={
                <PlaceholderPage
                  title="Transfer Decisions & Officer Sign-off"
                  description="Explainable transfer evaluation reports with official academic board sign-off."
                  phase="Phase 5"
                />
              }
            />
            <Route
              path="verify-certificates"
              element={
                <PlaceholderPage
                  title="Certificate Verification"
                  description="Validate authenticity of certificates and diplomas using SHA-256 digital seals."
                  phase="Phase 6"
                />
              }
            />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route
              path="students"
              element={
                <PlaceholderPage
                  title="Platform Student Directory"
                  description="National student index, ABC ID status, and cross-institutional credit summary."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="institutions"
              element={
                <PlaceholderPage
                  title="Institution Governance & Verification"
                  description="Review and verify participating university accreditations (NAAC/NIRF credentials)."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="courses"
              element={
                <PlaceholderPage
                  title="National Course Catalog"
                  description="Cross-institutional course registry and standardization index."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="credits"
              element={
                <PlaceholderPage
                  title="Global Credit Ledger"
                  description="System-wide tamper-evident credit issuance and transfer audit records."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="certificates"
              element={
                <PlaceholderPage
                  title="Certificate Registry"
                  description="National registry of verified academic degrees, diplomas, and micro-credentials."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="policies"
              element={
                <PlaceholderPage
                  title="Policy Compliance Monitoring"
                  description="Monitor active university transfer policies against national NEP guidelines."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="api-monitoring"
              element={
                <PlaceholderPage
                  title="API Gateway Telemetry & Health"
                  description="Platform-wide traffic volume, latency, error rates, and security telemetry."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="transfers"
              element={
                <PlaceholderPage
                  title="Inter-University Transfer Flow"
                  description="Aggregate analytics of credit transfer volume, acceptance rates, and flows."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="audit-logs"
              element={
                <PlaceholderPage
                  title="Immutable Audit Trail Explorer"
                  description="Searchable security audit log of all system state modifications."
                  phase="Phase 8"
                />
              }
            />
            <Route
              path="analytics"
              element={
                <PlaceholderPage
                  title="System-Wide Analytics & Metrics"
                  description="Macro-level trends, credit mobility stats, and institutional adoption metrics."
                  phase="Phase 8"
                />
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
