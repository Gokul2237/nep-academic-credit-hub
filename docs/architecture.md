# Architecture & System Design

## Overview
The NEP Aligned Standardized Academic Credit Accumulation Hub is engineered as a multi-tenant full-stack academic platform.

```
                    ┌──────────────────────────────────────────┐
                    │               React + Vite               │
                    │               Client App                 │
                    └────────────────────┬─────────────────────┘
                                         │  Axios HTTP / JWT / B2B API Key
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │             Express REST API             │
                    │            & B2B API Gateway             │
                    └────────────────────┬─────────────────────┘
                                         │  Mongoose ODM
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │                MongoDB                   │
                    │           nep_academic_hub               │
                    └──────────────────────────────────────────┘
```

## System Modules
1. **Authentication & RBAC**: JWT bearer token middleware with role authorization (`student`, `institution`, `admin`).
2. **Academic Credit Accumulation**: Ledger of awarded credits with SHA-256 integrity hashing to detect tampering.
3. **Cross-Institution Credit Transfer**: Transfer request pipeline with destination university evaluation queue.
4. **Certificate & Transcript Engine**: Cryptographically sealed certificates and verifiable snapshot transcripts.
5. **Academic Passport & Eligibility Tracker**: NEP 2020 degree benchmark evaluation (160 graduation credits target).
6. **Explainable Recommendation Engine**: Prerequisite-aware course recommendations with human-readable rationale.
7. **B2B API Gateway**: Machine-to-machine authentication using SHA-256 hashed API keys with scoped permissions (`read:credits`, `submit:credits`, `verify:certificates`, `read:students`).
8. **Smart Credit Validation Engine**: Pre-validation check suite verifying student, course, institution, credit bounds, grade schema, duplicate ledger check, and pre-seal hash.
