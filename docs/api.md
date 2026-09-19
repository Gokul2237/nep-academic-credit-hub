# API Specification Reference

## Base URLs
- Standard APIs: `http://localhost:5000/api`
- Versioned APIs: `http://localhost:5000/api/v1`

## Authentication APIs (`/api/auth`)
- `POST /register`: Register new student or institution user
- `POST /login`: Authenticate credentials and receive JWT bearer token
- `GET /me`: Retrieve authenticated user session details
- `GET /institutions`: Public listing of accredited institutions

## Course APIs (`/api/courses`)
- `GET /`: Query course catalog with filters
- `GET /:id`: Fetch course details
- `POST /`: Create course (Institution / Admin)
- `PUT /:id`: Update course (Owner Institution / Admin)

## Credit APIs (`/api/credits`)
- `GET /`: Query credit ledger
- `GET /wallet-summary`: Student digital credit wallet metrics
- `GET /timeline`: Student credit timeline grouped by academic year
- `POST /`: Award academic credit with SHA-256 seal (Institution / Admin)
- `POST /validate`: Smart pre-validation engine for credit payloads

## Transfer APIs (`/api/transfers`)
- `POST /`: Submit credit transfer request (Student)
- `GET /`: List transfer requests with role scoping
- `PUT /:id/review`: Review transfer request (Destination Institution / Admin)
- `PUT /:id/cancel`: Cancel pending transfer request (Student)

## Certificate APIs (`/api/certificates`)
- `GET /verify/:certificateId`: Public certificate verification (Unauthenticated)
- `GET /`: List certificates (Role-scoped)
- `POST /`: Issue certificate for verified credit (Institution / Admin)
- `PUT /:id/verify`: Review/approve certificate (Institution / Admin)
- `PUT /:id/revoke`: Revoke certificate with reason (Institution / Admin)

## Transcript APIs (`/api/transcripts`)
- `GET /verify/:verificationCode`: Public transcript verification (Unauthenticated)
- `POST /`: Generate snapshot transcript (Student / Institution / Admin)
- `GET /`: List transcript records
- `PUT /:id/revoke`: Revoke transcript (Institution / Admin)

## Eligibility & Recommendation APIs
- `GET /api/eligibility`: Evaluate student NEP degree benchmarks
- `GET /api/recommendations`: Generate prerequisite-aware course recommendations

## B2B API Gateway (`/api/gateway` & `/api/v1/gateway`)
- `POST /api/gateway/keys`: Generate SHA-256 hashed API Key (Returns raw secret once)
- `GET /api/gateway/keys`: List institution API keys
- `PUT /api/gateway/keys/:id/revoke`: Revoke API key
- `GET /api/gateway/logs`: B2B telemetry log stream
- `GET /api/v1/gateway/credits`: Read credits via API Key (`read:credits`)
- `POST /api/v1/gateway/credits`: Submit credit via API Key (`submit:credits`)
- `POST /api/v1/gateway/certificates/verify`: Verify certificate seal (`verify:certificates`)
- `GET /api/v1/gateway/students`: Read student roster (`read:students`)
