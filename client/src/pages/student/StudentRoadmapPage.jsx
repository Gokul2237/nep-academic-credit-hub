import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  GraduationCap,
  ArrowRightLeft,
  RefreshCw,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileText,
  Filter,
  Check,
  ChevronRight,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import { creditService } from '../../services/creditService';

export default function StudentRoadmapPage() {
  const [roadmapData, setRoadmapData] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('graduation');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Per-credit filter: all, eligible, needs_review, not_eligible
  const [creditFilter, setCreditFilter] = useState('all');

  // Load institutions list and initial roadmap
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch institutions for dropdown
      const instRes = await api.get('/auth/institutions?all=true');
      const rawInst =
        instRes.data?.institutions ||
        instRes.data?.data?.institutions ||
        instRes.data?.data ||
        (Array.isArray(instRes.data) ? instRes.data : []);
      const instList = Array.isArray(rawInst) ? rawInst : [];
      setInstitutions(instList);

      // Fetch student roadmap
      const res = await creditService.getReadinessRoadmap({
        pathwayGoal: selectedGoal,
      });

      if (res?.data) {
        setRoadmapData(res.data);
      }
    } catch (err) {
      console.error('Failed to load initial roadmap data:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load credit transfer readiness and personalized academic roadmap.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (targetInst = selectedInstId, goal = selectedGoal) => {
    try {
      setRefreshing(true);
      setError('');
      const params = { pathwayGoal: goal };
      if (targetInst) {
        params.targetInstitutionId = targetInst;
      }

      const res = await creditService.getReadinessRoadmap(params);
      if (res?.data) {
        setRoadmapData(res.data);
      }
    } catch (err) {
      console.error('Roadmap recalculation error:', err);
      setError(err.response?.data?.message || 'Error updating academic roadmap analysis.');
    } finally {
      setRefreshing(false);
    }
  };

  const onTargetInstChange = (e) => {
    const val = e.target.value;
    setSelectedInstId(val);
    handleRecalculate(val, selectedGoal);
  };

  const onGoalChange = (e) => {
    const val = e.target.value;
    setSelectedGoal(val);
    handleRecalculate(selectedInstId, val);
  };

  // Helper for status badge rendering
  const getReadinessBadge = (status) => {
    switch (status) {
      case 'READY':
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eligible for Mobility</span>
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-800 text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Needs Review</span>
          </span>
        );
      case 'NOT_ELIGIBLE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 border border-red-800 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not Transferable</span>
          </span>
        );
      case 'INSUFFICIENT_INFO':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Insufficient Info</span>
          </span>
        );
    }
  };

  // Filter credits
  const allCredits = roadmapData?.readiness?.evaluatedCredits || [];
  const filteredCredits = allCredits.filter((c) => {
    if (creditFilter === 'eligible') return c.readinessStatus === 'ELIGIBLE';
    if (creditFilter === 'needs_review') return c.readinessStatus === 'NEEDS_REVIEW';
    if (creditFilter === 'not_eligible') return c.readinessStatus === 'NOT_ELIGIBLE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Student-Specific Academic Roadmap & Transfer Readiness</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Transfer Readiness & Personalized Academic Roadmap
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Deterministic, policy-driven evaluation of your verified academic credits against receiving institution rules and NEP 2020 graduation benchmarks.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleRecalculate(selectedInstId, selectedGoal)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Evaluating...' : 'Recalculate Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Student Identity Bar */}
        {roadmapData?.student && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-white">{roadmapData.student.name}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-indigo-300">ABC ID: {roadmapData.student.studentId}</span>
              <span className="text-slate-500">•</span>
              <span>Semester {roadmapData.student.currentSemester}</span>
            </div>
            <div className="text-slate-400">
              Home Node: <span className="text-slate-200 font-medium">{roadmapData.student.homeInstitution}</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => handleRecalculate(selectedInstId, selectedGoal)}
            className="underline font-semibold ml-4 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Target Destination & Pathway Goal Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        {/* Target Institution Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Receiving Destination Institution</span>
          </label>
          <select
            value={selectedInstId}
            onChange={onTargetInstChange}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">National Baseline Policy (NEP 2020 Standard Framework)</option>
            {institutions.map((inst) => (
              <option key={inst._id || inst.id} value={inst._id || inst.id}>
                {inst.name} ({inst.code})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Evaluates your credits against this institution's official minimum grade and credit transfer limits.
          </p>
        </div>

        {/* Target Benchmark Goal */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span>Target Academic Milestone Goal</span>
          </label>
          <select
            value={selectedGoal}
            onChange={onGoalChange}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="graduation">Full NEP Bachelor Degree (4-Year) — 160 Credits</option>
            <option value="honors">NEP 3-Year UG Degree / Major Core — 140 Credits</option>
            <option value="diploma">Undergraduate Diploma Benchmark — 80 Credits</option>
            <option value="certificate">Undergraduate Academic Certificate — 40 Credits</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculates your precise remaining credit gap and milestone trajectory for this qualification.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : roadmapData ? (
        <>
          {/* Active Target Policy Status Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  Policy Model: {roadmapData.targetPolicy.targetInstitution}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Version: <span className="font-mono text-indigo-300">{roadmapData.targetPolicy.version}</span> • Min Grade:{' '}
                  <span className="font-semibold text-white">{roadmapData.targetPolicy.minGrade}</span> • Max Transfer Limit:{' '}
                  <span className="font-semibold text-white">{roadmapData.targetPolicy.maxCredits} Credits</span>
                </div>
              </div>
            </div>
            <div>{getReadinessBadge(roadmapData.summary.overallReadiness)}</div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Verified Credits */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Verified Credits</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {roadmapData.summary.verifiedCredits}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {roadmapData.pathwayGoal.requiredCredits} Target
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (roadmapData.summary.verifiedCredits /
                          roadmapData.pathwayGoal.requiredCredits) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {roadmapData.summary.pendingCredits > 0
                  ? `${roadmapData.summary.pendingCredits} credits pending verification`
                  : 'All earned credits fully verified'}
              </p>
            </div>

            {/* Transfer Eligible Credits */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Transfer Eligible</span>
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {roadmapData.readiness.eligibleCredits}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  / {roadmapData.targetPolicy.maxCredits} Cap
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (roadmapData.readiness.eligibleCredits /
                          roadmapData.targetPolicy.maxCredits) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {roadmapData.readiness.eligibleCount} course units meet policy
              </p>
            </div>

            {/* Degree Credit Gap */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Degree Credit Gap</span>
                <GraduationCap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {roadmapData.readiness.degreeCreditGap}{' '}
                <span className="text-xs text-slate-400 font-normal">Credits Remaining</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Toward {roadmapData.pathwayGoal.goalTitle}
              </div>
              <p className="text-[11px] text-slate-500">Zero double-counting applied</p>
            </div>

            {/* Transfer Mobility Cap Room */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Transfer Room Available</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {roadmapData.readiness.transferCreditGap}{' '}
                <span className="text-xs text-slate-400 font-normal">Credits</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Available before policy ceiling reached
              </div>
              <p className="text-[11px] text-slate-500">Based on receiving limit</p>
            </div>
          </div>

          {/* Academic Progression Milestones (NEP 2020 Multi-Exit / Multi-Entry) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>NEP 2020 Academic Progression Milestones</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard credit thresholds required for multi-entry and multi-exit academic benchmarks.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Current Progress: <span className="text-white font-bold">{roadmapData.summary.verifiedCredits}</span> Credits
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              {roadmapData.milestones.map((m) => {
                const isComplete = m.status === 'COMPLETED';
                const isTarget = m.isTarget;

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                      isTarget
                        ? 'bg-slate-950 border-indigo-500/60 ring-1 ring-indigo-500/30'
                        : isComplete
                        ? 'bg-slate-950/70 border-emerald-900/60'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          {m.level}
                        </span>
                        {isComplete ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-bold">
                            <Check className="w-3 h-3" />
                            <span>Achieved</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {m.remainingCredits} needed
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{m.title}</h4>
                      <p className="text-[11px] text-slate-400">Target: {m.requiredCredits} Credits</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{m.currentCredits} credits</span>
                        <span>{m.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            isComplete ? 'bg-emerald-400' : isTarget ? 'bg-indigo-500' : 'bg-slate-600'
                          }`}
                          style={{ width: `${m.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prioritized Recommended Next Steps */}
          {roadmapData.recommendedNextSteps?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>Prioritized Recommended Next Steps</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actionable guidance tailored to your verified records, missing requirements, and transfer eligibility.
                </p>
              </div>

              <div className="space-y-3">
                {roadmapData.recommendedNextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {step.priority}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{step.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{step.description}</p>
                      </div>
                    </div>

                    {step.actionUrl && (
                      <Link
                        to={step.actionUrl}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 shrink-0 self-start sm:self-auto transition"
                      >
                        <span>{step.actionLabel || 'Proceed'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit-by-Credit Transfer Readiness Table */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                  <span>Credit Transfer Readiness Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Individual evaluation of each academic credit record against destination institution criteria.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setCreditFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    creditFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({allCredits.length})
                </button>
                <button
                  onClick={() => setCreditFilter('eligible')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    creditFilter === 'eligible'
                      ? 'bg-emerald-950/80 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Eligible ({roadmapData.readiness.eligibleCount})
                </button>
                <button
                  onClick={() => setCreditFilter('needs_review')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    creditFilter === 'needs_review'
                      ? 'bg-amber-950/80 text-amber-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Review ({roadmapData.readiness.needsReviewCount})
                </button>
                <button
                  onClick={() => setCreditFilter('not_eligible')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    creditFilter === 'not_eligible'
                      ? 'bg-red-950/80 text-red-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ineligible ({roadmapData.readiness.notEligibleCount})
                </button>
              </div>
            </div>

            {filteredCredits.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800/60 p-6 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No credits match the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Course / Subject</th>
                      <th className="px-3 py-3">Credits</th>
                      <th className="px-3 py-3">Grade</th>
                      <th className="px-3 py-3">Term</th>
                      <th className="px-4 py-3">Readiness Status</th>
                      <th className="px-4 py-3">Policy Reason / Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {filteredCredits.map((c) => (
                      <tr key={c.creditId} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{c.courseName}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {c.courseCode} • {c.awardingInstitution}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-white">{c.credits}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              ['O', 'A+', 'A'].includes(c.grade)
                                ? 'bg-emerald-950 text-emerald-400'
                                : ['B+', 'B'].includes(c.grade)
                                ? 'bg-blue-950 text-blue-400'
                                : 'bg-red-950 text-red-400'
                            }`}
                          >
                            {c.grade}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          Sem {c.semester} <span className="text-[10px] block">{c.academicYear}</span>
                        </td>
                        <td className="px-4 py-3">{getReadinessBadge(c.readinessStatus)}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs max-w-md">{c.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Course Pathway Recommendations (Prerequisite-Aware) */}
          {roadmapData.coursePathway?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Recommended Learning & Course Pathway</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Future course offerings based on your current semester progression and verified prerequisite fulfillment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmapData.coursePathway.map((item) => (
                  <div
                    key={item.courseId}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-mono text-purple-300 font-semibold">{item.courseCode}</span>
                        <span>Semester {item.semester} • {item.credits} Credits</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{item.courseName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.department} ({item.institution})</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      {item.prerequisitesMet ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Prerequisites Fulfilled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-400 text-[11px] font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Requires {item.missingPrerequisites.join(', ')}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">Match: {item.matchScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence, Policy Auditing & NEP Compliance Transparency */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Evidence Audit Trail & NEP Policy Compliance</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
              <div>
                <span className="text-slate-500 block">Evaluated At:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(roadmapData.evidence.analyzedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Policy Applied:</span>
                <span className="text-slate-200">
                  {roadmapData.evidence.policyApplied.targetInstitution} ({roadmapData.evidence.policyApplied.version})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Source Records Audited:</span>
                <span className="text-slate-200">
                  {roadmapData.evidence.recordsEvaluatedCount} Academic Credits • {roadmapData.evidence.certificatesCount} Certificates
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-2">
              {roadmapData.evidence.disclaimer}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
          <Compass className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No academic records found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not have any registered academic credits in the system yet. Please contact your institution registrar.
          </p>
        </div>
      )}
    </div>
  );
}
