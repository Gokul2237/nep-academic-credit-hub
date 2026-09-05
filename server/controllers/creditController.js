const mongoose = require('mongoose');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Course } = require('../models/Course');
const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const { generateCreditHash, verifyCreditIntegrity } = require('../utils/hashHelper');
const ApiResponse = require('../utils/apiResponse');

/**
 * Award / Record Academic Credit for a Student
 * POST /api/credits
 * Access: Institution (for enrolled students), Admin
 */
const createCredit = async (req, res) => {
  try {
    const {
      studentEmail,
      studentId: inputStudentId,
      courseId,
      credits,
      grade,
      semester,
      academicYear,
      verificationStatus = 'verified',
    } = req.body;

    // 1. Resolve student record
    let student = null;
    if (studentEmail) {
      student = await User.findOne({
        email: studentEmail.toLowerCase().trim(),
        role: ROLES.STUDENT,
      });
    } else if (inputStudentId) {
      const queryConditions = [{ studentId: String(inputStudentId).trim() }];
      if (mongoose.Types.ObjectId.isValid(inputStudentId)) {
        queryConditions.push({ _id: inputStudentId });
      }
      student = await User.findOne({
        $or: queryConditions,
        role: ROLES.STUDENT,
      });
    }

    if (!student) {
      return ApiResponse.error(
        res,
        'Valid student not found. Please verify the student email or ABC Student ID.',
        404
      );
    }

    // 2. Resolve institution
    let institutionId = null;
    if (req.user.role === 'institution') {
      institutionId = req.user.institutionId;
      if (!institutionId) {
        return ApiResponse.error(res, 'User is not linked to any institution record.', 400);
      }

      // STRICT TENANT ISOLATION: Student must belong to the awarding institution
      if (
        !student.institutionId ||
        student.institutionId.toString() !== institutionId.toString()
      ) {
        return ApiResponse.error(
          res,
          'Cannot award credit: The student does not belong to your institution.',
          403
        );
      }
    } else if (req.user.role === 'admin') {
      institutionId = req.body.institutionId || student.institutionId;
      if (!institutionId) {
        return ApiResponse.error(res, 'Admin must specify institutionId.', 400);
      }
    } else {
      return ApiResponse.error(res, 'Only institutions and admins can award credits.', 403);
    }

    // 3. Resolve course
    const course = await Course.findById(courseId);
    if (!course) {
      return ApiResponse.error(res, 'Referenced course not found in catalog.', 404);
    }

    // Ensure the course belongs to the awarding institution
    if (course.institutionId.toString() !== institutionId.toString()) {
      return ApiResponse.error(
        res,
        'Cannot award credit: The course does not belong to the awarding institution.',
        400
      );
    }

    // 4. Validate Credit value
    const numericCredits = Number(credits || course.credits);
    if (!numericCredits || numericCredits < 1 || numericCredits > 20) {
      return ApiResponse.error(res, 'Credit value must be a positive integer (1-20).', 400);
    }

    if (numericCredits > course.credits) {
      return ApiResponse.error(
        res,
        `Credit value (${numericCredits}) cannot exceed the course's total assigned credits (${course.credits}).`,
        400
      );
    }

    // 5. Duplicate Credit Prevention (student + course + year + semester)
    const duplicate = await AcademicCredit.findOne({
      studentId: student._id,
      courseId: course._id,
      academicYear: academicYear.trim(),
      semester: Number(semester),
    });

    if (duplicate) {
      return ApiResponse.error(
        res,
        `Duplicate credit entry: Student already has a credit record for course ${course.courseCode} in Semester ${semester} (${academicYear}).`,
        409
      );
    }

    // 6. Generate SHA-256 integrity hash
    const integrityHash = generateCreditHash({
      studentId: student._id,
      courseId: course._id,
      institutionId,
      credits: numericCredits,
      grade: String(grade).toUpperCase().trim(),
      semester: Number(semester),
      academicYear: academicYear.trim(),
    });

    // 7. Create record
    const newCredit = await AcademicCredit.create({
      studentId: student._id,
      courseId: course._id,
      institutionId,
      credits: numericCredits,
      grade: String(grade).toUpperCase().trim(),
      semester: Number(semester),
      academicYear: academicYear.trim(),
      verificationStatus,
      sourceType: 'institution',
      integrityHash,
      verifiedBy: req.user._id,
      verifiedAt: verificationStatus === 'verified' ? new Date() : null,
    });

    const populatedCredit = await AcademicCredit.findById(newCredit._id)
      .populate('studentId', 'name email studentId')
      .populate('courseId', 'courseCode courseName credits department')
      .populate('institutionId', 'name code');

    return ApiResponse.created(
      res,
      populatedCredit,
      'Academic credit recorded and sealed with SHA-256 integrity hash.'
    );
  } catch (error) {
    console.error('Create Credit Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to record academic credit.', 500);
  }
};

