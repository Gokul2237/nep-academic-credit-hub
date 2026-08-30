const crypto = require('crypto');

/**
 * Generate a deterministic SHA-256 integrity hash for an academic credit record.
 * This provides an integrity verification mechanism to detect unexpected changes
 * to stored credit data across institutional exchanges.
 *
 * @param {Object} params - Credit record fields
 * @param {String} params.studentId - Student ObjectId or String
 * @param {String} params.courseId - Course ObjectId or String
 * @param {String} params.institutionId - Institution ObjectId or String
 * @param {Number} params.credits - Numeric credit value
 * @param {String} params.grade - Academic grade (e.g. "A+", "O")
 * @param {Number} params.semester - Semester number
 * @param {String} params.academicYear - Academic year (e.g. "2025-26")
 * @returns {String} Hex-encoded SHA-256 integrity hash
 */
const generateCreditHash = ({
  studentId,
  courseId,
  institutionId,
  credits,
  grade,
  semester,
  academicYear,
}) => {
  const stdId = studentId ? (studentId._id || studentId).toString() : '';
  const crsId = courseId ? (courseId._id || courseId).toString() : '';
  const instId = institutionId ? (institutionId._id || institutionId).toString() : '';
  const crd = Number(credits);
  const grd = String(grade || '').trim().toUpperCase();
  const sem = Number(semester);
  const yr = String(academicYear || '').trim();

  const payload = `NEP-CREDIT-INTEGRITY::student=${stdId}|course=${crsId}|institution=${instId}|credits=${crd}|grade=${grd}|semester=${sem}|year=${yr}`;

  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Verify whether an academic credit's stored integrity hash matches its data
 * @param {Object} credit - AcademicCredit document or object
 * @returns {Boolean} True if valid, false if tampered or mismatched
 */
const verifyCreditIntegrity = (credit) => {
  if (!credit || !credit.integrityHash) {
    return false;
  }
  const calculatedHash = generateCreditHash({
    studentId: credit.studentId,
    courseId: credit.courseId,
    institutionId: credit.institutionId,
    credits: credit.credits,
    grade: credit.grade,
    semester: credit.semester,
    academicYear: credit.academicYear,
  });
  return calculatedHash === credit.integrityHash;
};

module.exports = {
  generateCreditHash,
  verifyCreditIntegrity,
};
