# COLLEGE REPORT READINESS CHECKLIST & VIVA GUIDE

---

## 1. Verified Project Metadata

Ensure the following metadata is consistently stated across all sections of your final mini-project report:

- **Project Title:** NEP Aligned Standardized Academic Credit Accumulation Hub with Cross-Institutional Authentication API Gateways
- **Project Domain:** Academic Credit Banking, Distributed Student Mobility & B2B REST API Gateways
- **Academic Standard:** National Education Policy (NEP 2020) & UGC Academic Bank of Credits (ABC) Guidelines
- **Software Architecture:** Multi-Tenant MERN (MongoDB 8.x / 6.x, Express.js 4.19, React.js 18.3, Node.js 20.x)
- **Primary Database:** MongoDB (`nep_academic_hub`), 13 collections, compound indexes, pre-save hooks
- **Frontend Tooling:** Vite v5.4.21, Tailwind CSS 3.4.10, Axios 1.7.4, Recharts 2.12.7, Lucide React
- **Cryptography:** Node.js native `crypto` (SHA-256 integrity sealing, 24-byte random keys), `bcryptjs` (work factor 12)
- **Authentication:** Ephemeral 24-hour JSON Web Tokens (HMAC-SHA256 signed)
- **B2B API Authentication:** `X-API-Key: nep_live_...` with database SHA-256 hash lookup and role scoping
- **Application Ports:** Express Backend (:5000), Vite React Frontend (:5173), MongoDB (:27017)

---

## 2. Screenshot Capture Checklist for Final Report

Capture screenshots from your running browser (`http://localhost:5173`) to include in Chapter 4 / Chapter 5 (Results & Discussion):

| # | Figure Name | Route / View | What to Show |
| :---: | :--- | :--- | :--- |
| **Fig 1** | Homepage & Public Landing Portal | `/` | Hero section, NEP ABC portal branding, navigation links to sign in and register. |
| **Fig 2** | User Sign In & Role Selection | `/login` | Modern login card showing email and password fields. |
| **Fig 3** | Student Registration & Institution Dropdown | `/register` | Student registration modal showing dynamic dropdown of verified partner universities. |
| **Fig 4** | Student Digital Credit Wallet | `/student/wallet` | Summary cards (Total, Verified, Pending credits) and institutional distribution cards. |
| **Fig 5** | Semester-Wise Academic Credit Timeline | `/student/timeline` | Hierarchical chronological tree grouping credits by Academic Year and Semester. |
| **Fig 6** | Student Exam Results Ledger | `/student/wallet` (Results Tab) | Semester-wise course marks, grades, PASS/FAIL status, and current semester standing. |
| **Fig 7** | Digital Academic Passport Card | `/student/passport` | Official credential card with student ABC ID, verified credits, and cryptographic seal badge. |
| **Fig 8** | NEP 2020 Eligibility Benchmark Tracker | `/student/eligibility` | 4 milestone progress bars: Certificate (40), Diploma (80), 3-Yr UG (140), 4-Yr Degree (160). |
| **Fig 9** | Academic Pathway Planner | `/student/pathway` | Multi-stage visual curriculum roadmap showing verified core courses and upcoming electives. |
| **Fig 10** | Prerequisite-Aware Course Recommendations | `/student/recommendations` | Suggestion cards displaying match scores and explainable rationale for core and partner courses. |
| **Fig 11** | Pre-Transfer Acceptance Simulator | `/student/simulator` | Course selection dropdown, destination university selection, and rule calculation score. |
| **Fig 12** | Credit Transfer Request Proposal Form | `/student/transfers` | Transfer modal showing selectable verified credits, destination university, and reason. |
| **Fig 13** | Verifiable Transcript & QR Verification Code | `/student/transcript` | Snapshot transcript displaying course breakdown, SHA-256 seal, and verification code. |
| **Fig 14** | Public Transcript Verification View | `/verify/transcript/:code` | Incognito browser view verifying transcript authenticity without requiring login. |
| **Fig 15** | Public Certificate Verification View | `/verify/certificate/:id` | Incognito browser view displaying verified micro-credential and cryptographic seal. |
| **Fig 16** | Institution Live Telemetry Overview | `/institution/dashboard` | Dashboard widgets showing enrolled students, active courses, awarded credits, and transfers. |
| **Fig 17** | Course Catalog Management | `/institution/courses` | Department catalog table and modal for adding new courses with credit weights. |
| **Fig 18** | Smart Credit Pre-Validation Tool | `/institution/credits` | Credit creation modal displaying 8 automated pre-validation checks and anticipated seal. |
| **Fig 19** | Results Import Hub (Excel Drag & Drop) | `/institution/results-import` | File upload zone, academic year selector, semester selector, and template download button. |
| **Fig 20** | Excel Import Preview Modal | `/institution/results-import` | Preview table breaking down Total Rows, Valid Rows, In-File Duplicates, and Ineligible Rows. |
| **Fig 21** | Audited Result Correction Modal | `/institution/results-import` (Ledger) | Dialog updating exam marks/grades with mandatory reason and audit history archiving. |
| **Fig 22** | Transfer Request Review Queue | `/institution/transfers` | Review queue displaying incoming student requests with APPROVE and REJECT buttons. |
| **Fig 23** | Credit Acceptance Policy & Version History | `/institution/policies` | Section A editing active policy; Section B displaying historical versions (v1.0, v2.0). |
| **Fig 24** | B2B API Gateway & Key Management | `/institution/api-keys` | API keys table showing key prefix, last 4 digits, granted scopes, and raw secret modal. |
| **Fig 25** | B2B API Live Telemetry Stream | `/institution/api-logs` | Telemetry table showing incoming external requests, response status, and latency (ms). |
| **Fig 26** | Admin System Overview & Telemetry | `/admin/dashboard` | Central regulatory counters for universities, students, verified credits, and audit feed. |
| **Fig 27** | Admin System Analytics Charts | `/admin/analytics` | Recharts charts displaying verification distribution pie chart and grade bar charts. |
| **Fig 28** | Platform Security Audit Trail Explorer | `/admin/audit-logs` | Searchable log of administrative overrides, policy updates, and transfer approvals. |