/**
 * Get Academic Credits list
 * GET /api/credits
 * Access: Scoped per role
 */
const getCredits = async (req, res) => {
  try {
    const { studentId, institutionId, verificationStatus, semester, academicYear, page = 1, limit = 50 } = req.query;
    const query = {};

    // Role-based scoping
    if (req.user.role === 'student') {
      // Students can strictly only view their own credits
      query.studentId = req.user._id;
    } else if (req.user.role === 'institution') {
      // Institutions can only view credits they issued (or search by their institution)
      query.institutionId = req.user.institutionId;
      if (studentId) query.studentId = studentId;
    } else if (req.user.role === 'admin') {
      // Admin has full search capability
      if (studentId) query.studentId = studentId;
      if (institutionId) query.institutionId = institutionId;
    }

    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (semester) query.semester = Number(semester);
    if (academicYear) query.academicYear = academicYear;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AcademicCredit.countDocuments(query);
    const credits = await AcademicCredit.find(query)
      .populate('studentId', 'name email studentId')
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code type')
      .sort({ academicYear: -1, semester: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      credits,
      total,
      page,
      limit,
      'Credit records retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Credits Error:', error);
    return ApiResponse.error(res, 'Failed to fetch credit records.', 500);
  }
};

/**
 * Get Single Credit Record by ID with Integrity Validation
 * GET /api/credits/:id
 */
const getCreditById = async (req, res) => {
  try {
    const credit = await AcademicCredit.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code type contactEmail');

    if (!credit) {
      return ApiResponse.error(res, 'Academic credit record not found.', 404);
    }

    // Role Access Check
    if (
      req.user.role === 'student' &&
      credit.studentId._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(res, 'Access denied. You can only view your own credits.', 403);
    }

    if (
      req.user.role === 'institution' &&
      credit.institutionId._id.toString() !== req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You cannot view credits issued by another institution.',
        403
      );
    }

    const isIntegrityValid = verifyCreditIntegrity(credit);

    return ApiResponse.success(
      res,
      {
        ...credit.toObject(),
        integrityVerified: isIntegrityValid,
      },
      'Credit details retrieved successfully.'
    );
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch credit details.', 500);
  }
};

/**
 * Get Credits for a specific student
 * GET /api/credits/student/:studentId
 */
const getStudentCredits = async (req, res) => {
  try {
    const targetStudentId = req.params.studentId;

    // RBAC check: Student can only view their own
    if (req.user.role === 'student' && req.user._id.toString() !== targetStudentId) {
      return ApiResponse.error(res, 'Access denied. Cannot view other students credits.', 403);
    }

    const query = { studentId: targetStudentId };
    if (req.user.role === 'institution') {
      query.institutionId = req.user.institutionId;
    }

    const credits = await AcademicCredit.find(query)
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code')
      .sort({ academicYear: -1, semester: -1 });

    return ApiResponse.success(res, credits, 'Student credits retrieved successfully.');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch student credits.', 500);
  }
};

/**
 * Get Student Credit Wallet Summary
 * GET /api/credits/wallet-summary
 * Access: Student (for own wallet)
 */
