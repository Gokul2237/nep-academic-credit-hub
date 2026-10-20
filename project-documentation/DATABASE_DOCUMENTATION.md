# DATABASE DOCUMENTATION: MONGOOSE MODELS & SCHEMAS

---

## 1. Database Architecture & Overview

The database layer of the **NEP Aligned Standardized Academic Credit Accumulation Hub** is implemented using **MongoDB** with **Mongoose 8.5.1** as the Object Data Modeling (ODM) library. The primary database name is `nep_academic_hub`.

### Structural Characteristics:
- **Total Collections:** Exactly **13 primary collections**.
- **Embedded Subdocument Design:** Certain historical entities—such as policy version history and transfer decision remarks—are stored directly as embedded subdocument arrays within parent documents for atomic updates and fast read operations.
- **Integrity Sealing:** Deterministic 64-character SHA-256 hashes are automatically computed and persisted on critical academic records (`AcademicCredit`, `Certificate`, `Transcript`).
- **Compound Indexing:** Used extensively to enforce multi-tenant isolation, prevent duplicate credit allocations, and accelerate role-scoped dashboard queries.

---

## 2. Investigation of Expected vs. Actual Collections

| Expected Collection | Actual Finding in Codebase | Collection Name | Implementation Architecture |
| :--- | :--- | :--- | :--- |
| **Users** | Present | `users` | `server/models/User.js` (`User`) |
| **Institutions** | Present | `institutions` | `server/models/Institution.js` (`Institution`) |
| **Courses** | Present | `courses` | `server/models/Course.js` (`Course`) |
| **AcademicCredits** | Present | `academiccredits` | `server/models/AcademicCredit.js` (`AcademicCredit`) |
| **Certificates** | Present | `certificates` | `server/models/Certificate.js` (`Certificate`) |
| **Transcripts** | Present | `transcripts` | `server/models/Transcript.js` (`Transcript`) |
| **CreditPolicies** | Present | `creditpolicies` | `server/models/CreditPolicy.js` (`CreditPolicy`) |
| **PolicyVersions** | Embedded in `CreditPolicy` | N/A (Subdocument) | Implemented as `policyHistory: [policyHistorySchema]` embedded array inside `CreditPolicy`. |
| **TransferRequests** | Present | `transferrequests` | `server/models/TransferRequest.js` (`TransferRequest`) |
| **TransferDecisions** | Embedded in `TransferRequest` | N/A (Subdocument) | Implemented directly in `TransferRequest` (`status`, `reviewedBy`, `reviewedAt`, `remarks`, `rejectionReason`). |
| **APIKeys** | Present | `apikeys` | `server/models/APIKey.js` (`APIKey`) |
| **APILogs** | Present | `apilogs` | `server/models/APILog.js` (`APILog`) |
| **AuditLogs** | Present | `auditlogs` | `server/models/AuditLog.js` (`AuditLog`) |
| **SemesterResults** | Specialized Addition | `semesterresults` | `server/models/SemesterResult.js` (`SemesterResult`) |
| **ResultImportBatches**| Specialized Addition | `resultimportbatches` | `server/models/ResultImportBatch.js` (`ResultImportBatch`) |

---

## 3. Comprehensive Specifications of All 13 Models

---

### 3.1 User (`User.js` $\rightarrow$ `users`)
Manages accounts for students, institution representatives, and system administrators.

