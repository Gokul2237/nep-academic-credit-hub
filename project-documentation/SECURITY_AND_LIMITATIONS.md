# SECURITY CONTROLS, VULNERABILITIES & SYSTEM LIMITATIONS

---

## 1. Verified Security Controls

The **NEP Aligned Standardized Academic Credit Accumulation Hub** incorporates defensive security mechanisms across presentation, application, and database layers.

### 1.1 Password Hashing & Handling
- **Implementation:** Implemented in `server/models/User.js` using `bcryptjs` with salt work factor 12.
- **Idempotency Guard:** The `userSchema.pre('save')` hook detects if `passwordHash` is already a valid bcrypt hash (`/^\$2[aby]\$\d{2}\$/`), preventing double-hashing on account updates.
- **Serialization Protection:** The `passwordHash` schema property is configured with `select: false`. Controllers must explicitly execute `.select('+passwordHash')` to compare credentials. Furthermore, `userSchema.methods.toJSON` strips `passwordHash` from outgoing JSON responses.

### 1.2 Ephemeral JWT Authentication
- **Implementation:** Managed by `server/utils/tokenHelper.js` and `server/middleware/authMiddleware.js`.
- **Payload Scoping:** Signs an HMAC-SHA256 token containing `id`, `email`, `role`, `studentId`, `institutionId`, and `institutionCode`.
- **Expiration Policy:** Tokens carry a 24-hour expiration window (`JWT_EXPIRES_IN || '24h'`).
- **Active State Validation:** The `authenticate` middleware verifies that the decoded user account exists in MongoDB and carries `isActive: true`. If an administrator deactivates an account, in-flight bearer tokens are rejected immediately with HTTP 403 Forbidden.

### 1.3 Role-Based Access Control (RBAC)
- **Implementation:** `server/middleware/roleMiddleware.js` (`authorize(...allowedRoles)`).
- **Strict Role Boundaries:**
  - `student`: Can view own credit wallet, submit transfer requests, simulate mobility, view recommendations, and generate transcripts. Blocked from administrative and institution routes.
  - `institution`: Can manage catalog courses, award credits, preview/confirm bulk Excel results, decide transfer requests, configure acceptance policies, and manage B2B API keys. Scoped strictly to their institution.
  - `admin`: Central regulatory authority with platform-wide visibility across all universities, students, credit ledgers, and audit logs.

### 1.4 Multi-Tenant Data Isolation & IDOR Prevention
- **Implementation:** `server/middleware/scopeMiddleware.js` and tenant checks across controllers (`courseController.js`, `studentRoutes.js`, `creditController.js`).
- **Institution Scoping:** When an institution user queries `/api/students`, the query is automatically constrained: `{ institutionId: req.user.institutionId }`. If an officer manually targets a URL parameter belonging to another university (e.g. `GET /api/students/:id`), the server validates ownership and rejects the request with HTTP 403 Forbidden.

### 1.5 B2B API Gateway Security
- **Implementation:** `server/middleware/gatewayMiddleware.js`, `server/models/APIKey.js`.
- **Cryptographic Key Generation:** Keys are generated using 24 cryptographically secure random bytes from Node.js `crypto.randomBytes(24)` with the prefix `nep_live_`.
- **Zero Raw Key Storage:** The plaintext key is presented to the university administrator **strictly once** upon generation. MongoDB stores only the hexadecimal SHA-256 hash (`keyHash`).
- **Scoped Permissions:** Keys are restricted by explicit scopes (`read:credits`, `submit:credits`, `verify:certificates`, `read:students`). Requests lacking the required scope are rejected with HTTP 403.
- **Live Telemetry & Auditing:** The gateway wraps Express `res.send` to capture response status, endpoint, method, execution latency in milliseconds, and client IP in the `APILog` collection.

### 1.6 Deterministic Tamper-Evident Data Seals
- **Implementation:** `server/utils/hashHelper.js`, `server/controllers/certificateController.js`, `server/controllers/transcriptController.js`.
- **Deterministic Cryptographic Hashing:** Computes SHA-256 hashes over concatenated immutable academic parameters. If an attacker directly alters a student's grade or credit points in the database, the stored seal fails verification in `getCreditById`, `verifyCertificate`, or `verifyTranscript`.

### 1.7 Rate Limiting & Denial-of-Service Defense
- **Implementation:** `express-rate-limit` in `server/server.js` and `server/middleware/rateLimitMiddleware.js`.
- **Authentication Protection:** Limits authentication attempts to 100 requests per 15-minute window (`authLimiter`).
- **Public Verification Limiter:** Restricts unauthenticated transcript and certificate verification endpoints to 150 requests per 15-minute window (`verificationLimiter`).

### 1.8 HTTP Security Headers & CORS
- **Helmet:** `app.use(helmet())` sets secure HTTP response headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`).
- **CORS Configuration:** `cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true })` restricts cross-origin resource sharing to the authorized client application.

### 1.9 Error Sanitization
- **Implementation:** `server/middleware/errorMiddleware.js`.
- **Traceback Suppression:** Database internal stack traces are suppressed in production. Known exceptions (`ValidationError`, duplicate key code `11000`, `CastError`, `JsonWebTokenError`) are normalized into clean, user-friendly JSON messages.

---

## 2. Identified Limitations & Architectural Risks

### 2.1 Stateless JWT Revocation (Absence of Token Blacklist)
- **Current Limitation:** JWTs are stateless and valid for 24 hours. If a user logs out on the client, the token is cleared from `localStorage`, but the token signature remains cryptographically valid until expiration.
- **Risk:** If a bearer token is intercepted before expiration, it could theoretically be replayed until the 24-hour TTL elapses.
- **Recommendation for Production:** Deploy a Redis in-memory cache to maintain a revoked token blacklist checked by `authMiddleware`.

### 2.2 Lack of Ephemeral Refresh Token Rotation
- **Current Limitation:** The system currently relies on a single 24-hour access token rather than short-lived access tokens (e.g., 15 minutes) combined with HTTP-only cookie refresh tokens.
- **Recommendation for Production:** Implement silent token refresh using HTTP-only, secure, `SameSite=Strict` cookies.

### 2.3 Centralized Gateway Hub vs. Fully Distributed Peer Nodes
- **Current Limitation:** While the system models multiple institutions with strict tenant isolation, all institutions currently operate within a unified, centralized database and Express server deployment acting as the national clearinghouse.
- **Risk:** Inter-university communication occurs within the centralized hub rather than via peer-to-peer webhooks or mTLS between physically separated university servers.
- **Recommendation for Production:** Implement outbound webhook dispatchers so that when University A approves a transfer, an asynchronous signed webhook notification is delivered to University B's external endpoint.

### 2.4 File Upload Storage Architecture
- **Current Limitation:** The bulk Excel ingestion engine parses spreadsheets in-memory using Multer memory buffers (`storage: multer.memoryStorage()`). While this prevents uncleaned temporary files from lingering on the server disk, certificate `documentUrl` and transcript `documentUrl` fields are currently stored as URL strings rather than binary storage in AWS S3 or MongoDB GridFS.
- **Recommendation for Production:** Integrate an S3-compatible object storage service (e.g., MinIO or AWS S3) for long-term storage of uploaded syllabus PDFs and signed institution certificates.

### 2.5 Multi-Factor Authentication (MFA)
- **Current Limitation:** Institutional academic officers and superadministrators authenticate using email and password without time-based one-time passwords (TOTP).
- **Recommendation for Production:** Implement TOTP-based 2FA (e.g., Google Authenticator) for institutional officers before they can approve credit transfers or issue certificates.
