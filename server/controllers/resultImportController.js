const mongoose = require('mongoose');
const xlsx = require('xlsx');
const { SemesterResult, VALID_GRADES } = require('../models/SemesterResult');
const { ResultImportBatch } = require('../models/ResultImportBatch');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Course } = require('../models/Course');
const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');
const { generateCreditHash } = require('../utils/hashHelper');

// Grade-to-marks standard NEP mapping helper
const calculateGradeFromMarks = (marks) => {
  const m = Number(marks);
  if (isNaN(m)) return null;
  if (m >= 90) return 'O';
  if (m >= 80) return 'A+';
  if (m >= 70) return 'A';
  if (m >= 60) return 'B+';
  if (m >= 55) return 'B';
  if (m >= 50) return 'C';
  if (m >= 40) return 'P';
  return 'F';
};

const isPassingGrade = (grade) => {
  const g = String(grade || '').toUpperCase().trim();
  return ['O', 'A+', 'A', 'B+', 'B', 'C', 'P'].includes(g);
};

/**
 * 1. Generate & Download Sample Excel Template
 * GET /api/institution/results/template
 */
const downloadSampleTemplate = async (req, res) => {
  try {
    const institutionId = req.user.role === 'institution' ? req.user.institutionId : (req.query.institutionId || req.user.institutionId);

    // Fetch sample courses and students for this institution to provide realistic helper rows
    let sampleStudents = [];
    let sampleCourses = [];

    if (institutionId && mongoose.Types.ObjectId.isValid(institutionId)) {
      sampleStudents = await User.find({ role: ROLES.STUDENT, institutionId, isActive: true })
        .limit(5)
        .select('name studentId email')
        .lean();

      sampleCourses = await Course.find({ institutionId, isActive: true })
        .limit(5)
        .select('courseCode courseName credits semester')
        .lean();
    }

    const templateRows = [];

    if (sampleStudents.length > 0 && sampleCourses.length > 0) {
      // Generate realistic sample rows matching institution's curriculum
      sampleStudents.forEach((student, sIdx) => {
        const c1 = sampleCourses[0];
        const c2 = sampleCourses[1] || sampleCourses[0];

        // First subject
        const isLastStudent = sIdx === sampleStudents.length - 1;
        const marks1 = isLastStudent ? 34 : (82 + ((sIdx * 4) % 15));
        templateRows.push({
          'ABC ID': student.studentId,
          'Student Name': student.name,
          'Course Code': c1.courseCode,
          'Course Name': c1.courseName,
          Marks: marks1,
          Grade: calculateGradeFromMarks(marks1),
        });

        // Second subject (if another course exists)
        if (c2 && c2.courseCode !== c1.courseCode) {
          const marks2 = isLastStudent ? 62 : (74 + ((sIdx * 3) % 20));
          templateRows.push({
            'ABC ID': student.studentId,
            'Student Name': student.name,
            'Course Code': c2.courseCode,
            'Course Name': c2.courseName,
            Marks: marks2,
            Grade: calculateGradeFromMarks(marks2),
          });
        }
      });
    } else {
      // Generic fallback if institution has not registered courses or students yet
      templateRows.push(
        {
          'ABC ID': 'ABC-100101',
          'Student Name': 'Sample Student A',
          'Course Code': 'CS101',
          'Course Name': 'Programming Fundamentals',
          Marks: 85,
          Grade: 'A+',
        },
        {
          'ABC ID': 'ABC-100101',
          'Student Name': 'Sample Student A',
          'Course Code': 'CS102',
          'Course Name': 'Mathematics for Computing',
          Marks: 78,
          Grade: 'A',
        },
        {
          'ABC ID': 'ABC-100102',
          'Student Name': 'Sample Student B',
          'Course Code': 'CS101',
          'Course Name': 'Programming Fundamentals',
          Marks: 32,
          Grade: 'F',
        }
      );
    }

    const instructionRows = [
      {
        Field: 'ABC ID',
        Description: 'Student Academic Bank of Credits ID / Roll Number as registered in the system (Required).',
      },
      {
        Field: 'Student Name',
        Description: 'Student full name for reference verification (Optional).',
      },
      {
        Field: 'Course Code',
        Description: 'Exact course code as cataloged in your institution (e.g. 22MA101, 22PH102, CS101) (Required).',
      },
      {
        Field: 'Course Name',
        Description: 'Course module name (Optional).',
      },
      {
        Field: 'Marks',
        Description: 'Total score (0-100). Passing threshold is >= 40 marks.',
      },
      {
        Field: 'Grade',
        Description: 'Official NEP Grade: O (90-100), A+ (80-89), A (70-79), B+ (60-69), B (55-59), C (50-54), P (40-49), F (<40).',
      },
      {
        Field: 'Course Credits',
        Description: 'Fixed course credit value is AUTHORITATIVELY fetched from the institution course catalog in database.',
      },
    ];

    const wb = xlsx.utils.book_new();

    const wsResults = xlsx.utils.json_to_sheet(templateRows);
    wsResults['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 36 }, { wch: 10 }, { wch: 10 }];
    xlsx.utils.book_append_sheet(wb, wsResults, 'Results Template');

    const wsInstructions = xlsx.utils.json_to_sheet(instructionRows);
    wsInstructions['!cols'] = [{ wch: 20 }, { wch: 80 }];
    xlsx.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="NEP_Semester_Results_Import_Template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Template Download Error:', error);
    return ApiResponse.error(res, 'Failed to generate sample Excel template', 500, error.message);
  }
};

/**
 * 1b. Retrieve Sample Template Structure & Data for In-Browser Viewing
 * GET /api/institution/results/template/data
 */
const getTemplateData = async (req, res) => {
  try {
    const institutionId = req.user.role === 'institution' ? req.user.institutionId : (req.query.institutionId || req.user.institutionId);

    let sampleStudents = [];
    let sampleCourses = [];

    if (institutionId && mongoose.Types.ObjectId.isValid(institutionId)) {
      sampleStudents = await User.find({ role: ROLES.STUDENT, institutionId, isActive: true })
        .limit(5)
        .select('name studentId email currentSemester')
        .lean();

      sampleCourses = await Course.find({ institutionId, isActive: true })
        .limit(6)
        .select('courseCode courseName credits semester department')
        .lean();
    }

    const sampleRows = [];
    if (sampleStudents.length > 0 && sampleCourses.length > 0) {
      sampleStudents.forEach((student, sIdx) => {
        const c1 = sampleCourses[0];
        const c2 = sampleCourses[1] || sampleCourses[0];

        const isLast = sIdx === sampleStudents.length - 1;
        const marks1 = isLast ? 34 : (82 + ((sIdx * 4) % 15));
        sampleRows.push({
          'ABC ID': student.studentId,
          'Student Name': student.name,
          'Course Code': c1.courseCode,
          'Course Name': c1.courseName,
          Marks: marks1,
          Grade: calculateGradeFromMarks(marks1),
          Credits: c1.credits,
          Status: marks1 >= 40 ? 'PASS' : 'FAIL',
        });

        if (c2 && c2.courseCode !== c1.courseCode) {
          const marks2 = isLast ? 62 : (74 + ((sIdx * 3) % 20));
          sampleRows.push({
            'ABC ID': student.studentId,
            'Student Name': student.name,
            'Course Code': c2.courseCode,
            'Course Name': c2.courseName,
            Marks: marks2,
            Grade: calculateGradeFromMarks(marks2),
            Credits: c2.credits,
            Status: marks2 >= 40 ? 'PASS' : 'FAIL',
          });
        }
      });
    }

    return ApiResponse.success(res, {
      columns: [
        { key: 'ABC ID', label: 'Student ABC ID', required: true, description: 'Academic Bank of Credits identifier' },
        { key: 'Student Name', label: 'Student Name', required: false, description: 'Student full name for reference' },
        { key: 'Course Code', label: 'Course Code', required: true, description: 'Cataloged course code in curriculum' },
        { key: 'Course Name', label: 'Course Name', required: false, description: 'Course title' },
        { key: 'Marks', label: 'Marks', required: true, description: 'Score between 0 and 100' },
        { key: 'Grade', label: 'Grade', required: true, description: 'Letter grade: O, A+, A, B+, B, C, P, F' },
      ],
      sampleRows,
      availableCourses: sampleCourses.map(c => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        credits: c.credits,
        semester: c.semester,
      })),
      availableStudents: sampleStudents.map(s => ({
        studentId: s.studentId,
        name: s.name,
        currentSemester: s.currentSemester || 1,
      })),
      gradingScale: [
        { grade: 'O', range: '90 - 100', status: 'PASS', points: 10 },
        { grade: 'A+', range: '80 - 89', status: 'PASS', points: 9 },
        { grade: 'A', range: '70 - 79', status: 'PASS', points: 8 },
        { grade: 'B+', range: '60 - 69', status: 'PASS', points: 7 },
        { grade: 'B', range: '55 - 59', status: 'PASS', points: 6 },
        { grade: 'C', range: '50 - 54', status: 'PASS', points: 5 },
        { grade: 'P', range: '40 - 49', status: 'PASS', points: 4 },
        { grade: 'F', range: '0 - 39', status: 'FAIL', points: 0 },
      ],
    }, 'Template guide and sample data retrieved successfully.');
  } catch (error) {
    console.error('Template Data Error:', error);
    return ApiResponse.error(res, 'Failed to retrieve template sample data', 500, error.message);
  }
};

