const crypto = require('crypto');
const APIKey = require('../models/APIKey');
const APILog = require('../models/APILog');
const AuditLog = require('../models/AuditLog');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Certificate } = require('../models/Certificate');
const { User, ROLES } = require('../models/User');
const { Course } = require('../models/Course');
const ApiResponse = require('../utils/apiResponse');
const { generateCreditHash } = require('../utils/hashHelper');

/**
 * Generate a new API Key for institution B2B integration
 * POST /api/gateway/keys
 */
const generateApiKey = async (req, res) => {
  try {
    const { name, scopes = ['read:credits', 'submit:credits', 'verify:certificates', 'read:students'] } = req.body;

    if (!name || !name.trim()) {
      return ApiResponse.error(res, 'Key name is required.', 400);
    }

    let institutionId;
    if (req.user.role === ROLES.INSTITUTION) {
      if (!req.user.institutionId) {
        return ApiResponse.error(res, 'User is not linked to an institution.', 400);
      }
      institutionId = req.user.institutionId;
    } else if (req.user.role === ROLES.ADMIN) {
      institutionId = req.body.institutionId || req.user.institutionId;
      if (!institutionId) {
        return ApiResponse.error(res, 'institutionId is required for admin key generation.', 400);
      }
    } else {
      return ApiResponse.error(res, 'Access denied. Only institutions and admins can generate API keys.', 403);
    }

    // Generate secret key
    const rawSecret = `nep_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const lastFour = rawSecret.slice(-4);
    const keyId = `NEP-KEY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const apiKey = await APIKey.create({
      keyId,
      keyHash,
      keyPrefix: 'nep_live_',
      lastFour,
      name: name.trim(),
      institutionId,
      scopes,
      isActive: true,
      createdRequestedBy: req.user._id,
    });

    // Create Audit Log
    AuditLog.create({
      logId: `AUDIT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      userId: req.user._id,
      institutionId,
      action: 'GENERATE_API_KEY',
      resource: `APIKey:${apiKey._id}`,
      details: { keyId, name: apiKey.name, scopes },
      ipAddress: req.ip || '127.0.0.1',
    }).catch((e) => console.error('AuditLog error:', e.message));

    const populatedKey = await APIKey.findById(apiKey._id).populate('institutionId', 'name code');

    return ApiResponse.created(
      res,
      {
        ...populatedKey.toObject(),
        secretKey: rawSecret, // ONLY SHOWN ONCE UPON CREATION!
      },
      'API key generated successfully. Save secretKey securely — it will not be displayed again!'
    );
  } catch (error) {
    console.error('Generate API Key Error:', error);
    return ApiResponse.error(res, 'Failed to generate API key.', 500);
  }
};

/**
 * List API Keys
 * GET /api/gateway/keys
 */
const getApiKeys = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === ROLES.INSTITUTION) {
      query.institutionId = req.user.institutionId;
    } else if (req.user.role === ROLES.ADMIN) {
      if (req.query.institutionId) {
        query.institutionId = req.query.institutionId;
      }
    }

    const keys = await APIKey.find(query)
      .populate('institutionId', 'name code')
      .populate('createdRequestedBy', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, keys, 'API keys retrieved successfully.');
  } catch (error) {
    console.error('Get API Keys Error:', error);
    return ApiResponse.error(res, 'Failed to fetch API keys.', 500);
  }
};

/**
 * Revoke API Key
 * PUT /api/gateway/keys/:id/revoke
 */
const revokeApiKey = async (req, res) => {
  try {
    const key = await APIKey.findById(req.params.id);
    if (!key) {
      return ApiResponse.error(res, 'API key not found.', 404);
    }

    if (
      req.user.role === ROLES.INSTITUTION &&
      key.institutionId.toString() !== req.user.institutionId.toString()
    ) {
      return ApiResponse.error(res, 'Access denied. Key belongs to another institution.', 403);
    }

    key.isActive = false;
    await key.save();

    AuditLog.create({
      logId: `AUDIT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      userId: req.user._id,
      institutionId: key.institutionId,
      action: 'REVOKE_API_KEY',
      resource: `APIKey:${key._id}`,
      details: { keyId: key.keyId, name: key.name },
      ipAddress: req.ip || '127.0.0.1',
    }).catch((e) => console.error('AuditLog error:', e.message));

    return ApiResponse.success(res, key, 'API key revoked successfully.');
  } catch (error) {
    console.error('Revoke API Key Error:', error);
    return ApiResponse.error(res, 'Failed to revoke API key.', 500);
  }
};

/**
 * Fetch Gateway Telemetry Logs
 * GET /api/gateway/logs
 */
const getApiLogs = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === ROLES.INSTITUTION) {
      query.institutionId = req.user.institutionId;
    } else if (req.user.role === ROLES.ADMIN && req.query.institutionId) {
      query.institutionId = req.query.institutionId;
    }

    const logs = await APILog.find(query)
      .populate('apiKeyId', 'name keyId keyPrefix lastFour')
      .populate('institutionId', 'name code')
      .sort({ createdAt: -1 })
      .limit(100);

    return ApiResponse.success(res, logs, 'API telemetry logs retrieved successfully.');
  } catch (error) {
    console.error('Get API Logs Error:', error);
    return ApiResponse.error(res, 'Failed to fetch API logs.', 500);
  }
};

