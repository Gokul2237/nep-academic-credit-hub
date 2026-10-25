# VERIFIED WORKFLOW & ARCHITECTURAL DIAGRAMS

This document contains all production-verified architectural diagrams and workflow specifications for the **NEP Aligned Standardized Academic Credit Accumulation Hub with Cross-Institutional Authentication API Gateways**.

All diagrams have been verified directly against the underlying codebase (`server/controllers`, `server/models`, `server/middleware`, and `client/src`) and rendered in both **Lossless Vector SVG** and **Ultra High-Resolution PNG** formats.

Interactive gallery and batch downloader: [`project-documentation/diagrams/index.html`](./diagrams/index.html)

---

## 1. Verified Transfer Lifecycle Diagram

> **Placeholder:** *Insert the verified transfer lifecycle diagram here*

### Diagram Description
Documents the multi-tenant state and sequence lifecycle of inter-university academic credit transfers:
1. **Pre-Submission Invariant Check (`POST /api/transfers`)**: Confirms student ownership, verifies credit status is `verified`, checks credits have not already been transferred (`isTransferred === false`), verifies destination university accreditation and active status (`verificationStatus === 'VERIFIED'`), and ensures destination differs from source.
2. **Queueing & State Machine**: Transitions to `PENDING` state and appears in the student's outgoing queue and the destination institution's review queue (`GET /api/transfers?type=incoming`).
3. **Institutional Evaluation (`PUT /api/transfers/:id/review`)**: Destination Academic Officer evaluates curriculum equivalency, course weights, and institutional credit policy rules.
4. **Final Decision & Atomic Persistence**: Status transitions to `APPROVED`, `CONDITIONAL_APPROVAL`, or `REJECTED`. On approval, the database atomically updates `AcademicCredit` records (`isTransferred = true`, `transferredTo = destId`, `transferredAt = ISODate()`) and records an immutable `AuditLog` entry.
5. **Student Cancellation**: Student can cancel anytime while status remains `PENDING` (`PUT /api/transfers/:id/cancel`).

### Downloadable Picture Links
- **High-Resolution PNG:** [1_transfer_lifecycle.png](./diagrams/1_transfer_lifecycle.png)
- **Lossless Vector SVG:** [1_transfer_lifecycle.svg](./diagrams/1_transfer_lifecycle.svg)

### Embedded Diagram
![Verified Transfer Lifecycle Diagram](./diagrams/1_transfer_lifecycle.png)

