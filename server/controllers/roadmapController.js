const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Course } = require('../models/Course');
const CreditPolicy = require('../models/CreditPolicy');
const Institution = require('../models/Institution');
const { TransferRequest } = require('../models/TransferRequest');
const { Certificate } = require('../models/Certificate');
const { SemesterResult } = require('../models/SemesterResult');
const ApiResponse = require('../utils/apiResponse');

// Standard NEP 2020 Grade Scale Hierarchy
const GRADE_RANKS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
};

// Standard NEP 2020 Benchmark Milestones
const NEP_BENCHMARKS = {
  graduation: { id: 'graduation', title: 'Full NEP Bachelor Degree (4-Year)', requiredCredits: 160, level: 'Year 4' },
  honors: { id: 'honors', title: 'NEP 3-Year UG Degree / Major Core', requiredCredits: 140, level: 'Year 3' },
  diploma: { id: 'diploma', title: 'Undergraduate Diploma Benchmark', requiredCredits: 80, level: 'Year 2' },
  certificate: { id: 'certificate', title: 'Undergraduate Academic Certificate', requiredCredits: 40, level: 'Year 1' },
};

/**
 * Core engine to compute student-specific transfer readiness and personalized roadmap
 */
async function generateStudentRoadmap({ studentId, targetInstitutionId = null, pathwayGoal = 'graduation' }) {
  // 1. Fetch Student Profile
  const student = await User.findById(studentId).populate('institutionId', 'name code type contactEmail address');
  if (!student || student.role !== ROLES.STUDENT) {
    throw { statusCode: 404, message: 'Valid student profile not found.' };
  }

  // 2. Fetch Destination Institution and Active Policy
  let targetInstitution = null;
  let targetPolicy = null;

  if (targetInstitutionId && mongoose.Types.ObjectId.isValid(targetInstitutionId)) {
    targetInstitution = await Institution.findById(targetInstitutionId).select('name code type verificationStatus isActive contactEmail address');
    if (targetInstitution) {
      targetPolicy = await CreditPolicy.getEffectivePolicy(targetInstitution._id);
    }
  }

  // Fallback to national default NEP 2020 baseline policy if no specific target institution
  if (!targetPolicy) {
    targetPolicy = {
      institutionId: null,
      version: 'NEP-2020-NAT-v1.0',
      minGrade: 'B',
      minEquivalency: 80,
      maxCredits: 60,
      description: 'National NEP 2020 Academic Bank of Credits baseline policy',
    };
  }

  // 3. Fetch Student Academic Records from DB
  const [credits, certificates, semesterResults, activeTransfers] = await Promise.all([
    AcademicCredit.find({ studentId }).populate('courseId').populate('institutionId', 'name code').sort({ semester: 1, createdAt: 1 }),
    Certificate.find({ studentId }).sort({ issueDate: -1 }),
    SemesterResult.find({ studentId }).sort({ semester: 1 }),
    TransferRequest.find({
      studentId,
      status: { $in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW', 'APPROVED', 'CONDITIONAL_APPROVAL'] },
    }),
  ]);

  // Set of credits currently locked in active transfer requests
  const lockedCreditIds = new Set();
  activeTransfers.forEach((tr) => {
    (tr.creditIds || []).forEach((cId) => lockedCreditIds.add(cId.toString()));
  });

  // Track completed course codes and IDs
  const completedCourseCodes = new Set();
  const completedCourseIds = new Set();

  let totalEarnedCredits = 0;
  let verifiedCredits = 0;
  let pendingCredits = 0;
  let transferredOutCredits = 0;

  credits.forEach((c) => {
    const crd = Number(c.credits || 0);
    totalEarnedCredits += crd;

    if (c.verificationStatus === 'verified') {
      verifiedCredits += crd;
      if (c.courseId) {
        completedCourseIds.add(c.courseId._id ? c.courseId._id.toString() : c.courseId.toString());
        if (c.courseId.courseCode) {
          completedCourseCodes.add(c.courseId.courseCode.toUpperCase());
        }
      }
    } else if (c.verificationStatus === 'pending') {
      pendingCredits += crd;
    }

    if (c.isTransferred) {
      transferredOutCredits += crd;
    }
  });

  // 4. Per-Credit Transfer Readiness Evaluation
  const evaluatedCredits = [];
  let cumulativeAcceptedTransferCredits = 0;
  let eligibleCount = 0;
  let reviewCount = 0;
  let notEligibleCount = 0;
  let insufficientInfoCount = 0;

  const minGradeRank = GRADE_RANKS[targetPolicy.minGrade] ?? GRADE_RANKS['B'];

  for (const credit of credits) {
    const course = credit.courseId || {};
    const creditValue = Number(credit.credits || 0);
    const grade = (credit.grade || '').toUpperCase();
    const gradeRank = GRADE_RANKS[grade] ?? -1;

    let readinessStatus = 'ELIGIBLE';
    let reason = '';
    let isAcceptedForTransfer = false;

    // Rule 1: Missing or corrupted grade information
    if (!grade || gradeRank === -1) {
      readinessStatus = 'INSUFFICIENT_INFO';
      reason = 'Academic grade is missing or unrecorded. Requires authoritative grade report from awarding institution.';
      insufficientInfoCount++;
    }
    // Rule 2: Unverified or pending credit
    else if (credit.verificationStatus !== 'verified') {
      readinessStatus = 'NEEDS_REVIEW';
      reason = `Credit status is '${credit.verificationStatus}'. Only verified credits with SHA-256 integrity seal can be transferred.`;
      reviewCount++;
    }
    // Rule 3: Already transferred to another institution
    else if (credit.isTransferred) {
      readinessStatus = 'NOT_ELIGIBLE';
      reason = `Credit has already been permanently transferred to an external institution. Double-counting credits is prohibited under NEP 2020.`;
      notEligibleCount++;
    }
    // Rule 4: Currently locked in an active transfer request
    else if (lockedCreditIds.has(credit._id.toString())) {
      readinessStatus = 'NEEDS_REVIEW';
      reason = 'Credit is currently locked in an active pending transfer review. Awaiting destination evaluation.';
      reviewCount++;
    }
    // Rule 5: Failed course grade
    else if (grade === 'F') {
      readinessStatus = 'NOT_ELIGIBLE';
      reason = 'Failed course grade (F) cannot be transferred or counted toward degree completion.';
      notEligibleCount++;
    }
    // Rule 6: Grade below destination institution policy minimum
    else if (gradeRank < minGradeRank) {
      readinessStatus = 'NOT_ELIGIBLE';
      reason = `Grade '${grade}' is below ${targetInstitution ? targetInstitution.name : 'policy'} minimum requirement of '${targetPolicy.minGrade}'.`;
      notEligibleCount++;
    }
    // Rule 7: Credit transfer cap limit
    else if (cumulativeAcceptedTransferCredits + creditValue > targetPolicy.maxCredits) {
      readinessStatus = 'NOT_ELIGIBLE';
      reason = `Exceeds destination institution transfer credit cap of ${targetPolicy.maxCredits} credits (currently accumulated ${cumulativeAcceptedTransferCredits} credits).`;
      notEligibleCount++;
    }
    // Rule 8: Eligible!
    else {
      readinessStatus = 'ELIGIBLE';
      reason = `Satisfies verification seal, grade criteria (${grade} >= ${targetPolicy.minGrade}), and falls within the transfer ceiling (${targetPolicy.maxCredits} credits).`;
      cumulativeAcceptedTransferCredits += creditValue;
      eligibleCount++;
      isAcceptedForTransfer = true;
    }

    evaluatedCredits.push({
      creditId: credit._id,
      courseCode: course.courseCode || 'N/A',
      courseName: course.courseName || 'Course Unit',
      department: course.department || 'General',
      credits: creditValue,
      grade,
      semester: credit.semester,
      academicYear: credit.academicYear,
      awardingInstitution: credit.institutionId?.name || student.institutionName || 'Home Institution',
      verificationStatus: credit.verificationStatus,
      integrityHash: credit.integrityHash ? `${credit.integrityHash.slice(0, 10)}...${credit.integrityHash.slice(-8)}` : null,
      readinessStatus,
      reason,
      isAcceptedForTransfer,
    });
  }

  // 5. Pathway & Credit Gap Calculations
  const selectedBenchmark = NEP_BENCHMARKS[pathwayGoal] || NEP_BENCHMARKS.graduation;
  const benchmarkRequiredCredits = selectedBenchmark.requiredCredits;

  // Active verified credits available toward degree (excluding already transferred out)
  const effectiveVerifiedCredits = Math.max(0, verifiedCredits - transferredOutCredits);
  const degreeCreditGap = Math.max(0, benchmarkRequiredCredits - verifiedCredits);

  // Maximum transferable credits allowed under policy for this benchmark
  const transferCap = Math.min(targetPolicy.maxCredits, benchmarkRequiredCredits);
  const transferCreditGap = Math.max(0, transferCap - cumulativeAcceptedTransferCredits);

  // Transfer readiness indicator
  let overallReadiness = 'NOT_ELIGIBLE';
  let overallReadinessSummary = '';

  if (credits.length === 0) {
    overallReadiness = 'INSUFFICIENT_INFO';
    overallReadinessSummary = 'No academic credits recorded in your profile yet. Enroll in courses and obtain verified semester grades to begin evaluation.';
  } else if (eligibleCount > 0 && cumulativeAcceptedTransferCredits >= 20) {
    overallReadiness = 'READY';
    overallReadinessSummary = `You have ${cumulativeAcceptedTransferCredits} verified credits eligible for immediate mobility under ${targetInstitution ? targetInstitution.name : 'NEP'} policies.`;
  } else if (reviewCount > 0 || (eligibleCount > 0 && cumulativeAcceptedTransferCredits < 20)) {
    overallReadiness = 'NEEDS_REVIEW';
    overallReadinessSummary = `You have ${cumulativeAcceptedTransferCredits} eligible credits and ${reviewCount} credits requiring verification or institutional syllabus review.`;
  } else if (eligibleCount === 0 && (notEligibleCount > 0 || reviewCount > 0)) {
    overallReadiness = 'NOT_ELIGIBLE';
    overallReadinessSummary = `No credits currently meet the transfer criteria for ${targetInstitution ? targetInstitution.name : 'the selected target'}. Review policy grade requirements.`;
  }

  // 6. NEP Milestones Generation
  const milestones = Object.values(NEP_BENCHMARKS).map((bench) => {
    const isCompleted = verifiedCredits >= bench.requiredCredits;
    const isCurrentTarget = selectedBenchmark.id === bench.id;
    const progress = Math.min(100, Math.round((verifiedCredits / bench.requiredCredits) * 100));
    const remaining = Math.max(0, bench.requiredCredits - verifiedCredits);

    let status = 'PENDING';
    if (isCompleted) status = 'COMPLETED';
    else if (verifiedCredits > 0) status = 'IN_PROGRESS';

    return {
      id: bench.id,
      title: bench.title,
      level: bench.level,
      requiredCredits: bench.requiredCredits,
      currentCredits: Math.min(bench.requiredCredits, verifiedCredits),
      remainingCredits: remaining,
      progressPercentage: progress,
      status,
      isTarget: isCurrentTarget,
    };
  });

  // 7. Prioritized Recommended Next Steps
  const recommendedNextSteps = [];

  // Priority 1: Pending verifications
  if (pendingCredits > 0) {
    recommendedNextSteps.push({
      priority: 1,
      type: 'VERIFICATION',
      title: 'Resolve Pending Academic Credits',
      description: `You have ${pendingCredits} credits pending institutional verification. Contact your home institution academic registrar to seal these credits on the ABC hub.`,
      actionLabel: 'View Digital Wallet',
      actionUrl: '/student/wallet',
    });
  }

  // Priority 2: Eligible credits ready for transfer
  if (cumulativeAcceptedTransferCredits > 0 && targetInstitution) {
    recommendedNextSteps.push({
      priority: 2,
      type: 'TRANSFER',
      title: `Initiate Credit Mobility to ${targetInstitution.name}`,
      description: `Your ${cumulativeAcceptedTransferCredits} eligible credits satisfy ${targetInstitution.name}'s policy (${targetPolicy.version}). You can create a formal transfer request.`,
      actionLabel: 'Start Transfer Request',
      actionUrl: '/student/transfers',
    });
  }

  // Priority 3: Credit gap closing
  if (degreeCreditGap > 0) {
    recommendedNextSteps.push({
      priority: 3,
      type: 'COURSEWORK',
      title: `Accumulate ${degreeCreditGap} Remaining Credits for ${selectedBenchmark.title}`,
      description: `You need ${degreeCreditGap} more verified credits to achieve the ${selectedBenchmark.title} milestone. Enroll in upcoming semester core and elective modules.`,
      actionLabel: 'Browse Course Catalog',
      actionUrl: '/student/recommendations',
    });
  }

  // Priority 4: Grade improvement or policy mismatch
  if (notEligibleCount > 0) {
    recommendedNextSteps.push({
      priority: 4,
      type: 'POLICY_GAP',
      title: 'Address Non-Transferable Credits',
      description: `${notEligibleCount} course credits do not meet ${targetInstitution ? targetInstitution.name : 'standard'} criteria (minimum grade ${targetPolicy.minGrade}). Inquire with your department advisor about remedial exams or equivalency waivers.`,
      actionLabel: 'Review Transfer Simulator',
      actionUrl: '/student/simulator',
    });
  }

  // 8. Learning and Course Pathway (Prerequisite-Aware Recommendations)
  // Fetch available courses from student's home institution or target institution
  const relevantInstIds = [student.institutionId?._id || student.institutionId];
  if (targetInstitution?._id) {
    relevantInstIds.push(targetInstitution._id);
  }

  const catalogCourses = await Course.find({
    isActive: true,
    institutionId: { $in: relevantInstIds.filter(Boolean) },
  }).populate('institutionId', 'name code');

  const coursePathway = [];
  const studentSemester = student.currentSemester || 1;

  for (const course of catalogCourses) {
    const courseCodeUpper = (course.courseCode || '').toUpperCase();

    // Skip courses the student has already completed
    if (completedCourseCodes.has(courseCodeUpper)) {
      continue;
    }

    // Check prerequisites
    const prereqs = course.prerequisites || [];
    const missingPrereqs = prereqs.filter((p) => !completedCourseCodes.has(p.toUpperCase()));
    const prereqsMet = missingPrereqs.length === 0;

    // Is this course aligned with student's upcoming academic semester?
    const isTargetSemester = course.semester === studentSemester || course.semester === studentSemester + 1;

    let matchScore = 70;
    if (prereqsMet) matchScore += 20;
    if (isTargetSemester) matchScore += 10;

    coursePathway.push({
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      semester: course.semester,
      department: course.department,
      institution: course.institutionId?.name || 'Academic Institution',
      isHomeInstitution: course.institutionId?._id?.toString() === student.institutionId?._id?.toString(),
      prerequisites: prereqs,
      prerequisitesMet: prereqsMet,
      missingPrerequisites: missingPrereqs,
      matchScore,
      recommendationReason: prereqsMet
        ? `Prerequisites fulfilled. Aligned with your Semester ${course.semester} academic progression.`
        : `Requires prerequisite: ${missingPrereqs.join(', ')}.`,
    });
  }

  // Sort course pathway by matchScore descending and semester ascending
  coursePathway.sort((a, b) => b.matchScore - a.matchScore || a.semester - b.semester);

  // 9. Evidence and Explanations
  const evidence = {
    analyzedAt: new Date().toISOString(),
    studentProfile: {
      id: student._id,
      name: student.name,
      email: student.email,
      studentId: student.studentId || 'ABC-NOT-REGISTERED',
      homeInstitution: student.institutionName || student.institutionId?.name || 'N/A',
      currentSemester: student.currentSemester || 1,
    },
    policyApplied: {
      targetInstitution: targetInstitution ? targetInstitution.name : 'National NEP Baseline Policy',
      targetInstitutionCode: targetInstitution ? targetInstitution.code : 'NAT-NEP',
      version: targetPolicy.version || 'v1.0',
      minGrade: targetPolicy.minGrade || 'B',
      minEquivalency: targetPolicy.minEquivalency || 80,
      maxCredits: targetPolicy.maxCredits || 60,
      isInstitutionalCustom: Boolean(targetInstitution),
    },
    recordsEvaluatedCount: credits.length,
    certificatesCount: certificates.length,
    semesterResultsCount: semesterResults.length,
    disclaimer: 'This readiness evaluation is a deterministic, rule-based assessment based on official records in the NEP Academic Credit Hub. Formal credit mobility is confirmed upon final review and authorization by the receiving institution.',
  };

  return {
    student: evidence.studentProfile,
    summary: {
      totalEarnedCredits,
      verifiedCredits,
      pendingCredits,
      transferredOutCredits,
      effectiveVerifiedCredits,
      overallReadiness,
      overallReadinessSummary,
    },
    targetPolicy: evidence.policyApplied,
    readiness: {
      overallStatus: overallReadiness,
      totalCreditsEvaluated: credits.length,
      eligibleCredits: cumulativeAcceptedTransferCredits,
      eligibleCount,
      needsReviewCount: reviewCount,
      notEligibleCount,
      insufficientInfoCount,
      degreeCreditGap,
      transferCreditGap,
      evaluatedCredits,
    },
    pathwayGoal: {
      selectedGoal: selectedBenchmark.id,
      goalTitle: selectedBenchmark.title,
      requiredCredits: benchmarkRequiredCredits,
      degreeCreditGap,
    },
    milestones,
    recommendedNextSteps,
    coursePathway: coursePathway.slice(0, 10), // Top 10 recommendations
    evidence,
  };
}

/**
 * Endpoint: GET /api/students/readiness-roadmap/me
 * Access: Authenticated Student (Self Only)
 */
const getMyRoadmapAndReadiness = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { targetInstitutionId, pathwayGoal } = req.query;

    const roadmap = await generateStudentRoadmap({
      studentId,
      targetInstitutionId,
      pathwayGoal,
    });

    return ApiResponse.success(res, roadmap, 'Student credit transfer readiness and personalized roadmap generated successfully.');
  } catch (error) {
    console.error('Roadmap generation error:', error);
    const status = error.statusCode || 500;
    return ApiResponse.error(res, error.message || 'Failed to generate academic roadmap.', status);
  }
};

