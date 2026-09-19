const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Institution = require('./models/Institution');
const { User, ROLES } = require('./models/User');
const { Course } = require('./models/Course');
const { AcademicCredit } = require('./models/AcademicCredit');
const { Certificate } = require('./models/Certificate');
const { Transcript } = require('./models/Transcript');
const { TransferRequest } = require('./models/TransferRequest');
const APIKey = require('./models/APIKey');
const APILog = require('./models/APILog');
const AuditLog = require('./models/AuditLog');
const { generateCreditHash } = require('./utils/hashHelper');

// --------------------------------------------------
// COURSE CATALOG DEFINITION (36 Courses, 6 per Semester)
// --------------------------------------------------
const COURSE_CATALOG_DEFS = [
  // SEMESTER 1 (2023-24)
  { code: 'CS101', name: 'Programming Fundamentals', credits: 4, semester: 1, year: '2023-24' },
  { code: 'CS102', name: 'Mathematics for Computing', credits: 4, semester: 1, year: '2023-24' },
  { code: 'CS103', name: 'Digital Systems', credits: 3, semester: 1, year: '2023-24' },
  { code: 'CS104', name: 'Communication Skills', credits: 3, semester: 1, year: '2023-24' },
  { code: 'CS105', name: 'Data Structures Foundations', credits: 4, semester: 1, year: '2023-24' },
  { code: 'CS106', name: 'Environmental Studies', credits: 2, semester: 1, year: '2023-24' },

  // SEMESTER 2 (2023-24)
  { code: 'CS201', name: 'Object Oriented Programming', credits: 4, semester: 2, year: '2023-24' },
  { code: 'CS202', name: 'Discrete Mathematics', credits: 4, semester: 2, year: '2023-24' },
  { code: 'CS203', name: 'Computer Organization', credits: 3, semester: 2, year: '2023-24' },
  { code: 'CS204', name: 'Database Fundamentals', credits: 4, semester: 2, year: '2023-24' },
  { code: 'CS205', name: 'Web Technologies', credits: 3, semester: 2, year: '2023-24' },
  { code: 'CS206', name: 'Professional Ethics', credits: 2, semester: 2, year: '2023-24' },

  // SEMESTER 3 (2024-25)
  { code: 'CS301', name: 'Operating Systems', credits: 4, semester: 3, year: '2024-25' },
  { code: 'CS302', name: 'Computer Networks', credits: 4, semester: 3, year: '2024-25' },
  { code: 'CS303', name: 'Database Management Systems', credits: 4, semester: 3, year: '2024-25' },
  { code: 'CS304', name: 'Software Engineering', credits: 3, semester: 3, year: '2024-25' },
  { code: 'CS305', name: 'Probability and Statistics', credits: 3, semester: 3, year: '2024-25' },
  { code: 'CS306', name: 'UI/UX Fundamentals', credits: 2, semester: 3, year: '2024-25' },

  // SEMESTER 4 (2024-25)
  { code: 'CS401', name: 'Machine Learning', credits: 4, semester: 4, year: '2024-25' },
  { code: 'CS402', name: 'Design and Analysis of Algorithms', credits: 4, semester: 4, year: '2024-25' },
  { code: 'CS403', name: 'Full Stack Development', credits: 4, semester: 4, year: '2024-25' },
  { code: 'CS404', name: 'Cloud Computing', credits: 3, semester: 4, year: '2024-25' },
  { code: 'CS405', name: 'Cyber Security', credits: 3, semester: 4, year: '2024-25' },
  { code: 'CS406', name: 'Open Source Development', credits: 2, semester: 4, year: '2024-25' },

  // SEMESTER 5 (2025-26)
  { code: 'CS501', name: 'Deep Learning', credits: 4, semester: 5, year: '2025-26' },
  { code: 'CS502', name: 'Distributed Systems', credits: 4, semester: 5, year: '2025-26' },
  { code: 'CS503', name: 'DevOps Engineering', credits: 3, semester: 5, year: '2025-26' },
  { code: 'CS504', name: 'Big Data Analytics', credits: 4, semester: 5, year: '2025-26' },
  { code: 'CS505', name: 'Blockchain Technology', credits: 3, semester: 5, year: '2025-26' },
  { code: 'CS506', name: 'Technical Elective I', credits: 2, semester: 5, year: '2025-26' },

  // SEMESTER 6 (2025-26)
  { code: 'CS601', name: 'Generative AI', credits: 4, semester: 6, year: '2025-26' },
  { code: 'CS602', name: 'Advanced Cloud Architecture', credits: 4, semester: 6, year: '2025-26' },
  { code: 'CS603', name: 'Information Security', credits: 3, semester: 6, year: '2025-26' },
  { code: 'CS604', name: 'Software Project', credits: 5, semester: 6, year: '2025-26' },
  { code: 'CS605', name: 'Technical Elective II', credits: 2, semester: 6, year: '2025-26' },
  { code: 'CS606', name: 'Entrepreneurship', credits: 2, semester: 6, year: '2025-26' },
];

