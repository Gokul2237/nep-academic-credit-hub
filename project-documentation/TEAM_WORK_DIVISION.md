# TEAM WORK DIVISION & RESPONSIBILITY MATRIX

---

## 1. Work Allocation Overview

To align with undergraduate academic project presentation guidelines, the engineering contributions for the **NEP Aligned Standardized Academic Credit Accumulation Hub** are divided between **two team members** based on the actual codebase structure.

- **Member 1 (Backend Engineer & System Architect):** Backend REST architecture, MongoDB schema modeling, cryptographic integrity sealing, authentication & RBAC middleware, B2B API gateway, bulk Excel examination ingestion engine, semester progression algorithms, and automated test suites.
- **Member 2 (Frontend Engineer & UI/UX Specialist):** Single Page Application architecture, React component hierarchies, Tailwind CSS design system, user experience across 3 role-tailored dashboards, Axios API integration layer, semester-wise credit visualizations, mobility workflow UI, public verification portals, and manual QA validation.

---

## 2. Detailed Technical Division of Responsibilities

### Member 1: Backend Architecture, Database, Cryptography & B2B Gateway

#### 1. Database Engineering & Schema Modeling (MongoDB / Mongoose)
- Designed and authored all 13 Mongoose models in `server/models/`:
  - `User.js`, `Institution.js`, `Course.js`, `AcademicCredit.js`, `CreditPolicy.js`, `TransferRequest.js`, `Certificate.js`, `Transcript.js`, `APIKey.js`, `APILog.js`, `AuditLog.js`, `SemesterResult.js`, `ResultImportBatch.js`.
- Formulated compound indexes to prevent duplicates (e.g. `{ studentId: 1, courseId: 1, academicYear: 1, semester: 1 }` in `AcademicCredit` and `SemesterResult`).
- Embedded policy version histories (`policyHistorySchema`) within `CreditPolicy` to ensure atomic version updates.

#### 2. Authentication, Security & Middleware Architecture
- Engineered bcryptjs salted password hashing with work factor 12 in `server/models/User.js`.
- Implemented ephemeral 24-hour JWT token generation and verification (`server/utils/tokenHelper.js`, `server/middleware/authMiddleware.js`).
- Authored Role-Based Access Control (`server/middleware/roleMiddleware.js`) and Multi-Tenant Isolation (`server/middleware/scopeMiddleware.js`).
- Implemented rate limiting (`server/middleware/rateLimitMiddleware.js`), Helmet headers, and CORS policies in `server/server.js`.
- Configured internal administrator bootstrapping (`ensureAdminAccount`) to prevent public admin registration.

#### 3. Core Business Logic & Algorithmic Engines
- Created the Deterministic SHA-256 Tamper-Evident Hashing Engine (`server/utils/hashHelper.js`, `generateCreditHash`, `verifyCreditIntegrity`).
- Implemented the Smart Credit Pre-Validation Suite (`server/controllers/validationController.js`).
- Authored the Bulk Results Ingestion Pipeline with SheetJS and Multer (`server/controllers/resultImportController.js`), handling spreadsheet parsing, validation, batch confirmation, automatic credit conversion, and semester progression.
- Built the Audited Result Correction Engine with historical archiving (`correctionHistory`) and cryptographic hash resealing.
- Implemented the Credit Acceptance Policy Versioning Engine (`server/controllers/institutionController.js`).
- Programmed the NEP Exit Milestone Eligibility Tracker and Prerequisite-Aware Course Recommendation Engine.

#### 4. B2B Cross-Institutional API Gateway
- Developed the API key generation algorithm using 24 cryptographically secure random bytes (`nep_live_...`), storing only SHA-256 hashes (`server/controllers/gatewayController.js`).
- Engineered the B2B Gateway Authentication Middleware (`server/middleware/gatewayMiddleware.js`) enforcing scoped permissions (`read:credits`, `submit:credits`, `verify:certificates`, `read:students`).
- Implemented automated B2B response telemetry and latency logging in `APILog`.

