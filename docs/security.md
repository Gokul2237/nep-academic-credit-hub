# Security Architecture & Compliance

## Security Measures
1. **Password Hashing**: User passwords hashed using `bcryptjs` (salt work factor 10+).
2. **Authentication**: JWT bearer token authentication with expiration and role payload verification.
3. **Tenant Isolation**: Institution data is strictly scoped. Institutions can only view or modify records belonging to their institution.
4. **B2B API Key Security**:
   - Secrets are generated with 24 cryptographically secure random bytes (`nep_live_...`).
   - Only SHA-256 hashes are stored in the database.
   - Secrets are displayed ONLY ONCE to the user at creation time.
5. **SHA-256 Data Seals**:
   - All academic credits and certificates carry a deterministic SHA-256 integrity seal calculated over key fields.
6. **Input & ObjectId Validation**:
   - All incoming route parameters are validated to prevent MongoDB CastErrors or injection attempts.
7. **Production Error Normalization**:
   - Internal database exception tracebacks are never exposed to end-users. All errors are caught and sanitized via standard `ApiResponse.error`.