```mermaid
flowchart TD
    Start(["Student Initiates Credit Transfer Request"]) --> SelectCredits["Student Selects Earned Academic Credits & Target Destination University"]
    
    subgraph PreSubmission_Validation ["Pre-Submission & Boundary Verification (POST /api/transfers)"]
        SelectCredits --> ValOwnership{"Does student own all selected credits?"}
        ValOwnership -->|"No"| FailOwn["Reject: Unauthorized Credit Access"]
        ValOwnership -->|"Yes"| ValVerified{"Are all credits marked 'verified'?"}
        ValVerified -->|"No"| FailStatus["Reject: Only verified credits can be transferred"]
        ValVerified -->|"Yes"| ValTransferred{"Has any credit already been transferred?"}
        ValTransferred -->|"Yes"| FailTransferred["Reject 409: Credit already transferred to another university"]
        ValTransferred -->|"No"| ValDestInst{"Destination Institution Exists, Verified & Active?"}
        ValDestInst -->|"No"| FailInst["Reject: Destination university not recognized"]
        ValDestInst -->|"Yes"| ValDistinct{"Destination != Student Home Institution?"}
        ValDistinct -->|"No"| FailSame["Reject: Cannot transfer to same institution"]
        ValDistinct -->|"Yes"| CreateTransfer["Create TransferRequest in MongoDB<br>(Status: PENDING, TotalCredits, Reason, PolicyVersion: 1.0)"]
    end

    FailOwn --> ErrorResp["Return 400 / 403 / 409 Validation Error"]
    FailStatus --> ErrorResp
    FailTransferred --> ErrorResp
    FailInst --> ErrorResp
    FailSame --> ErrorResp
    ErrorResp --> Abort(["Request Aborted"])

    CreateTransfer --> StatusPending{"Transfer State: PENDING"}
    
    StatusPending -->|"Student Cancels (PUT .../cancel)"| StateCancelled["Status: CANCELLED<br>(Transfer terminated, credits remain at source)"]
    StateCancelled --> CancelledEnd(["Transfer Terminated"])

    StatusPending -->|"Appears in Destination Queue (GET ...?type=incoming)"| QueueReview["Destination University Academic Officer Reviews Request"]
    
    subgraph Evaluation_Stage ["Destination University Academic Evaluation (PUT /api/transfers/:id/review)"]
        QueueReview --> ReviewEquivalence["Evaluate Course Curriculum, Syllabus Equivalency & Credit Weights"]
        ReviewEquivalence --> CheckPolicy["Evaluate Against Active Credit Acceptance Policy (Min Grade, Max Limit)"]
        CheckPolicy --> DecisionBranch{"Academic Officer Decision"}
        
        DecisionBranch -->|"Reject"| StateRejected["Status: REJECTED<br>Store Rejection Reason & Officer ID"]
        DecisionBranch -->|"Conditional Approval"| StateCond["Status: CONDITIONAL_APPROVAL<br>Bridge courses or prerequisites required"]
        DecisionBranch -->|"Approve"| StateApproved["Status: APPROVED<br>Officer ID, Remarks, Timestamp Recorded"]
    end

    StateRejected --> LogRejectAudit["Record Immutable AuditLog (TRANSFER_REJECTED)"]
    LogRejectAudit --> RejectedEnd(["Transfer Request Closed as Rejected"])

    StateCond --> StateApproved

    subgraph Atomic_Commit ["Atomic Database Mutations & Credit Mobility Synchronization"]
        StateApproved --> UpdateCredits["Update AcademicCredit Documents:<br>• isTransferred = true<br>• transferredTo = DestinationInstitutionId<br>• transferredAt = ISODate()"]
        UpdateCredits --> WriteAudit["Record Immutable AuditLog Entry (TRANSFER_APPROVED)"]
        WriteAudit --> SyncPassport["Real-Time Student Credit Sync:<br>• Digital Credit Wallet reflects updated mobility<br>• Verifiable Transcript reflects new university ownership"]
    end

    SyncPassport --> FinalCompleted(["Lifecycle Completed: Credits Successfully Transferred"])
```

---

## 2. Verified Spreadsheet Import Workflow

> **Placeholder:** *Insert the verified spreadsheet import workflow here*

### Diagram Description
Documents the two-phase examination ingestion pipeline (`server/controllers/resultImportController.js`):
1. **Template Generation (`GET /api/institution/results/template`)**: Dynamically compiles an institution-customized `.xlsx` template populated with valid student ABC IDs and active course codes.
2. **Phase 1: In-Memory Staging & Validation (`POST /api/institution/results/preview`)**: Uploaded files are buffered in RAM with `multer.memoryStorage()`, parsed with SheetJS (`xlsx.read`), and validated via O(1) in-memory maps against MongoDB:
   - Validates student ABC ID existence and verifies student belongs to the uploading university (flagging cross-institution tampering).
   - Validates course code cataloging within active curriculum.
   - Detects in-file duplicates and identifies credits already awarded in database.
   - Creates a staged `ResultImportBatch` document (`status: 'PREVIEW'`) with aggregate telemetry.
3. **Officer Review**: Frontend renders an interactive preview modal showing valid rows, duplicates, and errors.
4. **Phase 2: Authoritative Confirmation (`POST /api/institution/results/confirm`)**: 
   - Batch locks to `CONFIRMED`.
   - Creates authoritative `SemesterResult` documents.
   - Passing grades (`O, A+, A, B+, B, C, P`) trigger the deterministic SHA-256 seal engine and generate `AcademicCredit` records.
   - Triggers the **Semester Progression Algorithm**: If student passed all registered courses for their current semester, standing advances ($N \rightarrow N+1$); otherwise, the student retains current semester with backlogs.
   - Writes immutable `AuditLog` entry.

