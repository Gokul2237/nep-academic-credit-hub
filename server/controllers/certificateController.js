const crypto = require('crypto');
const mongoose = require('mongoose');

const { Certificate } = require('../models/Certificate');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Course } = require('../models/Course');
const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');

const ApiResponse = require('../utils/apiResponse');

const extractIdString = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return val.toString();
};

/**
 * Generate deterministic SHA-256 hash for a certificate.
 * The hash is based on the certificate's academic references
 * and identity information.
 */
const generateCertificateHash = ({
  certificateId,
  studentId,
  institutionId,
  courseId,
  academicCreditId,
  title,
  certificateType,
  issueDate,
}) => {
  const payload =
    `NEP-CERTIFICATE-INTEGRITY::` +
    `certificate=${certificateId}|` +
    `student=${extractIdString(studentId)}|` +
    `institution=${extractIdString(institutionId)}|` +
    `course=${extractIdString(courseId)}|` +
    `credit=${extractIdString(academicCreditId)}|` +
    `title=${String(title || '').trim()}|` +
    `type=${String(certificateType || '').trim()}|` +
    `issueDate=${new Date(issueDate).toISOString()}`;

  return crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');
};

/**
 * Verify certificate integrity.
 */
const verifyCertificateIntegrity = (certificate) => {
  if (!certificate || !certificate.integrityHash) {
    return false;
  }

  const calculatedHash = generateCertificateHash({
    certificateId: certificate.certificateId,
    studentId: certificate.studentId,
    institutionId: certificate.institutionId,
    courseId: certificate.courseId,
    academicCreditId: certificate.academicCreditId,
    title: certificate.title,
    certificateType: certificate.certificateType,
    issueDate: certificate.issueDate,
  });

  return calculatedHash === certificate.integrityHash;
};

/**
 * Generate a unique public certificate ID.
 */
const generateCertificateId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `NEP-CERT-${timestamp}-${random}`;
};

/**
 * Issue a certificate for an existing academic credit.
 *
 * POST /api/certificates
 * Access: Institution, Admin
 */