- **Collection:** `users`
- **Fields:**
  - `name` (String, Required, Trim, min 2, max 100): Full user name.
  - `email` (String, Required, Unique, Lowercase, Trim, Indexed): Verified email address matching regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
  - `passwordHash` (String, Required, `select: false`): Password salted and hashed with `bcryptjs` (salt work factor 12).
  - `role` (String, Required, Enum: `['student', 'institution', 'admin']`, Default: `'student'`, Indexed): Primary RBAC role.
  - `studentId` (String, Optional, Trim, Sparse, Indexed): Academic Bank of Credits ID / Roll Number (e.g. `ABC-100101`).
  - `currentSemester` (Number, Optional, Default: 1, min: 1, max: 12, Indexed): Current enrolled semester standing.
  - `institutionId` (ObjectId, Ref: `'Institution'`, Default: null, Indexed): Associated university node.
  - `institutionCode` (String, Optional, Trim, Uppercase, Default: null): Cached institution code (e.g. `BIT001`).
  - `institutionName` (String, Optional, Trim, Default: null): Cached institution name.
  - `isActive` (Boolean, Default: true, Indexed): Account activation flag.
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Mongoose Hooks & Serialization:**
  - `pre('save')`: Hashes `passwordHash` with `bcrypt.genSalt(12)` if modified and not already a bcrypt hash.
  - `userSchema.methods.comparePassword`: Compares candidate string with `passwordHash` using `bcrypt.compare`.
  - `userSchema.methods.toJSON`: Strips `passwordHash` and `__v` before transmitting in API responses.
- **Indexes:**
  - `{ email: 1 }` (Unique)
  - `{ studentId: 1 }` (Sparse)
  - `{ institutionId: 1, role: 1 }`
  - `{ institutionId: 1, studentId: 1 }`

---

### 3.2 Institution (`Institution.js` $\rightarrow$ `institutions`)
Stores accredited participating higher education universities and colleges.

- **Collection:** `institutions`
- **Fields:**
  - `name` (String, Required, Trim): Official university name.
  - `code` (String, Required, Unique, Uppercase, Trim): Standard identifier code (e.g. `BIT001`, `IITB_01`).
  - `type` (String, Enum: `['CENTRAL_UNIVERSITY', 'STATE_UNIVERSITY', 'DEEMED_UNIVERSITY', 'AUTONOMOUS_COLLEGE', 'PRIVATE_UNIVERSITY', 'INSTITUTE_OF_NATIONAL_IMPORTANCE']`, Default: `'STATE_UNIVERSITY'`).
  - `contactEmail` (String, Required, Lowercase, Trim): Official administrative contact address.
  - `naacAccreditation` (String, Default: `'A+'`): NAAC rating.
  - `nirfRank` (Number, Default: null): National Institutional Ranking Framework score.
  - `verificationStatus` (String, Enum: `['PENDING', 'VERIFIED', 'SUSPENDED']`, Default: `'VERIFIED'`).
  - `isActive` (Boolean, Default: true).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ code: 1 }` (Unique)

---

### 3.3 Course (`Course.js` $\rightarrow$ `courses`)
Maintains the curriculum catalog of courses offered by each university.

- **Collection:** `courses`
- **Fields:**
  - `courseCode` (String, Required, Uppercase, Trim, max 20): Module code (e.g. `CS501`, `22MA101`).
  - `courseName` (String, Required, Trim, max 150): Full course title.
  - `description` (String, Trim, Default: `''`): Course syllabus summary.
  - `credits` (Number, Required, min: 1, max: 20, Integer validator): Assigned credit value.
  - `courseLevel` (String, Enum: `['Undergraduate', 'Postgraduate', 'Doctoral', 'Diploma', 'Certificate', 'Level 100', 'Level 200', 'Level 300', 'Level 400']`, Default: `'Undergraduate'`).
  - `department` (String, Required, Trim): Academic department (e.g. `Computer Science & Engineering`).
  - `semester` (Number, Required, min: 1, max: 12): Prescribed curriculum semester.
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed): Offering university.
  - `isActive` (Boolean, Default: true).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ institutionId: 1, courseCode: 1 }` (Unique compound index preventing duplicate course codes within the same university).

---

### 3.4 AcademicCredit (`AcademicCredit.js` $\rightarrow$ `academiccredits`)
The primary ledger for awarded academic credits with cryptographic SHA-256 seals.

