# BACKEND API DOCUMENTATION & ENDPOINT INVENTORY

---

## 1. Complete Verified API Inventory Table

The following inventory documents every active REST endpoint implemented in the Express backend (`server/server.js`), verified against actual route definitions and controllers.

| Method | Endpoint | Purpose | Authentication | Allowed Roles | Request Fields | Response | Source File | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | System health & MongoDB connection check | None (Public) | All | None | `{ success, message, database }` | `server/server.js` | **Verified (200 OK)** |
| **POST** | `/api/auth/register` | Register new student or institution user | None (Public) | All | `name, email, password, role, studentId, institutionId, institutionName, institutionCode` | `{ user, token }` (201) | `authController.js` | **Verified (201 Created)** |
| **POST** | `/api/auth/login` | Authenticate credentials & return JWT | None (Public) | All | `email, password` | `{ user, token }` (200) | `authController.js` | **Verified (200 OK)** |
| **GET** | `/api/auth/me` | Fetch active user session profile | Bearer JWT | `student, institution, admin` | None | `{ user }` (200) | `authController.js` | **Verified (200 OK)** |
| **GET** | `/api/auth/institutions` | Directory of verified universities for registration | None / Optional | All | Query: `all=true` | `{ institutions: [...] }` (200) | `authController.js` | **Verified (200 OK)** |
| **GET** | `/api/courses` | Search course catalog with filters | Bearer JWT | `student, institution, admin` | Query: `institutionId, department, semester, search, page, limit` | Paginated Course list | `courseController.js` | **Verified (200 OK)** |
| **GET** | `/api/courses/:id` | Fetch specific course metadata | Bearer JWT | `student, institution, admin` | Param: `id` | Single Course object | `courseController.js` | **Verified (200 OK)** |
| **POST** | `/api/courses` | Create new course in catalog | Bearer JWT | `institution, admin` | `courseCode, courseName, credits, department, semester, description` | Created Course object (201) | `courseController.js` | **Verified (201 Created)** |
| **PUT** | `/api/courses/:id` | Update course syllabus or credits | Bearer JWT | `institution, admin` | `courseName, credits, department, semester, isActive` | Updated Course object (200) | `courseController.js` | **Verified (200 OK)** |
| **DELETE**| `/api/courses/:id` | Soft-deactivate course | Bearer JWT | `institution, admin` | Param: `id` | Deactivation confirmation (200) | `courseController.js` | **Verified (200 OK)** |
| **GET** | `/api/credits` | Query academic credit records (Scoped) | Bearer JWT | `student, institution, admin` | Query: `studentId, semester, academicYear, verificationStatus` | Paginated Credits array | `creditController.js` | **Verified (200 OK)** |
| **GET** | `/api/credits/:id` | Fetch credit details & verify hash | Bearer JWT | `student, institution, admin` | Param: `id` | Credit object + `integrityVerified: bool` | `creditController.js` | **Verified (200 OK)** |
| **POST** | `/api/credits` | Award credit with SHA-256 seal | Bearer JWT | `institution, admin` | `studentEmail / studentId, courseId, credits, grade, semester, academicYear` | Created sealed Credit (201) | `creditController.js` | **Verified (201 Created)** |
| **PUT** | `/api/credits/:id` | Update / verify credit & reseal hash | Bearer JWT | `institution, admin` | `grade, credits, verificationStatus` | Resealed Credit object (200) | `creditController.js` | **Verified (200 OK)** |
| **POST** | `/api/credits/validate`| Smart credit payload pre-validation | Bearer JWT | `institution, admin` | `studentId, courseId, credits, grade, semester, academicYear` | `{ isValid, checks: [...], computedHash }` | `validationController.js` | **Verified (200 OK)** |
| **GET** | `/api/credits/wallet-summary` | Student digital wallet metrics | Bearer JWT | `student` | None | `{ totalCredits, verifiedCredits, pendingCredits, institutionBreakdown }` | `creditController.js` | **Verified (200 OK)** |
| **GET** | `/api/credits/timeline` | Student credit timeline by year/sem | Bearer JWT | `student` | None | `{ [year]: { semesters: { [sem]: [...] } } }` | `creditController.js` | **Verified (200 OK)** |
| **GET** | `/api/credits/semester-results` | Student's own exam results & standing | Bearer JWT | `student` | None | `{ currentSemester, results, groupedBySemester }` | `resultImportController.js` | **Verified (200 OK)** |
| **GET** | `/api/students` | Get enrolled student roster (Scoped) | Bearer JWT | `institution, admin` | None | Student directory array | `studentRoutes.js` | **Verified (200 OK)** |
| **GET** | `/api/students/:id` | Get single student academic profile | Bearer JWT | `institution, admin` | Param: `id` | Student profile object | `studentRoutes.js` | **Verified (200 OK)** |
| **POST** | `/api/transfers` | Initiate credit transfer request | Bearer JWT | `student, institution, admin` | `destinationInstitutionId, creditIds: [...], reason` | Created TransferRequest (201) | `transferController.js` | **Verified (201 Created)** |
| **GET** | `/api/transfers` | List transfer requests (Scoped) | Bearer JWT | `student, institution, admin` | Query: `type ('incoming','outgoing','history'), status` | Transfer request array | `transferController.js` | **Verified (200 OK)** |
| **GET** | `/api/transfers/:id` | Get single transfer request details | Bearer JWT | `student, institution, admin` | Param: `id` | Populated TransferRequest object | `transferController.js` | **Verified (200 OK)** |
| **PUT** | `/api/transfers/:id/review` | Approve or reject transfer request | Bearer JWT | `institution, admin` | `status ('APPROVED','REJECTED'), remarks, rejectionReason` | Updated TransferRequest (200) | `transferController.js` | **Verified (200 OK)** |
| **PUT** | `/api/transfers/:id/cancel` | Cancel pending transfer request | Bearer JWT | `student, admin` | Param: `id` | Cancelled TransferRequest (200) | `transferController.js` | **Verified (200 OK)** |
| **GET** | `/api/transfers/stats` | Summary statistics of transfers | Bearer JWT | `student, institution, admin` | None | `{ total, pending, approved, rejected, cancelled }` | `transferController.js` | **Verified (200 OK)** |
| **GET** | `/api/certificates/verify/:certificateId` | Public certificate verification | None (Public Rate Limited) | All | Param: `certificateId` | `{ isValid, integrityVerified, student, course, institution }` | `certificateController.js` | **Verified (200 OK)** |
| **GET** | `/api/certificates` | List certificates (Role-scoped) | Bearer JWT | `student, institution, admin` | Query: `studentId, verificationStatus, page, limit` | Paginated Certificate list | `certificateController.js` | **Verified (200 OK)** |
| **POST** | `/api/certificates` | Issue certificate for verified credit | Bearer JWT | `institution, admin` | `academicCreditId, title, certificateType, documentUrl` | Created Certificate (201) | `certificateController.js` | **Verified (201 Created)** |
| **PUT** | `/api/certificates/:id/verify` | Review / verify certificate | Bearer JWT | `institution, admin` | `verificationStatus, rejectionReason` | Updated Certificate (200) | `certificateController.js` | **Verified (200 OK)** |
| **PUT** | `/api/certificates/:id/revoke` | Revoke certificate with reason | Bearer JWT | `institution, admin` | `revocationReason` | Revoked Certificate (200) | `certificateController.js` | **Verified (200 OK)** |
| **GET** | `/api/transcripts/verify/:verificationCode` | Public transcript verification | None (Public Rate Limited) | All | Param: `verificationCode` | `{ isValid, integrityVerified, student, institution, totalCredits }` | `transcriptController.js` | **Verified (200 OK)** |
| **POST** | `/api/transcripts` | Generate digital snapshot transcript | Bearer JWT | `student, institution, admin` | `studentId, transcriptType` | Sealed Transcript record (201) | `transcriptController.js` | **Verified (201 Created)** |
| **GET** | `/api/transcripts` | List transcript records (Scoped) | Bearer JWT | `student, institution, admin` | Query: `studentId, status, page, limit` | Paginated Transcript array | `transcriptController.js` | **Verified (200 OK)** |
| **PUT** | `/api/transcripts/:id/revoke` | Revoke transcript with reason | Bearer JWT | `institution, admin` | `revocationReason` | Revoked Transcript (200) | `transcriptController.js` | **Verified (200 OK)** |
| **GET** | `/api/eligibility` | Evaluate NEP 2020 exit benchmarks | Bearer JWT | `student, institution, admin` | Query: `studentId` (if admin/inst) | `{ summary, requirements: [4 benchmarks] }` | `eligibilityController.js` | **Verified (200 OK)** |
| **GET** | `/api/recommendations` | Prerequisite-aware course suggestions | Bearer JWT | `student, institution, admin` | Query: `studentId` (if admin/inst) | `{ totalRecommended, recommendations: [...] }` | `recommendationController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/overview` | Live institution KPIs & metrics | Bearer JWT | `institution, admin` | None | Aggregated student, course, credit, transfer, API metrics | `institutionController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/policies` | Get active credit acceptance policy | Bearer JWT | `institution, admin` | None | `{ version, minGrade, minEquivalency, maxCredits, policyHistory }` | `institutionController.js` | **Verified (200 OK)** |
| **PUT** | `/api/institution/policies` | Publish new policy version | Bearer JWT | `institution, admin` | `minGrade, minEquivalency, maxCredits, version, description` | Updated Policy with archived version | `institutionController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/results/template` | Download official Excel template | Bearer JWT | `institution, admin` | None | Binary `.xlsx` file download | `resultImportController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/results/template/data` | In-browser sample template data | Bearer JWT | `institution, admin` | None | Sample template rows JSON | `resultImportController.js` | **Verified (200 OK)** |
| **POST** | `/api/institution/results/preview` | Upload Excel & preview validation | Bearer JWT | `institution, admin` | Multipart FormData: `file, academicYear, semester` | Batch preview with row-level validation | `resultImportController.js` | **Verified (200 OK)** |
| **POST** | `/api/institution/results/confirm` | Confirm batch & award credits | Bearer JWT | `institution, admin` | `batchId` | Confirmation metrics & progression count | `resultImportController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/results/batches` | List previous import batches | Bearer JWT | `institution, admin` | Query: `page, limit` | Paginated ImportBatches | `resultImportController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/results/batches/:batchId`| Get batch details & row items | Bearer JWT | `institution, admin` | Param: `batchId` | Full batch object with row errors/items | `resultImportController.js` | **Verified (200 OK)** |
| **GET** | `/api/institution/results` | Query semester results ledger | Bearer JWT | `institution, admin` | Query: `academicYear, semester, studentAbcId, courseCode` | Paginated SemesterResult array | `resultImportController.js` | **Verified (200 OK)** |
| **PUT** | `/api/institution/results/:id/correct` | Audited exam result correction | Bearer JWT | `institution, admin` | `marks, grade, reason` | Updated SemesterResult + resealed Credit | `resultImportController.js` | **Verified (200 OK)** |
| **GET** | `/api/gateway/info` | API Gateway overview & endpoints | Bearer JWT | `institution, admin` | None | Gateway capabilities, scopes, active keys | `gatewayController.js` | **Verified (200 OK)** |
| **POST** | `/api/gateway/keys` | Generate B2B API Key | Bearer JWT | `institution, admin` | `name, scopes: [...]` | Key object + raw `secretKey` (shown once) | `gatewayController.js` | **Verified (201 Created)** |
| **GET** | `/api/gateway/keys` | List institution API keys | Bearer JWT | `institution, admin` | None | API keys array with `lastFour` | `gatewayController.js` | **Verified (200 OK)** |
| **PUT** | `/api/gateway/keys/:id/revoke` | Revoke API key | Bearer JWT | `institution, admin` | Param: `id` | Revoked key confirmation | `gatewayController.js` | **Verified (200 OK)** |
| **GET** | `/api/gateway/logs` | Fetch B2B API telemetry logs | Bearer JWT | `institution, admin` | None | Log records with latency and status | `gatewayController.js` | **Verified (200 OK)** |
| **GET** | `/api/gateway/audit-logs` | Fetch system security audit trail | Bearer JWT | `institution, admin` | None | AuditLog entries | `gatewayController.js` | **Verified (200 OK)** |
| **GET** | `/api/v1/gateway/credits` | B2B Gateway: Read credits | `X-API-Key` (`read:credits`) | B2B Machine | Query: `studentId` | Credit ledger array | `gatewayController.js` | **Verified (200 OK)** |
| **POST** | `/api/v1/gateway/credits` | B2B Gateway: Award credit | `X-API-Key` (`submit:credits`) | B2B Machine | `studentId, courseId, credits, grade, semester, academicYear` | Created sealed Credit object | `gatewayController.js` | **Verified (201 Created)** |
| **POST** | `/api/v1/gateway/certificates/verify` | B2B Gateway: Verify cert seal | `X-API-Key` (`verify:certificates`) | B2B Machine | `certificateId` | Authenticity seal verdict | `gatewayController.js` | **Verified (200 OK)** |
| **GET** | `/api/v1/gateway/students` | B2B Gateway: Read student roster | `X-API-Key` (`read:students`) | B2B Machine | None | Institution student array | `gatewayController.js` | **Verified (200 OK)** |
| **GET** | `/api/admin/overview` | Platform-wide master telemetry | Bearer JWT | `admin` | None | Master counts, pending universities, logs | `adminController.js` | **Verified (200 OK)** |

