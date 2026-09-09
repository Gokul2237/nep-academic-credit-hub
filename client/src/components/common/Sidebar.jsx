import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Clock,
  CheckCircle,
  GitFork,
  Sparkles,
  ArrowRightLeft,
  Award,
  FileText,
  User,
  Users,
  BookOpen,
  GraduationCap,
  FileCheck,
  Shield,
  Layers,
  Webhook,
  Key,
  ScrollText,
  BarChart3,
  Building2,
  Activity,
  X,
} from 'lucide-react';

const studentNavItems = [
  {
    name: 'Overview',
    path: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Digital Credit Wallet',
    path: '/student/wallet',
    icon: Wallet,
  },
  {
    name: 'Credit Timeline',
    path: '/student/timeline',
    icon: Clock,
  },
  {
    name: 'Eligibility Tracker',
    path: '/student/eligibility',
    icon: CheckCircle,
  },
  {
    name: 'Academic Pathway',
    path: '/student/pathway',
    icon: GitFork,
  },
  {
    name: 'Course Recommendations',
    path: '/student/recommendations',
    icon: Sparkles,
  },
  {
    name: 'Transfer Simulator',
    path: '/student/simulator',
    icon: ArrowRightLeft,
  },
  {
    name: 'Certificates',
    path: '/student/certificates',
    icon: Award,
  },
  {
    name: 'Verifiable Transcript',
    path: '/student/transcript',
    icon: FileText,
  },
  {
    name: 'Academic Passport',
    path: '/student/passport',
    icon: ShieldCheck,
  },
  {
    name: 'My Profile',
    path: '/student/profile',
    icon: User,
  },
];

const institutionNavItems = [
  {
    name: 'Overview',
    path: '/institution/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Student Management',
    path: '/institution/students',
    icon: Users,
  },
  {
    name: 'Course Management',
    path: '/institution/courses',
    icon: BookOpen,
  },
  {
    name: 'Academic Credits',
    path: '/institution/credits',
    icon: GraduationCap,
  },
  {
    name: 'Transfer Requests',
    path: '/institution/transfers',
    icon: ArrowRightLeft,
  },
  {
    name: 'Credit Policies',
    path: '/institution/policies',
    icon: Shield,
  },
  {
    name: 'Policy Versions',
    path: '/institution/policy-versions',
    icon: Layers,
  },
  {
    name: 'API Gateway',
    path: '/institution/api-gateway',
    icon: Webhook,
  },
  {
    name: 'API Keys',
    path: '/institution/api-keys',
    icon: Key,
  },
  {
    name: 'API Logs',
    path: '/institution/api-logs',
    icon: ScrollText,
  },
  {
    name: 'Transfer Decisions',
    path: '/institution/decisions',
    icon: FileCheck,
  },
  {
    name: 'Certificate Verification',
    path: '/institution/verify-certificates',
    icon: Award,
  },
];

const adminNavItems = [
  {
    name: 'Overview',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Student Management',
    path: '/admin/students',
    icon: Users,
  },
  {
    name: 'Institution Management',
    path: '/admin/institutions',
    icon: Building2,
  },
  {
    name: 'Course Catalog',
    path: '/admin/courses',
    icon: BookOpen,
  },
  {
    name: 'Credit Ledger',
    path: '/admin/credits',
    icon: GraduationCap,
  },
  {
    name: 'Certificates',
    path: '/admin/certificates',
    icon: Award,
  },
  {
    name: 'Policy Monitoring',
    path: '/admin/policies',
    icon: Shield,
  },
  {
    name: 'API Telemetry',
    path: '/admin/api-monitoring',
    icon: Activity,
  },
  {
    name: 'Transfer Flow',
    path: '/admin/transfers',
    icon: ArrowRightLeft,
  },
  {
    name: 'Platform Audit Logs',
    path: '/admin/audit-logs',
    icon: ScrollText,
  },
  {
    name: 'System Analytics',
    path: '/admin/analytics',
    icon: BarChart3,
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const getNavItems = () => {
    switch (user?.role) {
      case 'student':
        return studentNavItems;

      case 'institution':
        return institutionNavItems;

      case 'admin':
        return adminNavItems;

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            <div>
              <span className="font-bold text-sm text-slate-100 block leading-tight">
                NEP Academic Hub
              </span>

              <span className="text-[10px] text-slate-400 font-mono">
                {user?.role === 'student'
                  ? 'Student Portal'
                  : user?.role === 'institution'
                  ? 'Institution Node'
                  : 'System Governance'}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Link List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation Menu
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />

                <span className="truncate">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Node Meta */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>

              <span className="text-slate-300 font-medium capitalize">
                {user?.role || 'Guest'} Node
              </span>
            </div>

            <span className="text-slate-400 font-mono text-[10px]">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}