/**
 * 2. Upload and Preview Semester-Wise Results
 * POST /api/institution/results/preview
 */
const previewResultsImport = async (req, res) => {
  try {
    let institutionId = null;
    if (req.user.role === 'institution') {
      institutionId = req.user.institutionId;
    } else if (req.user.role === 'admin') {
      institutionId = req.body.institutionId || req.user.institutionId;
    }

    if (!institutionId || !mongoose.Types.ObjectId.isValid(institutionId)) {
      return ApiResponse.error(res, 'Valid institution context is required.', 400);
    }

    const { academicYear, semester } = req.body;
    const numSemester = Number(semester);

    if (!academicYear || !academicYear.trim()) {
      return ApiResponse.error(res, 'Academic year is required (e.g. 2024-25).', 400);
    }
    if (isNaN(numSemester) || numSemester < 1 || numSemester > 12) {
      return ApiResponse.error(res, 'Semester must be an integer between 1 and 12.', 400);
    }

    if (!req.file || !req.file.buffer) {
      return ApiResponse.error(res, 'Please upload a valid .xlsx Excel results spreadsheet.', 400);
    }

    // Parse XLSX file from memory buffer
    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    } catch (err) {
      return ApiResponse.error(res, 'Failed to parse Excel file. Ensure file is a valid .xlsx format.', 400);
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return ApiResponse.error(res, 'The uploaded Excel file contains no worksheets.', 400);
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return ApiResponse.error(res, 'The uploaded worksheet contains no data rows.', 400);
    }

    if (rawRows.length > 2000) {
      return ApiResponse.error(res, 'File exceeds maximum limit of 2,000 result rows per batch.', 400);
    }

    // Pre-load all courses belonging to this institution for high-performance lookup
    const courses = await Course.find({ institutionId, isActive: true }).lean();
    const courseMapByCode = new Map();
    courses.forEach((c) => {
      courseMapByCode.set(c.courseCode.toUpperCase().trim(), c);
    });

    // Pre-load all students belonging to this institution
    const students = await User.find({ role: ROLES.STUDENT, institutionId }).lean();
    const studentMapByAbcId = new Map();
    students.forEach((s) => {
      if (s.studentId) {
        studentMapByAbcId.set(s.studentId.toUpperCase().trim(), s);
      }
    });

    // Also look up all ABC IDs globally to catch cross-institution attempts
    const allAbcIdsInFile = rawRows
      .map((r) => String(r['ABC ID'] || r['Student ID'] || r['abcId'] || r['studentId'] || '').toUpperCase().trim())
      .filter(Boolean);

    const crossInstStudents = await User.find({
      role: ROLES.STUDENT,
      studentId: { $in: allAbcIdsInFile },
      institutionId: { $ne: institutionId },
    }).lean();

    const crossInstMap = new Map();
    crossInstStudents.forEach((s) => {
      if (s.studentId) {
        crossInstMap.set(s.studentId.toUpperCase().trim(), s);
      }
    });

    // Pre-load ALL existing AcademicCredits and SemesterResults for this institution's students
    // Under NEP / ABC rules, a student cannot receive duplicate academic credits for the same course
    const studentDbIds = students.map((s) => s._id);

    const existingCredits = await AcademicCredit.find({
      institutionId,
      studentId: { $in: studentDbIds },
    }).lean();

    const studentMapById = new Map(students.map((s) => [s._id.toString(), s]));
    const courseMapById = new Map(courses.map((c) => [c._id.toString(), c]));

    // Maps for fast O(1) duplicate credit detection
    const existingCreditMap = new Map();
    const existingAbcCourseCreditMap = new Map();

    existingCredits.forEach((c) => {
      const idKey = `${c.studentId.toString()}_${c.courseId.toString()}`;
      existingCreditMap.set(idKey, c);

      const sDoc = studentMapById.get(c.studentId.toString());
      const cDoc = courseMapById.get(c.courseId.toString());
      if (sDoc?.studentId && cDoc?.courseCode) {
        const abcKey = `${sDoc.studentId.toUpperCase().trim()}_${cDoc.courseCode.toUpperCase().trim()}`;
        existingAbcCourseCreditMap.set(abcKey, c);
      }
    });

    const existingResults = await SemesterResult.find({
      institutionId,
    }).lean();

    const existingResultMap = new Map();
    const existingAbcCourseResultMap = new Map();

    existingResults.forEach((r) => {
      const idKey = `${r.studentId.toString()}_${r.courseId.toString()}`;
      existingResultMap.set(idKey, r);

      if (r.studentAbcId && r.courseCode) {
        const abcKey = `${r.studentAbcId.toUpperCase().trim()}_${r.courseCode.toUpperCase().trim()}`;
        existingAbcCourseResultMap.set(abcKey, r);
      }
    });

    // Process and validate rows
    const seenInFile = new Set();
    const items = [];
    const errors = [];

    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let duplicateRows = 0;
    let previouslyProcessedRows = 0;
    let totalEligibleCredits = 0;

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNumber = index + 2; // 1-based index including header
      totalRows++;

      // Header normalization
      const abcId = String(row['ABC ID'] || row['Student ID'] || row['abcId'] || row['studentId'] || '').trim().toUpperCase();
      const rawCourseCode = String(row['Course Code'] || row['courseCode'] || row['Course'] || row['course'] || '').trim().toUpperCase();
      const studentName = String(row['Student Name'] || row['name'] || '').trim();
      const courseName = String(row['Course Name'] || row['courseName'] || '').trim();
      const rawMarks = row['Marks'] !== '' && row['Marks'] !== undefined ? Number(row['Marks']) : null;
      let rawGrade = String(row['Grade'] || row['grade'] || '').trim().toUpperCase();

      let rowValid = true;
      let rejectionReason = null;
      let isDuplicate = false;
      let isAlreadyProcessed = false;
      let alreadyExistsReason = null;

      // 1. ABC ID Validation
      if (!abcId) {
        rowValid = false;
        rejectionReason = 'Missing student ABC ID.';
      } else if (crossInstMap.has(abcId)) {
        rowValid = false;
        rejectionReason = `Student with ABC ID '${abcId}' belongs to another institution. Cross-institutional results upload is forbidden.`;
      } else if (!studentMapByAbcId.has(abcId)) {
        rowValid = false;
        rejectionReason = `Student with ABC ID '${abcId}' is not found in your institution directory. New students cannot be auto-created from results.`;
      }

      // 2. Course Validation
      let matchedCourse = null;
      if (rowValid) {
        if (!rawCourseCode) {
          rowValid = false;
          rejectionReason = 'Missing Course Code.';
        } else if (!courseMapByCode.has(rawCourseCode)) {
          rowValid = false;
          rejectionReason = `Course '${rawCourseCode}' is not cataloged in your institution curriculum.`;
        } else {
          matchedCourse = courseMapByCode.get(rawCourseCode);
        }
      }

      // 3. Duplicate within File Check
      const fileKey = `${abcId}_${rawCourseCode}`;
      if (abcId && rawCourseCode) {
        if (seenInFile.has(fileKey)) {
          rowValid = false;
          isDuplicate = true;
          rejectionReason = `Duplicate entry in spreadsheet for student '${abcId}' and course '${rawCourseCode}'.`;
          duplicateRows++;
        } else {
          seenInFile.add(fileKey);
        }
      }

      // 4. Previously Awarded Credits & Existing Results Check
      if (rowValid && !isDuplicate) {
        const matchedStudent = studentMapByAbcId.get(abcId);
        let existingCreditFound = null;
        let existingResultFound = null;

        if (matchedStudent && matchedCourse) {
          const idKey = `${matchedStudent._id.toString()}_${matchedCourse._id.toString()}`;
          existingCreditFound = existingCreditMap.get(idKey);
          existingResultFound = existingResultMap.get(idKey);
        }

        if (!existingCreditFound) {
          existingCreditFound = existingAbcCourseCreditMap.get(fileKey);
        }
        if (!existingResultFound) {
          existingResultFound = existingAbcCourseResultMap.get(fileKey);
        }

        if (existingCreditFound) {
          isAlreadyProcessed = true;
          previouslyProcessedRows++;
          alreadyExistsReason = `Credits already awarded for this course (${existingCreditFound.credits} credits, Grade ${existingCreditFound.grade} in Sem ${existingCreditFound.semester}, ${existingCreditFound.academicYear}).`;
        } else if (existingResultFound) {
          isAlreadyProcessed = true;
          previouslyProcessedRows++;
          alreadyExistsReason = `Semester result already recorded for this course (Status ${existingResultFound.resultStatus}, Grade ${existingResultFound.grade} in Sem ${existingResultFound.semester}, ${existingResultFound.academicYear}).`;
        }
      }

      // 5. Marks and Grade Validation
      let computedMarks = rawMarks;
      let finalGrade = rawGrade;

      if (rowValid && !isDuplicate) {
        if (computedMarks !== null) {
          if (isNaN(computedMarks) || computedMarks < 0 || computedMarks > 100) {
            rowValid = false;
            rejectionReason = `Invalid marks (${row['Marks']}). Marks must be a number between 0 and 100.`;
          } else if (!finalGrade) {
            finalGrade = calculateGradeFromMarks(computedMarks);
          }
        }

        if (rowValid) {
          if (!finalGrade) {
            rowValid = false;
            rejectionReason = 'Neither valid marks nor grade was supplied for this course result.';
          } else if (!VALID_GRADES.includes(finalGrade)) {
            rowValid = false;
            rejectionReason = `Unrecognized grade '${finalGrade}'. Permitted grades are: ${VALID_GRADES.join(', ')}.`;
          }
        }
      }

      // 6. Passing & Eligible Credits Calculation
      // Authoritative credits come from database Course record
      const courseCredits = matchedCourse ? matchedCourse.credits : 0;
      const isPass = isPassingGrade(finalGrade);
      const resultStatus = isPass ? 'PASS' : 'FAIL';
      // Eligible credits to be awarded: 0 if already processed / previously awarded credits exist
      const eligibleCredits = (rowValid && !isAlreadyProcessed && isPass) ? courseCredits : 0;

      if (rowValid && !isAlreadyProcessed) {
        validRows++;
        totalEligibleCredits += eligibleCredits;
      } else if (!rowValid) {
        invalidRows++;
        errors.push({
          rowNumber,
          studentAbcId: abcId || 'N/A',
          courseCode: rawCourseCode || 'N/A',
          reason: rejectionReason,
        });
      }

      const matchedStudent = studentMapByAbcId.get(abcId);

      items.push({
        rowNumber,
        studentAbcId: abcId,
        studentName: matchedStudent?.name || studentName || '—',
        studentId: matchedStudent?._id || null,
        currentSemester: matchedStudent?.currentSemester || 1,
        courseCode: rawCourseCode,
        courseName: matchedCourse?.courseName || courseName || '—',
        courseId: matchedCourse?._id || null,
        credits: courseCredits,
        marks: computedMarks,
        grade: finalGrade,
        resultStatus,
        eligibleCredits,
        isValid: rowValid,
        isDuplicateInFile: isDuplicate,
        isAlreadyProcessed,
        alreadyExistsReason,
        rejectionReason: alreadyExistsReason || rejectionReason,
      });
    }

    // Generate Batch Record in 'PREVIEW' status
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const batchRecord = new ResultImportBatch({
      batchId,
      institutionId,
      academicYear: academicYear.trim(),
      semester: numSemester,
      uploadedBy: req.user._id,
      originalFileName: req.file.originalname || 'results.xlsx',
      fileSize: req.file.size || 0,
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      previouslyProcessedRows,
      processedRows: 0,
      creditsAwarded: 0,
      studentsAdvanced: 0,
      status: 'PREVIEW',
      errors: errors.slice(0, 100), // Keep top 100 error summaries
      items,
    });

    await batchRecord.save();

    let summaryMsg = `Validated ${totalRows} rows: ${validRows} ready for credit accumulation`;
    if (previouslyProcessedRows > 0) {
      summaryMsg += `, ${previouslyProcessedRows} already exist with previously awarded credits (will be skipped)`;
    }
    if (invalidRows > 0) {
      summaryMsg += `, ${invalidRows} validation errors`;
    }
    summaryMsg += '.';

    return ApiResponse.success(
      res,
      {
        batchId,
        academicYear: academicYear.trim(),
        semester: numSemester,
        counts: {
          totalRows,
          validRows,
          invalidRows,
          duplicateRows,
          previouslyProcessedRows,
          totalEligibleCredits,
        },
        items,
        errors,
      },
      summaryMsg
    );
  } catch (error) {
    console.error('Preview Results Import Error:', error);
    return ApiResponse.error(res, 'Failed to process Excel preview', 500, error.message);
  }
};