### Downloadable Picture Links
- **High-Resolution PNG:** [2_spreadsheet_import.png](./diagrams/2_spreadsheet_import.png)
- **Lossless Vector SVG:** [2_spreadsheet_import.svg](./diagrams/2_spreadsheet_import.svg)

### Embedded Diagram
![Verified Spreadsheet Import Workflow](./diagrams/2_spreadsheet_import.png)

```mermaid
flowchart TD
    Start(["Academic Officer Enters Results Import Hub"]) --> DownloadTemplate["Download Standardized Excel Template<br>(GET /api/institution/results/template)"]
    DownloadTemplate --> FillSpreadsheet["Populate Spreadsheet with Student ABC IDs, Course Codes, Marks & Grades"]
    FillSpreadsheet --> UploadExcel["Upload .xlsx File with Semester & Academic Year<br>(POST /api/institution/results/preview)"]

    subgraph Phase1_Staging ["Phase 1: In-Memory Parsing & Multi-Point Staging Validation"]
        UploadExcel --> MulterMem["Multer In-Memory Buffer (Zero Disk Residue / High Security)"]
        MulterMem --> SheetJS["Parse Rows via SheetJS xlsx.read()"]
        SheetJS --> BatchLimit{"Row Count <= 2,000?"}
        BatchLimit -->|"Exceeded"| LimitErr["Return 400: Batch exceeds 2,000 row maximum"]
        
        BatchLimit -->|"Valid"| LoadDB["Pre-load Institutional Catalog & Enrolled Students into Memory Maps"]
        LoadDB --> RowLoop["Iterate Spreadsheet Rows (O(1) Map Checks)"]
        
        RowLoop --> CheckAbcId{"Student ABC ID Exists & Enrolled in Institution?"}
        CheckAbcId -->|"Not Found / Cross-Inst"| ErrStudent["Flag Row: Invalid Student ABC ID"]
        
        CheckAbcId -->|"Verified"| CheckCourseCode{"Course Code Cataloged in Curriculum?"}
        CheckCourseCode -->|"Not Found"| ErrCourse["Flag Row: Course Code Not in Catalog"]
        
        CheckCourseCode -->|"Verified"| CheckInFileDup{"Duplicate Student + Course in Uploaded File?"}
        CheckInFileDup -->|"Duplicate Found"| WarnFileDup["Flag Warning: Duplicate Record in Sheet"]
        
        CheckInFileDup -->|"Unique"| CheckDbDup{"Credit Already Earned in Database?"}
        CheckDbDup -->|"Already Awarded"| WarnDbDup["Flag Warning: Student already awarded credit for course"]
        
        CheckDbDup -->|"Unique"| MarkValidRow["Mark Row as Valid for Import"]
        
        ErrStudent --> CompileStats
        ErrCourse --> CompileStats
        WarnFileDup --> CompileStats
        WarnDbDup --> CompileStats
        MarkValidRow --> CompileStats["Aggregate Statistics: Total, Valid, Ineligible & Duplicate Counts"]
        
        CompileStats --> SaveBatch["Create ResultImportBatch Document (Status: PREVIEW) in MongoDB"]
    end

    SaveBatch --> ReturnPreview["Frontend Renders Interactive Validation Preview Modal"]
    ReturnPreview --> OfficerAction{"Officer Confirms Batch?"}
    
    OfficerAction -->|"Cancel / Fix Errors"| AbortBatch["Discard Batch & Rectify Excel File"]
    AbortBatch --> AbortedEnd(["Import Staging Aborted"])

    subgraph Phase2_Execution ["Phase 2: Authoritative Commit & Progression Engine (POST .../confirm)"]
        OfficerAction -->|"Confirm Import"| LockBatch["Set ResultImportBatch Status: CONFIRMED"]
        LockBatch --> LoopValid["Process Each Valid Item in Batch"]
        
        LoopValid --> CreateSemResult["Create Authoritative SemesterResult Document:<br>studentId, courseId, marks, grade, status (PASS/FAIL)"]
        CreateSemResult --> GradeCheck{"Is Passing Grade?<br>(O, A+, A, B+, B, C, P)"}
        
        GradeCheck -->|"Fail (F Grade)"| ZeroCred["Credits Earned = 0<br>(Result recorded, no credit awarded)"]
        ZeroCred --> NextItem["Proceed to Next Row"]
        
        GradeCheck -->|"Pass"| GenHash["Execute Deterministic SHA-256 Engine:<br>generateCreditHash(studentId, courseId, instId, credits, grade, sem, year)"]
        GenHash --> CreateCredit["Create AcademicCredit Record:<br>verificationStatus = 'verified', integrityHash = sha256"]
        CreateCredit --> LinkRecord["Link creditId back into SemesterResult document"]
        LinkRecord --> NextItem
        
        NextItem --> AllRowsDone{"All Valid Rows Processed?"}
        AllRowsDone -->|"No"| LoopValid
        AllRowsDone -->|"Yes"| EvaluateProgression["Trigger Semester Progression Engine"]
        
        EvaluateProgression --> CheckAllPassed{"Did student pass ALL registered semester courses?"}
        CheckAllPassed -->|"Yes and currentSem == batchSem"| AdvanceSem["Advance Academic Standing:<br>currentSemester = currentSemester + 1"]
        CheckAllPassed -->|"Failed courses present"| RetainSem["Retain currentSemester<br>(Backlog / Supplementary standing)"]
        
        AdvanceSem --> WriteAuditLog["Record Immutable System AuditLog Entry"]
        RetainSem --> WriteAuditLog
    end

    WriteAuditLog --> CompleteSuccess(["Results Imported & Credits Awarded Successfully (200 OK)"])
```

