import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Building2,
  BookOpen,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export default function Header({ toggleSidebar, title = 'Dashboard', breadcrumbs = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return {
          label: 'STUDENT',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: BookOpen,
        };
      case 'institution':
        return {
          label: 'INSTITUTION NODE',
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          icon: Building2,
        };
      case 'admin':
        return {
          label: 'SUPER ADMIN',
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          icon: KeyRound,
        };
      default:
        return {
          label: 'USER',
          bg: 'bg-slate-700 border-slate-600 text-slate-300',
          icon: User,
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-200 transition flex items-center space-x-1">
            <span>NEP Hub</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="text-slate-600">/</span>
              <span className={idx === breadcrumbs.length - 1 ? 'text-slate-200 font-medium' : 'hover:text-slate-200'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Role Indicator & Profile Dropdown */}
      <div className="flex items-center space-x-3">
        {/* Role Badge */}
        <div className={`hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${badge.bg}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
          {user?.institutionCode && (
            <span className="ml-1 pl-1.5 border-l border-indigo-500/40 text-slate-300 font-mono">
              [{user.institutionCode}]
            </span>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-800 transition focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[140px]">
                {user?.name || 'Academic User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-700/60">
                <p className="text-xs font-bold text-slate-100">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                {user?.studentId && (
                  <p className="text-[10px] text-blue-400 font-mono mt-0.5">ABC ID: {user.studentId}</p>
                )}
                {user?.institutionName && (
                  <p className="text-[10px] text-indigo-300 font-mono mt-0.5">{user.institutionName}</p>
                )}
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 flex items-center space-x-2 transition"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
