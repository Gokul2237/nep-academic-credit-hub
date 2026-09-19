import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Award,
  Contact,
  CheckCircle2,

  RefreshCw,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function StudentProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/auth/me');
      const userData = res.data?.user || res.user || res.data?.data?.user || (res._id ? res : authUser);
      setProfile(userData);



    } catch (err) {
      console.error('Fetch profile error:', err);
      // Fall back to AuthContext user if API fails
      if (authUser) {
        setProfile(authUser);
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to load student profile. Please try refreshing.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const activeUser = profile || authUser;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold mb-1">
            <Contact className="w-4 h-4" />
            <span>National Academic Bank of Credits (ABC) Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Academic Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Verified student identity and institutional affiliation details.
          </p>
        </div>
        <button
          onClick={fetchProfile}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Profile</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProfile} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-64 animate-pulse" />
      ) : activeUser ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Identity Card */}
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
              {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{activeUser.name || 'Student User'}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{activeUser.email}</p>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified ABC Identity</span>
            </div>

            <div className="w-full pt-4 border-t border-slate-800/80 text-xs space-y-2 text-left text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">System Role:</span>
                <span className="font-semibold capitalize text-blue-400">{activeUser.role || 'Student'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Status:</span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered On:</span>
                <span className="font-mono text-slate-400">
                  {activeUser.createdAt ? new Date(activeUser.createdAt).toLocaleDateString() : 'Active Session'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Info Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Academic Credential Summary */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Institutional Affiliation & ABC Records</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Student ID / ABC ID</span>
                  <p className="text-sm font-mono font-bold text-white">
                    {activeUser.studentId || 'ABC-IDENTITY-PENDING'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Institution Name</span>
                  <p className="text-sm font-semibold text-white">
                    {activeUser.institutionName ||
                      activeUser.institutionId?.name ||
                      'Home Academic Institution'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Institution Code</span>
                  <p className="text-sm font-mono font-semibold text-indigo-400">
                    {activeUser.institutionCode ||
                      activeUser.institutionId?.code ||
                      'INST-NODE'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[11px] block">National ABC Ledger Status</span>
                  <p className="text-sm font-semibold text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Synchronized</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Overview Note */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>Academic Identity Governance</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your National Academic Bank of Credits (ABC) profile is linked directly with your accredited institution. Earned credits, verifiable digital transcripts, and course completion certificates are bound to your verified Student ID.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 text-xs">
          No profile information available.
        </div>
      )}
    </div>
  );
}