---

## 3. Verified Credit Validation Workflow

> **Placeholder:** *Insert the verified credit validation workflow here*

### Diagram Description
Documents the 8-rule automated pre-validation engine (`server/controllers/validationController.js`, `POST /api/credits/validate`):
1. **Rule 1: Student Verification**: Confirms MongoDB `ObjectId` format, verifies user exists, and enforces `role === 'student'`.
2. **Rule 2: Institution Authorization**: Verifies institution exists, has accreditation status `VERIFIED`, and `isActive === true`.
3. **Rule 3: Course Catalog Verification**: Checks that course exists in the institution's active catalog.
4. **Rule 4: Credit Value Bounds**: Enforces integer bounds $1 \le \text{credits} \le 30$.
5. **Rule 5: Grade Schema Validation**: Checks grade letter against standard NEP grading scale `['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'S']`.
6. **Rule 6: Academic Period Validation**: Validates $1 \le \text{semester} \le 12$ and validates non-empty academic year string.
7. **Rule 7: Duplicate Ledger Check**: Queries `AcademicCredit.findOne({ studentId, courseId, semester, academicYear })` to guarantee idempotent ledger integrity and prevent double accumulation.
8. **Rule 8: Cryptographic Pre-Seal Engine**: Computes and returns the anticipated deterministic SHA-256 integrity seal before database write:
   $$\text{Seal} = \text{SHA256}(\text{studentId} \parallel \text{courseId} \parallel \text{instId} \parallel \text{credits} \parallel \text{grade} \parallel \text{sem} \parallel \text{year} \parallel \text{PEPPER})$$

### Downloadable Picture Links
- **High-Resolution PNG:** [3_credit_validation.png](./diagrams/3_credit_validation.png)
- **Lossless Vector SVG:** [3_credit_validation.svg](./diagrams/3_credit_validation.svg)

### Embedded Diagram
![Verified Credit Validation Workflow](./diagrams/3_credit_validation.png)