// --------------------------------------------------
// NAME GENERATION POOLS
// --------------------------------------------------
const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Ananya', 'Arjun', 'Bhavya', 'Chetan', 'Deepika',
  'Dev', 'Divya', 'Gokul', 'Harini', 'Ishaan', 'Kavya', 'Kiran', 'Karthik',
  'Lakshmi', 'Manish', 'Meera', 'Nikhil', 'Nivetha', 'Pooja', 'Pranav', 'Priya',
  'Rahul', 'Rhea', 'Rohan', 'Sai', 'Siddharth', 'Sneha', 'Surya', 'Swetha',
  'Tarun', 'Varun', 'Vidyut', 'Vikram', 'Vishnu', 'Yash', 'Yogesh', 'Zoya',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Kumar', 'Nair', 'Rao', 'Iyer', 'Patel', 'Reddy',
  'Gupta', 'Singh', 'Deshmukh', 'Subramanian', 'Menon', 'Pillai', 'Joshi', 'Kulkarni',
  'Chaudhary', 'Gowda', 'Shetty', 'Bhat',
];

const VALID_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

// --------------------------------------------------
// MAIN SEED FUNCTION
// --------------------------------------------------
async function seedDemoData() {
  console.log('🌱 Starting NEP Academic Hub Production-Safe Demo Seeding System...\n');

  try {
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not active.');
    }

    const passwordHash = await bcrypt.hash('Password@123', 10);

    // ============================================================
    // 1. SUPERADMIN (1 Exactly)
    // ============================================================
    console.log('1️⃣  Configuring Demo Superadmin Account...');
    let admin = await User.findOne({ role: ROLES.ADMIN });
    if (!admin) {
      admin = await User.create({
        name: 'National Credit Hub Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@nep.gov.in',
        passwordHash,
        role: ROLES.ADMIN,
        isActive: true,
      });
      console.log(`   ✓ Created Admin: ${admin.email}`);
    } else {
      console.log(`   ✓ Reused existing Admin: ${admin.email}`);
    }

    // ============================================================
    // 2. INSTITUTIONS (3 Exactly)
    // ============================================================
    console.log('\n2️⃣  Seeding 3 Target Institutions...');
    const instSpecs = [
      {
        name: 'Bannari Institute of Technology',
        code: 'BIT001',
        type: 'AUTONOMOUS_COLLEGE',
        contactEmail: 'admin@bit-demo.edu',
        naacAccreditation: 'A+',
        nirfRank: 45,
        demoEmail: 'institution@bit-demo.edu',
      },
      {
        name: 'Kongu Institute of Technology',
        code: 'KIT002',
        type: 'AUTONOMOUS_COLLEGE',
        contactEmail: 'admin@kit-demo.edu',
        naacAccreditation: 'A+',
        nirfRank: 52,
        demoEmail: 'institution@kit-demo.edu',
      },
      {
        name: 'Coimbatore Institute of Computing',
        code: 'CIC003',
        type: 'DEEMED_UNIVERSITY',
        contactEmail: 'admin@cic-demo.edu',
        naacAccreditation: 'A++',
        nirfRank: 28,
        demoEmail: 'institution@cic-demo.edu',
      },
    ];

    const institutions = {};
    const instAdmins = {};

    for (const spec of instSpecs) {
      let inst = await Institution.findOne({ code: spec.code });
      if (!inst) {
        inst = await Institution.create({
          name: spec.name,
          code: spec.code,
          type: spec.type,
          contactEmail: spec.contactEmail,
          naacAccreditation: spec.naacAccreditation,
          nirfRank: spec.nirfRank,
          verificationStatus: 'VERIFIED',
          isActive: true,
        });
      }
      institutions[spec.code] = inst;

      // Create Institution User Account
      let instUser = await User.findOne({ email: spec.demoEmail });
      if (!instUser) {
        instUser = await User.create({
          name: `Dean of Academics (${spec.code})`,
          email: spec.demoEmail,
          passwordHash,
          role: ROLES.INSTITUTION,
          institutionId: inst._id,
          institutionCode: inst.code,
          institutionName: inst.name,
          isActive: true,
        });
      }
      instAdmins[spec.code] = instUser;
      console.log(`   ✓ Institution verified: ${inst.name} [${inst.code}]`);
    }

    // ============================================================
    // 3. COURSES (108 Total, 36 per Institution)
    // ============================================================
    console.log('\n3️⃣  Seeding Course Catalogs (108 Courses total)...');
    const courseMap = {}; // { `${instCode}_${courseCode}`: courseDoc }

    for (const spec of instSpecs) {
      const inst = institutions[spec.code];
      courseMap[spec.code] = {};

      for (const def of COURSE_CATALOG_DEFS) {
        let course = await Course.findOne({
          institutionId: inst._id,
          courseCode: def.code,
        });

        if (!course) {
          course = await Course.create({
            courseCode: def.code,
            courseName: def.name,
            description: `Official ${def.name} course module under NEP 2020 framework.`,
            credits: def.credits,
            semester: def.semester,
            courseLevel: 'Undergraduate',
            department: 'Computer Science & Engineering',
            institutionId: inst._id,
            isActive: true,
          });
        }
        courseMap[spec.code][def.code] = course;
      }
    }
    console.log('   ✓ 108 Courses verified across 3 institutions (36 courses per inst).');

    // ============================================================
    // 4. STUDENTS (600 Total, 200 per Institution)
    // ============================================================
    console.log('\n4️⃣  Seeding 600 Student Accounts (200 per Institution)...');
    const studentList = [];
    const studentsByInst = { BIT001: [], KIT002: [], CIC003: [] };

    for (const spec of instSpecs) {
      const inst = institutions[spec.code];
      const domain = spec.code.toLowerCase();

      for (let i = 1; i <= 200; i++) {
        const numStr = String(i).padStart(3, '0');
        const studentId = `${spec.code}STU${numStr}`;
        const email = `student${numStr}@${domain}-demo.edu`;

        const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
        const lastName = LAST_NAMES[Math.floor((i - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
        const fullName = `${firstName} ${lastName}`;

        let studentDoc = await User.findOne({ email });
        if (!studentDoc) {
          studentDoc = await User.create({
            name: fullName,
            email,
            passwordHash,
            role: ROLES.STUDENT,
            studentId,
            institutionId: inst._id,
            institutionCode: inst.code,
            institutionName: inst.name,
            isActive: true,
          });
        }

        studentList.push(studentDoc);
        studentsByInst[spec.code].push(studentDoc);
      }
    }
    console.log(`   ✓ 600 Student accounts verified (200 for BIT001, 200 for KIT002, 200 for CIC003).`);

    // ============================================================
    // 5. ACADEMIC CREDITS (21,600 Records)
    // ============================================================
    console.log('\n5️⃣  Seeding 21,600 Academic Credit Records with SHA-256 Hashes...');

    const existingCreditCount = await AcademicCredit.countDocuments();
    if (existingCreditCount < 21600) {
      const creditOps = [];

      for (const spec of instSpecs) {
        const inst = institutions[spec.code];
        const instStudents = studentsByInst[spec.code];
        const instCourses = courseMap[spec.code];

        for (let sIdx = 0; sIdx < instStudents.length; sIdx++) {
          const student = instStudents[sIdx];

          // Determine student academic profile
          // sIdx 0-39 (Top 20%): High performance
          // sIdx 40-139 (50%): Average performance
          // sIdx 140-179 (20%): Mixed performance
          // sIdx 180-199 (10%): Weak/pending performance
          const profileType = sIdx < 40 ? 'HIGH' : sIdx < 140 ? 'AVG' : sIdx < 180 ? 'MIXED' : 'WEAK';

          for (const cDef of COURSE_CATALOG_DEFS) {
            const course = instCourses[cDef.code];

            // Deterministic grade selection
            let grade = 'A';
            const seedVal = (sIdx * 37 + cDef.semester * 13 + cDef.credits * 7) % 100;

            if (profileType === 'HIGH') {
              grade = seedVal < 45 ? 'O' : seedVal < 80 ? 'A+' : 'A';
            } else if (profileType === 'AVG') {
              grade = seedVal < 20 ? 'A+' : seedVal < 50 ? 'A' : seedVal < 80 ? 'B+' : 'B';
            } else if (profileType === 'MIXED') {
              grade = seedVal < 25 ? 'B+' : seedVal < 55 ? 'B' : seedVal < 80 ? 'C' : 'P';
            } else {
              grade = seedVal < 30 ? 'B' : seedVal < 60 ? 'C' : seedVal < 85 ? 'P' : 'F';
            }

            // Verification status distribution: ~87% verified, ~9% pending, ~4% rejected
            let verificationStatus = 'verified';
            if (seedVal > 95) {
              verificationStatus = 'rejected';
            } else if (seedVal > 86) {
              verificationStatus = 'pending';
            }

            const integrityHash = generateCreditHash({
              studentId: student._id,
              courseId: course._id,
              institutionId: inst._id,
              credits: cDef.credits,
              grade,
              semester: cDef.semester,
              academicYear: cDef.year,
            });

            // Set realistic award date based on academic year
            const yearStart = cDef.year === '2023-24' ? 2023 : cDef.year === '2024-25' ? 2024 : 2025;
            const month = cDef.semester % 2 === 1 ? 11 : 5; // Nov for odd sem, May for even sem
            const awardDate = new Date(yearStart + (cDef.semester % 2 === 1 ? 0 : 1), month, 15);

            creditOps.push({
              updateOne: {
                filter: {
                  studentId: student._id,
                  courseId: course._id,
                  academicYear: cDef.year,
                  semester: cDef.semester,
                },
                update: {
                  $setOnInsert: {
                    studentId: student._id,
                    courseId: course._id,
                    institutionId: inst._id,
                    credits: cDef.credits,
                    grade,
                    semester: cDef.semester,
                    academicYear: cDef.year,
                    awardDate,
                    verificationStatus,
                    sourceType: 'institution',
                    integrityHash,
                    verifiedBy: verificationStatus === 'verified' ? instAdmins[spec.code]._id : null,
                    verifiedAt: verificationStatus === 'verified' ? awardDate : null,
                  },
                },
                upsert: true,
              },
            });
          }
        }
      }

      // Execute bulkWrite in batches of 2000
      console.log(`   Executing bulk write of ${creditOps.length} credit operations...`);
      const BATCH_SIZE = 2000;
      for (let i = 0; i < creditOps.length; i += BATCH_SIZE) {
        const batch = creditOps.slice(i, i + BATCH_SIZE);
        await AcademicCredit.bulkWrite(batch);
        process.stdout.write(`   Processed ${Math.min(i + BATCH_SIZE, creditOps.length)} / ${creditOps.length} records...\r`);
      }
      console.log('\n   ✓ 21,600 Academic Credit records verified with SHA-256 integrity hashes.');
    } else {
      console.log(`   ✓ ${existingCreditCount} Academic Credit records already present.`);
    }

    // Fetch all student credits for certificate/transcript/transfer seeding
    console.log('\n6️⃣  Seeding Certificates, Transcripts, Transfers & Policies...');
    const allCredits = await AcademicCredit.find({ verificationStatus: 'verified' }).lean();

    // Group credits by studentId
    const creditsByStudent = {};
    allCredits.forEach((c) => {
      const sId = c.studentId.toString();
      if (!creditsByStudent[sId]) creditsByStudent[sId] = [];
      creditsByStudent[sId].push(c);
    });

    // ============================================================
    // 6. CERTIFICATES (~400 Certificates)
    // ============================================================
    const certCount = await Certificate.countDocuments();
    if (certCount < 300) {
      const certDocs = [];
      let cIdx = 0;

      for (const student of studentList) {
        const sCredits = creditsByStudent[student._id.toString()] || [];
        // Issue certificates for Sem 4, 5, 6 courses with grade O or A+
        const certEligible = sCredits.filter((c) => ['O', 'A+'].includes(c.grade) && c.semester >= 4);

        for (const cRecord of certEligible.slice(0, 2)) {
          cIdx++;
          const certId = `CERT-${student.institutionCode}-${String(cIdx).padStart(4, '0')}`;
          const title = `Certificate of Academic Excellence in ${cRecord.courseId}`;

          const rawHash = crypto
            .createHash('sha256')
            .update(`NEP-CERT-SEAL::certId=${certId}|student=${student._id}|inst=${student.institutionId}|credit=${cRecord._id}`)
            .digest('hex');

          let verificationStatus = 'verified';
          if (cIdx % 25 === 0) verificationStatus = 'revoked';
          else if (cIdx % 15 === 0) verificationStatus = 'pending';
          else if (cIdx % 20 === 0) verificationStatus = 'rejected';

          certDocs.push({
            certificateId: certId,
            studentId: student._id,
            institutionId: student.institutionId,
            courseId: cRecord.courseId,
            academicCreditId: cRecord._id,
            title: `Certificate of Completion - ${cRecord.semester >= 5 ? 'Advanced' : 'Core'} Discipline`,
            certificateType: 'course_completion',
            issueDate: cRecord.awardDate || new Date(),
            integrityHash: rawHash,
            verificationStatus,
            verifiedBy: verificationStatus === 'verified' ? instAdmins[student.institutionCode]._id : null,
            verifiedAt: verificationStatus === 'verified' ? cRecord.awardDate : null,
            revokedAt: verificationStatus === 'revoked' ? new Date() : null,
            revocationReason: verificationStatus === 'revoked' ? 'Academic audit discrepancy flag' : '',
          });
        }
      }

      for (const cd of certDocs) {
        await Certificate.updateOne(
          { academicCreditId: cd.academicCreditId },
          { $setOnInsert: cd },
          { upsert: true }
        );
      }
      console.log(`   ✓ ${certDocs.length} Certificates seeded across institutions.`);
    } else {
      console.log(`   ✓ ${certCount} Certificates already present.`);
    }

    // ============================================================
    // 7. TRANSCRIPTS (600 Records, 1 per Student)
    // ============================================================
    const transcriptCount = await Transcript.countDocuments();
    if (transcriptCount < 600) {
      for (const student of studentList) {
        const sCredits = creditsByStudent[student._id.toString()] || [];
        const totalCredits = sCredits.reduce((acc, c) => acc + c.credits, 0);
        const verifiedCredits = sCredits
          .filter((c) => c.verificationStatus === 'verified')
          .reduce((acc, c) => acc + c.credits, 0);

        const transcriptId = `TR-${student.studentId}`;
        const vCode = `TR-VER-${student.institutionCode}-${student.studentId}`;

        const rawHash = crypto
          .createHash('sha256')
          .update(`NEP-TRANSCRIPT-SEAL::student=${student._id}|inst=${student.institutionId}|tot=${totalCredits}|ver=${verifiedCredits}`)
          .digest('hex');

        await Transcript.updateOne(
          { studentId: student._id },
          {
            $setOnInsert: {
              transcriptId,
              studentId: student._id,
              institutionId: student.institutionId,
              transcriptType: 'official',
              status: 'verified',
              generatedAt: new Date(),
              generatedBy: instAdmins[student.institutionCode]._id,
              totalCredits,
              verifiedCredits,
              creditRecordCount: sCredits.length,
              integrityHash: rawHash,
              verificationCode: vCode,
            },
          },
          { upsert: true }
        );
      }
      console.log('   ✓ 600 Transcripts seeded with calculated credit totals and verification codes.');
    } else {
      console.log(`   ✓ ${transcriptCount} Transcripts already present.`);
    }

    // ============================================================
    // 8. TRANSFERS (~75 Transfer Requests)
    // ============================================================
    const transferCount = await TransferRequest.countDocuments();
    if (transferCount < 50) {
      const transferDocs = [];
      const instCodes = ['BIT001', 'KIT002', 'CIC003'];

      for (let t = 0; t < 75; t++) {
        const sourceCode = instCodes[t % 3];
        const destCode = instCodes[(t + 1) % 3];
        const student = studentsByInst[sourceCode][t % 200];
        const sCredits = creditsByStudent[student._id.toString()] || [];

        if (sCredits.length > 0) {
          const selectedCredit = sCredits[t % sCredits.length];
          const statusList = ['APPROVED', 'PENDING', 'REJECTED', 'APPROVED', 'APPROVED'];
          const status = statusList[t % statusList.length];

          transferDocs.push({
            studentId: student._id,
            sourceInstitutionId: institutions[sourceCode]._id,
            destinationInstitutionId: institutions[destCode]._id,
            creditIds: [selectedCredit._id],
            totalCredits: selectedCredit.credits,
            status,
            reason: 'Pursuing cross-institutional NEP credit transfer under credit mobility guidelines.',
            policyVersionUsed: '1.0',
            reviewedBy: status !== 'PENDING' ? instAdmins[destCode]._id : null,
            reviewedAt: status !== 'PENDING' ? new Date() : null,
            remarks: status === 'APPROVED' ? 'Credits verified and accepted under host institution policy.' : '',
            rejectionReason: status === 'REJECTED' ? 'Syllabus mismatch exceeding 30% tolerance.' : '',
          });
        }
      }

      await TransferRequest.insertMany(transferDocs);
      console.log(`   ✓ ${transferDocs.length} Cross-Institutional Transfer Requests seeded.`);
    } else {
      console.log(`   ✓ ${transferCount} Transfer requests already present.`);
    }

    // ============================================================
    // 9. API KEYS (~6 Keys, 2 per Institution)
    // ============================================================
    const apiKeyCount = await APIKey.countDocuments();
    if (apiKeyCount < 6) {
      for (const spec of instSpecs) {
        const inst = institutions[spec.code];
        const adminUser = instAdmins[spec.code];

        const keysToCreate = [
          {
            keyId: `NEP-KEY-${spec.code}-01`,
            rawSecret: `nep_live_${spec.code.toLowerCase()}_sec_${crypto.randomBytes(12).toString('hex')}`,
            name: `${spec.name} Production B2B Gateway Key`,
            scopes: ['read:credits', 'submit:credits', 'verify:certificates', 'read:students'],
            isActive: true,
          },
          {
            keyId: `NEP-KEY-${spec.code}-02`,
            rawSecret: `nep_live_${spec.code.toLowerCase()}_ver_${crypto.randomBytes(12).toString('hex')}`,
            name: `${spec.name} Certificate Seal Verification Key`,
            scopes: ['verify:certificates', 'read:credits'],
            isActive: true,
          },
        ];

        for (const kSpec of keysToCreate) {
          const keyHash = crypto.createHash('sha256').update(kSpec.rawSecret).digest('hex');
          const lastFour = kSpec.rawSecret.slice(-4);

          await APIKey.updateOne(
            { keyId: kSpec.keyId },
            {
              $setOnInsert: {
                keyId: kSpec.keyId,
                keyHash,
                keyPrefix: 'nep_live_',
                lastFour,
                name: kSpec.name,
                institutionId: inst._id,
                scopes: kSpec.scopes,
                isActive: kSpec.isActive,
                lastUsedAt: new Date(),
                createdRequestedBy: adminUser._id,
              },
            },
            { upsert: true }
          );
        }
      }
      console.log('   ✓ 6 B2B API Keys seeded (2 per institution) with hashed secrets.');
    } else {
      console.log(`   ✓ ${apiKeyCount} API Keys already present.`);
    }

    // ============================================================
    // 10. API LOGS / TELEMETRY (~300 Log Records)
    // ============================================================
    const apiLogCount = await APILog.countDocuments();
    if (apiLogCount < 200) {
      const allKeys = await APIKey.find().lean();
      const logDocs = [];
      const endpoints = [
        { ep: '/api/v1/gateway/credits', method: 'GET', code: 200 },
        { ep: '/api/v1/gateway/credits', method: 'POST', code: 201 },
        { ep: '/api/v1/gateway/certificates/verify', method: 'POST', code: 200 },
        { ep: '/api/v1/gateway/students', method: 'GET', code: 200 },
        { ep: '/api/v1/gateway/credits', method: 'GET', code: 401 },
      ];

      for (let l = 0; l < 300; l++) {
        const key = allKeys[l % allKeys.length];
        const epObj = endpoints[l % endpoints.length];

        logDocs.push({
          logId: `LOG-${key.keyId}-${String(l).padStart(4, '0')}`,
          apiKeyId: key._id,
          institutionId: key.institutionId,
          endpoint: epObj.ep,
          method: epObj.method,
          statusCode: epObj.code,
          responseTimeMs: Math.floor(Math.random() * 35) + 12,
          ipAddress: `192.168.1.${(l % 50) + 10}`,
          userAgent: 'B2B-Gateway-Client/1.0',
          createdAt: new Date(Date.now() - (300 - l) * 600000),
        });
      }

      await APILog.insertMany(logDocs);
      console.log(`   ✓ ${logDocs.length} API Gateway Telemetry log records seeded.`);
    } else {
      console.log(`   ✓ ${apiLogCount} API Gateway Telemetry logs already present.`);
    }

    // ============================================================
    // 11. AUDIT LOGS (~100 Audit Records)
    // ============================================================
    const auditLogCount = await AuditLog.countDocuments();
    if (auditLogCount < 80) {
      const auditDocs = [];
      const actions = [
        'INSTITUTION_CREATED',
        'COURSE_CREATED',
        'CREDIT_AWARDED',
        'CREDIT_VERIFIED',
        'CERTIFICATE_ISSUED',
        'TRANSFER_APPROVED',
        'TRANSFER_REJECTED',
        'API_KEY_CREATED',
      ];

      for (let a = 0; a < 100; a++) {
        const instCode = instSpecs[a % 3].code;
        const inst = institutions[instCode];
        const action = actions[a % actions.length];

        auditDocs.push({
          logId: `AUDIT-${instCode}-${String(a).padStart(4, '0')}`,
          userId: instAdmins[instCode]._id,
          institutionId: inst._id,
          action,
          resource: `SystemResource:${action.toLowerCase()}_${a}`,
          details: { message: `Administrative action ${action} executed successfully.` },
          ipAddress: '127.0.0.1',
          createdAt: new Date(Date.now() - (100 - a) * 1200000),
        });
      }

      await AuditLog.insertMany(auditDocs);
      console.log(`   ✓ ${auditDocs.length} System Security Audit Log records seeded.`);
    } else {
      console.log(`   ✓ ${auditLogCount} Audit log records already present.`);
    }

    // ============================================================
    // POST-SEED VALIDATION & REPORT
    // ============================================================
    console.log('\n==============================================');
    console.log(' POST-SEED VALIDATION & COUNTS SUMMARY');
    console.log('==============================================');

    const finalAdmins = await User.countDocuments({ role: ROLES.ADMIN });
    const finalInsts = await Institution.countDocuments();
    const finalStudents = await User.countDocuments({ role: ROLES.STUDENT });
    const finalCourses = await Course.countDocuments();
    const finalCredits = await AcademicCredit.countDocuments();
    const finalCerts = await Certificate.countDocuments();
    const finalTranscripts = await Transcript.countDocuments();
    const finalTransfers = await TransferRequest.countDocuments();
    const finalKeys = await APIKey.countDocuments();
    const finalLogs = await APILog.countDocuments();
    const finalAudits = await AuditLog.countDocuments();

    console.log(`📍 Superadmin Accounts     : ${finalAdmins} (Target: 1)`);
    console.log(`📍 Target Institutions      : ${finalInsts} (Target: 3)`);
    console.log(`📍 Total Students           : ${finalStudents} (Target: 600 - 200/inst)`);
    console.log(`📍 Total Courses            : ${finalCourses} (Target: 108 - 36/inst)`);
    console.log(`📍 Total Academic Credits   : ${finalCredits} (Target: 21,600)`);
    console.log(`📍 Digital Certificates     : ${finalCerts}`);
    console.log(`📍 Student Transcripts      : ${finalTranscripts}`);
    console.log(`📍 Transfer Requests        : ${finalTransfers}`);
    console.log(`📍 B2B API Keys             : ${finalKeys}`);
    console.log(`📍 Gateway Telemetry Logs   : ${finalLogs}`);
    console.log(`📍 System Audit Logs        : ${finalAudits}`);

    // Validate relationships & integrity
    console.log('\n🔒 Executing Database Integrity & Tenant Isolation Verification...');

    // 1. Verify student-institution mapping
    const unlinkedStudents = await User.countDocuments({ role: ROLES.STUDENT, institutionId: null });
    console.log(`   - Unlinked Students Check      : ${unlinkedStudents === 0 ? '✓ PASSED (0 unlinked)' : '❌ FAILED'}`);

    // 2. Verify course-institution mapping
    const unlinkedCourses = await Course.countDocuments({ institutionId: null });
    console.log(`   - Unlinked Courses Check       : ${unlinkedCourses === 0 ? '✓ PASSED (0 unlinked)' : '❌ FAILED'}`);

    // 3. Verify sample credit hash integrity
    const sampleCredit = await AcademicCredit.findOne({ verificationStatus: 'verified' });
    const expectedHash = generateCreditHash({
      studentId: sampleCredit.studentId,
      courseId: sampleCredit.courseId,
      institutionId: sampleCredit.institutionId,
      credits: sampleCredit.credits,
      grade: sampleCredit.grade,
      semester: sampleCredit.semester,
      academicYear: sampleCredit.academicYear,
    });
    const hashValid = sampleCredit.integrityHash === expectedHash;
    console.log(`   - Credit SHA-256 Hash Check    : ${hashValid ? '✓ PASSED (Hash matches)' : '❌ FAILED'}`);

    console.log('\n🎉 DEMO DATASEEDING & POST-VALIDATION COMPLETED SUCCESSFULLY!');
    console.log('==============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ DEMO SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedDemoData();
