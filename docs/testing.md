# Testing & Verification Guide

## Automated Test Suites

| Phase | Test Script | Description | Status |
| :--- | :--- | :--- | :--- |
| **Phase 2** | `node testPhase2.js` | Authentication & RBAC Verification Suite | 13/13 PASSED |
| **Phase 3** | `node testPhase3.js` | Course Catalog & Academic Credit Ledger | 19/19 PASSED |
| **Phase 4** | `node testPhase4Transfers.js` | Cross-Institution Credit Transfers | 16/16 PASSED |
| **Phase 5** | `node testPhase5Certificates.js` | Certificate Issuance, Verification & Revocation | 36/36 PASSED |
| **Phase 6-12** | `node testPhase6To12Suite.js` | Passport, Eligibility, Recommendations, API Gateway & Validation | ALL PASSED |

## How to Execute Tests
```bash
# Navigate to server directory
cd server

# Run individual test suites
node testPhase2.js
node testPhase3.js
node testPhase4Transfers.js
node testPhase5Certificates.js
node testPhase6To12Suite.js
```

## Frontend Build Verification
```bash
cd client
npm run build
```
Result: Builds cleanly with 0 compilation or bundling errors.