```mermaid
flowchart TD
    Start(["Incoming Credit Payload (POST /api/credits/validate)"]) --> InitPayload["Extract: studentId, courseId, institutionId, credits, grade, semester, academicYear"]
    InitPayload --> InitChecklist["Initialize 8-Step Automated Integrity Suite"]

    subgraph Validation_Rules ["Sequential 8-Step Automated Integrity Verification Suite"]
        InitChecklist --> R1{"Rule 1: Student Verification"}
        R1 -->|"Valid ObjectId & role == 'student'"| P1["Pass: Student verified in system directory"] --> R2{"Rule 2: Institution Authorization"}
        R1 -->|"Invalid ID or role != 'student'"| F1["Fail: Student record not found or invalid"]
        
        R2 -->|"Exists, Accredited & Active"| P2["Pass: Issuing university accredited & active"] --> R3{"Rule 3: Course Catalog Verification"}
        R2 -->|"Not found or inactive"| F2["Fail: Issuing institution is not authorized"]
        
        R3 -->|"Course in active catalog"| P3["Pass: Course verified in institution catalog"] --> R4{"Rule 4: Credit Value Bounds"}
        R3 -->|"Course missing or inactive"| F3["Fail: Selected course not found in catalog"]
        
        R4 -->|"1 <= credits <= 30"| P4["Pass: Credit value within legal academic bounds"] --> R5{"Rule 5: Grade Schema Validation"}
        R4 -->|"credits < 1 or credits > 30"| F4["Fail: Credit amount out of bounds (1 - 30)"]
        
        R5 -->|"Grade in [O, A+, A, B+, B, C, P, F, S]"| P5["Pass: Grade conforms to standard NEP grading scale"] --> R6{"Rule 6: Academic Period Validation"}
        R5 -->|"Unrecognized grade letter"| F5["Fail: Grade code is invalid"]
        
        R6 -->|"1 <= semester <= 12 & valid year"| P6["Pass: Semester & academic year correctly formatted"] --> R7{"Rule 7: Duplicate Ledger Check"}
        R6 -->|"semester out of range or empty year"| F6["Fail: Academic period format invalid"]
        
        R7 -->|"No duplicate found in AcademicCredits"| P7["Pass: No duplicate credit in student record"] --> R8["Rule 8: Cryptographic Pre-Seal Engine"]
        R7 -->|"Existing record matches compound key"| F7["Fail: Duplicate credit record detected"]
        
        R8 --> ComputeHash["Compute Deterministic SHA-256 Hash:<br>crypto.createHash('sha256')<br>.update(studentId + ':' + courseId + ':' + instId + ':' + credits + ':' + grade + ':' + sem + ':' + year)<br>.digest('hex')"]
    end

    F1 --> AggregateFailure["Aggregate Failure Reasons & Return Check Results (isValid: false)"]
    F2 --> AggregateFailure
    F3 --> AggregateFailure
    F4 --> AggregateFailure
    F5 --> AggregateFailure
    F6 --> AggregateFailure
    F7 --> AggregateFailure

    AggregateFailure --> Res400["Respond HTTP 400 Bad Request<br>{ success: false, isValid: false, checks: [...], failureReason: '...' }"]
    Res400 --> EndRejected(["Credit Validation Rejected (Database Write Blocked)"])

    ComputeHash --> Res200["Respond HTTP 200 OK<br>{ success: true, isValid: true, checks: [...8 Passed Checks...], anticipatedSeal: 'sha256...' }"]
    Res200 --> EndApproved(["Credit Payload Verified & Pre-Sealed (Safe for Ledger Commit)"])
```

---

## 4. Verified Login and Token Workflow Diagram

> **Placeholder:** *Insert the verified login and token workflow diagram here*

### Diagram Description
Documents user authentication and session security across the full stack (`server/controllers/authController.js`, `server/middleware/auth.js`, `server/middleware/rateLimiter.js`):
1. **Perimeter Rate Limiting**: Client `POST /api/auth/login` is inspected by `rateLimiter` (100 req / 15 min per IP); prevents credential brute-forcing.
2. **Bcrypt Verification**: `User.findOne({ email }).select('+passwordHash')` retrieves salted hash; `bcrypt.compare` executes with work factor 12.
3. **JWT Minting**: Signs ephemeral 24-hour token with HMAC-SHA256 payload `{ id, email, role, studentId, institutionId }`.
4. **Client-Side Interceptors**: React stores token in `localStorage` and injects `Authorization: Bearer <token>` into all Axios requests.
5. **Protected Route Verification**: `authMiddleware` verifies signature, checks 24-hour expiration, queries MongoDB for user validity, attaches user and tenant scope to `req.user`, and verifies role permissions via `authorize('student', 'institution', 'admin')`.