/**
 * 3. Confirm Results Import & Automatic Credit Accumulation + Progression
 * POST /api/institution/results/confirm
 */
const confirmResultsImport = async (req, res) => {
  try {
    const { batchId } = req.body;
    if (!batchId) {
      return ApiResponse.error(res, 'Batch ID is required for confirmation.', 400);
    }

    let institutionId = null;
    if (req.user.role === 'institution') {
      institutionId = req.user.institutionId;
    } else if (req.user.role === 'admin') {
      institutionId = req.body.institutionId || req.user.institutionId;
    }

    const batch = await ResultImportBatch.findOne({ batchId, institutionId });
    if (!batch) {
      return ApiResponse.error(res, 'Batch not found or unauthorized for this institution.', 404);
    }

    if (batch.status === 'CONFIRMED') {
      return ApiResponse.error(res, 'This batch has already been confirmed and processed.', 400);
    }

    const validItems = batch.items.filter((item) => item.isValid && !item.isAlreadyProcessed);
    if (validItems.length === 0) {
      return ApiResponse.error(res, 'No valid, unprocessed rows exist in this batch to import.', 400);
    }

    let processedCount = 0;
    let creditsAwardedCount = 0;
    let creditPointsTotal = 0;
    const studentsAdvancedList = [];

    // Pre-fetch all students, courses, and existing records in bulk for instant in-memory processing
    const studentIds = [...new Set(validItems.map((i) => i.studentId.toString()))];
    const courseIds = [...new Set(validItems.map((i) => i.courseId.toString()))];

    const students = await User.find({
      _id: { $in: studentIds },
      institutionId: batch.institutionId,
      role: ROLES.STUDENT,
    });
    const courses = await Course.find({
      _id: { $in: courseIds },
      institutionId: batch.institutionId,
      isActive: true,
    });

    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const existingResults = await SemesterResult.find({
      studentId: { $in: studentIds },
      courseId: { $in: courseIds },
      semester: batch.semester,
    }).lean();
    const existingResultKeySet = new Set(
      existingResults.map((r) => `${r.studentId.toString()}_${r.courseId.toString()}`)
    );

    // Pre-load all AcademicCredits previously awarded for these students and courses across ANY academic year/semester
    const existingCredits = await AcademicCredit.find({
      studentId: { $in: studentIds },
      courseId: { $in: courseIds },
    }).lean();
    const existingCreditKeySet = new Set(
      existingCredits.map((c) => `${c.studentId.toString()}_${c.courseId.toString()}`)
    );

    // Map to group results by student to evaluate semester progression
    // studentId -> { studentDoc, results: [] }
    const studentResultsMap = new Map();

    for (const item of validItems) {
      const student = studentMap.get(item.studentId.toString());
      const course = courseMap.get(item.courseId.toString());

      if (!student || !course) {
        continue;
      }

      // Check duplicate idempotency
      const resultKey = `${student._id.toString()}_${course._id.toString()}`;
      if (existingResultKeySet.has(resultKey)) {
        continue; // Skip duplicate to ensure strict idempotency
      }
      existingResultKeySet.add(resultKey);

      const isPass = isPassingGrade(item.grade);
      const authoritativeCredits = isPass ? course.credits : 0;
      const resultStatus = isPass ? 'PASS' : 'FAIL';

      // 1. Create authoritative SemesterResult record
      const semesterResult = await SemesterResult.create({
        studentId: student._id,
        studentAbcId: student.studentId || item.studentAbcId,
        institutionId: batch.institutionId,
        academicYear: batch.academicYear,
        semester: batch.semester,
        courseId: course._id,
        courseCode: course.courseCode,
        marks: item.marks,
        grade: item.grade,
        creditsEarned: authoritativeCredits,
        resultStatus,
        importBatchId: batch._id,
        attemptNumber: 1,
      });

      // 2. If Passed, award AcademicCredit with SHA-256 seal
      let createdCredit = null;
      if (isPass && authoritativeCredits > 0) {
        // Prevent duplicate in AcademicCredit
        if (!existingCreditKeySet.has(resultKey)) {
          existingCreditKeySet.add(resultKey);
          const integrityHash = generateCreditHash({
            studentId: student._id,
            courseId: course._id,
            institutionId: batch.institutionId,
            credits: authoritativeCredits,
            grade: item.grade,
            semester: batch.semester,
            academicYear: batch.academicYear,
          });

          createdCredit = await AcademicCredit.create({
            studentId: student._id,
            courseId: course._id,
            institutionId: batch.institutionId,
            credits: authoritativeCredits,
            grade: item.grade,
            semester: batch.semester,
            academicYear: batch.academicYear,
            awardDate: new Date(),
            verificationStatus: 'verified',
            sourceType: 'institution',
            integrityHash,
            verifiedBy: req.user._id,
            verifiedAt: new Date(),
            semesterResultId: semesterResult._id,
            importBatchId: batch._id,
          });

          semesterResult.creditId = createdCredit._id;
          await semesterResult.save();

          creditsAwardedCount++;
          creditPointsTotal += authoritativeCredits;
        }
      }

      processedCount++;

      // Collect student results to check semester progression
      const sId = student._id.toString();
      if (!studentResultsMap.has(sId)) {
        studentResultsMap.set(sId, {
          student,
          results: [],
        });
      }
      studentResultsMap.get(sId).results.push({
        courseCode: course.courseCode,
        isPass,
        resultStatus,
        credits: authoritativeCredits,
      });
    }

    // 3. Automatic Semester Progression Evaluation
    // Progression policy: if credits awarded / results successfully completed for currentSemester,
    // and student did not fail any course in this semester, advance from Semester N to N+1.
    for (const [studentIdStr, studentData] of studentResultsMap.entries()) {
      const student = studentData.student;
      const currentSem = student.currentSemester || 1;

      // Only advance if the results uploaded correspond to the student's current semester
      if (batch.semester === currentSem) {
        const studentSemResults = studentData.results;
        // Check if student passed all courses for this semester
        const hasFailedCourse = studentSemResults.some((r) => !r.isPass);
        const hasPassedAtLeastOne = studentSemResults.some((r) => r.isPass);

        if (!hasFailedCourse && hasPassedAtLeastOne && currentSem < 12) {
          const nextSem = currentSem + 1;
          await User.findByIdAndUpdate(student._id, { $set: { currentSemester: nextSem } });
          studentsAdvancedList.push({
            studentId: student._id,
            studentAbcId: student.studentId,
            name: student.name,
            previousSemester: currentSem,
            newSemester: nextSem,
          });
        }
      }
    }

    // 4. Update ResultImportBatch status
    batch.status = 'CONFIRMED';
    batch.processedRows = processedCount;
    batch.creditsAwarded = creditsAwardedCount;
    batch.studentsAdvanced = studentsAdvancedList.length;
    await batch.save();

    // 5. Create immutable AuditLog
    await AuditLog.create({
      logId: `LOG-IMPORT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.user._id,
      institutionId: batch.institutionId,
      action: 'RESULTS_IMPORTED',
      resource: `ResultImportBatch:${batch._id}`,
      details: {
        batchId: batch.batchId,
        academicYear: batch.academicYear,
        semester: batch.semester,
        totalRows: batch.totalRows,
        processedRows: processedCount,
        creditsAwardedCount,
        creditPointsTotal,
        studentsAdvanced: studentsAdvancedList.length,
      },
      ipAddress: req.ip || '127.0.0.1',
    });

    return ApiResponse.success(
      res,
      {
        batchId: batch.batchId,
        processedRows: processedCount,
        creditsAwarded: creditsAwardedCount,
        creditPointsTotal,
        studentsAdvanced: studentsAdvancedList.length,
        advancedStudents: studentsAdvancedList,
        skippedExistingRecords: (batch.previouslyProcessedRows || 0) + (validItems.length - processedCount),
      },
      `Successfully imported ${processedCount} results and awarded ${creditsAwardedCount} academic credits. ${(batch.previouslyProcessedRows || 0) + (validItems.length - processedCount)} existing record(s) with previously awarded credits were safely skipped. ${studentsAdvancedList.length} student(s) advanced to the next semester.`
    );
  } catch (error) {
    console.error('Confirm Results Import Error:', error);
    return ApiResponse.error(res, 'Failed to confirm results import', 500, error.message);
  }
};

/**
 * 4. Get List of Import Batches
 * GET /api/institution/results/batches
 */
const getImportBatches = async (req, res) => {
  try {
    let institutionId = null;
    if (req.user.role === 'institution') {
      institutionId = req.user.institutionId;
    } else if (req.user.role === 'admin') {
      institutionId = req.query.institutionId || req.user.institutionId;
    }

    if (!institutionId) {
      return ApiResponse.error(res, 'Institution context is required.', 400);
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await ResultImportBatch.countDocuments({ institutionId });
    const batches = await ResultImportBatch.find({ institutionId })
      .select('-items') // omit raw items for summary listing
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      batches,
      total,
      page,
      limit,
      'Import batches retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Batches Error:', error);
    return ApiResponse.error(res, 'Failed to retrieve import batches', 500, error.message);
  }
};

/**
 * 5. Get Detailed Batch Information
 * GET /api/institution/results/batches/:batchId
 */
const getBatchDetails = async (req, res) => {
  try {
    const { batchId } = req.params;
    let institutionId = null;
    if (req.user.role === 'institution') {
      institutionId = req.user.institutionId;
    } else if (req.user.role === 'admin') {
      institutionId = req.query.institutionId || req.user.institutionId;
    }

    const query = { batchId };
    if (institutionId) {
      query.institutionId = institutionId;
    }

    const batch = await ResultImportBatch.findOne(query).populate('uploadedBy', 'name email');
    if (!batch) {
      return ApiResponse.error(res, 'Import batch not found.', 404);
    }

    return ApiResponse.success(res, batch, 'Batch details retrieved successfully.');
  } catch (error) {
    console.error('Get Batch Details Error:', error);
    return ApiResponse.error(res, 'Failed to retrieve batch details', 500, error.message);
  }
};

/**
 * 6. Get Semester-Wise Results List
 * GET /api/institution/results
 */
const getSemesterResults = async (req, res) => {
  try {
    let institutionId = null;
    if (req.user.role === 'institution') {
      institutionId = req.user.institutionId;
    } else if (req.user.role === 'admin') {
      institutionId = req.query.institutionId || req.user.institutionId;
    }

    const {
      academicYear,
      semester,
      studentId,
      studentAbcId,
      courseCode,
      resultStatus,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};
    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = Number(semester);
    if (studentId) query.studentId = studentId;
    if (studentAbcId) query.studentAbcId = String(studentAbcId).toUpperCase().trim();
    if (courseCode) query.courseCode = String(courseCode).toUpperCase().trim();
    if (resultStatus) query.resultStatus = String(resultStatus).toUpperCase().trim();

    const skip = (Number(page) - 1) * Number(limit);
    const total = await SemesterResult.countDocuments(query);
    const results = await SemesterResult.find(query)
      .populate('studentId', 'name email studentId currentSemester')
      .populate('courseId', 'courseCode courseName credits department')
      .populate('institutionId', 'name code')
      .sort({ academicYear: -1, semester: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      results,
      total,
      page,
      limit,
      'Semester results retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Semester Results Error:', error);
    return ApiResponse.error(res, 'Failed to fetch semester results', 500, error.message);
  }
};

/**
 * 7. Correct an Imported Result Record (Audited Correction Policy)
 * PUT /api/institution/results/:id/correct
 */
const correctResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks, grade, reason } = req.body;

    if (!reason || !reason.trim()) {
      return ApiResponse.error(res, 'A clear reason is required for audited result corrections.', 400);
    }

    const result = await SemesterResult.findById(id).populate('courseId');
    if (!result) {
      return ApiResponse.error(res, 'Semester result record not found.', 404);
    }

    if (
      req.user.role === 'institution' &&
      result.institutionId.toString() !== req.user.institutionId.toString()
    ) {
      return ApiResponse.error(res, 'Cannot modify results belonging to another institution.', 403);
    }

    let finalGrade = grade ? String(grade).toUpperCase().trim() : result.grade;
    let finalMarks = marks !== undefined && marks !== null ? Number(marks) : result.marks;

    if (marks !== undefined && marks !== null) {
      if (isNaN(finalMarks) || finalMarks < 0 || finalMarks > 100) {
        return ApiResponse.error(res, 'Marks must be between 0 and 100.', 400);
      }
      if (!grade) {
        finalGrade = calculateGradeFromMarks(finalMarks);
      }
    }

    if (!VALID_GRADES.includes(finalGrade)) {
      return ApiResponse.error(res, `Invalid grade. Permitted: ${VALID_GRADES.join(', ')}`, 400);
    }

    const isPass = isPassingGrade(finalGrade);
    const newStatus = isPass ? 'PASS' : 'FAIL';
    const courseCredits = result.courseId?.credits || 0;
    const newCreditsEarned = isPass ? courseCredits : 0;

    // Archive current state into correctionHistory
    result.correctionHistory.push({
      previousMarks: result.marks,
      previousGrade: result.grade,
      previousCredits: result.creditsEarned,
      previousStatus: result.resultStatus,
      updatedBy: req.user._id,
      updatedAt: new Date(),
      reason: reason.trim(),
    });

    result.marks = finalMarks;
    result.grade = finalGrade;
    result.creditsEarned = newCreditsEarned;
    result.resultStatus = newStatus;
    result.isCorrected = true;

    // Adjust or create AcademicCredit
    if (isPass && newCreditsEarned > 0) {
      let credit = await AcademicCredit.findOne({
        studentId: result.studentId,
        courseId: result.courseId._id,
        academicYear: result.academicYear,
        semester: result.semester,
      });

      if (credit) {
        credit.grade = finalGrade;
        credit.credits = newCreditsEarned;
        credit.verificationStatus = 'verified';
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
        result.creditId = credit._id;
      } else {
        const integrityHash = generateCreditHash({
          studentId: result.studentId,
          courseId: result.courseId._id,
          institutionId: result.institutionId,
          credits: newCreditsEarned,
          grade: finalGrade,
          semester: result.semester,
          academicYear: result.academicYear,
        });

        const newCredit = await AcademicCredit.create({
          studentId: result.studentId,
          courseId: result.courseId._id,
          institutionId: result.institutionId,
          credits: newCreditsEarned,
          grade: finalGrade,
          semester: result.semester,
          academicYear: result.academicYear,
          awardDate: new Date(),
          verificationStatus: 'verified',
          sourceType: 'institution',
          integrityHash,
          verifiedBy: req.user._id,
          verifiedAt: new Date(),
          semesterResultId: result._id,
        });
        result.creditId = newCredit._id;
      }
    } else {
      // Failed: Remove credit or set revoked
      if (result.creditId) {
        await AcademicCredit.findByIdAndDelete(result.creditId);
        result.creditId = null;
      }
    }

    await result.save();

    // Audit log
    await AuditLog.create({
      logId: `LOG-CORRECT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.user._id,
      institutionId: result.institutionId,
      action: 'RESULT_CORRECTED',
      resource: `SemesterResult:${result._id}`,
      details: {
        resultId: result._id,
        studentAbcId: result.studentAbcId,
        courseCode: result.courseCode,
        newMarks: finalMarks,
        newGrade: finalGrade,
        newStatus,
        newCreditsEarned,
        reason: reason.trim(),
      },
      ipAddress: req.ip || '127.0.0.1',
    });

    return ApiResponse.success(res, result, 'Semester result corrected and audit history updated successfully.');
  } catch (error) {
    console.error('Correct Result Error:', error);
    return ApiResponse.error(res, 'Failed to correct result record', 500, error.message);
  }
};