---

## 2. Detailed API Specifications & Payloads

### 2.1 Authentication & Registration (`POST /api/auth/register`)
- **Headers:** `Content-Type: application/json`
- **Request Body (Student):**
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav.sharma@gmail.com",
    "password": "Password@123",
    "role": "student",
    "studentId": "ABC-100201",
    "institutionId": "6712a101fbc34d0012a9b101"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Successfully registered as STUDENT. Welcome to NEP Academic Credit Hub.",
    "data": {
      "user": {
        "_id": "6713b202cde45e0023b8c202",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@gmail.com",
        "role": "student",
        "studentId": "ABC-100201",
        "institutionId": "6712a101fbc34d0012a9b101",
        "currentSemester": 1,
        "isActive": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "timestamp": "2026-10-20T13:25:00.000Z"
  }
  ```
- **Important Error Responses:**
  - `400 Bad Request`: Password $< 6$ characters, invalid email, or missing institution selection for student.
  - `403 Forbidden`: Attempting public registration with `role: 'admin'`.
  - `409 Conflict`: Email address is already registered.

---

### 2.2 Awarding Academic Credit (`POST /api/credits`)
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "studentId": "6713b202cde45e0023b8c202",
    "courseId": "6712a201fbc34d0012a9c303",
    "credits": 4,
    "grade": "A+",
    "semester": 1,
    "academicYear": "2024-25"
  }
  ```
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Academic credit recorded and sealed with SHA-256 integrity hash.",
    "data": {
      "_id": "6714c303def56f0034c9d404",
      "studentId": { "_id": "6713b202cde45e0023b8c202", "name": "Aarav Sharma", "studentId": "ABC-100201" },
      "courseId": { "_id": "6712a201fbc34d0012a9c303", "courseCode": "CS101", "courseName": "Data Structures" },
      "institutionId": { "_id": "6712a101fbc34d0012a9b101", "name": "Bannari Amman Institute of Technology" },
      "credits": 4,
      "grade": "A+",
      "semester": 1,
      "academicYear": "2024-25",
      "verificationStatus": "verified",
      "integrityHash": "3f8b89e13d9a74c20bc71e549a88e9903b6d21e865fa7b24ef78b871c841e21b",
      "isTransferred": false
    }
  }
  ```
- **Important Error Responses:**
  - `400 Bad Request`: Credits exceed assigned course limits or negative values.
  - `403 Forbidden`: Target student does not belong to the awarding institution.
  - `409 Conflict`: Duplicate entry (student already has a credit record for this course in this semester).

---

### 2.3 Reviewing Credit Transfer Request (`PUT /api/transfers/:id/review`)
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "status": "APPROVED",
    "remarks": "Syllabus equivalency verified at 85%. Credits accepted into Bachelor of Technology curriculum."
  }
  ```
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Transfer request has been successfully updated to APPROVED.",
    "data": {
      "_id": "6715d404efa67a0045dae505",
      "status": "APPROVED",
      "remarks": "Syllabus equivalency verified at 85%...",
      "reviewedBy": { "name": "Academic Dean", "email": "dean@kiterode.ac.in" },
      "reviewedAt": "2026-10-20T13:28:10.000Z"
    }
  }
  ```
- **Side Effect Executed in Database:**
  Automatically executes `AcademicCredit.updateMany` marking transferred credits as:
  `{ isTransferred: true, transferredTo: destinationInstitutionId, transferredAt: new Date() }`.

---

### 2.4 B2B API Gateway: Read Credits (`GET /api/v1/gateway/credits`)
- **Headers:** `X-API-Key: nep_live_8f3c71a9b2...`
- **Query Parameter:** `studentId=6713b202cde45e0023b8c202` (Optional)
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Gateway credit records retrieved successfully.",
    "data": [
      {
        "_id": "6714c303def56f0034c9d404",
        "credits": 4,
        "grade": "A+",
        "semester": 1,
        "academicYear": "2024-25",
        "verificationStatus": "verified",
        "integrityHash": "3f8b89e13d9a74c20bc71e549a88e9903b6d21e865fa7b24ef78b871c841e21b",
        "courseId": { "courseCode": "CS101", "courseName": "Data Structures", "credits": 4 }
      }
    ]
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: API key missing or invalid SHA-256 hash.
  - `403 Forbidden`: API key lacks `read:credits` scope.