const getWalletSummary = async (req, res) => {
  try {
    const studentId = req.user._id;

    const credits = await AcademicCredit.find({ studentId })
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code type')
      .sort({ academicYear: -1, semester: -1 });

    let totalCredits = 0;
    let verifiedCredits = 0;
    let pendingCredits = 0;
    const institutionMap = {};

    credits.forEach((c) => {
      totalCredits += c.credits;
      if (c.verificationStatus === 'verified') {
        verifiedCredits += c.credits;
      } else if (c.verificationStatus === 'pending') {
        pendingCredits += c.credits;
      }

      const instName = c.institutionId?.name || 'Unknown Institution';
      const instCode = c.institutionId?.code || 'EXT';

      if (!institutionMap[instCode]) {
        institutionMap[instCode] = {
          name: instName,
          code: instCode,
          credits: 0,
          courseCount: 0,
        };
      }
      institutionMap[instCode].credits += c.credits;
      institutionMap[instCode].courseCount += 1;
    });

    const institutionBreakdown = Object.values(institutionMap);

    return ApiResponse.success(
      res,
      {
        totalCredits,
        verifiedCredits,
        pendingCredits,
        courseCount: credits.length,
        institutionBreakdown,
        credits,
      },
      'Wallet summary calculated successfully.'
    );
  } catch (error) {
    console.error('Wallet Summary Error:', error);
    return ApiResponse.error(res, 'Failed to calculate wallet summary.', 500);
  }
};

/**
 * Get Student Credit Timeline
 * GET /api/credits/timeline
 * Access: Student (for own timeline)
 */
const getTimeline = async (req, res) => {
  try {
    const studentId = req.user._id;

    const credits = await AcademicCredit.find({ studentId })
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code type')
      .sort({ academicYear: 1, semester: 1 });

    // Group by Academic Year -> Semester
    const timeline = {};

    credits.forEach((c) => {
      const yearKey = c.academicYear || 'General';
      const semKey = `Semester ${c.semester}`;

      if (!timeline[yearKey]) {
        timeline[yearKey] = {
          academicYear: yearKey,
          semesters: {},
          yearCredits: 0,
        };
      }

      if (!timeline[yearKey].semesters[semKey]) {
        timeline[yearKey].semesters[semKey] = {
          semesterName: semKey,
          semesterNumber: c.semester,
          semesterCredits: 0,
          records: [],
        };
      }

      timeline[yearKey].semesters[semKey].records.push(c);
      timeline[yearKey].semesters[semKey].semesterCredits += c.credits;
      timeline[yearKey].yearCredits += c.credits;
    });

    return ApiResponse.success(res, timeline, 'Credit timeline structured successfully.');
  } catch (error) {
    console.error('Timeline Error:', error);
    return ApiResponse.error(res, 'Failed to generate credit timeline.', 500);
  }
};

/**
 * Update / Verify Credit Record
 * PUT /api/credits/:id
 * Access: Institution (own issued credits), Admin
 */
const updateCredit = async (req, res) => {
  try {
    const credit = await AcademicCredit.findById(req.params.id);
    if (!credit) {
      return ApiResponse.error(res, 'Credit record not found.', 404);
    }

    // Ownership check
    if (
      req.user.role === 'institution' &&
      credit.institutionId.toString() !== req.user.institutionId.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied. Cannot modify credit record issued by another institution.',
        403
      );
    }

    const { grade, credits, verificationStatus } = req.body;

    if (credits !== undefined) {
      const numericCredits = Number(credits);
      if (numericCredits < 1 || numericCredits > 20) {
        return ApiResponse.error(res, 'Credits must be between 1 and 20.', 400);
      }
      credit.credits = numericCredits;
    }

    if (grade) credit.grade = String(grade).toUpperCase().trim();

    if (verificationStatus) {
      credit.verificationStatus = verificationStatus;
      if (verificationStatus === 'verified') {
        credit.verifiedBy = req.user._id;
        credit.verifiedAt = new Date();
      }
    }

    // Re-generate integrity hash since data changed
    credit.integrityHash = generateCreditHash({
      studentId: credit.studentId,
      courseId: credit.courseId,
      institutionId: credit.institutionId,
      credits: credit.credits,
      grade: credit.grade,
      semester: credit.semester,
      academicYear: credit.academicYear,
    });

    await credit.save();

    return ApiResponse.success(res, credit, 'Credit record updated and integrity hash resealed.');
  } catch (error) {
    return ApiResponse.error(res, error.message || 'Failed to update credit record.', 500);
  }
};

module.exports = {
  createCredit,
  getCredits,
  getCreditById,
  getStudentCredits,
  getWalletSummary,
  getTimeline,
  updateCredit,
};
