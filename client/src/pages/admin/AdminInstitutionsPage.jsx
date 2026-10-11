import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, RefreshCw, Search, ShieldCheck, Mail, Users, Award } from 'lucide-react';
import api from '../../services/api';

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/auth/institutions?all=true');
      const list =
        res.data?.institutions ||
        res.institutions ||
        (Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
      setInstitutions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch institutions error:', err);
      setError(err.message || 'Failed to fetch participating institutions list.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = institutions.filter((inst) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inst.name || '').toLowerCase().includes(q) ||
      (inst.code || '').toLowerCase().includes(q) ||
      (inst.contactEmail || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold mb-1">
            <Building2 className="w-4 h-4" />
            <span>National Accreditation Node</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Institution Governance & Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review and monitor accredited universities participating in the Academic Bank of Credits.
          </p>
        </div>
        <button
          onClick={fetchInstitutions}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Search institution by name, code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : institutions.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">No institutions found.</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">No institutions match your search filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inst) => (
            <div key={inst._id || inst.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">
                    [{inst.code}]
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{inst.name}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    (inst.verificationStatus || 'VERIFIED').toUpperCase() === 'VERIFIED'
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                      : 'bg-amber-950/80 border-amber-800 text-amber-400'
                  }`}
                >
                  {inst.verificationStatus || 'VERIFIED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Type</span>
                  <span className="text-slate-300 font-medium capitalize">
                    {inst.type ? inst.type.replace(/_/g, ' ') : 'University'}
                  </span>
                </div>

                {inst.contactEmail && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Official Contact</span>
                    <span className="text-slate-300 font-mono text-[11px] truncate block">
                      {inst.contactEmail}
                    </span>
                  </div>
                )}

                {inst.naacAccreditation && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">NAAC Grade</span>
                    <span className="text-emerald-400 font-semibold">{inst.naacAccreditation}</span>
                  </div>
                )}

                {inst.nirfRank && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">NIRF Ranking</span>
                    <span className="text-purple-300 font-semibold">#{inst.nirfRank}</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-500 block">Enrolled Students</span>
                  <span className="text-blue-400 font-bold font-mono">
                    {inst.studentCount !== undefined ? inst.studentCount : '—'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
