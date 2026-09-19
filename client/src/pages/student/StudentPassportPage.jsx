import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import certificateService from '../../services/certificateService';
import api from '../../services/api';

const StudentPassportPage = () => {
  const [wallet, setWallet] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPassport();
  }, []);

  const loadPassport = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        walletResponse,
        timelineResponse,
        certificateResponse,
      ] = await Promise.all([
        api.get('/credits/wallet-summary'),
        api.get('/credits/timeline'),
        certificateService.getCertificates(),
      ]);

      const walletData = walletResponse.data?.data || walletResponse.data;
      setWallet(walletData);

      const timelineRaw =
        timelineResponse.data?.data ||
        timelineResponse.data ||
        {};

      const flattenTimelineData = (data) => {
        if (Array.isArray(data)) return data;
        if (!data || typeof data !== 'object') return [];
        const records = [];
        Object.values(data).forEach((yearObj) => {
          if (yearObj && typeof yearObj === 'object') {
            if (Array.isArray(yearObj.records)) {
              records.push(...yearObj.records);
            } else if (yearObj.semesters && typeof yearObj.semesters === 'object') {
              Object.values(yearObj.semesters).forEach((semObj) => {
                if (semObj && Array.isArray(semObj.records)) {
                  records.push(...semObj.records);
                }
              });
            }
          }
        });
        return records.length > 0 ? records : (walletData?.credits || []);
      };

      setTimeline(flattenTimelineData(timelineRaw));

      setCertificates(
        certificateResponse.data?.data ||
          certificateResponse.data ||
          []
      );

    } catch (err) {
      console.error('Passport loading error:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load academic passport.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'verified') {
      return (
        <CheckCircle
          size={18}
          className="text-green-600"
        />
      );
    }

    if (status === 'rejected') {
      return (
        <XCircle
          size={18}
          className="text-red-600"
        />
      );
    }

    return (
      <Clock
        size={18}
        className="text-yellow-600"
      />
    );
  };

  const getStatusClass = (status) => {
    if (status === 'verified') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'rejected') {
      return 'bg-red-100 text-red-700';
    }

    if (status === 'revoked') {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-yellow-100 text-yellow-700';
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-gray-500">
          Loading academic passport...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="text-red-600" />
          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load passport
            </h2>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={loadPassport}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalCredits =
    wallet?.totalCredits ??
    wallet?.credits ??
    0;

  const verifiedCredits =
    wallet?.verifiedCredits ??
    0;

  const totalCourses =
    wallet?.totalCourses ??
    wallet?.coursesCompleted ??
    timeline.length;

  const verifiedCertificates =
    certificates.filter(
      (certificate) =>
        certificate.verificationStatus === 'verified'
    ).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <GraduationCap size={32} />

              <h1 className="text-2xl font-bold">
                Academic Credit Passport
              </h1>
            </div>

            <p className="mt-2 text-sm text-indigo-100">
              Your standardized digital record of academic
              credits, achievements and certificates.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3">
            <ShieldCheck size={22} />

            <div>
              <p className="text-xs text-indigo-100">
                Passport Status
              </p>

              <p className="font-semibold">
                Digitally Verifiable
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-100 p-3">
              <Award className="text-blue-600" />
            </div>

            <TrendingUp className="text-gray-300" />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Total Credits
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {totalCredits}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-green-100 p-3 w-fit">
            <CheckCircle className="text-green-600" />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Verified Credits
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {verifiedCredits}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-purple-100 p-3 w-fit">
            <BookOpen className="text-purple-600" />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Academic Courses
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {totalCourses}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-orange-100 p-3 w-fit">
            <ShieldCheck className="text-orange-600" />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Verified Certificates
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {verifiedCertificates}
          </p>
        </div>
      </div>

      {/* Academic Timeline */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp
              size={20}
              className="text-indigo-600"
            />

            Academic Credit Timeline
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Chronological record of your academic achievements.
          </p>
        </div>

        <div className="p-5">
          {timeline.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No academic credit records found.
            </div>
          ) : (
            <div className="space-y-5">
              {timeline.map((item, index) => (
                <div
                  key={
                    item._id ||
                    item.id ||
                    index
                  }
                  className="relative flex gap-4"
                >
                  {index !== timeline.length - 1 && (
                    <div className="absolute left-[15px] top-8 h-full w-px bg-gray-200" />
                  )}

                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <Award
                      size={16}
                      className="text-indigo-600"
                    />
                  </div>

                  <div className="flex-1 rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.courseName ||
                            item.courseId?.courseName ||
                            item.title ||
                            'Academic Credit'}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {item.courseCode ||
                            item.courseId?.courseCode ||
                            'Course'}
                        </p>
                      </div>

                      <span className="font-semibold text-indigo-600">
                        {item.credits ??
                          item.creditPoints ??
                          0}{' '}
                        Credits
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                      {item.semester && (
                        <span>
                          Semester: {item.semester}
                        </span>
                      )}

                      {item.academicYear && (
                        <span>
                          Academic Year:{' '}
                          {item.academicYear}
                        </span>
                      )}

                      {item.verificationStatus && (
                        <span
                          className={`rounded-full px-2 py-1 ${getStatusClass(
                            item.verificationStatus
                          )}`}
                        >
                          {item.verificationStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certificates */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <ShieldCheck
              size={20}
              className="text-indigo-600"
            />

            Digital Certificates
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Certificates linked to your verified academic
            achievements.
          </p>
        </div>

        <div className="overflow-x-auto">
          {certificates.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No certificates have been issued yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">
                    Certificate
                  </th>

                  <th className="px-5 py-3">
                    Institution
                  </th>

                  <th className="px-5 py-3">
                    Issue Date
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {certificates.map((certificate) => (
                  <tr
                    key={certificate._id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {certificate.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {certificate.certificateId}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {certificate.institutionId?.name ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {certificate.issueDate
                        ? new Date(
                            certificate.issueDate
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          certificate.verificationStatus
                        )}`}
                      >
                        {getStatusIcon(
                          certificate.verificationStatus
                        )}

                        {certificate.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Integrity Information */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <div className="flex gap-3">
          <ShieldCheck
            className="mt-0.5 shrink-0 text-indigo-600"
          />

          <div>
            <h3 className="font-semibold text-indigo-900">
              Digital Integrity Protection
            </h3>

            <p className="mt-1 text-sm leading-6 text-indigo-700">
              Certificates issued through the platform are
              protected using SHA-256 integrity seals. This
              allows institutions and authorized verifiers to
              validate whether certificate information has been
              altered.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentPassportPage;