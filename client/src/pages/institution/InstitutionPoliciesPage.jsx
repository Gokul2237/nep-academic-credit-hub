import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  History,
  Building2,
  Sliders,
  FileText,
  Calendar,
} from 'lucide-react';
import institutionService from '../../services/institutionService';
import { authService } from '../../services/authService';

export default function InstitutionPoliciesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  // Active Tab: 'current' (Section A) or 'history' (Section B)
  const isHistoryRoute = location.pathname.includes('policy-versions') || location.search.includes('tab=history');
  const [activeTab, setActiveTab] = useState(isHistoryRoute ? 'history' : 'current');

  // Institution Selector state for Superadmin
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [instLoading, setInstLoading] = useState(false);

  // Policy Form & Data state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState('v1.0');
  const [minGrade, setMinGrade] = useState('B');
  const [minEquivalency, setMinEquivalency] = useState(80);
  const [maxCredits, setMaxCredits] = useState(60);
  const [policyHistory, setPolicyHistory] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update tab if route changes
  useEffect(() => {
    if (location.pathname.includes('policy-versions')) {
      setActiveTab('history');
    }
  }, [location.pathname]);

  // Load institutions list for Admin
  useEffect(() => {
    if (isAdmin) {
      loadInstitutionsForAdmin();
    } else {
      fetchPolicy();
    }
  }, [isAdmin]);

  const loadInstitutionsForAdmin = async () => {
    try {
      setInstLoading(true);
      setError('');
      const list = await authService.getInstitutions();
      setInstitutions(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        const defaultId = list[0]._id || list[0].id;
        setSelectedInstId(defaultId);
        fetchPolicy(defaultId);
      } else {
        setError('No participating institutions found.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load institutions list for admin:', err);
      setError('Failed to load accredited universities directory.');
      setLoading(false);
    } finally {
      setInstLoading(false);
    }
  };

  const fetchPolicy = async (instId = selectedInstId) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (isAdmin && instId) {
        params.institutionId = instId;
      }

      const res = await institutionService.getPolicy(params);
      const data = res?.data || res;
      if (data) {
        setVersion(data.version || 'v1.0');
        setMinGrade(data.minGrade || 'B');
        setMinEquivalency(data.minEquivalency ?? 80);
        setMaxCredits(data.maxCredits ?? 60);
        setPolicyHistory(data.policyHistory || []);
      }
    } catch (err) {
      console.error('Fetch Policy Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load institutional credit policy.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstitution = (instId) => {
    setSelectedInstId(instId);
    fetchPolicy(instId);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        minGrade,
        minEquivalency: Number(minEquivalency),
        maxCredits: Number(maxCredits),
        description: remarks || `Policy update: Min Grade ${minGrade}, Equivalency ${minEquivalency}%, Max ${maxCredits} CR`,
      };

      if (isAdmin && selectedInstId) {
        payload.institutionId = selectedInstId;
      }

      const res = await institutionService.updatePolicy(payload);
      const updated = res?.data || res;
      if (updated) {
        setVersion(updated.version || version);
        setMinGrade(updated.minGrade || minGrade);
        setMinEquivalency(updated.minEquivalency ?? minEquivalency);
        setMaxCredits(updated.maxCredits ?? maxCredits);
        setPolicyHistory(updated.policyHistory || []);
        setRemarks('');
      }

      setSuccess(`Credit acceptance policy (${updated?.version || version}) updated and published successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Update Policy Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update credit policy.');
    } finally {
      setSaving(false);
    }
  };

  const selectedInstObj = institutions.find((i) => (i._id || i.id) === selectedInstId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <Shield className="w-4 h-4" />
            <span>{isAdmin ? 'National Credit Governance Control' : 'Institutional Governance'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Credit Acceptance Policies
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            {isAdmin
              ? 'Inspect, monitor, and govern inter-institutional credit transfer thresholds across accredited universities.'
              : 'Configure and monitor rules governing external credit evaluations, minimum grade thresholds, and syllabus equivalency.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center">
          <button
            type="button"
            onClick={() => fetchPolicy(selectedInstId)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Policy</span>
          </button>
        </div>
      </div>

      {/* Admin Institution Selector */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-white">Target University Node</span>
              <p className="text-[11px] text-slate-400">
                {selectedInstObj
                  ? `${selectedInstObj.name} [${selectedInstObj.code}]`
                  : 'Select an accredited university to monitor their credit policy'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="inst-select" className="text-xs text-slate-400 font-medium">
              University:
            </label>
            <select
              id="inst-select"
              value={selectedInstId}
              onChange={(e) => handleSelectInstitution(e.target.value)}
              disabled={instLoading || institutions.length === 0}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
            >
              {institutions.map((inst) => (
                <option key={inst._id || inst.id} value={inst._id || inst.id}>
                  {inst.name} [{inst.code}]
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Notification Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Tabs (Consolidating Current Policy & Policy History) */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'current'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Section A — Current Active Policy</span>
          <span className="font-mono text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-700/50">
            {version}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Section B — Policy Version History</span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            {policyHistory.length + 1}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading institutional credit governance policy...</p>
        </div>
      ) : activeTab === 'current' ? (
        /* ======================================================== */
        /* SECTION A — CURRENT POLICY SETTINGS & PUBLISHING FORM   */
        /* ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSave}
            className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Active Policy Formulation</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Update acceptance rules and publish a new immutable policy version.
                </p>
              </div>
              <span className="font-mono text-[11px] text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                Active: {version}
              </span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Minimum Grade Threshold For Transfer
              </label>
              <select
                value={minGrade}
                onChange={(e) => setMinGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="O">O (Outstanding)</option>
                <option value="A+">A+ (Excellent)</option>
                <option value="A">A (Very Good)</option>
                <option value="B+">B+ (Good)</option>
                <option value="B">B (Above Average)</option>
                <option value="C">C (Average)</option>
                <option value="P">P (Pass)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                External course credits below this minimum grade will be flagged during transfer evaluation.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Minimum Course Syllabus Equivalency (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={minEquivalency}
                onChange={(e) => setMinEquivalency(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Minimum syllabus match percentage required between source course and receiving department.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Maximum Cumulative Transferable Credits
              </label>
              <input
                type="number"
                min="10"
                max="160"
                value={maxCredits}
                onChange={(e) => setMaxCredits(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maximum credit ceiling that can be transferred toward a degree qualification.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Revision Notes / Council Rationale (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Academic Council resolution 2026 update on equivalency"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Saving will create and publish a new immutable policy version.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>Publish & Save Policy Version</span>
              </button>
            </div>
          </form>

          {/* Current Thresholds Summary Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Enforcement Standards</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active {version}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Minimum Grade Required</span>
                  <span className="text-lg font-bold text-white mt-0.5 block">{minGrade}</span>
                  <span className="text-[10px] text-slate-500">Credits graded below {minGrade} are flagged</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Syllabus Equivalency Match</span>
                  <span className="text-lg font-bold text-indigo-400 mt-0.5 block">{minEquivalency}%</span>
                  <span className="text-[10px] text-slate-500">Course curriculum overlap requirement</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Maximum Transfer Cap</span>
                  <span className="text-lg font-bold text-purple-400 mt-0.5 block">{maxCredits} Credits</span>
                  <span className="text-[10px] text-slate-500">Per-student cumulative mobility limit</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 text-xs space-y-1">
              <div className="font-semibold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated Transfer Evaluation</span>
              </div>
              <p className="text-[11px] text-indigo-400/80 leading-relaxed">
                These thresholds are enforced in real-time when evaluating inter-university transfer requests between accredited institutions.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* SECTION B — IMMUTABLE POLICY VERSION HISTORY            */
        /* ======================================================== */
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Policy Version History & Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chronological ledger of active and archived credit evaluation policies.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Recorded Versions: {policyHistory.length + 1}
            </span>
          </div>

          <div className="space-y-4">
            {/* Current Active Version Card */}
            <div className="p-4 rounded-xl bg-slate-950 border-2 border-indigo-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-indigo-300">{version}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    CURRENT ACTIVE
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Live Policy</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Min Grade</span>
                  <span className="font-bold text-white text-sm">{minGrade}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Min Equivalency</span>
                  <span className="font-bold text-indigo-400 text-sm">{minEquivalency}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Max Credits</span>
                  <span className="font-bold text-purple-400 text-sm">{maxCredits} CR</span>
                </div>
              </div>
            </div>

            {/* Archived Versions */}
            {policyHistory.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                Baseline v1.0 policy active. No historical versions archived yet.
              </div>
            ) : (
              policyHistory
                .slice()
                .reverse()
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-200">{item.version}</span>
                        <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-800">
                          ARCHIVED
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Archived Record'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Grade Threshold</span>
                        <span className="font-semibold text-slate-300">{item.minGrade}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Equivalency</span>
                        <span className="font-semibold text-slate-300">{item.minEquivalency}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Max Credits</span>
                        <span className="font-semibold text-slate-300">{item.maxCredits} CR</span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                        "{item.description}"
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
