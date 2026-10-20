# PROJECT OVERVIEW: NEP ALIGNED ACADEMIC CREDIT ACCUMULATION HUB

---

## 1. Project Identification

- **Project Title:** NEP Aligned Standardized Academic Credit Accumulation Hub with Cross-Institutional Authentication API Gateways
- **Academic Context:** S5 Computer Science & Engineering Mini Project
- **Primary Domain:** Decentralized Higher Education Technologies, Academic Mobility & B2B API Integration
- **Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)
- **Current Version:** v1.0.0 (Production-Ready Architecture)

---

## 2. Executive Abstract

The National Education Policy (NEP 2020) envisioned a transformative, multidisciplinary higher education paradigm in India, establishing the **Academic Bank of Credits (ABC)** to facilitate seamless student mobility, flexible entry and exit trajectories, and decentralized credit accumulation across accredited institutions. However, educational institutions currently maintain fragmented, heterogeneous Student Information Systems (SIS) and legacy Enterprise Resource Planning (ERP) databases. Consequently, evaluating course equivalency, verifying credit authenticity, and transferring academic units between autonomous colleges and universities remains a manual, time-consuming, and error-prone process vulnerable to document forgery.

The **NEP Aligned Standardized Academic Credit Accumulation Hub** addresses these challenges by providing a full-stack, policy-driven academic credit exchange platform. Designed using the MERN stack, the platform provides:
1. A **Student Digital Credit Wallet & Academic Passport** offering unified, semester-wise visibility over accumulated academic credits earned across multiple recognized institutions.
2. An **Institutional Credit Trust Gateway** enabling universities to author versioned credit acceptance policies (e.g., minimum grade thresholds, equivalency percentages, and transferable credit ceilings).
3. A **Deterministic Cryptographic Seal Engine** that binds credit records, certificates, and academic transcripts to SHA-256 integrity hashes to prevent tampering.
4. A **Bulk Excel Result Import & Automatic Progression Pipeline** that parses institutional examination spreadsheets, auto-converts passing results into verified credit units, and evaluates semester-by-semester student progression.
5. A **Cross-Institutional B2B REST API Gateway** secured by cryptographically hashed API keys (`nep_live_...`) and granular permission scopes (`read:credits`, `submit:credits`, `verify:certificates`, `read:students`), enabling machine-to-machine academic interoperability.

The system ensures strict multi-tenant data isolation and Role-Based Access Control (RBAC), providing dedicated dashboard environments for Students, Higher Education Institutions, and Central Regulating Administrators.

---

## 3. Problem Statement

Under traditional university ecosystems, academic management is strictly centralized within single institutions:

1. **Siloed Academic Repositories:** When a student migrates between universities or enrolls in cross-institutional courses (such as SWAYAM, NPTEL, or inter-university partnerships), credit records are maintained in isolated relational schemas without standardized interoperability protocols.
2. **Manual and Subjective Equivalency Decisions:** Inter-university transfer evaluations depend on paper syllabus comparisons and discretionary academic committees. The lack of transparent, versioned institutional credit acceptance rules leads to administrative delays and student uncertainty.
3. **Absence of Real-Time Fraud Prevention:** Paper grade cards and downloadable digital PDFs can be altered with standard software. Employers and admissions officers lack unauthenticated, real-time cryptographic verification tools.
4. **Frictional Migration Workflows:** No standardized machine-to-machine API gateway exists to allow destination institutions to query a student's verified academic history or submit inter-institutional transfer requests programmatically.
5. **Lack of NEP Degree Benchmark Tracking:** Students lack visual self-service tools to evaluate their accumulated credits against NEP graduation targets (e.g., Certificate: 40 credits; Diploma: 80 credits; 3-Year UG: 140 credits; 4-Year Bachelor Degree: 160 credits).

---

## 4. Project Objectives

The project accomplishes the following core engineering objectives:

- **Objective 1 — Unified Academic Credit Repository:** Design a centralized MongoDB data model capturing course metadata, academic semesters, performance grades, awarding institution identifiers, and student ABC roll numbers.
- **Objective 2 — Multi-Role Portal Architecture:** Implement distinct, role-protected frontend dashboard interfaces for Students, Institutions, and Superadministrators using React 18, Vite, and Tailwind CSS.
- **Objective 3 — Tamper-Evident Ledger:** Formulate a deterministic SHA-256 integrity seal calculated over credit payload fields to immediately detect any unauthorized modifications to database records.
- **Objective 4 — Policy-Driven Transfer Engine:** Enable destination universities to define, version, and enforce credit transfer acceptance rules (`minGrade`, `minEquivalency`, `maxCredits`) with an explainable audit trail.
- **Objective 5 — Institutional Examination Automation:** Create an in-memory spreadsheet ingestion pipeline that validates student eligibility, records semester exam scores, auto-issues cryptographic credits for passing grades, and advances student semester standing.
- **Objective 6 — B2B Cross-Institutional API Gateway:** Establish cryptographically authenticated REST endpoints allowing external university ERPs to interact with the credit hub programmatically using scoped API keys.
- **Objective 7 — Student Academic Mobility Tools:** Provide students with a Credit Transfer Simulator, an Explainable Course Recommendation Engine, an Academic Pathway Planner, and verifiable digital transcripts.

