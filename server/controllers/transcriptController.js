const crypto = require('crypto');
const mongoose = require('mongoose');

const { Transcript } = require('../models/Transcript');
const { AcademicCredit } = require('../models/AcademicCredit');
const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const ApiResponse = require('../utils/apiResponse');

/**
 * Generate deterministic SHA-256 hash for a transcript.
 */
const generateTranscriptHash = ({
  transcriptId,
  studentId,
  institutionId,
  totalCredits,
  verifiedCredits,
  creditRecordCount,
  transcriptType,
  generatedAt,
}) => {
  const payload =
    `NEP-TRANSCRIPT-INTEGRITY::` +
    `transcript=${transcriptId}|` +
    `student=${studentId}|` +
    `institution=${institutionId}|` +
    `totalCredits=${totalCredits}|` +
    `verifiedCredits=${verifiedCredits}|` +
    `count=${creditRecordCount}|` +
    `type=${String(transcriptType || '').trim()}|` +
    `generatedAt=${new Date(generatedAt).toISOString()}`;

  return crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');
};

/**
 * Verify transcript integrity hash.
 */
const verifyTranscriptIntegrity = (transcript) => {
  if (!transcript || !transcript.integrityHash) {
    return false;
  }

  const calculatedHash = generateTranscriptHash({
    transcriptId: transcript.transcriptId,
    studentId: transcript.studentId._id || transcript.studentId,
    institutionId: transcript.institutionId._id || transcript.institutionId,
    totalCredits: transcript.totalCredits,
    verifiedCredits: transcript.verifiedCredits,
    creditRecordCount: transcript.creditRecordCount,
    transcriptType: transcript.transcriptType,
    generatedAt: transcript.generatedAt,
  });

  return calculatedHash === transcript.integrityHash;
};

/**
 * Generate unique IDs for transcript.
 */
const generateTranscriptId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `NEP-TR-${timestamp}-${random}`;
};

const generateVerificationCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TR-VER-${timestamp}-${random}`;
};

/**
 * Generate a transcript.
 * POST /api/transcripts
 */
const generateTranscript = async (req, res) => {
  try {
    const {
      studentId: reqStudentId,
      transcriptType = 'official',
      institutionId: reqInstitutionId,
    } = req.body;

    let targetStudentId;

    if (req.user.role === ROLES.STUDENT) {
      if (reqStudentId && reqStudentId.toString() !== req.user._id.toString()) {
        return ApiResponse.error(
          res,
          'Access denied. Students can only generate their own transcript.',
          403
        );
      }
      targetStudentId = req.user._id;
    } else {
      if (!reqStudentId || !mongoose.Types.ObjectId.isValid(reqStudentId)) {
        return ApiResponse.error(
          res,
          'Valid studentId is required.',
          400
        );
      }
      targetStudentId = reqStudentId;
    }

    const student = await User.findById(targetStudentId);
    if (!student || student.role !== ROLES.STUDENT) {
      return ApiResponse.error(res, 'Student record not found.', 404);
    }

    let issuingInstitutionId;
    if (req.user.role === ROLES.INSTITUTION) {
      if (!req.user.institutionId) {
        return ApiResponse.error(res, 'User is not linked to an institution.', 400);
      }
      issuingInstitutionId = req.user.institutionId;

      const hasStudentAccess =
        (student.institutionId &&
          student.institutionId.toString() === issuingInstitutionId.toString()) ||
        (await AcademicCredit.exists({
          studentId: targetStudentId,
          institutionId: issuingInstitutionId,
        }));

      if (!hasStudentAccess) {
        return ApiResponse.error(
          res,
          'Access denied. You cannot generate a transcript for this student.',
          403
        );
      }
    } else if (req.user.role === ROLES.ADMIN) {
      issuingInstitutionId = reqInstitutionId || student.institutionId;
    } else {
      issuingInstitutionId = student.institutionId;
    }

    if (!issuingInstitutionId) {
      return ApiResponse.error(
        res,
        'Issuing institution could not be determined for this transcript.',
        400
      );
    }

    const institution = await Institution.findById(issuingInstitutionId);
    if (!institution) {
      return ApiResponse.error(res, 'Issuing institution not found.', 404);
    }

    const credits = await AcademicCredit.find({ studentId: targetStudentId });

    let totalCredits = 0;
    let verifiedCredits = 0;
    const creditRecordCount = credits.length;

    credits.forEach((c) => {
      if (c.verificationStatus !== 'rejected') {
        totalCredits += c.credits || 0;
      }
      if (c.verificationStatus === 'verified') {
        verifiedCredits += c.credits || 0;
      }
    });

    const transcriptId = generateTranscriptId();
    const verificationCode = generateVerificationCode();
    const generatedAt = new Date();

    const integrityHash = generateTranscriptHash({
      transcriptId,
      studentId: targetStudentId,
      institutionId: issuingInstitutionId,
      totalCredits,
      verifiedCredits,
      creditRecordCount,
      transcriptType,
      generatedAt,
    });

    const transcript = await Transcript.create({
      transcriptId,
      studentId: targetStudentId,
      institutionId: issuingInstitutionId,
      transcriptType,
      status: 'generated',
      generatedAt,
      generatedBy: req.user._id,
      totalCredits,
      verifiedCredits,
      creditRecordCount,
      integrityHash,
      verificationCode,
    });

    const populatedTranscript = await Transcript.findById(transcript._id)
      .populate('studentId', 'name email studentId')
      .populate('institutionId', 'name code type')
      .populate('generatedBy', 'name email role');

    return ApiResponse.created(
      res,
      populatedTranscript,
      'Academic transcript generated successfully.'
    );
  } catch (error) {
    console.error('Generate Transcript Error:', error);
    return ApiResponse.error(
      res,
      error.message || 'Failed to generate transcript.',
      500
    );
  }
};

/**
 * Get transcripts.
 * GET /api/transcripts
 */
const getTranscripts = async (req, res) => {
  try {
    const { studentId, institutionId, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (req.user.role === ROLES.STUDENT) {
      query.studentId = req.user._id;
    } else if (req.user.role === ROLES.INSTITUTION) {
      query.institutionId = req.user.institutionId;
      if (studentId) {
        query.studentId = studentId;
      }
    } else if (req.user.role === ROLES.ADMIN) {
      if (studentId) {
        query.studentId = studentId;
      }
      if (institutionId) {
        query.institutionId = institutionId;
      }
    }

    if (status) {
      query.status = status;
    }

    const numericPage = Math.max(1, Number(page));
    const numericLimit = Math.min(100, Math.max(1, Number(limit)));
    const skip = (numericPage - 1) * numericLimit;

    const total = await Transcript.countDocuments(query);
    const transcripts = await Transcript.find(query)
      .populate('studentId', 'name email studentId')
      .populate('institutionId', 'name code type')
      .populate('generatedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit);

    return ApiResponse.paginated(
      res,
      transcripts,
      total,
      numericPage,
      numericLimit,
      'Transcript records retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Transcripts Error:', error);
    return ApiResponse.error(res, 'Failed to fetch transcript records.', 500);
  }
};

/**
 * Get single transcript details.
 * GET /api/transcripts/:id
 */
const getTranscriptById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return ApiResponse.error(res, 'Invalid transcript ID.', 400);
    }

    const transcript = await Transcript.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('institutionId', 'name code type contactEmail')
      .populate('generatedBy', 'name email role');

    if (!transcript) {
      return ApiResponse.error(res, 'Transcript not found.', 404);
    }

    if (
      req.user.role === ROLES.STUDENT &&
      transcript.studentId._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You can only view your own transcripts.',
        403
      );
    }

    if (
      req.user.role === ROLES.INSTITUTION &&
      transcript.institutionId._id.toString() !== req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You cannot view transcripts belonging to another institution.',
        403
      );
    }

    const integrityVerified = verifyTranscriptIntegrity(transcript);

    const credits = await AcademicCredit.find({ studentId: transcript.studentId._id })
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code')
      .sort({ academicYear: -1, semester: -1 });

    return ApiResponse.success(
      res,
      {
        ...transcript.toObject(),
        credits,
        integrityVerified,
      },
      'Transcript details retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Transcript Error:', error);
    return ApiResponse.error(res, 'Failed to fetch transcript details.', 500);
  }
};

/**
 * Public transcript verification.
 * GET /api/transcripts/verify/:verificationCode
 */
const verifyTranscript = async (req, res) => {
  try {
    const code = String(req.params.verificationCode || '').trim().toUpperCase();
    if (!code) {
      return ApiResponse.error(res, 'Verification code is required.', 400);
    }

    const transcript = await Transcript.findOne({ verificationCode: code })
      .populate('studentId', 'name studentId email')
      .populate('institutionId', 'name code type');

    if (!transcript) {
      return ApiResponse.error(
        res,
        'Transcript not found. The verification code may be invalid.',
        404
      );
    }

    const integrityVerified = verifyTranscriptIntegrity(transcript);
    const isValid = integrityVerified && transcript.status !== 'revoked';

    return ApiResponse.success(
      res,
      {
        transcriptId: transcript.transcriptId,
        verificationCode: transcript.verificationCode,
        transcriptType: transcript.transcriptType,
        status: transcript.status,
        totalCredits: transcript.totalCredits,
        verifiedCredits: transcript.verifiedCredits,
        creditRecordCount: transcript.creditRecordCount,
        generatedAt: transcript.generatedAt,
        revokedAt: transcript.revokedAt,
        revocationReason: transcript.revocationReason,
        student: {
          name: transcript.studentId?.name || '',
          studentId: transcript.studentId?.studentId || '',
        },
        institution: {
          name: transcript.institutionId?.name || '',
          code: transcript.institutionId?.code || '',
          type: transcript.institutionId?.type || '',
        },
        integrityVerified,
        isValid,
      },
      isValid
        ? 'Transcript is authentic and verified.'
        : 'Transcript verification completed. The transcript is not currently valid.'
    );
  } catch (error) {
    console.error('Verify Transcript Error:', error);
    return ApiResponse.error(res, 'Failed to verify transcript.', 500);
  }
};

/**
 * Revoke transcript.
 * PUT /api/transcripts/:id/revoke
 * Access: Institution, Admin
 */
const revokeTranscript = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return ApiResponse.error(res, 'Invalid transcript ID.', 400);
    }

    const transcript = await Transcript.findById(req.params.id);
    if (!transcript) {
      return ApiResponse.error(res, 'Transcript not found.', 404);
    }

    if (
      req.user.role === ROLES.INSTITUTION &&
      transcript.institutionId.toString() !== req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You can only revoke transcripts issued by your institution.',
        403
      );
    }

    if (transcript.status === 'revoked') {
      return ApiResponse.error(res, 'Transcript is already revoked.', 400);
    }

    const { revocationReason } = req.body;
    if (!String(revocationReason || '').trim()) {
      return ApiResponse.error(res, 'Revocation reason is required.', 400);
    }

    transcript.status = 'revoked';
    transcript.revokedAt = new Date();
    transcript.revocationReason = String(revocationReason).trim();

    await transcript.save();

    return ApiResponse.success(res, transcript, 'Transcript revoked successfully.');
  } catch (error) {
    console.error('Revoke Transcript Error:', error);
    return ApiResponse.error(
      res,
      error.message || 'Failed to revoke transcript.',
      500
    );
  }
};

module.exports = {
  generateTranscript,
  getTranscripts,
  getTranscriptById,
  verifyTranscript,
  revokeTranscript,
  generateTranscriptHash,
  verifyTranscriptIntegrity,
};
