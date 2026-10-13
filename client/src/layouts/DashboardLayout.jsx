import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate clean, user-friendly breadcrumbs from current pathname
  const getBreadcrumbs = (pathname) => {
    const adminMap = {
      '/admin': ['Dashboard'],
      '/admin/dashboard': ['Dashboard'],
      '/admin/students': ['Dashboard', 'Student Management'],
      '/admin/institutions': ['Dashboard', 'Institution Management'],
      '/admin/courses': ['Dashboard', 'Course Catalog'],
      '/admin/credits': ['Dashboard', 'Credit Ledger'],
      '/admin/certificates': ['Dashboard', 'Certificates'],
      '/admin/policies': ['Dashboard', 'Policy Monitoring'],
      '/admin/api-monitoring': ['Dashboard', 'API Monitoring'],
      '/admin/transfers': ['Dashboard', 'Transfer Flow'],
      '/admin/audit-logs': ['Dashboard', 'Platform Audit Logs'],
      '/admin/analytics': ['Dashboard', 'System Analytics'],
    };

    const institutionMap = {
      '/institution': ['Dashboard'],
      '/institution/dashboard': ['Dashboard'],
      '/institution/courses': ['Dashboard', 'Course Catalog'],
      '/institution/credits': ['Dashboard', 'Credit Management'],
      '/institution/students': ['Dashboard', 'Student Directory'],
      '/institution/transfers': ['Dashboard', 'Transfer Evaluation'],
      '/institution/certificates': ['Dashboard', 'Certificate Issuance'],
      '/institution/verify-certificates': ['Dashboard', 'Certificates & Verification'],
      '/institution/policies': ['Dashboard', 'Credit Policies'],
      '/institution/policy-versions': ['Dashboard', 'Credit Policies', 'Version History'],
      '/institution/api-gateway': ['Dashboard', 'API Gateway'],
      '/institution/api-keys': ['Dashboard', 'API Keys'],
      '/institution/api-logs': ['Dashboard', 'API Logs'],
      '/institution/decisions': ['Dashboard', 'Transfer Decisions'],
    };

    const studentMap = {
      '/student': ['Dashboard'],
      '/student/dashboard': ['Dashboard'],
      '/student/wallet': ['Dashboard', 'Credit Wallet'],
      '/student/timeline': ['Dashboard', 'Academic Timeline'],
      '/student/transfer': ['Dashboard', 'Credit Transfers'],
      '/student/passport': ['Dashboard', 'Academic Passport'],
      '/student/transcript': ['Dashboard', 'Official Transcript'],
      '/student/certificates': ['Dashboard', 'Earned Certificates'],
      '/student/eligibility': ['Dashboard', 'Degree Eligibility'],
      '/student/pathway': ['Dashboard', 'Academic Pathway'],
      '/student/recommendations': ['Dashboard', 'Course Recommendations'],
      '/student/simulator': ['Dashboard', 'Credit Simulator'],
      '/student/profile': ['Dashboard', 'Student Profile'],
    };

    if (adminMap[pathname]) return adminMap[pathname];
    if (institutionMap[pathname]) return institutionMap[pathname];
    if (studentMap[pathname]) return studentMap[pathname];

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return ['Dashboard'];
    return [
      'Dashboard',
      ...parts.slice(1).map((p) =>
        p
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      ),
    ];
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
