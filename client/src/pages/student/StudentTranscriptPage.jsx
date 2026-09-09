import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import api from '../../services/api';
import certificateService from '../../services/certificateService';

export default function StudentTranscriptPage() {
  const [credits, setCredits] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTranscript();
  }, []);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        creditsResponse,
        walletResponse,
        certificatesResponse,
      ] = await Promise.all([
        api.get('/credits'),
        api.get('/credits/wallet-summary'),
        certificateService.getCertificates(),
      ]);

      setCredits(
        creditsResponse.data?.data ||
          creditsResponse.data ||
          []
      );

      setWallet(
        walletResponse.data?.data ||
          walletResponse.data ||
          null
      );

      setCertificates(
        certificatesResponse.data?.data ||
          certificatesResponse.data ||
          []
      );
    } catch (err) {
      console.error(
        'Transcript Load Error:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load your academic transcript.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifiedCredits = useMemo(() => {
    return credits.filter(
      (credit) =>
        credit.verificationStatus === 'verified'
    );
  }, [credits]);

  const totalCredits = useMemo(() => {
    return verifiedCredits.reduce(
      (total, credit) =>
        total + Number(credit.credits || 0),
      0
    );
  }, [verifiedCredits]);

  const verifiedCertificates = useMemo(() => {
    return certificates.filter(
      (certificate) =>
        certificate.verificationStatus ===
          'verified' &&
        !certificate.revokedAt
    );
  }, [certificates]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-slate-400">
            Preparing your official transcript...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-2xl p-6 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-white mb-2">
            Unable to Load Transcript
          </h2>

          <p className="text-sm text-slate-400 mb-5">
            {error}
          </p>

          <button
            type="button"
            onClick={loadTranscript}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:bg-white print:text-black">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-400" />

            <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
              Official Academic Record
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Verifiable Digital Transcript
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Consolidated academic credit record generated from
            your verified NEP Academic Hub records.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20"
        >
          <Download className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Printable Transcript */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden print:bg-white print:border print:border-slate-300 print:rounded-none">

        {/* Transcript Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800 print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center print:bg-slate-800">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white print:text-black">
                  NEP Academic Credit Hub
                </h2>

                <p className="text-sm text-slate-400 print:text-slate-600">
                  Official Verifiable Digital Transcript
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 print:text-emerald-700" />

              <span className="text-emerald-400 font-semibold print:text-emerald-700">
                Digitally Verifiable Record
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-800 print:border-slate-300">

          <div className="p-5 border-r border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Total Credits
            </p>

            <p className="text-2xl font-bold text-white mt-1 print:text-black">
              {wallet?.totalCredits ?? totalCredits}
            </p>
          </div>

          <div className="p-5 lg:border-r border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Verified Credits
            </p>

            <p className="text-2xl font-bold text-emerald-400 mt-1 print:text-emerald-700">
              {wallet?.verifiedCredits ?? totalCredits}
            </p>
          </div>

          <div className="p-5 border-r border-t lg:border-t-0 border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Academic Records
            </p>

            <p className="text-2xl font-bold text-white mt-1 print:text-black">
              {verifiedCredits.length}
            </p>
          </div>

          <div className="p-5 border-t lg:border-t-0 border-slate-800 print:border-slate-300">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Certificates
            </p>

            <p className="text-2xl font-bold text-white mt-1 print:text-black">
              {verifiedCertificates.length}
            </p>
          </div>
        </div>

        {/* Academic Records */}
        <div className="p-6 sm:p-8">

          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-5 h-5 text-blue-400 print:text-slate-700" />

            <h3 className="text-lg font-semibold text-white print:text-black">
              Academic Credit Records
            </h3>
          </div>

          {verifiedCredits.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-700 rounded-xl">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />

              <p className="text-sm text-slate-400">
                No verified academic credit records found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 print:border-slate-300">
                    <th className="text-left px-3 py-3 text-xs uppercase tracking-wider text-slate-500">
                      Course
                    </th>

                    <th className="text-left px-3 py-3 text-xs uppercase tracking-wider text-slate-500">
                      Code
                    </th>

                    <th className="text-left px-3 py-3 text-xs uppercase tracking-wider text-slate-500">
                      Grade
                    </th>

                    <th className="text-center px-3 py-3 text-xs uppercase tracking-wider text-slate-500">
                      Credits
                    </th>

                    <th className="text-center px-3 py-3 text-xs uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {verifiedCredits.map((credit) => {
                    const course =
                      credit.courseId || {};

                    return (
                      <tr
                        key={credit._id}
                        className="border-b border-slate-800/70 print:border-slate-300"
                      >
                        <td className="px-3 py-4">
                          <p className="font-medium text-white print:text-black">
                            {course.courseName ||
                              credit.courseName ||
                              'Academic Course'}
                          </p>

                          {course.institutionId?.name && (
                            <p className="text-xs text-slate-500 mt-1">
                              {course.institutionId.name}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-4 text-slate-400 print:text-slate-700">
                          {course.courseCode ||
                            credit.courseCode ||
                            '—'}
                        </td>

                        <td className="px-3 py-4 font-semibold text-white print:text-black">
                          {credit.grade || '—'}
                        </td>

                        <td className="px-3 py-4 text-center font-semibold text-blue-400 print:text-slate-700">
                          {credit.credits ?? 0}
                        </td>

                        <td className="px-3 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 print:text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr>
                    <td
                      colSpan="3"
                      className="px-3 py-4 text-right font-semibold text-slate-300 print:text-black"
                    >
                      Total Verified Credits
                    </td>

                    <td className="px-3 py-4 text-center font-bold text-blue-400 print:text-black">
                      {totalCredits}
                    </td>

                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Certificates */}
        <div className="px-6 pb-8 sm:px-8">

          <div className="flex items-center gap-2 mb-5">
            <Award className="w-5 h-5 text-amber-400 print:text-slate-700" />

            <h3 className="text-lg font-semibold text-white print:text-black">
              Verified Certificates
            </h3>
          </div>

          {verifiedCertificates.length === 0 ? (
            <p className="text-sm text-slate-500">
              No verified certificates associated with this transcript.
            </p>
          ) : (
            <div className="space-y-3">
              {verifiedCertificates.map((certificate) => (
                <div
                  key={certificate._id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-white print:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>
                      <p className="font-semibold text-white print:text-black">
                        {certificate.title}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Certificate ID:{' '}
                        <span className="font-mono">
                          {certificate.certificateId}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 print:text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Footer */}
        <div className="px-6 py-5 sm:px-8 bg-slate-950/70 border-t border-slate-800 print:bg-white print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 print:text-emerald-700" />

              <div>
                <p className="text-xs font-semibold text-slate-200 print:text-black">
                  Blockchain-style SHA-256 Integrity Protection
                </p>

                <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
                  Academic records are validated against the
                  integrity mechanisms of the NEP Academic Credit Hub.
                </p>
              </div>
            </div>

            <span className="text-[10px] text-slate-600 font-mono">
              NEP-TRANSCRIPT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}