#### 5. Quality Assurance & Automated Testing
- Authored the comprehensive end-to-end test runner (`server/testAllFeaturesComprehensive.js`, 87 passing assertions).
- Created the isolated database test harness (`server/scripts/runIsolatedTests.js`, `testSemesterResultsAndProgression.js`, 68 passing assertions).
- Developed the real database metrics invariant test suite (`server/testInstitutionStats.js`).

---

### Member 2: Frontend Engineering, UI/UX, State Management & Workflow Integration

#### 1. Frontend Architecture & Build Optimization (React 18 + Vite)
- Configured the Vite 5 build pipeline with Tailwind CSS 3.4, PostCSS, and dynamic chunk splitting (`client/vite.config.js`).
- Structured client-side routing in `client/src/App.jsx` with code-split lazy loading (`React.lazy`, `Suspense`).
- Designed the global session state provider (`client/src/context/AuthContext.jsx`) and route guard (`client/src/components/ProtectedRoute.jsx`).
- Constructed the reusable layout hierarchy (`client/src/layouts/DashboardLayout.jsx`, `client/src/components/common/Sidebar.jsx`).

#### 2. Student Experience & Credit Mobility Interfaces
- **Digital Academic Credit Wallet (`StudentWalletPage.jsx`):** Visual card widgets summarizing total, verified, and pending credits with institution-wise distribution.
- **Credit Timeline (`StudentTimelinePage.jsx`):** Hierarchical view grouping credits chronologically by academic year and semester.
- **Credit Transfer Workflow (`StudentTransferPage.jsx`):** Interactive transfer modal allowing students to select verified credits, choose destination universities, track approval status, and cancel pending requests.
- **NEP Eligibility Tracker (`StudentEligibilityPage.jsx`):** Visual progress bars showing completion percentage toward Certificate (40), Diploma (80), 3-Yr Degree (140), and 4-Yr Degree (160).
- **Academic Pathway Planner (`StudentPathwayPage.jsx`):** Multi-stage visual curriculum roadmap.
- **Course Recommendations (`StudentRecommendationsPage.jsx`):** Responsive cards with explainable recommendation badges.
- **Credit Transfer Simulator (`StudentSimulatorPage.jsx`):** Interactive acceptance probability calculator.
- **Digital Transcript Generator (`StudentTranscriptPage.jsx`):** Formats official snapshot transcripts with QR verification code display.

#### 3. Institution Administration & Examination Management Views
- **Institution Overview Dashboard (`InstitutionDashboard.jsx`):** Live telemetry widgets rendering real-time database counts.
- **Student Roster Management (`InstitutionStudentsPage.jsx`):** Searchable table with semester filtering and profile modals.
- **Course Catalog Management (`InstitutionCoursesPage.jsx`):** CRUD interface for defining department modules and credit weights.
- **Academic Credit Issuance (`InstitutionCreditsPage.jsx`):** Credit issuance modal integrated with Smart Credit Pre-Validation checks.
- **Results Import Hub (`InstitutionResultsImportPage.jsx`):** 1,661-line feature hub featuring drag-and-drop Excel uploading, dynamic preview summary modals, batch history tables, semester result ledger, and audited grade correction forms.
- **Transfer Request Evaluation Queue (`InstitutionTransfersPage.jsx`):** Review queue with modal controls for approving or rejecting incoming transfer proposals.
- **Credit Acceptance Policies (`InstitutionPoliciesPage.jsx`):** Two-section interface: Section A edits active policy; Section B displays version history (v1.0, v2.0).
- **API Gateway & Keys Hub (`InstitutionApiGatewayPage.jsx`, `InstitutionApiKeysPage.jsx`, `InstitutionApiLogsPage.jsx`):** Secret key generation modal (showing key once), active key tables, and live B2B telemetry log viewer.

#### 4. Superadministrator Governance Views & System Analytics
- **Admin Dashboard (`AdminDashboard.jsx`):** National telemetry monitoring, pending university accreditation queue, and platform audit feed.
- **System Analytics (`AdminAnalyticsPage.jsx`):** Interactive visual charts using Recharts (pie chart for credit verification distribution, bar charts for grade distributions).
- **Governance Pages:** `AdminInstitutionsPage.jsx`, `AdminStudentsPage.jsx`, `AdminCoursesPage.jsx`, `AdminCreditsPage.jsx`, `AdminTransfersPage.jsx`, `AdminApiMonitoringPage.jsx`, `AdminAuditLogsPage.jsx`.