- **Collection:** `academiccredits`
- **Fields:**
  - `studentId` (ObjectId, Ref: `'User'`, Required, Indexed): Student recipient.
  - `courseId` (ObjectId, Ref: `'Course'`, Required, Indexed): Course completed.
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed): Awarding institution.
  - `credits` (Number, Required, min: 1, max: 20, Integer validator): Numeric credit points awarded.
  - `grade` (String, Required, Uppercase, Trim, Enum: `['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']`): Letter grade.
  - `semester` (Number, Required, min: 1, max: 12): Semester when earned.
  - `academicYear` (String, Required, Trim): e.g. `'2024-25'`.
  - `awardDate` (Date, Default: `Date.now`): Official award timestamp.
  - `verificationStatus` (String, Enum: `['pending', 'verified', 'rejected']`, Default: `'pending'`, Indexed): Ledger verification status.
  - `sourceType` (String, Enum: `['institution', 'manual', 'api']`, Default: `'institution'`).
  - `integrityHash` (String, Required): 64-char hexadecimal SHA-256 integrity seal calculated over `{studentId, courseId, institutionId, credits, grade, semester, academicYear}`.
  - `verifiedBy` (ObjectId, Ref: `'User'`, Default: null): Academic officer who signed off.
  - `verifiedAt` (Date, Default: null).
  - `isTransferred` (Boolean, Default: false, Indexed): Credit mobility flag.
  - `transferredTo` (ObjectId, Ref: `'Institution'`, Default: null, Indexed): Destination university after transfer.
  - `transferRequestId` (ObjectId, Ref: `'TransferRequest'`, Default: null).
  - `transferredAt` (Date, Default: null).
  - `semesterResultId` (ObjectId, Ref: `'SemesterResult'`, Default: null, Indexed).
  - `importBatchId` (ObjectId, Ref: `'ResultImportBatch'`, Default: null, Indexed).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Mongoose Hooks:**
  - `pre('validate')`: Automatically calculates and sets `integrityHash` if credits or grade were modified.
- **Indexes:**
  - `{ studentId: 1, courseId: 1, academicYear: 1, semester: 1 }` (Unique compound index preventing double-awarding of credits).
  - `{ verificationStatus: 1 }`
  - `{ isTransferred: 1 }`

---

### 3.5 CreditPolicy (`CreditPolicy.js` $\rightarrow$ `creditpolicies`)
Stores institutional credit acceptance rules and maintains version history.

- **Collection:** `creditpolicies`
- **Fields:**
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Unique, Indexed): University defining the policy.
  - `version` (String, Default: `'v1.0'`, Trim): Current active policy version.
  - `minGrade` (String, Enum: `['O', 'A+', 'A', 'B+', 'B', 'C', 'P']`, Default: `'B'`, Trim): Minimum grade for credit acceptance.
  - `minEquivalency` (Number, min: 50, max: 100, Default: 80): Minimum syllabus match percentage required.
  - `maxCredits` (Number, min: 1, max: 160, Default: 60): Maximum transferable credits allowed into degree.
  - `policyHistory` (Array of Subdocuments):
    - `version` (String, Required)
    - `minGrade` (String, Required)
    - `minEquivalency` (Number, Required)
    - `maxCredits` (Number, Required)
    - `updatedBy` (ObjectId, Ref: `'User'`)
    - `updatedAt` (Date, Default: `Date.now`)
    - `description` (String, Default: `''`)
  - `updatedBy` (ObjectId, Ref: `'User'`, Default: null).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Statics:**
  - `CreditPolicy.getEffectivePolicy(institutionId)`: Returns the active policy or supplies default NEP baseline parameters.

---

### 3.6 TransferRequest (`TransferRequest.js` $\rightarrow$ `transferrequests`)
Tracks inter-institutional credit transfer proposals and approval decisions.