### Downloadable Picture Links
- **High-Resolution PNG:** [4_login_token_workflow.png](./diagrams/4_login_token_workflow.png)
- **Lossless Vector SVG:** [4_login_token_workflow.svg](./diagrams/4_login_token_workflow.svg)

### Embedded Diagram
![Verified Login & Token Workflow Diagram](./diagrams/4_login_token_workflow.png)

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser (React)
    participant RateLimiter as Rate Limit Middleware
    participant AuthRouter as Express /api/auth
    participant AuthCtrl as Auth Controller
    participant UserModel as Mongoose User Model
    participant Bcrypt as bcryptjs Library
    participant JWT as jsonwebtoken Library
    participant ProtectedCtrl as Credit Controller

    Note over User, JWT: Phase 1 - Authentication and Token Minting
    User->>RateLimiter: POST /api/auth/login with email and password
    RateLimiter->>RateLimiter: Check IP request count (Max 100 req / 15 min)
    alt Exceeded Rate Limit
        RateLimiter-->>User: 429 Too Many Requests
    else Allowed Quota
        RateLimiter->>AuthRouter: Forward login request
        AuthRouter->>AuthCtrl: login(req, res)
        AuthCtrl->>UserModel: User.findOne({email}).select('+passwordHash')
        alt User Not Found or Inactive
            UserModel-->>AuthCtrl: null or isActive is false
            AuthCtrl-->>User: 401 Unauthorized (Invalid credentials)
        else User Found
            UserModel-->>AuthCtrl: user document with salt & passwordHash
            AuthCtrl->>Bcrypt: bcrypt.compare(candidatePassword, storedHash)
            alt Password Mismatch
                Bcrypt-->>AuthCtrl: false
                AuthCtrl-->>User: 401 Unauthorized (Incorrect password)
            else Password Matches
                Bcrypt-->>AuthCtrl: true
                AuthCtrl->>JWT: sign({id, email, role, studentId, institutionId}, secret, 24h)
                JWT-->>AuthCtrl: signed Bearer Token
                AuthCtrl-->>User: 200 OK {token, userProfile}
            end
        end
    end

    Note over User, ProtectedCtrl: Phase 2 - Client Storage & Interceptor Setup
    User->>User: Store token in localStorage and React AuthContext
    User->>User: Set Axios Header: Authorization Bearer token

    Note over User, ProtectedCtrl: Phase 3 - Authenticated API Request & RBAC Verification
    User->>AuthRouter: GET /api/credits/wallet-summary (Bearer token)
    AuthRouter->>JWT: verify(token, secret)
    alt Invalid or Expired Token
        JWT-->>AuthRouter: Token Error
        AuthRouter-->>User: 401 Unauthorized (Invalid or expired token)
    else Token Verified
        JWT-->>AuthRouter: decodedPayload {id, role, studentId, instId}
        AuthRouter->>UserModel: User.findById(decoded.id)
        UserModel-->>AuthRouter: user document
        AuthRouter->>AuthRouter: Attach user and tenant scope to req.user
        AuthRouter->>AuthRouter: Check RBAC Role authorize('student')
        alt Insufficient Privileges
            AuthRouter-->>User: 403 Forbidden (Access Denied)
        else Role Authorized
            AuthRouter->>ProtectedCtrl: creditController.getWalletSummary(req, res)
            ProtectedCtrl-->>User: 200 OK with verified credits wallet summary
        end
    end