const createCertificate = async (req, res) => {
  try {
    const {
      academicCreditId,
      title,
      certificateType = 'course_completion',
      documentUrl = '',
    } = req.body;

    // 1. Validate academic credit ID
    if (!mongoose.Types.ObjectId.isValid(academicCreditId)) {
      return ApiResponse.error(
        res,
        'Valid academicCreditId is required.',
        400
      );
    }

    // 2. Find academic credit
    const credit = await AcademicCredit.findById(academicCreditId);

    if (!credit) {
      return ApiResponse.error(
        res,
        'Academic credit record not found.',
        404
      );
    }

    // 3. Certificate title validation
    if (!title || !String(title).trim()) {
      return ApiResponse.error(
        res,
        'Certificate title is required.',
        400
      );
    }

    // 4. Only verified credits can receive certificates
    if (credit.verificationStatus !== 'verified') {
      return ApiResponse.error(
        res,
        'A certificate can only be issued for a verified academic credit.',
        400
      );
    }

    // 5. Resolve issuing institution
    let issuingInstitutionId;

    if (req.user.role === ROLES.INSTITUTION) {
      if (!req.user.institutionId) {
        return ApiResponse.error(
          res,
          'User is not linked to an institution.',
          400
        );
      }

      issuingInstitutionId = req.user.institutionId;

      // Strict tenant isolation
      if (
        credit.institutionId.toString() !==
        issuingInstitutionId.toString()
      ) {
        return ApiResponse.error(
          res,
          'Access denied. You can only issue certificates for credits belonging to your institution.',
          403
        );
      }
    } else if (req.user.role === ROLES.ADMIN) {
      if (
        req.body.institutionId &&
        req.body.institutionId.toString() !== credit.institutionId.toString()
      ) {
        return ApiResponse.error(
          res,
          'Issuing institution must match the academic credit institution.',
          400
        );
      }
      issuingInstitutionId = credit.institutionId;
    } else {
      return ApiResponse.error(
        res,
        'Only institutions and admins can issue certificates.',
        403
      );
    }

    // 6. Verify issuing institution exists
    const institution = await Institution.findById(
      issuingInstitutionId
    );

    if (!institution) {
      return ApiResponse.error(
        res,
        'Issuing institution not found.',
        404
      );
    }

    // 7. Verify referenced course exists
    const course = await Course.findById(credit.courseId);

    if (!course) {
      return ApiResponse.error(
        res,
        'Referenced course not found.',
        404
      );
    }

    // 8. Course must belong to the same institution
    if (
      course.institutionId.toString() !==
      credit.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Course and academic credit institution mismatch.',
        400
      );
    }

    // 9. Student must exist
    const student = await User.findById(credit.studentId);

    if (!student || student.role !== ROLES.STUDENT) {
      return ApiResponse.error(
        res,
        'Referenced student not found.',
        404
      );
    }

    // 10. Prevent duplicate certificate for same credit
    const existingCertificate = await Certificate.findOne({
      academicCreditId: credit._id,
    });

    if (existingCertificate) {
      return ApiResponse.error(
        res,
        'A certificate has already been issued for this academic credit.',
        409
      );
    }

    // 11. Generate unique certificate ID
    const certificateId = generateCertificateId();

    // 12. Issue date
    const issueDate = new Date();

    // 13. Generate integrity hash
    const integrityHash = generateCertificateHash({
      certificateId,
      studentId: credit.studentId,
      institutionId: issuingInstitutionId,
      courseId: credit.courseId,
      academicCreditId: credit._id,
      title: String(title).trim(),
      certificateType,
      issueDate,
    });

    // 14. Create certificate
    const certificate = await Certificate.create({
      certificateId,
      studentId: credit.studentId,
      institutionId: issuingInstitutionId,
      courseId: credit.courseId,
      academicCreditId: credit._id,
      title: String(title).trim(),
      certificateType,
      issueDate,
      documentUrl: String(documentUrl || '').trim(),
      integrityHash,
      verificationStatus: 'pending',
    });

    // 15. Return populated certificate
    const populatedCertificate =
      await Certificate.findById(certificate._id)
        .populate('studentId', 'name email studentId')
        .populate(
          'institutionId',
          'name code type'
        )
        .populate(
          'courseId',
          'courseCode courseName credits department courseLevel'
        )
        .populate(
          'academicCreditId',
          'credits grade semester academicYear verificationStatus integrityHash'
        );

    return ApiResponse.created(
      res,
      populatedCertificate,
      'Certificate issued successfully and sealed with SHA-256 integrity hash.'
    );
  } catch (error) {
    console.error('Create Certificate Error:', error);

    return ApiResponse.error(
      res,
      error.message || 'Failed to issue certificate.',
      500
    );
  }
};

/**
 * Get certificates with role-based scoping.
 *
 * GET /api/certificates
 */