- **Collection:** `transferrequests`
- **Fields:**
  - `studentId` (ObjectId, Ref: `'User'`, Required, Indexed): Student requesting mobility.
  - `sourceInstitutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed): Origin university.
  - `destinationInstitutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed): Target university.
  - `creditIds` (Array of ObjectId, Ref: `'AcademicCredit'`, Required): List of credits to transfer.
  - `totalCredits` (Number, Required, min: 1): Sum of transferable credit points.
  - `status` (String, Enum: `['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW', 'APPROVED', 'CONDITIONAL_APPROVAL', 'REJECTED', 'COMPLETED', 'CANCELLED']`, Default: `'PENDING'`, Uppercase, Indexed).
  - `reason` (String, Trim, Default: `''`): Student's stated reason.
  - `policyVersionUsed` (String, Trim, Default: `'1.0'`): Acceptance policy version enforced.
  - `reviewedBy` (ObjectId, Ref: `'User'`, Default: null): Reviewing academic officer.
  - `reviewedAt` (Date, Default: null): Decision timestamp.
  - `remarks` (String, Trim, Default: `''`): Administrative evaluation remarks.
  - `rejectionReason` (String, Trim, Default: `''`): Mandatory reason if rejected.
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ studentId: 1, status: 1 }`
  - `{ destinationInstitutionId: 1, status: 1 }`
  - `{ sourceInstitutionId: 1, status: 1 }`
  - `{ creditIds: 1 }`

---

### 3.7 Certificate (`Certificate.js` $\rightarrow$ `certificates`)
Cryptographically sealed micro-credentials and course completion certificates.

- **Collection:** `certificates`
- **Fields:**
  - `certificateId` (String, Required, Unique, Trim, Indexed): Public credential token (e.g. `NEP-CERT-M3...`).
  - `studentId` (ObjectId, Ref: `'User'`, Required, Indexed): Recipient.
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed): Issuing institution.
  - `courseId` (ObjectId, Ref: `'Course'`, Required, Indexed): Module completed.
  - `academicCreditId` (ObjectId, Ref: `'AcademicCredit'`, Required, Unique): Backing verified credit.
  - `title` (String, Required, Trim, max 200): Certificate title.
  - `certificateType` (String, Enum: `['course_completion', 'academic_achievement', 'skill', 'participation', 'other']`, Default: `'course_completion'`).
  - `issueDate` (Date, Default: `Date.now`).
  - `documentUrl` (String, Trim, Default: `''`): External document/cloud storage link.
  - `integrityHash` (String, Required, Trim): Deterministic SHA-256 seal.
  - `verificationStatus` (String, Enum: `['pending', 'verified', 'rejected', 'revoked']`, Default: `'pending'`, Indexed).
  - `verifiedBy` (ObjectId, Ref: `'User'`, Default: null).
  - `verifiedAt` (Date, Default: null).
  - `rejectionReason` (String, Trim, Default: `''`).
  - `revokedAt` (Date, Default: null).
  - `revocationReason` (String, Trim, Default: `''`).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ academicCreditId: 1 }` (Unique: prevents duplicate certificates for the same credit).
  - `{ studentId: 1, verificationStatus: 1 }`

---

### 3.8 Transcript (`Transcript.js` $\rightarrow$ `transcripts`)
Official and unofficial digital transcripts carrying QR-compatible verification codes.

