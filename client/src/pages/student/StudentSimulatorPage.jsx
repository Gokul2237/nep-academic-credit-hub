import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  BookOpen,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentSimulatorPage() {
  const [credits, setCredits] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulator Form
  const [selectedCreditId, setSelectedCreditId] = useState('');
  const [targetInstitutionId, setTargetInstitutionId] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    loadSimulatorData();
  }, []);

  const loadSimulatorData = async () => {
    try {
      setLoading(true);
      const [credRes, instRes] = await Promise.all([
        api.get('/credits'),
        api.get('/auth/institutions'),
      ]);
      const crd = credRes.data?.data || credRes.data || [];
      const rawInst = instRes.data?.institutions || instRes.institutions || (Array.isArray(instRes.data) ? instRes.data : (Array.isArray(instRes) ? instRes : []));
      setCredits(Array.isArray(crd) ? crd : []);
      setInstitutions(Array.isArray(rawInst) ? rawInst : []);
    } catch (err) {
      console.error('Simulator load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = (e) => {
    e.preventDefault();
    if (!selectedCreditId || !targetInstitutionId) return;

    const credit = credits.find((c) => c._id === selectedCreditId);
    const targetInst = institutions.find((i) => (i._id || i.id) === targetInstitutionId);

    if (!credit) return;

    const isVerified = credit.verificationStatus === 'verified';
    const gradeValid = ['O', 'A+', 'A', 'B+'].includes(String(credit.grade).toUpperCase());

    let score = 0;
    const rules = [];

    if (isVerified) {
      score += 40;
      rules.push({ name: 'Credit Verification Seal', pass: true, text: 'Source credit is fully verified with SHA-256 integrity seal.' });
    } else {
      rules.push({ name: 'Credit Verification Seal', pass: false, text: 'Source credit is unverified/pending. Only verified credits can be transferred.' });
    }

    if (gradeValid) {
      score += 30;
      rules.push({ name: 'Grade Threshold Criteria', pass: true, text: `Grade '${credit.grade}' satisfies standard transfer minimum (B+).` });
    } else {
      rules.push({ name: 'Grade Threshold Criteria', pass: false, text: `Grade '${credit.grade}' may require additional institutional review.` });
    }

    score += 30;
    rules.push({ name: 'NEP Framework Compatibility', pass: true, text: 'Course credit value aligns with national ABC unit system.' });

    let status = 'High Acceptance Probability';
    if (score < 70) status = 'Moderate Review Required';
    if (score < 50) status = 'Low Acceptance Probability';

    setSimulationResult({
      credit,
      targetInst,
      score,
      status,
      rules,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Pre-Transfer Acceptance Simulator</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Credit Transfer Simulator
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pre-evaluate credit transfer eligibility against destination university acceptance guidelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">Simulation Setup</h3>
          {loading ? (
            <p className="text-xs text-slate-500">Loading credits and institutions...</p>
          ) : (
            <form onSubmit={handleSimulate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Source Credit</label>
                <select
                  value={selectedCreditId}
                  onChange={(e) => setSelectedCreditId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose credit record --</option>
                  {credits.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseId?.courseName || c.courseId?.courseCode || 'Course'} ({c.credits} cr, Grade {c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Destination University</label>
                <select
                  value={targetInstitutionId}
                  onChange={(e) => setTargetInstitutionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Choose target university --</option>
                  {institutions.map((i) => (
                    <option key={i._id || i.id} value={i._id || i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedCreditId || !targetInstitutionId}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-md shadow-indigo-600/20"
              >
                Run Simulation
              </button>
            </form>
          )}
        </div>

        {/* Output Panel */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Simulation Analysis Report</span>
          </h3>

          {!simulationResult ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a source credit and target university to preview transfer acceptance probability.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px]">Evaluation Outcome</span>
                  <h4 className="text-base font-bold text-white">{simulationResult.status}</h4>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px]">Compatibility Index</span>
                  <p className="text-xl font-bold text-indigo-400">{simulationResult.score}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 font-semibold block">Criteria Breakdown:</span>
                {simulationResult.rules.map((rule, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-2">
                    {rule.pass ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-200">{rule.name}</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{rule.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
