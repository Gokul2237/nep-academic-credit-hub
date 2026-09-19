const { AcademicCredit } = require('../models/AcademicCredit');
const { User, ROLES } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Evaluate student eligibility for NEP academic benchmarks
 * GET /api/eligibility
 */
const getEligibilityStatus = async (req, res) => {
  try {
    let studentId;

    if (req.user.role === ROLES.STUDENT) {
      studentId = req.user._id;
    } else if (req.query.studentId) {
      studentId = req.query.studentId;
    } else {
      return ApiResponse.error(res, 'Student ID parameter is required.', 400);
    }

    const student = await User.findById(studentId).populate('institutionId', 'name code');
    if (!student) {
      return ApiResponse.error(res, 'Student record not found.', 404);
    }

    const credits = await AcademicCredit.find({ studentId }).populate('courseId');

    let totalCredits = 0;
    let verifiedCredits = 0;
    let pendingCredits = 0;
    const courseCategories = new Set();
    const institutionsSet = new Set();

    credits.forEach((c) => {
      const crd = Number(c.credits || 0);
      if (c.verificationStatus === 'verified') {
        verifiedCredits += crd;
        totalCredits += crd;
        if (c.institutionId) institutionsSet.add(c.institutionId.toString());
        if (c.courseId && c.courseId.department) courseCategories.add(c.courseId.department);
      } else if (c.verificationStatus === 'pending') {
        pendingCredits += crd;
        totalCredits += crd;
      }
    });

    // Standard NEP benchmarks
    const GRADUATION_REQUIRED = 160;
    const HONORS_REQUIRED = 140;
    const DIPLOMA_REQUIRED = 80;
    const CERTIFICATE_REQUIRED = 40;

    const requirements = [
      {
        id: 'graduation',
        title: 'Full NEP Bachelor Degree (4-Year)',
        requiredCredits: GRADUATION_REQUIRED,
        currentCredits: verifiedCredits,
        remainingCredits: Math.max(0, GRADUATION_REQUIRED - verifiedCredits),
        status:
          verifiedCredits >= GRADUATION_REQUIRED
            ? 'Eligible'
            : verifiedCredits >= GRADUATION_REQUIRED * 0.75
            ? 'Almost Eligible'
            : 'Not Yet Eligible',
      },
      {
        id: 'honors',
        title: 'NEP 3-Year UG Degree / Major Core',
        requiredCredits: HONORS_REQUIRED,
        currentCredits: verifiedCredits,
        remainingCredits: Math.max(0, HONORS_REQUIRED - verifiedCredits),
        status:
          verifiedCredits >= HONORS_REQUIRED
            ? 'Eligible'
            : verifiedCredits >= HONORS_REQUIRED * 0.75
            ? 'Almost Eligible'
            : 'Not Yet Eligible',
      },
      {
        id: 'diploma',
        title: 'Undergraduate Diploma Benchmark',
        requiredCredits: DIPLOMA_REQUIRED,
        currentCredits: verifiedCredits,
        remainingCredits: Math.max(0, DIPLOMA_REQUIRED - verifiedCredits),
        status:
          verifiedCredits >= DIPLOMA_REQUIRED
            ? 'Eligible'
            : verifiedCredits >= DIPLOMA_REQUIRED * 0.75
            ? 'Almost Eligible'
            : 'Not Yet Eligible',
      },
      {
        id: 'certificate',
        title: 'Undergraduate Academic Certificate',
        requiredCredits: CERTIFICATE_REQUIRED,
        currentCredits: verifiedCredits,
        remainingCredits: Math.max(0, CERTIFICATE_REQUIRED - verifiedCredits),
        status:
          verifiedCredits >= CERTIFICATE_REQUIRED
            ? 'Eligible'
            : verifiedCredits >= CERTIFICATE_REQUIRED * 0.75
            ? 'Almost Eligible'
            : 'Not Yet Eligible',
      },
    ];

    // Determine overall student status
    let overallStatus = 'Not Yet Eligible';
    let summaryMessage = '';

    if (verifiedCredits >= GRADUATION_REQUIRED) {
      overallStatus = 'Eligible';
      summaryMessage = 'Congratulations! You meet the credit requirements for a Full NEP Bachelor Degree.';
    } else if (verifiedCredits >= DIPLOMA_REQUIRED) {
      overallStatus = 'Almost Eligible';
      summaryMessage = `You have earned ${verifiedCredits} verified credits. You are on track towards graduation!`;
    } else {
      overallStatus = 'Not Yet Eligible';
      summaryMessage = `You have earned ${verifiedCredits} verified credits out of 160 required for graduation.`;
    }

    const progressPercentage = Math.min(100, Math.round((verifiedCredits / GRADUATION_REQUIRED) * 100));

    return ApiResponse.success(
      res,
      {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          institution: student.institutionId ? student.institutionId.name : 'N/A',
        },
        summary: {
          totalCredits,
          verifiedCredits,
          pendingCredits,
          institutionsAttended: institutionsSet.size,
          departmentsCovered: courseCategories.size,
          progressPercentage,
          overallStatus,
          summaryMessage,
        },
        requirements,
      },
      'Eligibility tracker evaluation generated successfully.'
    );
  } catch (error) {
    console.error('Eligibility evaluation error:', error);
    return ApiResponse.error(res, 'Failed to evaluate eligibility requirements.', 500);
  }
};

module.exports = {
  getEligibilityStatus,
};