/**
 * 8. Student view: Get student's own semester-wise marks and results
 * GET /api/credits/semester-results
 */
const getStudentOwnSemesterResults = async (req, res) => {
  try {
    const studentId = req.user._id;

    const results = await SemesterResult.find({ studentId })
      .populate('courseId', 'courseCode courseName credits department courseLevel')
      .populate('institutionId', 'name code')
      .sort({ academicYear: 1, semester: 1 });

    // Group by semester
    const grouped = {};
    results.forEach((r) => {
      const semKey = `Semester ${r.semester}`;
      if (!grouped[semKey]) {
        grouped[semKey] = {
          semester: r.semester,
          academicYear: r.academicYear,
          courses: [],
          totalCreditsEarned: 0,
          totalCourses: 0,
          passedCourses: 0,
        };
      }
      grouped[semKey].courses.push(r);
      grouped[semKey].totalCourses += 1;
      if (r.resultStatus === 'PASS') {
        grouped[semKey].passedCourses += 1;
        grouped[semKey].totalCreditsEarned += r.creditsEarned;
      }
    });

    return ApiResponse.success(
      res,
      {
        currentSemester: req.user.currentSemester || 1,
        results,
        groupedBySemester: grouped,
      },
      'Student semester results retrieved successfully.'
    );
  } catch (error) {
    console.error('Student Semester Results Error:', error);
    return ApiResponse.error(res, 'Failed to retrieve semester results', 500, error.message);
  }
};

module.exports = {
  downloadSampleTemplate,
  getTemplateData,
  previewResultsImport,
  confirmResultsImport,
  getImportBatches,
  getBatchDetails,
  getSemesterResults,
  correctResult,
  getStudentOwnSemesterResults,
};
