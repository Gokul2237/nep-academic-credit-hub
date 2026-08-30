# NEP Aligned Standardized Academic Credit Accumulation Hub with Cross-Institutional Authentication API Gateways

> **S5 Computer Science Engineering Mini Project**  
> *A Policy-Driven Cross-Institutional Academic Credit Trust Gateway aligned with NEP 2020 Academic Bank of Credits (ABC).*

---

## 🌟 Overview

The **NEP Aligned Standardized Academic Credit Accumulation Hub** is a decentralized academic credit repository and transfer exchange platform. It enables students to store, verify, and transfer academic credits earned across multiple recognized higher education institutions, while offering universities an automated, policy-driven verification gateway and B2B REST APIs.

### Key Innovations
- **Policy-Driven Credit Trust Gateway**: Universities define custom, versioned acceptance rules (e.g. minimum equivalency %, max external credits, mandatory practical components).
- **Explainable Decision Engine**: Automated evaluations yield transparent `ACCEPTED`, `CONDITIONAL`, or `REJECTED` verdicts with point-by-point rule audits.
- **Cross-Institutional B2B API Gateway**: Cryptographically authenticated REST APIs for machine-to-machine student credit verification and transfer evaluations.
- **NEP Academic Pathway & Recommendation Engine**: Visual pathway planner and prerequisite-aware course recommendation.
- **Tamper-Evident Digital Ledger**: SHA-256 digital seals on all awarded credits and certificates.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, Mongoose ODM, JWT, bcryptjs, Morgan, Helmet |
| **Database** | MongoDB Atlas / Local MongoDB |
| **Architecture** | RESTful API, B2B Gateway, Role-Based Access Control (RBAC), Policy Versioning Engine |

---

## 👥 User Roles & Dashboards

1. **Student Dashboard**
   - Digital Academic Credit Wallet
   - Cross-Institution Credit Timeline
   - Academic Progress & NEP Eligibility Tracker
   - Academic Pathway Planner
   - Intelligent Course Recommendations
   - Real-Time Transfer Simulator
   - Official Verifiable Transcripts & Micro-Credentials

2. **Institution Dashboard**
   - Student & Course Catalog Management
   - Academic Credit Issuance & Verification Ledger
   - Credit Acceptance Policy Authoring & Versioning (v1.0, v2.0...)
   - Transfer Request Evaluation Queue & Academic Officer Sign-off
   - B2B API Gateway Key Management & Live API Telemetry Logs

3. **Admin Dashboard**
   - University Accreditation & Verification Queue
   - System-wide Credit & Transfer Analytics
   - Global Course & Credit Audit Monitoring
   - Platform Audit Trail Explorer
   - API Gateway Health & Security Monitoring

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account or local MongoDB instance (`mongodb://localhost:27017/nep_academic_hub`)
- npm / yarn / pnpm

### 1. Installation
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` in both `server/` and `client/` directories:
```bash
# In server/
cp .env.example .env

# In client/
cp .env.example .env
```
Fill in your `MONGO_URI` and `JWT_SECRET` in `server/.env`.

### 3. Seed Realistic NEP Demo Data
```bash
npm run seed
```

### 4. Run Development Servers
```bash
# Starts both Express API (:5000) and Vite React Frontend (:5173)
npm run dev
```

---

## 📁 Repository Structure

```
NEP/
├── client/          # React + Vite + Tailwind CSS Frontend
├── server/          # Node.js + Express + Mongoose REST Backend
├── .gitignore       # Git ignore rules (protecting secrets & builds)
├── README.md        # Documentation
└── package.json     # Orchestration scripts
```

---

## 🔒 Security & Standards
- Passwords hashed with `bcryptjs` (salt work factor 12).
- Ephemeral JWT Access Tokens + secure Refresh Token rotation.
- SHA-256 hashed API Keys with role scoping and rate-limiting.
- Tenant isolation middleware preventing cross-institutional Insecure Direct Object References (IDOR).
- Strictly zero secret leakage in source code commits.

---

## 📜 License
Developed as an Academic Mini Project under Computer Science & Engineering. Open for academic research and educational deployment.