```

---

## 5. Verified System Architecture Diagram

> **Placeholder:** *Insert the verified system architecture diagram here*

### Diagram Description
Documents the complete 5-tier architecture of the platform:
1. **Presentation Layer (React 18.3 + Vite + Tailwind CSS)**: Four tailored web portals (Student, Institution, Superadmin, Public Verifier) with Axios interceptors.
2. **Security & Perimeter Layer**: Helmet headers, strict CORS, rate limiters, JWT bearer tokens, role authorization (RBAC), multi-tenant scoping, and B2B API Key verification (`X-API-Key: nep_live_...`).
3. **Application & Engine Layer (Express 4.19)**: 11 specialized controllers handling credit ledgers, transfer state machines, Excel result ingestion, SHA-256 seal computation, certificate issuance, and B2B API gateway routing.
4. **Data Persistence Tier (MongoDB 13 Collections)**: Enforced via Mongoose ODM models with compound indexing, unique constraints, and schema validations.
5. **External Integration Tier**: External university ERPs and public verifiers accessing verifiable endpoints.

### Downloadable Picture Links
- **High-Resolution PNG:** [5_system_architecture.png](./diagrams/5_system_architecture.png)
- **Lossless Vector SVG:** [5_system_architecture.svg](./diagrams/5_system_architecture.svg)

### Embedded Diagram
![Verified System Architecture Diagram](./diagrams/5_system_architecture.png)

```mermaid
flowchart TD
    subgraph Tier1 ["1. Client Presentation Tier (React 18.3 + Vite + Tailwind CSS)"]
        UI_Student["Student Portal<br>• Digital Credit Wallet<br>• Academic Passport<br>• Transfer Request Modal<br>• Pathway & Exit Tracker"]
        UI_Inst["Institution Hub<br>• Excel Results Import Hub<br>• Course Catalog Manager<br>• Policy Authoring & Versions<br>• Transfer Review Queue"]
        UI_Admin["Superadmin Portal<br>• National Telemetry KPIs<br>• University Accreditation<br>• Audit Trail Explorer<br>• Recharts Analytics"]
        UI_Public["Public Verification<br>• Certificate Verification<br>• Transcript QR Seal Check"]
        Axios["Axios HTTP Client with Bearer JWT & Error Interceptors"]

        UI_Student --> Axios
        UI_Inst --> Axios
        UI_Admin --> Axios
        UI_Public --> Axios
    end

    subgraph Tier2 ["2. Security, Perimeter & Middleware Tier"]
        Helmet["Helmet Security Headers<br>(XSS, Clickjacking, Sniff Guard)"]
        Cors["CORS Policy Guard<br>(Origin Isolation)"]
        RateLimit["Rate Limiting Middleware<br>(Auth: 100/15min, Public: 60/min)"]
        AuthMW["JWT Authentication Middleware<br>(Bearer Token HMAC-SHA256)"]
        RoleMW["RBAC Role Authorization<br>(student, institution, admin)"]
        ScopeMW["Tenant Scoping & IDOR Defense<br>(Cross-University Data Isolation)"]
        GateMW["B2B API Key Authenticator<br>(SHA-256 Key Hash & Scopes)"]
    end

    subgraph Tier3 ["3. Application Controllers & Logic Engines (Express 4.19)"]
        AuthCtrl["Auth Controller<br>(Registration, Login, Bcrypt)"]
        CreditCtrl["Credit Controller<br>(Wallet, Timeline, Ledger)"]
        CourseCtrl["Course Catalog Controller<br>(CRUD, Prerequisites)"]
        TransferCtrl["Transfer Controller<br>(Lifecycle, Queue, Approval)"]
        ResultCtrl["Excel Import & Progression Engine<br>(Multer, SheetJS, Auto-Advance)"]
        PolicyCtrl["Credit Policy Engine<br>(Rules & Historical Versioning)"]
        ValidateCtrl["Smart Credit Pre-Validation<br>(8-Step Integrity Suite)"]
        CertCtrl["Certificate & Transcript Engine<br>(Cryptographic Seal & Verification)"]
        GateCtrl["B2B API Gateway<br>(External REST & APILogs)"]
        AdminCtrl["Superadmin Controller<br>(Governance, Metrics, Audit Feed)"]
    end

    subgraph Tier4 ["4. Data Persistence Tier (MongoDB 13 Collections via Mongoose ODM)"]
        DB_Users[("Users<br>(Auth, Profiles, Roles)")]
        DB_Inst[("Institutions<br>(Accreditation, Codes)")]
        DB_Courses[("Courses<br>(Curriculum, Credits)")]
        DB_Credits[("AcademicCredits<br>(SHA-256 Seals, Verified)")]
        DB_Results[("SemesterResults<br>(Authoritative Ledger)")]
        DB_Batches[("ResultImportBatches<br>(Staging & Preview)")]
        DB_Transfers[("TransferRequests<br>(Cross-Uni Lifecycle)")]
        DB_Policies[("CreditPolicies<br>(Embedded Version History)")]
        DB_Certs[("Certificates & Transcripts<br>(Publicly Verifiable)")]
        DB_Audit[("AuditLogs & APILogs<br>(Immutable Compliance)")]
        DB_Keys[("APIKeys<br>(SHA-256 Hashed Secrets)")]
    end

    subgraph Tier5 ["5. External Integration & Consumers"]
        Ext_ERP["External University ERPs / SIS<br>(B2B API Key: nep_live_...)"]
        Ext_Verifier["Public Verifiers / Employers<br>(Open Unauthenticated Verification)"]
    end

    Axios --> Helmet
    Ext_ERP -->|"X-API-Key: nep_live_..."| GateMW
    Ext_Verifier -->|"Public Verification"| Helmet

    Helmet --> Cors --> RateLimit
    RateLimit --> AuthMW --> RoleMW --> ScopeMW

    ScopeMW --> AuthCtrl
    ScopeMW --> CreditCtrl
    ScopeMW --> CourseCtrl
    ScopeMW --> TransferCtrl
    ScopeMW --> ResultCtrl
    ScopeMW --> PolicyCtrl
    ScopeMW --> ValidateCtrl
    ScopeMW --> CertCtrl
    ScopeMW --> AdminCtrl
    GateMW --> GateCtrl

    AuthCtrl --> DB_Users
    AuthCtrl --> DB_Inst
    CourseCtrl --> DB_Courses
    CreditCtrl --> DB_Credits
    ResultCtrl --> DB_Results & DB_Batches & DB_Credits
    TransferCtrl --> DB_Transfers & DB_Credits & DB_Audit
    PolicyCtrl --> DB_Policies
    ValidateCtrl --> DB_Credits & DB_Courses & DB_Inst
    CertCtrl --> DB_Certs
    GateCtrl --> DB_Keys & DB_Audit
    AdminCtrl --> DB_Users & DB_Inst & DB_Audit
