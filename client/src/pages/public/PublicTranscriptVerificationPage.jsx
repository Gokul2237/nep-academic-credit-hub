import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Building2,
  User,
  GraduationCap,
  Download,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import transcriptService from '../../services/transcriptService';

export default function PublicTranscriptVerificationPage() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchCode, setSearchCode] = useState(code || '');

  useEffect(() => {
    if (code) {
      verifyRecord(code);
    }
  }, [code]);

  const verifyRecord = async (verificationCode) => {
    try {
      setLoading(true);
      setError('');
      setTranscript(null);
      const res = await transcriptService.verifyTranscript(verificationCode.trim());
      if (res && res.data) {
        setTranscript(res.data);
      } else {
        setError('Verification response did not contain valid transcript details.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Transcript not found or invalid verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (transcript?.verificationCode) {
      navigator.clipboard.writeText(transcript.verificationCode);
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
                Public Trust Verification Gateway
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
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-base font-semibold text-slate-200">
              Verifying Cryptographic Transcript Signature...
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Querying National Academic Credit Ledger
            </p>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Transcript Verification Failed</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {error}
              </p>
            </div>

            {/* Quick Re-Verify Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchCode.trim()) verifyRecord(searchCode.trim());
              }}
              className="flex items-center space-x-2 pt-2"
            >
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Verification Code (e.g. TR-VER-...)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                Verify
              </button>
            </form>

            <div className="pt-2">
              <Link to="/" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                Return to Home
              </Link>
            </div>
          </div>
        ) : transcript ? (
          <div className="space-y-6">
            {/* Status Banner */}
            {transcript.isValid ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 sm:mt-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">
                      Official Academic Transcript Verified
                    </h3>
                    <p className="text-xs text-emerald-400/80 mt-0.5">
                      Cryptographic SHA-256 seal matches and state is valid in the NEP Academic Credit Hub.
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
                    Transcript Is Not Valid / Revoked
                  </h3>
                  <p className="text-xs text-rose-400/80 mt-1">
                    {transcript.status === 'revoked'
                      ? `This transcript was officially revoked by the institution on ${new Date(
                          transcript.revokedAt
                        ).toLocaleDateString()}.${
                          transcript.revocationReason
                            ? ` Reason: ${transcript.revocationReason}`
                            : ''
                        }`
                      : 'Integrity hash validation failed. The contents may have been tampered with.'}
                  </p>
                </div>
              </div>
            )}

            {/* Transcript Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-slate-300">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 print:bg-slate-100">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white print:text-black">
                      {transcript.institution?.name || 'Academic Institution'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono print:text-slate-600">
                      Institution Code: {transcript.institution?.code} • {transcript.institution?.type?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500 print:text-slate-600">Verification Code</div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="font-mono text-xs font-bold text-blue-400 print:text-black">
                      {transcript.verificationCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      title="Copy Verification Code"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition print:hidden"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Student Academic Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                    Student Information
                  </span>
                  <div className="font-bold text-sm text-white print:text-black">
                    {transcript.student?.name || 'Verified Student'}
                  </div>
                  <div className="text-slate-400 font-mono mt-0.5 print:text-slate-600">
                    ABC Student ID: {transcript.student?.studentId || 'N/A'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 print:bg-slate-50 print:border-slate-200">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                    Transcript Metadata
                  </span>
                  <div className="font-bold text-sm text-white print:text-black font-mono">
                    {transcript.transcriptId}
                  </div>
                  <div className="text-slate-400 mt-0.5 print:text-slate-600">
                    Generated: {new Date(transcript.generatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Credit Summary Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-xl sm:text-2xl font-bold text-white print:text-black">
                    {transcript.totalCredits}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wider">
                    Total Credits
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 print:text-emerald-700">
                    {transcript.verifiedCredits}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wider">
                    Verified Credits
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-xl sm:text-2xl font-bold text-blue-400 print:text-blue-700">
                    {transcript.creditRecordCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wider">
                    Courses Count
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
                  Status: {transcript.status?.toUpperCase()}
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