---

## 5. Scope & Application Boundaries

### Included within System Scope:
- **Institutions:** Central universities, State universities, Deemed universities, Autonomous colleges, and Institutes of National Importance (INIs) accredited by NAAC/NIRF.
- **Academic Programs:** Undergraduate (4-year NEP framework with multiple exit qualifications: Certificate, Diploma, 3-Year Degree, 4-Year Honours/Research) and Postgraduate programs.
- **Credit Lifecycle:** Catalog registration $\rightarrow$ Result ingestion $\rightarrow$ Credit allocation $\rightarrow$ Digital seal computation $\rightarrow$ Transfer initiation $\rightarrow$ Institutional review $\rightarrow$ Credit re-assignment.
- **Verification Layer:** Public, unauthenticated QR-code-compatible verification endpoints for transcripts and certificates.

### Excluded / External to System Scope:
- Financial fee transactions, tuition payments, or scholarship disbursals.
- Classroom scheduling, live attendance biometric tracking, or learning management system (LMS) video lectures.
- Direct external database replication (the system communicates via REST API JSON payloads, not direct database links).

---

## 6. Technical Motivation & Innovation

The design of the NEP Academic Credit Hub differs fundamentally from generic Student Information Systems:

| Evaluation Aspect | Traditional College ERP / SIS | NEP Academic Credit Hub (This Project) |
| :--- | :--- | :--- |
| **Data Scope** | Single institution only | Multi-institutional, cross-university credit accumulation |
| **Trust Model** | Relies on internal database admin trust | Deterministic SHA-256 cryptographic seals on all credits |
| **Transfer Logic** | Manual paper equivalency forms | Versioned programmatic policy engine (`minGrade`, `minEquivalency`) |
| **Integration** | Proprietary proprietary interfaces / No API | Scoped B2B REST API Gateway with hashed keys and telemetry logs |
| **Academic Mobility** | Static degree pathways | NEP 2020 multiple exit benchmark tracking (40, 80, 140, 160 credits) |
| **Result Ingestion** | Manual single-entry forms | Bulk Excel spreadsheet parsing with duplicate checking and auto-progression |
| **Verification** | Physical registrar seal or email | Instant public verification of transcripts and certificate hashes |

---

## 7. Technology Stack Summary

### Frontend Technologies
- **Runtime & Bundler:** React.js 18.3.1 with Vite 5.4.21
- **Styling Framework:** Tailwind CSS 3.4.10 with PostCSS and Autoprefixer
- **Routing:** React Router DOM 6.26.0 (supporting protected routes, role routing, and code-split lazy loading)
- **HTTP Client:** Axios 1.7.4 with unified request/response interceptors
- **Icons & Visuals:** Lucide React (v0.435.0)
- **Data Visualization:** Recharts 2.12.7 (rendering bar charts, status distributions, and academic grade analytics)

### Backend Technologies
- **Runtime Environment:** Node.js (v18.x / v20.x recommended)
- **Web Framework:** Express.js 4.19.2
- **Object Data Modeling (ODM):** Mongoose 8.5.1
- **Security & Cryptography:** bcryptjs 2.4.3 (work factor 12), jsonwebtoken 9.0.2 (24h JWT), Node.js native `crypto` module (SHA-256, random bytes)
- **HTTP Security & Protection:** Helmet 7.1.0, express-rate-limit 7.3.1, CORS 2.8.5
- **File Handling & Spreadsheet Processing:** Multer 2.4.0 (in-memory buffer storage), XLSX 0.18.5 (spreadsheet parsing and generation)
- **Logging & Monitoring:** Morgan 1.10.0

### Database
- **Primary Database:** MongoDB (v6.x / v8.x Community Server or MongoDB Atlas)
- **Database Name:** `nep_academic_hub`
- **Isolated Testing Database:** `nep_test_isolated`
- **Total Collections:** 13 primary collections with compound indexes for multi-tenant query isolation.