/**
 * Endpoint: GET /api/students/readiness-roadmap/:studentId
 * Access: Institution (Enrolled students only) or Admin (All)
 */
const getStudentRoadmapById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { targetInstitutionId, pathwayGoal } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return ApiResponse.error(res, 'Invalid student identifier format.', 400);
    }

    // Role-based Tenant Enforcement
    if (req.user.role === ROLES.STUDENT) {
      // Students cannot use parameter-based route to inspect other students
      if (req.user._id.toString() !== studentId.toString()) {
        return ApiResponse.error(res, 'Access denied: You are only authorized to view your own academic roadmap.', 403);
      }
    } else if (req.user.role === ROLES.INSTITUTION) {
      const student = await User.findById(studentId);
      if (!student) {
        return ApiResponse.error(res, 'Student record not found.', 404);
      }
      if (
        !req.user.institutionId ||
        !student.institutionId ||
        student.institutionId.toString() !== req.user.institutionId.toString()
      ) {
        return ApiResponse.error(res, 'Access denied: You can only view roadmaps of students enrolled in your institution.', 403);
      }
    }

    const roadmap = await generateStudentRoadmap({
      studentId,
      targetInstitutionId,
      pathwayGoal,
    });

    return ApiResponse.success(res, roadmap, 'Student academic roadmap retrieved successfully.');
  } catch (error) {
    console.error('Roadmap retrieval error:', error);
    const status = error.statusCode || 500;
    return ApiResponse.error(res, error.message || 'Failed to retrieve student academic roadmap.', status);
  }
};

module.exports = {
  generateStudentRoadmap,
  getMyRoadmapAndReadiness,
  getStudentRoadmapById,
};
