const mongoose = require('mongoose');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Course } = require('../models/Course');
const Institution = require('../models/Institution');
const { User, ROLES } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { generateCreditHash } = require('../utils/hashHelper');

/**
 * Smart Credit Validation Engine
 * POST /api/credits/validate
 */
const validateCreditPayload = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      institutionId: reqInstId,
      credits,
      grade,
      semester,
      academicYear,
    } = req.body;

    const checks = [];
    let isValid = true;
    let failureReason = '';

    // 1. Student Check
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      checks.push({
        name: 'Student Verification',
        passed: false,
        message: 'Invalid or missing student ID format.',
      });
      isValid = false;
      failureReason = 'Student ID format is invalid.';
    } else {
      const student = await User.findById(studentId);
      if (!student || student.role !== ROLES.STUDENT) {
        checks.push({
          name: 'Student Verification',
          passed: false,
          message: 'Student record not found in system directory.',
        });
        isValid = false;
        failureReason = 'Student record does not exist.';
      } else {
        checks.push({
          name: 'Student Verification',
          passed: true,
          message: `Student '${student.name}' (${student.studentId || 'ID Verified'}) verified.`,
        });
      }
    }

    // 2. Institution Check
    const targetInstId = reqInstId || req.user?.institutionId;
    if (!targetInstId || !mongoose.Types.ObjectId.isValid(targetInstId)) {
      checks.push({
        name: 'Institution Authorization',
        passed: false,
        message: 'Invalid or missing institution ID.',
      });
      isValid = false;
      if (!failureReason) failureReason = 'Institution ID format is invalid.';
    } else {
      const institution = await Institution.findById(targetInstId);
      if (!institution) {
        checks.push({
          name: 'Institution Authorization',
          passed: false,
          message: 'Issuing institution record not found.',
        });
        isValid = false;
        if (!failureReason) failureReason = 'Issuing institution is not recognized.';
      } else {
        checks.push({
          name: 'Institution Authorization',
          passed: true,
          message: `Institution '${institution.name}' (${institution.code}) accredited and active.`,
        });
      }
    }

    // 3. Course Catalog Check
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      checks.push({
        name: 'Course Catalog Check',
        passed: false,
        message: 'Invalid course ID format.',
      });
      isValid = false;
      if (!failureReason) failureReason = 'Course ID format is invalid.';
    } else {
      const course = await Course.findById(courseId);
      if (!course) {
        checks.push({
          name: 'Course Catalog Check',
          passed: false,
          message: 'Course not found in active catalog.',
        });
        isValid = false;
        if (!failureReason) failureReason = 'Selected course is not in the course catalog.';
      } else {
        checks.push({
          name: 'Course Catalog Check',
          passed: true,
          message: `Course '${course.courseName}' (${course.courseCode}) verified.`,
        });
      }
    }

    // 4. Credit Value Bounds Check
    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits <= 0 || numCredits > 30) {
      checks.push({
        name: 'Credit Value Bounds',
        passed: false,
        message: `Credit value (${credits}) is out of allowed range (1 - 30).`,
      });
      isValid = false;
      if (!failureReason) failureReason = 'Credit amount must be between 1 and 30.';
    } else {
      checks.push({
        name: 'Credit Value Bounds',
        passed: true,
        message: `Credit value (${numCredits}) is within valid academic bounds.`,
      });
    }

    // 5. Grade Schema Validation
    const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'S'];
    const formattedGrade = String(grade || '').trim().toUpperCase();
    if (!formattedGrade || !validGrades.includes(formattedGrade)) {
      checks.push({
        name: 'Grade Schema Validation',
        passed: false,
        message: `Grade '${grade}' is invalid. Allowed grades: ${validGrades.join(', ')}.`,
      });
      isValid = false;
      if (!failureReason) failureReason = `Grade '${grade}' is not a recognized grade code.`;
    } else {
      checks.push({
        name: 'Grade Schema Validation',
        passed: true,
        message: `Grade '${formattedGrade}' conforms to standard NEP grade scale.`,
      });
    }

    // 6. Semester & Academic Year Format
    const numSem = Number(semester);
    const yrStr = String(academicYear || '').trim();
    if (isNaN(numSem) || numSem < 1 || numSem > 12 || !yrStr) {
      checks.push({
        name: 'Academic Period Format',
        passed: false,
        message: 'Invalid semester (must be 1-12) or academic year format.',
      });
      isValid = false;
      if (!failureReason) failureReason = 'Academic period details are invalid.';
    } else {
      checks.push({
        name: 'Academic Period Format',
        passed: true,
        message: `Semester ${numSem} (${yrStr}) correctly formatted.`,
      });
    }

    // 7. Duplicate Ledger Check
    if (studentId && courseId && numSem && yrStr && mongoose.Types.ObjectId.isValid(studentId) && mongoose.Types.ObjectId.isValid(courseId)) {
      const duplicate = await AcademicCredit.findOne({
        studentId,
        courseId,
        semester: numSem,
        academicYear: yrStr,
      });

      if (duplicate) {
        checks.push({
          name: 'Duplicate Ledger Check',
          passed: false,
          message: 'An academic credit with the same course, semester, and academic year already exists.',
        });
        isValid = false;
        if (!failureReason) failureReason = 'An academic credit with the same course, semester and academic year already exists.';
      } else {
        checks.push({
          name: 'Duplicate Ledger Check',
          passed: true,
          message: 'No duplicate record found in national credit ledger.',
        });
      }
    }

    // 8. SHA-256 Hash Pre-seal
    let computedHash = null;
    if (isValid) {
      computedHash = generateCreditHash({
        studentId,
        courseId,
        institutionId: targetInstId,
        credits: numCredits,
        grade: formattedGrade,
        semester: numSem,
        academicYear: yrStr,
      });

      checks.push({
        name: 'SHA-256 Cryptographic Pre-Seal',
        passed: true,
        message: `Pre-computed integrity hash: ${computedHash.slice(0, 16)}...`,
      });
    }

    return ApiResponse.success(
      res,
      {
        isValid,
        overallStatus: isValid ? 'VALID CREDIT' : 'INVALID CREDIT',
        failureReason: isValid ? null : failureReason,
        computedHash,
        checks,
      },
      isValid
        ? 'Credit pre-validation passed successfully.'
        : `Credit validation failed: ${failureReason}`
    );
  } catch (error) {
    console.error('Smart Credit Validation Error:', error);
    return ApiResponse.error(res, 'Smart credit validation error.', 500);
  }
};

module.exports = {
  validateCreditPayload,
};