const getCertificates = async (req, res) => {
  try {
    const {
      studentId,
      institutionId,
      verificationStatus,
      certificateType,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Student → own certificates only
    if (req.user.role === ROLES.STUDENT) {
      query.studentId = req.user._id;
    }

    // Institution → certificates issued by institution
    else if (req.user.role === ROLES.INSTITUTION) {
      query.institutionId = req.user.institutionId;

      if (studentId) {
        query.studentId = studentId;
      }
    }

    // Admin → global access
    else if (req.user.role === ROLES.ADMIN) {
      if (studentId) {
        query.studentId = studentId;
      }

      if (institutionId) {
        query.institutionId = institutionId;
      }
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (certificateType) {
      query.certificateType = certificateType;
    }

    const numericPage = Math.max(1, Number(page));
    const numericLimit = Math.min(
      100,
      Math.max(1, Number(limit))
    );

    const skip =
      (numericPage - 1) * numericLimit;

    const total =
      await Certificate.countDocuments(query);

    const certificates =
      await Certificate.find(query)
        .populate(
          'studentId',
          'name email studentId'
        )
        .populate(
          'institutionId',
          'name code type'
        )
        .populate(
          'courseId',
          'courseCode courseName credits department courseLevel'
        )
        .populate(
          'academicCreditId',
          'credits grade semester academicYear verificationStatus'
        )
        .sort({
          issueDate: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(numericLimit);

    return ApiResponse.paginated(
      res,
      certificates,
      total,
      numericPage,
      numericLimit,
      'Certificate records retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Certificates Error:', error);

    return ApiResponse.error(
      res,
      'Failed to fetch certificate records.',
      500
    );
  }
};

/**
 * Get a single certificate.
 *
 * GET /api/certificates/:id
 */
const getCertificateById = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return ApiResponse.error(
        res,
        'Invalid certificate ID.',
        400
      );
    }

    const certificate =
      await Certificate.findById(req.params.id)
        .populate(
          'studentId',
          'name email studentId'
        )
        .populate(
          'institutionId',
          'name code type contactEmail'
        )
        .populate(
          'courseId',
          'courseCode courseName credits department courseLevel'
        )
        .populate(
          'academicCreditId',
          'credits grade semester academicYear verificationStatus integrityHash'
        );

    if (!certificate) {
      return ApiResponse.error(
        res,
        'Certificate not found.',
        404
      );
    }

    // Student → own certificate only
    if (
      req.user.role === ROLES.STUDENT &&
      certificate.studentId._id.toString() !==
        req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You can only view your own certificates.',
        403
      );
    }

    // Institution → only certificates belonging to institution
    if (
      req.user.role === ROLES.INSTITUTION &&
      certificate.institutionId._id.toString() !==
        req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You cannot view certificates issued by another institution.',
        403
      );
    }

    const integrityVerified =
      verifyCertificateIntegrity(certificate);

    return ApiResponse.success(
      res,
      {
        ...certificate.toObject(),
        integrityVerified,
      },
      'Certificate details retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Certificate Error:', error);

    return ApiResponse.error(
      res,
      'Failed to fetch certificate details.',
      500
    );
  }
};

/**
 * Public certificate verification.
 *
 * GET /api/certificates/verify/:certificateId
 *
 * No authentication required.
 */
const verifyCertificate = async (req, res) => {
  try {
    const certificate =
      await Certificate.findOne({
        certificateId:
          String(req.params.certificateId)
            .trim()
            .toUpperCase(),
      })
        .populate(
          'studentId',
          'name studentId'
        )
        .populate(
          'institutionId',
          'name code type'
        )
        .populate(
          'courseId',
          'courseCode courseName credits department courseLevel'
        )
        .populate(
          'academicCreditId',
          'credits grade semester academicYear verificationStatus'
        );

    if (!certificate) {
      return ApiResponse.error(
        res,
        'Certificate not found. The certificate ID may be invalid.',
        404
      );
    }

    const integrityVerified =
      verifyCertificateIntegrity(certificate);

    const isValid =
      integrityVerified &&
      certificate.verificationStatus === 'verified' &&
      !certificate.revokedAt;

    return ApiResponse.success(
      res,
      {
        certificateId: certificate.certificateId,
        title: certificate.title,
        certificateType: certificate.certificateType,
        issueDate: certificate.issueDate,
        verificationStatus:
          certificate.verificationStatus,
        revokedAt: certificate.revokedAt,

        student: {
          name: certificate.studentId?.name || '',
          studentId: certificate.studentId?.studentId || '',
        },
        institution: {
          name: certificate.institutionId?.name || '',
          code: certificate.institutionId?.code || '',
          type: certificate.institutionId?.type || '',
        },
        course: {
          courseCode: certificate.courseId?.courseCode || '',
          courseName: certificate.courseId?.courseName || '',
          credits: certificate.courseId?.credits || 0,
          department: certificate.courseId?.department || '',
          courseLevel: certificate.courseId?.courseLevel || '',
        },
        academicCredit: {
          credits: certificate.academicCreditId?.credits || 0,
          grade: certificate.academicCreditId?.grade || '',
          semester: certificate.academicCreditId?.semester || '',
          academicYear: certificate.academicCreditId?.academicYear || '',
          verificationStatus: certificate.academicCreditId?.verificationStatus || '',
        },

        integrityVerified,
        isValid,
      },
      isValid
        ? 'Certificate is authentic and verified.'
        : 'Certificate verification completed. The certificate is not currently valid.'
    );
  } catch (error) {
    console.error('Verify Certificate Error:', error);

    return ApiResponse.error(
      res,
      'Failed to verify certificate.',
      500
    );
  }
};

