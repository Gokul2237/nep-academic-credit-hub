import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Building2,
  GraduationCap,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import certificateService from '../../services/certificateService';

export default function PublicCertificateVerificationPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchId, setSearchId] = useState(id || '');

  useEffect(() => {
    if (id) {
      verifyRecord(id);
    }
  }, [id]);

  const verifyRecord = async (certId) => {
    try {
      setLoading(true);
      setError('');
      setCertificate(null);
      const res = await certificateService.verifyCertificate(certId.trim());
      if (res && res.data) {
        setCertificate(res.data);
      } else {
        setError('Verification response did not contain valid certificate details.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Certificate not found or invalid certificate ID.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (certificate?.certificateId) {
      navigator.clipboard.writeText(certificate.certificateId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition duration-150">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                NEP Academic Credit Hub
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Public Certificate Credential Verification
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-10 flex-1">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-base font-semibold text-slate-200">
              Verifying Certificate Cryptographic Authenticity...
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Validating against National Education Policy registry
            </p>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Certificate Verification Failed</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {error}
              </p>
            </div>

            {/* Quick Re-Verify Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchId.trim()) verifyRecord(searchId.trim());
              }}
              className="flex items-center space-x-2 pt-2"
            >
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Certificate ID (e.g. NEP-CERT-...)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Verify
              </button>
            </form>

            <div className="pt-2">
              <Link to="/" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Return to Home
              </Link>
            </div>
          </div>
        ) : certificate ? (
          <div className="space-y-6">
            {/* Status Banner */}
            {certificate.isValid ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Official Academic Certificate Verified
                    </h3>
                    <p className="text-xs text-emerald-400/80 mt-0.5">
                      Cryptographic SHA-256 seal verified and academic credit record confirmed authentic.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition self-start sm:self-center print:hidden"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Print Document</span>
                </button>
              </div>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-300">
                    Certificate Is Not Valid / Revoked
                  </h3>
                  <p className="text-xs text-rose-400/80 mt-1">
                    {certificate.revokedAt
                      ? `This certificate was officially revoked on ${new Date(
                          certificate.revokedAt
                        ).toLocaleDateString()}.`
                      : certificate.verificationStatus !== 'verified'
                      ? `This certificate has status: ${certificate.verificationStatus}.`
                      : 'Integrity hash validation failed. The contents may have been tampered with.'}
                  </p>
                </div>
              </div>
            )}

            {/* Certificate Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-slate-300">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 print:bg-slate-100">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white print:text-black">
                      {certificate.title}
                    </h2>
                    <p className="text-xs text-slate-400 print:text-slate-600">
                      Type: {certificate.certificateType?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500 print:text-slate-600">Certificate ID</div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="font-mono text-xs font-bold text-indigo-400 print:text-black">
                      {certificate.certificateId}
                    </span>
                    <button
                      onClick={handleCopyId}
                      title="Copy Certificate ID"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition print:hidden"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipient & Issuer Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                    Awarded To
                  </span>
                  <div className="font-bold text-sm text-white print:text-black">
                    {certificate.student?.name || 'Verified Student'}
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5 print:text-slate-600">
                    Student ABC ID: {certificate.student?.studentId || 'N/A'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                    Issuing Institution
                  </span>
                  <div className="font-bold text-sm text-white print:text-black">
                    {certificate.institution?.name || 'Academic Institution'}
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5 print:text-slate-600">
                    Code: {certificate.institution?.code} • {certificate.institution?.type?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Course & Credit Details */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-50 print:border-slate-200 space-y-3 text-xs">
                <span className="text-slate-500 text-[11px] uppercase tracking-wider block">
                  Academic Achievement Details
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Course</span>
                    <span className="font-semibold text-white print:text-black">
                      {certificate.course?.courseName || 'Course'}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      {certificate.course?.courseCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Department / Level</span>
                    <span className="font-semibold text-white print:text-black">
                      {certificate.course?.department || 'General'}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {certificate.course?.courseLevel || 'Undergraduate'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Credits & Grade</span>
                    <span className="font-bold text-indigo-400 print:text-indigo-700">
                      {certificate.academicCredit?.credits || certificate.course?.credits || 0} Credits
                    </span>
                    <span className="block text-[10px] text-slate-300 print:text-slate-700">
                      Grade: {certificate.academicCredit?.grade || 'Verified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Issue Date</span>
                    <span className="font-semibold text-white print:text-black">
                      {new Date(certificate.issueDate).toLocaleDateString()}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Sem: {certificate.academicCredit?.semester || '1'} ({certificate.academicCredit?.academicYear || '2025-26'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Verification Footer */}
              <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
                  <span>Tamper-proof digital seal verified against National Academic Credit Hub</span>
                </div>
                <span className="font-mono text-[10px] text-slate-600 print:text-slate-400">
                  Status: {certificate.verificationStatus?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 NEP Academic Credit Hub. All rights reserved.</p>
          <p>National Academic Bank of Credits Portal</p>
        </div>
      </footer>
    </div>
  );
}