- **Collection:** `transcripts`
- **Fields:**
  - `transcriptId` (String, Required, Unique, Trim, Indexed): e.g. `NEP-TR-MVG...`.
  - `studentId` (ObjectId, Ref: `'User'`, Required, Indexed).
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed).
  - `transcriptType` (String, Enum: `['official', 'unofficial']`, Default: `'official'`).
  - `status` (String, Enum: `['draft', 'generated', 'verified', 'revoked']`, Default: `'generated'`, Indexed).
  - `generatedAt` (Date, Default: `Date.now`).
  - `generatedBy` (ObjectId, Ref: `'User'`, Default: null).
  - `totalCredits` (Number, min: 0, Default: 0).
  - `verifiedCredits` (Number, min: 0, Default: 0).
  - `creditRecordCount` (Number, min: 0, Default: 0).
  - `integrityHash` (String, Required, Trim): SHA-256 integrity seal.
  - `documentUrl` (String, Trim, Default: `''`).
  - `verificationCode` (String, Unique, Sparse, Trim, Indexed): e.g. `TR-VER-MVGPRQ...`.
  - `revokedAt` (Date, Default: null).
  - `revocationReason` (String, Trim, Default: `''`).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ studentId: 1, createdAt: -1 }`
  - `{ institutionId: 1, status: 1 }`
  - `{ verificationCode: 1 }` (Unique, Sparse)

---

### 3.9 APIKey (`APIKey.js` $\rightarrow$ `apikeys`)
Stores cryptographically hashed API keys for B2B inter-university integration.

- **Collection:** `apikeys`
- **Fields:**
  - `keyId` (String, Required, Unique, Trim): Key identifier (e.g. `NEP-KEY-MVG...`).
  - `keyHash` (String, Required, Unique): Hex-encoded SHA-256 hash of the raw 24-byte secret.
  - `keyPrefix` (String, Default: `'nep_live_'`).
  - `lastFour` (String, Required): Last 4 characters for safe identification in UI.
  - `name` (String, Required, Trim): Friendly label (e.g. `ERP Production Gateway`).
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required): Key owner institution.
  - `scopes` (Array of String, Enum: `['read:credits', 'submit:credits', 'verify:certificates', 'read:students']`).
  - `isActive` (Boolean, Default: true).
  - `lastUsedAt` (Date, Default: null).
  - `createdRequestedBy` (ObjectId, Ref: `'User'`).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ keyHash: 1 }` (Unique)
  - `{ keyId: 1 }` (Unique)

---

### 3.10 APILog (`APILog.js` $\rightarrow$ `apilogs`)
Live telemetry logs for requests arriving through the B2B API Gateway.

- **Collection:** `apilogs`
- **Fields:**
  - `logId` (String, Required, Unique): e.g. `LOG-1792...`.
  - `apiKeyId` (ObjectId, Ref: `'APIKey'`).
  - `institutionId` (ObjectId, Ref: `'Institution'`).
  - `endpoint` (String, Required): Target URI (e.g. `/api/v1/gateway/credits`).
  - `method` (String, Required): HTTP method (e.g. `GET`, `POST`).
  - `statusCode` (Number, Required): HTTP response status (e.g. 200, 401, 403).
  - `responseTimeMs` (Number, Default: 0): Execution latency in milliseconds.
  - `ipAddress` (String, Default: `'127.0.0.1'`).
  - `userAgent` (String, Default: `'B2B-Gateway-Client/1.0'`).
  - `createdAt`, `updatedAt` (Date, Timestamps).

---

### 3.11 AuditLog (`AuditLog.js` $\rightarrow$ `auditlogs`)
Immutable system-wide governance audit trail of critical actions.

- **Collection:** `auditlogs`
- **Fields:**
  - `logId` (String, Required, Unique).
  - `userId` (ObjectId, Ref: `'User'`).
  - `institutionId` (ObjectId, Ref: `'Institution'`).
  - `action` (String, Required): e.g. `TRANSFER_APPROVED`, `POLICY_VERSION_PUBLISHED`, `RESULTS_IMPORTED`.
  - `resource` (String, Required): Target resource identifier (e.g. `TransferRequest:67...`).
  - `details` (Mixed Schema): Structured JSON context.
  - `ipAddress` (String, Default: `'127.0.0.1'`).
  - `createdAt`, `updatedAt` (Date, Timestamps).

---

### 3.12 SemesterResult (`SemesterResult.js` $\rightarrow$ `semesterresults`)
Authoritative record of a student's examination marks, grade, and pass/fail standing.