```

---

## 6. Diagram Inventory & Download Manifest

| # | Workflow / Architecture Component | High-Res PNG File | Vector SVG File |
| :---: | :--- | :--- | :--- |
| **1** | Verified Transfer Lifecycle Diagram | [`1_transfer_lifecycle.png`](./diagrams/1_transfer_lifecycle.png) | [`1_transfer_lifecycle.svg`](./diagrams/1_transfer_lifecycle.svg) |
| **2** | Verified Spreadsheet Import Workflow | [`2_spreadsheet_import.png`](./diagrams/2_spreadsheet_import.png) | [`2_spreadsheet_import.svg`](./diagrams/2_spreadsheet_import.svg) |
| **3** | Verified Credit Validation Workflow | [`3_credit_validation.png`](./diagrams/3_credit_validation.png) | [`3_credit_validation.svg`](./diagrams/3_credit_validation.svg) |
| **4** | Verified Login and Token Workflow Diagram | [`4_login_token_workflow.png`](./diagrams/4_login_token_workflow.png) | [`4_login_token_workflow.svg`](./diagrams/4_login_token_workflow.svg) |
| **5** | Verified System Architecture Diagram | [`5_system_architecture.png`](./diagrams/5_system_architecture.png) | [`5_system_architecture.svg`](./diagrams/5_system_architecture.svg) |
| **UI** | Interactive All-in-One Diagram Viewer & Downloader | [`index.html`](./diagrams/index.html) | Open in browser to preview and download all files |