---

## 3. Information Requiring Confirmation from You (The Student)

Before preparing your final college mini-project report document, fill in these institutional details:

1. **Student Team Details:**
   - Name and Register / Roll Number of Member 1: `[TO BE CONFIRMED]`
   - Name and Register / Roll Number of Member 2: `[TO BE CONFIRMED]`
2. **College & University Affiliation:**
   - Name of College / Institute: `[e.g., Bannari Amman Institute of Technology / Kongu Engineering College]`
   - Name of Department: `[e.g., Department of Computer Science & Engineering]`
   - Affiliated University: `[e.g., Anna University / Autonomous]`
3. **Faculty & Guide Details:**
   - Project Supervisor / Guide Name & Designation: `[e.g., Dr. / Prof. ...]`
   - Head of Department (HOD) Name: `[e.g., Dr. ...]`
4. **Academic Year & Semester:**
   - Semester: `Semester 5 (S5)`
   - Academic Year: `2024–2025 / 2025–2026`
   - Month & Year of Submission: `[e.g., October 2026 / November 2026]`

---

## 4. Viva Voce Preparation Guide (Questions & Model Answers)

### Q1: What is the main problem this project solves under NEP 2020?
> **Model Answer:** Under traditional higher education systems, academic records exist in isolated, non-interoperable college ERPs. NEP 2020 mandates student mobility across institutions via the Academic Bank of Credits (ABC). Our project provides a standardized, multi-tenant academic credit repository where students store and transfer verified credits, universities enforce versioned credit acceptance rules, and external systems integrate via a secure B2B API Gateway.

### Q2: How do you prevent academic credit tampering or unauthorized database alterations?
> **Model Answer:** We engineered a Deterministic SHA-256 Cryptographic Seal Engine (`server/utils/hashHelper.js`). Whenever credit is awarded, a 64-character hash is computed over the student ID, course ID, institution ID, credits, grade, semester, and academic year. If an attacker directly alters a grade or credit value in the database, the recalculation check (`verifyCreditIntegrity`) detects the mismatch and marks the credit invalid.

### Q3: How are student examination results converted into academic credits?
> **Model Answer:** We built an in-memory spreadsheet ingestion pipeline using SheetJS and Multer (`resultImportController.js`). An academic officer uploads an Excel file with student ABC IDs and course codes. The preview phase validates records and flags duplicates. Upon confirmation, authoritative `SemesterResult` documents are created. For passing grades (`O` through `P`), `AcademicCredit` records are automatically generated with SHA-256 seals. Furthermore, if a student passes all registered semester courses, their `currentSemester` standing automatically advances.

### Q4: Why did you not create separate collections for `PolicyVersions` and `TransferDecisions`?
> **Model Answer:** In MongoDB document design, 1-to-few relationships with tightly coupled lifecycles are best modeled as **embedded subdocuments**. In `CreditPolicy.js`, historical versions are stored in an embedded `policyHistory` array, guaranteeing atomic, single-document updates. Similarly, transfer decisions (reviewedBy, reviewedAt, remarks, rejectionReason) belong exclusively to that specific transfer request, avoiding unnecessary relational `$lookup` joins.

### Q5: How does your B2B API Gateway authenticate external universities?
> **Model Answer:** External systems authenticate using an `X-API-Key: nep_live_...` header. When generated, a 24-byte cryptographically secure random token is shown to the administrator only once. We store only its SHA-256 hash in MongoDB. The `gatewayMiddleware` hashes the incoming header, locates the key, verifies active status, enforces granted scopes (`read:credits`, `submit:credits`, `verify:certificates`, `read:students`), and automatically logs response latency into `APILog`.

### Q6: How is multi-tenant data isolation enforced?
> **Model Answer:** We implement multi-tenant isolation at both the middleware and database levels. Express routes utilize `requireInstitutionScope()` and controller queries explicitly bind `institutionId: req.user.institutionId`. For example, an institution officer cannot query or award credits to students enrolled in another university. The Superadmin role bypasses this scope for global regulatory oversight.

---

## 5. Formal Academic References & Standards

Include these citations in the References section of your report:

1. **Ministry of Education, Government of India (2020).** *National Education Policy 2020 (NEP 2020)*. New Delhi: Ministry of Human Resource Development.
2. **University Grants Commission (UGC) (2021).** *Establishment and Operation of Academic Bank of Credits in Higher Education Regulations, 2021*. Gazette of India, Notification No. F. 1-1/2021(ABC).
3. **National Academic Depository (NAD).** *DigiLocker NAD Guidelines for Higher Education Institutions*. Ministry of Electronics and Information Technology (MeitY), Government of India.
4. **National Institute of Standards and Technology (NIST) (2015).** *Secure Hash Standard (SHS)*. Federal Information Processing Standards Publication (FIPS PUB 180-4), SHA-256 Specifications.
5. **MongoDB Documentation (2024).** *Data Modeling Concepts: Embedded vs. Normalized Data Models*. MongoDB Inc.
6. **Express.js Foundation (2024).** *Production Best Practices: Performance and Security in REST APIs*. OpenJS Foundation.
7. **React Documentation (2024).** *Single Page Application Architecture and Component Design Patterns*. Meta Platforms Inc.