- **Collection:** `semesterresults`
- **Fields:**
  - `studentId` (ObjectId, Ref: `'User'`, Required, Indexed).
  - `studentAbcId` (String, Required, Trim, Indexed): ABC ID / Roll number.
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed).
  - `academicYear` (String, Required, Trim): e.g. `'2024-25'`.
  - `semester` (Number, Required, min: 1, max: 12): Exam semester.
  - `courseId` (ObjectId, Ref: `'Course'`, Required, Indexed).
  - `courseCode` (String, Required, Uppercase, Trim).
  - `marks` (Number, min: 0, max: 100, Default: null): Raw exam score.
  - `grade` (String, Required, Uppercase, Trim, Enum: `['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F']`).
  - `creditsEarned` (Number, Default: 0, min: 0, max: 20): Credits earned (authoritative course value if passed, 0 if failed).
  - `resultStatus` (String, Enum: `['PASS', 'FAIL', 'PENDING']`, Default: `'PASS'`, Uppercase).
  - `importBatchId` (ObjectId, Ref: `'ResultImportBatch'`, Default: null, Indexed).
  - `creditId` (ObjectId, Ref: `'AcademicCredit'`, Default: null): Linked academic credit record if passed.
  - `attemptNumber` (Number, Default: 1).
  - `isCorrected` (Boolean, Default: false): Indicates whether an audited grade correction occurred.
  - `correctionHistory` (Array of Subdocuments):
    - `previousMarks` (Number)
    - `previousGrade` (String)
    - `previousCredits` (Number)
    - `previousStatus` (String)
    - `updatedBy` (ObjectId, Ref: `'User'`)
    - `updatedAt` (Date, Default: `Date.now`)
    - `reason` (String, Trim)
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ studentId: 1, courseId: 1, academicYear: 1, semester: 1 }` (Unique compound index preventing duplicate results).
  - `{ institutionId: 1, academicYear: 1, semester: 1 }`
  - `{ studentAbcId: 1, semester: 1 }`

---

### 3.13 ResultImportBatch (`ResultImportBatch.js` $\rightarrow$ `resultimportbatches`)
Tracks bulk examination spreadsheet uploads, preview validation stats, and confirmation state.

- **Collection:** `resultimportbatches`
- **Fields:**
  - `batchId` (String, Required, Unique, Trim, Indexed): e.g. `BATCH-1792...`.
  - `institutionId` (ObjectId, Ref: `'Institution'`, Required, Indexed).
  - `academicYear` (String, Required, Trim).
  - `semester` (Number, Required, min: 1, max: 12).
  - `uploadedBy` (ObjectId, Ref: `'User'`, Required).
  - `originalFileName` (String, Default: `''`).
  - `fileSize` (Number, Default: 0).
  - `totalRows` (Number, Default: 0): Total rows in spreadsheet.
  - `validRows` (Number, Default: 0): Rows with valid student and course links.
  - `invalidRows` (Number, Default: 0): Rows failing validation.
  - `duplicateRows` (Number, Default: 0): Rows duplicated within the file.
  - `previouslyProcessedRows` (Number, Default: 0): Rows already awarded in database.
  - `processedRows` (Number, Default: 0): Confirmed rows written to DB.
  - `creditsAwarded` (Number, Default: 0): Number of academic credits auto-issued.
  - `studentsAdvanced` (Number, Default: 0): Students advanced to next semester.
  - `status` (String, Enum: `['PREVIEW', 'CONFIRMED', 'FAILED', 'PARTIALLY_PROCESSED']`, Default: `'PREVIEW'`, Indexed).
  - `errors` (Array of Subdocuments: `{ rowNumber, studentAbcId, courseCode, reason }`).
  - `items` (Array of Subdocuments: validated row items).
  - `createdAt`, `updatedAt` (Date, Timestamps).
- **Indexes:**
  - `{ institutionId: 1, createdAt: -1 }`
