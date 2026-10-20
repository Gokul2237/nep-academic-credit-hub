import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import institutionService from '../../services/institutionService';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Eye,
  BookOpen,
  Info,
  Table,
} from 'lucide-react';

export default function InstitutionResultsImportPage() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'batches' | 'ledger'

  // Upload Form State
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [semester, setSemester] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Template Viewer & Quick Test State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [quickTesting, setQuickTesting] = useState(false);

  // Preview Data State
  const [previewData, setPreviewData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedResult, setConfirmedResult] = useState(null);

  // Batches History State
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Ledger State
  const [ledgerResults, setLedgerResults] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerSemFilter, setLedgerSemFilter] = useState('');

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionMarks, setCorrectionMarks] = useState('');
  const [correctionGrade, setCorrectionGrade] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionLoading, setCorrectionLoading] = useState(false);

  // Fetch batches on initial mount so pending preview batches are detected immediately
  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch batches when switching to batches tab or ledger
  useEffect(() => {
    if (activeTab === 'batches') {
      fetchBatches();
    } else if (activeTab === 'ledger') {
      fetchLedger();
    }
  }, [activeTab]);

  const fetchBatches = async () => {
    setBatchesLoading(true);
    try {
      const res = await institutionService.getImportBatches();
      const payload = res?.data !== undefined ? res.data : res;
      setBatches(Array.isArray(payload) ? payload : (payload?.batches || []));
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      const params = {};
      if (ledgerSemFilter) params.semester = ledgerSemFilter;
      const res = await institutionService.getSemesterResults(params);
      const payload = res?.data !== undefined ? res.data : res;
      setLedgerResults(Array.isArray(payload) ? payload : (payload?.results || []));
    } catch (err) {
      console.error('Failed to load semester results ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  // 1. Template Download Handler
  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setErrorMsg('');
    try {
      await institutionService.downloadTemplate();
      setSuccessMsg('Official NEP results template (.xlsx) downloaded successfully. Open it in Microsoft Excel, Google Sheets, or LibreOffice.');
    } catch (err) {
      setErrorMsg('Failed to download sample template: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // 1b. Open Template Structure Guide & Sample Data Modal
  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true);
    if (!templateData) {
      setTemplateLoading(true);
      try {
        const res = await institutionService.getTemplateData();
        setTemplateData(res.data || res);
      } catch (err) {
        console.error('Failed to load template guide:', err);
      } finally {
        setTemplateLoading(false);
      }
    }
  };

  // 1c. Load Sample Template Directly into Upload/Preview Area
  const handleLoadSampleForTest = async () => {
    setQuickTesting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const file = await institutionService.getTemplateFile();
      setSelectedFile(file);
      setPreviewData(null);
      setConfirmedResult(null);

      // Auto-preview with current form settings
      setPreviewLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academicYear', academicYear);
      formData.append('semester', semester);

      const res = await institutionService.previewResultsImport(formData);
      const payload = res?.data !== undefined ? res.data : res;
      setPreviewData(payload);
      setSuccessMsg(res?.message || 'Official sample template loaded and successfully validated in the preview table below!');
      setShowTemplateModal(false);
    } catch (err) {
      setErrorMsg('Failed to test with sample template: ' + (err.message || 'Unknown error'));
    } finally {
      setQuickTesting(false);
      setPreviewLoading(false);
    }
  };

  // 2. File Selection Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setErrorMsg('Invalid file type. Please select an Excel (.xlsx or .xls) spreadsheet.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File exceeds 5MB size limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
      setPreviewData(null);
      setConfirmedResult(null);
    }
  };

  // 3. Upload & Preview Handler
  const handlePreviewUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select an Excel (.xlsx) file to upload.');
      return;
    }

    setPreviewLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmedResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('academicYear', academicYear);
      formData.append('semester', semester);

      const res = await institutionService.previewResultsImport(formData);
      const payload = res?.data !== undefined ? res.data : res;
      setPreviewData(payload);
      setSuccessMsg(res?.message || 'Spreadsheet inspected and validated successfully. Review results below and confirm to award credits.');
    } catch (err) {
      console.error('Preview error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to inspect Excel file.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Load an existing batch directly into the preview area
  const handleLoadBatchIntoPreview = async (batchId) => {
    setPreviewLoading(true);
    setErrorMsg('');
    try {
      const res = await institutionService.getBatchDetails(batchId);
      const b = res?.data !== undefined ? res.data : res;
      if (!b) throw new Error('Could not retrieve batch details.');
      setPreviewData({
        batchId: b.batchId,
        academicYear: b.academicYear,
        semester: b.semester,
        counts: {
          totalRows: b.totalRows,
          validRows: b.validRows,
          invalidRows: b.invalidRows,
          duplicateRows: b.duplicateRows,
          previouslyProcessedRows: b.previouslyProcessedRows,
          totalEligibleCredits: (b.items || []).reduce((sum, i) => sum + (i.eligibleCredits || 0), 0),
        },
        items: b.items || [],
        errors: b.errors || [],
      });
      setSelectedBatch(null);
      setActiveTab('upload');
      setSuccessMsg(`Loaded batch ${b.batchId} (${b.validRows} valid rows) into preview. Review below and confirm to award credits.`);
    } catch (err) {
      setErrorMsg('Failed to load batch into preview: ' + (err.message || 'Unknown error'));
    } finally {
      setPreviewLoading(false);
    }
  };

  // 4. Confirm Import Handler (supports direct batch ID or previewData)
  const handleConfirmImport = async (targetBatchId = null) => {
    const idToConfirm = targetBatchId || previewData?.batchId;
    if (!idToConfirm) return;

    setConfirmLoading(true);
    setErrorMsg('');

    try {
      const res = await institutionService.confirmResultsImport(idToConfirm);
      const payload = res?.data !== undefined ? res.data : res;
      setConfirmedResult(payload);
      setShowConfirmModal(false);
      setSelectedBatch(null);
      setSuccessMsg(res?.message || 'Results confirmed and credits accumulated successfully!');
      setPreviewData(null);
      setSelectedFile(null);
      fetchBatches();
      if (activeTab !== 'upload') {
        setActiveTab('upload');
      }
    } catch (err) {
      console.error('Confirm error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to confirm results import.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // 5. Submit Result Correction
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionTarget) return;
    if (!correctionReason.trim()) {
      alert('Please provide a mandatory audit reason for this correction.');
      return;
    }

    setCorrectionLoading(true);
    try {
      await institutionService.correctResult(correctionTarget._id, {
        marks: correctionMarks !== '' ? Number(correctionMarks) : undefined,
        grade: correctionGrade || undefined,
        reason: correctionReason,
      });
      setCorrectionTarget(null);
      fetchLedger();
      alert('Result corrected successfully. Audit trail recorded.');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Correction failed');
    } finally {
      setCorrectionLoading(false);
    }
  };

  const filteredLedger = ledgerResults.filter((r) => {
    const q = ledgerSearch.toLowerCase();
    return (
      r.studentAbcId?.toLowerCase().includes(q) ||
      r.studentId?.name?.toLowerCase().includes(q) ||
      r.courseCode?.toLowerCase().includes(q) ||
      r.courseId?.courseName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Academic Bank of Credits • Ingestion Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Semester-Wise Results Import & Credit Accumulation
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Upload institution-verified Excel spreadsheets. Automatically calculates academic credits from authoritative course catalogs, validates student ABC IDs, and triggers semester progression.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleOpenTemplateModal}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>View Template Guide</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
          >
            {downloadingTemplate ? (
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-blue-400" />
            )}
            <span>Download Sample (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload & Ingestion</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'batches'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Import Batches & Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
            activeTab === 'ledger'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Semester Results Ledger</span>
        </button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: UPLOAD & INGESTION */}
      {/* ============================================================ */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Confirmed Result Success Card */}
          {confirmedResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Results Import Confirmed & Sealed
                  </h3>
                  <p className="text-xs text-slate-400">
                    Batch ID: <span className="font-mono text-emerald-400">{confirmedResult.batchId}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Processed Rows</span>
                  <span className="text-lg font-bold text-slate-100">{confirmedResult.processedRows}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Credits Awarded</span>
                  <span className="text-lg font-bold text-blue-400">{confirmedResult.creditsAwarded}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Credit Points</span>
                  <span className="text-lg font-bold text-indigo-400">{confirmedResult.creditPointsTotal}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Students Advanced</span>
                  <span className="text-lg font-bold text-emerald-400">{confirmedResult.studentsAdvanced}</span>
                </div>
              </div>

              {confirmedResult.advancedStudents && confirmedResult.advancedStudents.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Students Advanced to Next Academic Semester</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {confirmedResult.advancedStudents.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono"
                      >
                        {s.name} ({s.studentAbcId}) → Sem {s.newSemester}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Unconfirmed Preview Batch Banner */}
          {batches.find((b) => b.status === 'PREVIEW') && !previewData && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-amber-300">
                      Unconfirmed Preview Batch Waiting: {batches.find((b) => b.status === 'PREVIEW').batchId}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      PREVIEW STATUS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {batches.find((b) => b.status === 'PREVIEW').validRows} valid rows for Semester{' '}
                    {batches.find((b) => b.status === 'PREVIEW').semester} (
                    {batches.find((b) => b.status === 'PREVIEW').academicYear}) are inspected and ready. Academic credits have not been awarded yet.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-end md:self-auto flex-shrink-0">
                <button
                  type="button"
                  disabled={previewLoading}
                  onClick={() => handleLoadBatchIntoPreview(batches.find((b) => b.status === 'PREVIEW').batchId)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  View in Preview
                </button>
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={() => handleConfirmImport(batches.find((b) => b.status === 'PREVIEW').batchId)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{confirmLoading ? 'Confirming...' : 'Confirm & Award Credits Now'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload Form Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Step 1: Select Term & Upload Results Spreadsheet</span>
            </h3>

            <form onSubmit={handlePreviewUpload} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Academic Year <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="2023-24">2023-24</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Semester Number <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <option key={num} value={num}>
                        Semester {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag & Drop File Zone */}
              <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 sm:p-8 text-center bg-slate-950/40 transition">
                <input
                  type="file"
                  id="resultsFileInput"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to inspect
                      </p>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <label
                        htmlFor="resultsFileInput"
                        className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Change file
                      </label>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label htmlFor="resultsFileInput" className="cursor-pointer block space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          Drop your results Excel file here, or{' '}
                          <span className="text-blue-400 underline">browse</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Supports .xlsx spreadsheets (maximum 2,000 rows, 5MB)
                        </p>
                      </div>
                    </label>

                    <div className="pt-2 border-t border-slate-900/60 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition"
                      >
                        {downloadingTemplate ? (
                          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>Download Template (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenTemplateModal}
                        className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-300 text-xs font-medium flex items-center space-x-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Structure & Samples</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleForTest}
                        disabled={quickTesting}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center space-x-1.5 transition"
                      >
                        {quickTesting ? (
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>Quick Test with Sample</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="submit"
                  disabled={!selectedFile || previewLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-2"
                >
                  {previewLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{previewLoading ? 'Inspecting & Validating...' : 'Inspect & Preview Results'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Step 2: Preview Results Section */}
          {previewData && (
            <div className="space-y-6">
              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Rows</span>
                  <span className="text-xl font-bold text-slate-100">{previewData.counts.totalRows}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-950/10">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono block">Valid & Ready</span>
                  <span className="text-xl font-bold text-emerald-400">{previewData.counts.validRows}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 bg-rose-950/10">
                  <span className="text-[10px] text-rose-400 uppercase font-mono block">Invalid / Errors</span>
                  <span className="text-xl font-bold text-rose-400">{previewData.counts.invalidRows}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 bg-amber-950/10">
                  <span className="text-[10px] text-amber-400 uppercase font-mono block">Duplicate Rows</span>
                  <span className="text-xl font-bold text-amber-400">{previewData.counts.duplicateRows}</span>
                </div>

                <div
                  className={`p-4 rounded-xl bg-slate-900 border transition ${
                    previewData.counts.previouslyProcessedRows > 0
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-mono block ${
                      previewData.counts.previouslyProcessedRows > 0
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    Already Recorded
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      previewData.counts.previouslyProcessedRows > 0
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {previewData.counts.previouslyProcessedRows}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 bg-indigo-950/10">
                  <span className="text-[10px] text-indigo-400 uppercase font-mono block">Eligible Credits</span>
                  <span className="text-xl font-bold text-indigo-400">
                    {previewData.counts.totalEligibleCredits}
                  </span>
                </div>
              </div>

              {/* Errors Accordion / List if any */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Validation Errors Detected ({previewData.errors.length})</span>
                  </div>
                  <p className="text-xs text-rose-300">
                    The following rows violate integrity or identity constraints and will be rejected automatically:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                    {previewData.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-500/20 text-xs flex items-center justify-between text-rose-300 font-mono"
                      >
                        <span>
                          Row {err.rowNumber}: [{err.studentAbcId}] - {err.courseCode}
                        </span>
                        <span className="text-rose-400 font-sans font-medium text-[11px]">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Banner to Confirm */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    Ready to Confirm & Award Academic Credits?
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {previewData.counts.validRows} new rows verified. Credits will be computed authoritatively from catalog.
                    {previewData.counts.previouslyProcessedRows > 0 && (
                      <span className="text-amber-300/90 block font-medium mt-0.5">
                        Notice: {previewData.counts.previouslyProcessedRows} record(s) already exist with awarded credits and will be safely skipped.
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={previewData.counts.validRows === 0 || confirmLoading}
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Results & Award Credits</span>
                </button>
              </div>

              {/* Preview Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">Inspected Rows Preview ({previewData.items.length})</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Term: {previewData.academicYear} • Sem {previewData.semester}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-3">Row</th>
                        <th className="px-3.5 py-3">ABC ID</th>
                        <th className="px-3.5 py-3">Student Name</th>
                        <th className="px-3.5 py-3">Current Sem</th>
                        <th className="px-3.5 py-3">Course Code</th>
                        <th className="px-3.5 py-3">Catalog Name</th>
                        <th className="px-3.5 py-3">Marks</th>
                        <th className="px-3.5 py-3">Grade</th>
                        <th className="px-3.5 py-3">Status</th>
                        <th className="px-3.5 py-3">Credits</th>
                        <th className="px-3.5 py-3">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {previewData.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`transition ${
                            item.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/10 hover:bg-rose-950/20'
                          }`}
                        >
                          <td className="px-3.5 py-2.5 font-mono text-slate-500">{item.rowNumber}</td>
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-blue-400">
                            {item.studentAbcId}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-200">{item.studentName}</td>
                          <td className="px-3.5 py-2.5 text-slate-400 font-mono">Sem {item.currentSemester}</td>
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-indigo-400">
                            {item.courseCode}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-300 max-w-[180px] truncate">
                            {item.courseName}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-200">
                            {item.marks !== null ? item.marks : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 font-bold font-mono">
                            <span
                              className={
                                item.grade === 'F' ? 'text-rose-400' : 'text-emerald-400'
                              }
                            >
                              {item.grade}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.resultStatus === 'PASS'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.resultStatus}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 font-bold font-mono">
                            {item.isAlreadyProcessed ? (
                              <span className="text-amber-400/90 text-[11px] font-normal" title="Credits previously awarded">
                                0 / {item.credits} (Earned)
                              </span>
                            ) : (
                              <span className="text-slate-100">
                                {item.eligibleCredits} / {item.credits}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            {item.isAlreadyProcessed ? (
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-amber-400 text-[11px] font-semibold flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                  <span>Already Exists (Skipped)</span>
                                </span>
                                <span className="text-[10px] text-amber-300/80 leading-tight">
                                  {item.alreadyExistsReason || 'Credits already awarded for this course'}
                                </span>
                              </div>
                            ) : item.isValid ? (
                              <span className="text-emerald-400 text-[11px] font-medium flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                <span>Verified Ready</span>
                              </span>
                            ) : (
                              <span className="text-rose-400 text-[11px] font-medium" title={item.rejectionReason}>
                                Rejected: {item.rejectionReason}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: IMPORT BATCHES & AUDIT HISTORY */}
      {/* ============================================================ */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Historical Ingestion Batches</span>
            </h3>
            <button
              onClick={fetchBatches}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Batches</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {batchesLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading batch audit records...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No import batches recorded yet.</p>
                <p className="text-xs text-slate-500 mt-1">Uploaded spreadsheets will log full batch telemetry here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Batch ID</th>
                      <th className="px-4 py-3">Academic Term</th>
                      <th className="px-4 py-3">Uploaded On</th>
                      <th className="px-4 py-3">Total Rows</th>
                      <th className="px-4 py-3">Processed</th>
                      <th className="px-4 py-3">Credits Awarded</th>
                      <th className="px-4 py-3">Students Advanced</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {batches.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-semibold text-blue-400">{b.batchId}</td>
                        <td className="px-4 py-3 text-slate-200">
                          {b.academicYear} • Sem {b.semester}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono">{b.totalRows}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{b.processedRows}</td>
                        <td className="px-4 py-3 font-mono text-indigo-400 font-bold">{b.creditsAwarded}</td>
                        <td className="px-4 py-3 font-mono text-amber-400">{b.studentsAdvanced || 0}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  const details = await institutionService.getBatchDetails(b.batchId);
                                  setSelectedBatch(details.data);
                                } catch (e) {
                                  alert('Could not load batch details');
                                }
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                            >
                              Inspect Details
                            </button>
                            {b.status === 'PREVIEW' && (
                              <button
                                onClick={() => handleConfirmImport(b.batchId)}
                                disabled={confirmLoading}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1 shadow-sm transition"
                                title="Confirm this preview batch and award academic credits"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm & Award</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SEMESTER RESULTS LEDGER */}
      {/* ============================================================ */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search by student ABC ID, name, or course code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={ledgerSemFilter}
                onChange={(e) => {
                  setLedgerSemFilter(e.target.value);
                  fetchLedger();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchLedger}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Refresh Ledger"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {ledgerLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading semester results ledger...</div>
            ) : filteredLedger.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No semester results recorded yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once Excel results batches are confirmed, official semester result records will populate here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Student ABC ID</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Current Sem</th>
                      <th className="px-4 py-3">Course Code</th>
                      <th className="px-4 py-3">Course Name</th>
                      <th className="px-4 py-3">Result Term</th>
                      <th className="px-4 py-3">Marks</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Credits Earned</th>
                      <th className="px-4 py-3 text-right">Audited Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLedger.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-semibold text-blue-400">
                          {r.studentAbcId}
                        </td>
                        <td className="px-4 py-3 text-slate-100 font-medium">{r.studentId?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          Sem {r.studentId?.currentSemester || 1}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-indigo-400">{r.courseCode}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate">
                          {r.courseId?.courseName || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          Sem {r.semester} ({r.academicYear})
                        </td>
                        <td className="px-4 py-3 font-mono">{r.marks !== null ? r.marks : '—'}</td>
                        <td className="px-4 py-3 font-mono font-bold">
                          <span className={r.grade === 'F' ? 'text-rose-400' : 'text-emerald-400'}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.resultStatus === 'PASS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {r.resultStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-100">{r.creditsEarned}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setCorrectionTarget(r);
                              setCorrectionMarks(r.marks !== null ? String(r.marks) : '');
                              setCorrectionGrade(r.grade || '');
                              setCorrectionReason('');
                            }}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                          >
                            Correct Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {showConfirmModal && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-100">
              Confirm Semester Results & Accumulate Credits
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              You are confirming the import for{' '}
              <span className="text-slate-200 font-semibold">{previewData.counts.validRows} valid rows</span> for{' '}
              <span className="text-blue-400 font-semibold">
                Semester {previewData.semester} ({previewData.academicYear})
              </span>
              . Eligible passing results will immediately earn authoritative credits and advance qualifying students to Semester{' '}
              {previewData.semester + 1}.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Valid Records:</span>
                <span className="text-emerald-400 font-bold">{previewData.counts.validRows}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Credits to Award:</span>
                <span className="text-indigo-400 font-bold">{previewData.counts.totalEligibleCredits}</span>
              </div>
              {previewData.counts.previouslyProcessedRows > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Already Existing (Will be Skipped):</span>
                  <span className="font-bold">{previewData.counts.previouslyProcessedRows}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Invalid Records to Skip:</span>
                <span className="text-rose-400 font-bold">{previewData.counts.invalidRows}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
              >
                {confirmLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmLoading ? 'Confirming...' : 'Yes, Import & Award Credits'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BATCH INSPECT MODAL */}
      {/* ============================================================ */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Batch Inspection • {selectedBatch.batchId}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedBatch.academicYear} • Sem {selectedBatch.semester} • File: {selectedBatch.originalFileName}
                </p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Total Rows</span>
                <span className="font-bold text-slate-100">{selectedBatch.totalRows}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-emerald-500 block">Processed</span>
                <span className="font-bold text-emerald-400">{selectedBatch.processedRows}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-indigo-500 block">Credits Awarded</span>
                <span className="font-bold text-indigo-400">{selectedBatch.creditsAwarded}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-amber-500 block">Students Advanced</span>
                <span className="font-bold text-amber-400">{selectedBatch.studentsAdvanced || 0}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              <h4 className="text-xs font-bold text-slate-300">
                Errors Logged ({selectedBatch.errors?.length || 0})
              </h4>
              {selectedBatch.errors && selectedBatch.errors.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedBatch.errors.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/20 text-xs text-rose-300 font-mono flex items-center justify-between"
                    >
                      <span>
                        Row {e.rowNumber}: [{e.studentAbcId}] {e.courseCode}
                      </span>
                      <span className="text-[11px] text-rose-400 font-sans">{e.reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No error items recorded in this batch.</p>
              )}
            </div>

            {selectedBatch.status === 'PREVIEW' && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-300">Unconfirmed Preview Batch</p>
                  <p className="text-[11px] text-amber-400/80">
                    {selectedBatch.validRows} valid rows ready for Semester {selectedBatch.semester} ({selectedBatch.academicYear}). Credits not yet awarded.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={() => handleConfirmImport(selectedBatch.batchId)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{confirmLoading ? 'Confirming...' : 'Confirm & Award Credits'}</span>
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {selectedBatch.status === 'PREVIEW' ? (
                <button
                  type="button"
                  onClick={() => handleLoadBatchIntoPreview(selectedBatch.batchId)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Load into Preview Table
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedBatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AUDITED CORRECTION MODAL */}
      {/* ============================================================ */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Audited Result Correction</span>
            </h3>

            <p className="text-xs text-slate-400">
              Student: <span className="font-mono text-blue-400">{correctionTarget.studentAbcId}</span> • Course:{' '}
              <span className="font-mono text-indigo-400">{correctionTarget.courseCode}</span> (Sem{' '}
              {correctionTarget.semester})
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">New Marks (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={correctionMarks}
                  onChange={(e) => setCorrectionMarks(e.target.value)}
                  placeholder="e.g. 78"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">New Grade</label>
                <select
                  value={correctionGrade}
                  onChange={(e) => setCorrectionGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Keep / Auto-calculate</option>
                  {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Mandatory Audit Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Re-evaluation paper correction per institutional examination board"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center space-x-2"
                >
                  {correctionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Audited Correction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TEMPLATE GUIDE & SAMPLE DATA MODAL */}
      {/* ============================================================ */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Results Import Spreadsheet Template Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Expected columns, validation specifications, and realistic sample data for your institution
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {templateLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Fetching institution schema & sample data...</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Enrolled Students in DB</span>
                      <span className="text-sm font-bold text-slate-200">
                        {templateData?.availableStudents?.length || 0} Students Available
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Institution Courses in DB</span>
                      <span className="text-sm font-bold text-slate-200">
                        {templateData?.availableCourses?.length || 0} Active Courses
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">File Format</span>
                      <span className="text-sm font-bold text-slate-200">.xlsx (Excel 2007+)</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Sample Rows Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                      <Table className="w-3.5 h-3.5 text-blue-400" />
                      <span>Live Sample Rows in Downloaded Template (Sheet 1: 'Results Template')</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {templateData?.sampleRows?.length || 0} rows included
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                          <th className="py-2.5 px-3">ABC ID</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Course Code</th>
                          <th className="py-2.5 px-3">Course Name</th>
                          <th className="py-2.5 px-3 text-center">Marks</th>
                          <th className="py-2.5 px-3 text-center">Grade</th>
                          <th className="py-2.5 px-3 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                        {templateData?.sampleRows && templateData.sampleRows.length > 0 ? (
                          templateData.sampleRows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition">
                              <td className="py-2 px-3 text-blue-300 font-bold">{r['ABC ID']}</td>
                              <td className="py-2 px-3 text-slate-200">{r['Student Name']}</td>
                              <td className="py-2 px-3 text-indigo-300 font-bold">{r['Course Code']}</td>
                              <td className="py-2 px-3 text-slate-400 truncate max-w-[200px]">{r['Course Name']}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-200">{r.Marks}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  r.Grade === 'F' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {r.Grade}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.Status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {r.Status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="py-4 text-center text-slate-500">
                              No sample rows generated yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Expected Column Specifications */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Required Column Specifications & Validation Rules</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-blue-400 text-xs">ABC ID / Student ID</span>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Must match an existing registered student's ABC ID in your institution directory. New students cannot be created from results.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-indigo-400 text-xs">Course Code</span>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Must match an active course cataloged in your institution curriculum (e.g. 22MA101, 22PH102).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-amber-400 text-xs">Marks</span>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Numeric score between 0 and 100. Scores &gt;= 40 are eligible for passing credits.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-emerald-400 text-xs">Grade</span>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">Required</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Official NEP letter grades: O, A+, A, B+, B, C, P, or F.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: NEP Grading Scale Reference */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Official NEP Grading Scale Reference
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {templateData?.gradingScale?.map((g, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-center">
                        <span className={`text-xs font-black block ${g.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {g.grade}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">{g.range}</span>
                        <span className="text-[9px] text-slate-400 font-mono block">{g.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadSampleForTest}
                  disabled={quickTesting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  {quickTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Test with Sample in Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition"
                >
                  {downloadingTemplate ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download .xlsx File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