/**
 * Verify or reject certificate.
 *
 * PUT /api/certificates/:id/verify
 * Access: Institution, Admin
 */
const reviewCertificate = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return ApiResponse.error(
        res,
        'Invalid certificate ID.',
        400
      );
    }

    const certificate =
      await Certificate.findById(req.params.id);

    if (!certificate) {
      return ApiResponse.error(
        res,
        'Certificate not found.',
        404
      );
    }

    // Institution can only review its own certificates
    if (
      req.user.role === ROLES.INSTITUTION &&
      certificate.institutionId.toString() !==
        req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You can only review certificates issued by your institution.',
        403
      );
    }

    if (
      ['revoked'].includes(
        certificate.verificationStatus
      )
    ) {
      return ApiResponse.error(
        res,
        'Revoked certificates cannot be reviewed.',
        400
      );
    }

    const {
      verificationStatus,
      rejectionReason = '',
    } = req.body;

    if (
      !['verified', 'rejected'].includes(
        verificationStatus
      )
    ) {
      return ApiResponse.error(
        res,
        'verificationStatus must be either verified or rejected.',
        400
      );
    }

    if (
      verificationStatus === 'rejected' &&
      !String(rejectionReason).trim()
    ) {
      return ApiResponse.error(
        res,
        'Rejection reason is required when rejecting a certificate.',
        400
      );
    }

    certificate.verificationStatus =
      verificationStatus;

    certificate.verifiedBy =
      req.user._id;

    certificate.verifiedAt =
      new Date();

    if (verificationStatus === 'rejected') {
      certificate.rejectionReason =
        String(rejectionReason).trim();
    } else {
      certificate.rejectionReason = '';
    }

    await certificate.save();

    return ApiResponse.success(
      res,
      certificate,
      `Certificate ${verificationStatus} successfully.`
    );
  } catch (error) {
    console.error('Review Certificate Error:', error);

    return ApiResponse.error(
      res,
      error.message ||
        'Failed to review certificate.',
      500
    );
  }
};

/**
 * Revoke a verified certificate.
 *
 * PUT /api/certificates/:id/revoke
 * Access: Institution, Admin
 */
const revokeCertificate = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return ApiResponse.error(
        res,
        'Invalid certificate ID.',
        400
      );
    }

    const certificate =
      await Certificate.findById(req.params.id);

    if (!certificate) {
      return ApiResponse.error(
        res,
        'Certificate not found.',
        404
      );
    }

    // Institution ownership
    if (
      req.user.role === ROLES.INSTITUTION &&
      certificate.institutionId.toString() !==
        req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You can only revoke certificates issued by your institution.',
        403
      );
    }

    if (
      certificate.verificationStatus !==
      'verified'
    ) {
      return ApiResponse.error(
        res,
        'Only verified certificates can be revoked.',
        400
      );
    }

    const {
      revocationReason,
    } = req.body;

    if (!String(revocationReason || '').trim()) {
      return ApiResponse.error(
        res,
        'Revocation reason is required.',
        400
      );
    }

    certificate.verificationStatus =
      'revoked';

    certificate.revokedAt =
      new Date();

    certificate.revocationReason =
      String(revocationReason).trim();

    await certificate.save();

    return ApiResponse.success(
      res,
      certificate,
      'Certificate revoked successfully.'
    );
  } catch (error) {
    console.error('Revoke Certificate Error:', error);

    return ApiResponse.error(
      res,
      error.message ||
        'Failed to revoke certificate.',
      500
    );
  }
};

module.exports = {
  createCertificate,
  getCertificates,
  getCertificateById,
  verifyCertificate,
  reviewCertificate,
  revokeCertificate,
  generateCertificateHash,
  verifyCertificateIntegrity,
};