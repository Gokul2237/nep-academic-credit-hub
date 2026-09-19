const { AcademicCredit } = require('../models/AcademicCredit');
const { Course } = require('../models/Course');
const { User, ROLES } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Generate course recommendations for a student
 * GET /api/recommendations
 */
const getCourseRecommendations = async (req, res) => {
  try {
    let studentId;

    if (req.user.role === ROLES.STUDENT) {
      studentId = req.user._id;
    } else if (req.query.studentId) {
      studentId = req.query.studentId;
    } else {
      return ApiResponse.error(res, 'Student ID is required.', 400);
    }

    const student = await User.findById(studentId);
    if (!student) {
      return ApiResponse.error(res, 'Student not found.', 404);
    }

    // 1. Get student's completed or existing credits
    const studentCredits = await AcademicCredit.find({ studentId }).populate('courseId');

    const completedCourseIds = new Set();
    const completedCourseCodes = new Set();

    studentCredits.forEach((c) => {
      if (c.courseId) {
        completedCourseIds.add(c.courseId._id.toString());
        if (c.courseId.courseCode) {
          completedCourseCodes.add(c.courseId.courseCode.toUpperCase());
        }
      }
    });

    // 2. Fetch all active courses from catalog
    const allCourses = await Course.find({ isActive: true }).populate('institutionId', 'name code');

    const recommendations = [];

    allCourses.forEach((course) => {
      // Exclude courses student already completed
      if (completedCourseIds.has(course._id.toString())) {
        return;
      }
      if (completedCourseCodes.has(course.courseCode.toUpperCase())) {
        return;
      }

      // Check prerequisites if any
      let prereqsMet = true;
      let prereqReason = '';

      if (course.prerequisites && course.prerequisites.length > 0) {
        const missingPrereqs = course.prerequisites.filter(
          (p) => !completedCourseCodes.has(p.toUpperCase())
        );
        if (missingPrereqs.length > 0) {
          prereqsMet = false;
          prereqReason = `Requires prerequisite course(s): ${missingPrereqs.join(', ')}`;
        }
      }

      let why = '';
      let isRecommended = true;

      if (!prereqsMet) {
        isRecommended = false;
      } else if (
        student.institutionId &&
        course.institutionId &&
        course.institutionId._id.toString() === student.institutionId.toString()
      ) {
        why = `Core requirement from your home institution (${course.institutionId.name}) worth ${course.credits} credits.`;
      } else {
        why = `Elective credit opportunity from ${course.institutionId?.name || 'partner institution'} transferrable under NEP guidelines.`;
      }

      if (isRecommended) {
        recommendations.push({
          course: {
            _id: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            credits: course.credits,
            department: course.department,
            courseLevel: course.courseLevel,
            institution: course.institutionId,
            prerequisites: course.prerequisites || [],
          },
          whyRecommended: why,
          transferrable: true,
          matchScore: student.institutionId && course.institutionId?._id?.toString() === student.institutionId?.toString() ? 95 : 85,
        });
      }
    });

    // Sort by matchScore descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return ApiResponse.success(
      res,
      {
        totalRecommended: recommendations.length,
        recommendations,
      },
      'Course recommendations generated successfully.'
    );
  } catch (error) {
    console.error('Course recommendation error:', error);
    return ApiResponse.error(res, 'Failed to generate course recommendations.', 500);
  }
};

module.exports = {
  getCourseRecommendations,
};