#### 5. Public Verification & Integration Testing
- **Public Verification Pages:** Built unauthenticated, public QR-code-compatible verification views (`PublicTranscriptVerificationPage.jsx`, `PublicCertificateVerificationPage.jsx`).
- **Unified API Client:** Authored the Axios interceptor client (`client/src/services/api.js`) and service modules (`authService`, `courseService`, `creditService`, `transferService`, `certificateService`, `transcriptService`, `institutionService`, `studentService`).
- **User Acceptance & Build Verification:** Verified production build cleanliness (0 errors across 2,419 modules) and conducted end-to-end browser walkthroughs.

---

## 3. Evidence-Based Artifact & File Traceability Matrix

| Component / Subsystem | Primary Responsible Member | Key Files & Artifacts | Verified Functionality |
| :--- | :---: | :--- | :--- |
| **Database Models (13 Models)** | Member 1 | `server/models/*.js` | Mongoose schemas, compound indexes, pre-save hooks |
| **Authentication & RBAC** | Member 1 | `authController.js`, `authMiddleware.js`, `roleMiddleware.js` | Bcrypt salting, 24h JWT, role authorization, bootstrap admin |
| **Cryptographic Sealing Engine** | Member 1 | `server/utils/hashHelper.js`, `certificateController.js` | Deterministic SHA-256 integrity seal generation & validation |
| **Excel Ingestion & Progression** | Member 1 | `server/controllers/resultImportController.js` | In-memory spreadsheet parsing, duplicate prevention, progression |
| **Credit Policies & Versioning** | Member 1 | `CreditPolicy.js`, `institutionController.js` | Embedded version history, version incrementing, audit logging |
| **B2B API Gateway & Keys** | Member 1 | `gatewayMiddleware.js`, `gatewayController.js`, `APIKey.js` | SHA-256 key hashing, scoped endpoints, telemetry logging |
| **Automated Test Suites** | Member 1 | `testAllFeaturesComprehensive.js`, `runIsolatedTests.js` | 161 automated test assertions across 5 suites |
| **React App Architecture & Build** | Member 2 | `client/src/App.jsx`, `vite.config.js`, `tailwind.config.js` | Vite 5 build, React Router v6, dynamic code splitting |
| **Auth Context & Route Guards** | Member 2 | `AuthContext.jsx`, `ProtectedRoute.jsx`, `api.js` | Axios JWT interceptor, 401 redirection, session management |
| **Student Credit Wallet & Timeline** | Member 2 | `StudentWalletPage.jsx`, `StudentTimelinePage.jsx` | Digital wallet metrics, chronological semester grouping |
| **Credit Mobility & Transfer UI** | Member 2 | `StudentTransferPage.jsx`, `InstitutionTransfersPage.jsx` | Transfer proposal forms, review queue, approval modals |
| **Eligibility Tracker & Pathway** | Member 2 | `StudentEligibilityPage.jsx`, `StudentPathwayPage.jsx` | NEP exit milestone progress bars, multi-stage roadmap |
| **Course Recommendations & Sim** | Member 2 | `StudentRecommendationsPage.jsx`, `StudentSimulatorPage.jsx` | Prerequisite-aware recommendation cards, simulator calculator |
| **Results Import UI Hub** | Member 2 | `InstitutionResultsImportPage.jsx` | 1,661-line UI: Excel upload, preview modal, batch history, ledger |
| **Policy & API Gateway UI** | Member 2 | `InstitutionPoliciesPage.jsx`, `InstitutionApiKeysPage.jsx` | Section A/B policy editor, API key generation modal, log viewer |
| **Admin Analytics & Dashboards** | Member 2 | `AdminDashboard.jsx`, `AdminAnalyticsPage.jsx` | Recharts charts, national telemetry counters, audit explorer |
| **Public Verification Views** | Member 2 | `PublicTranscriptVerificationPage.jsx`, `PublicCertificate...` | Public verification without login, QR verification lookup |