// ============================================================
// B2B GATEWAY CONSUMPTION ENDPOINTS
// ============================================================

/**
 * B2B Gateway: Read Academic Credits
 * GET /api/v1/gateway/credits
 */
const gatewayReadCredits = async (req, res) => {
  try {
    const institutionId = req.gatewayInstitution._id || req.gatewayInstitution;
    const { studentId } = req.query;

    const query = { institutionId };
    if (studentId) {
      query.studentId = studentId;
    }

    const credits = await AcademicCredit.find(query)
      .populate('studentId', 'name studentId email')
      .populate('courseId', 'courseCode courseName credits')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, credits, 'Gateway credit records retrieved successfully.');
  } catch (error) {
    console.error('Gateway Read Credits Error:', error);
    return ApiResponse.error(res, 'Gateway failed to read credits.', 500);
  }
};

/**
 * B2B Gateway: Submit Academic Credit
 * POST /api/v1/gateway/credits
 */
const gatewaySubmitCredit = async (req, res) => {
  try {
    const institutionId = req.gatewayInstitution._id || req.gatewayInstitution;
    const { studentId, courseId, credits, grade, semester, academicYear } = req.body;

    if (!studentId || !courseId || !credits || !grade || !semester || !academicYear) {
      return ApiResponse.error(res, 'Missing required credit submission fields.', 400);
    }

    // Verify student belongs to this institution
    const student = await User.findById(studentId);
    if (!student || student.role !== ROLES.STUDENT) {
      return ApiResponse.error(res, 'Student record not found.', 404);
    }

    if (student.institutionId && student.institutionId.toString() !== institutionId.toString()) {
      return ApiResponse.error(res, 'Access denied. Student belongs to another institution.', 403);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return ApiResponse.error(res, 'Course record not found.', 404);
    }

    // Check duplicate
    const existing = await AcademicCredit.findOne({
      studentId,
      courseId,
      semester,
      academicYear,
    });

    if (existing) {
      return ApiResponse.error(
        res,
        'Duplicate credit entry: Student already has a credit record for this course and semester.',
        409
      );
    }

    const integrityHash = generateCreditHash({
      studentId,
      courseId,
      institutionId,
      credits,
      grade,
      semester,
      academicYear,
    });

    const credit = await AcademicCredit.create({
      studentId,
      courseId,
      institutionId,
      credits,
      grade: String(grade).toUpperCase(),
      semester,
      academicYear,
      verificationStatus: 'verified',
      integrityHash,
    });

    return ApiResponse.created(res, credit, 'Academic credit awarded via API Gateway successfully.');
  } catch (error) {
    console.error('Gateway Submit Credit Error:', error);
    return ApiResponse.error(res, 'Gateway failed to submit credit.', 500);
  }
};

/**
 * B2B Gateway: Verify Certificate
 * POST /api/v1/gateway/certificates/verify
 */
const gatewayVerifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.body;
    if (!certificateId) {
      return ApiResponse.error(res, 'certificateId is required.', 400);
    }

    const cert = await Certificate.findOne({ certificateId })
      .populate('studentId', 'name studentId email')
      .populate('institutionId', 'name code type');

    if (!cert) {
      return ApiResponse.error(res, 'Certificate not found.', 404);
    }

    const isValid = cert.verificationStatus === 'verified' && !cert.revokedAt;

    return ApiResponse.success(
      res,
      {
        certificateId: cert.certificateId,
        title: cert.title,
        status: cert.verificationStatus,
        revoked: !!cert.revokedAt,
        revocationReason: cert.revocationReason || null,
        student: cert.studentId,
        institution: cert.institutionId,
        integrityHash: cert.integrityHash,
        isValid,
      },
      isValid ? 'Certificate verified as authentic.' : 'Certificate is not valid or has been revoked.'
    );
  } catch (error) {
    console.error('Gateway Verify Certificate Error:', error);
    return ApiResponse.error(res, 'Gateway certificate verification failed.', 500);
  }
};

/**
 * B2B Gateway: Read Institution Students
 * GET /api/v1/gateway/students
 */
const gatewayReadStudents = async (req, res) => {
  try {
    const institutionId = req.gatewayInstitution._id || req.gatewayInstitution;
    const students = await User.find({ role: ROLES.STUDENT, institutionId }).select(
      'name email studentId createdAt'
    );
    return ApiResponse.success(res, students, 'Gateway student roster retrieved successfully.');
  } catch (error) {
    console.error('Gateway Read Students Error:', error);
    return ApiResponse.error(res, 'Gateway failed to read students.', 500);
  }
};

module.exports = {
  generateApiKey,
  getApiKeys,
  revokeApiKey,
  getApiLogs,
  gatewayReadCredits,
  gatewaySubmitCredit,
  gatewayVerifyCertificate,
  gatewayReadStudents,
};
