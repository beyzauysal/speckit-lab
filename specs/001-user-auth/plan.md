# Implementation Plan: User Authentication System

**Branch**: `001-user-auth` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-user-auth/spec.md`

## Summary

Build a comprehensive user authentication system supporting email/password registration, JWT-based login with 24-hour expiry, refresh token mechanism (30-day expiry), session management across multiple devices, password reset via email, account deletion with GDPR compliance, and brute force protection via temporary account lockout. 

**Technical Approach**: RESTful API backend using Express.js + TypeScript, PostgreSQL for persistence, bcrypt for password hashing, JWT for authentication tokens. Async email queue for resilient delivery. Test-first development with Jest (70% unit / 20% integration / 10% e2e to meet 80% coverage target on business logic).

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: Express.js, jsonwebtoken, bcrypt, pg (PostgreSQL driver)  
**Storage**: PostgreSQL (user accounts, tokens, sessions, deletion requests, audit logs, email queue)  
**Testing**: Jest with ts-jest, supertest for API testing  
**Target Platform**: Linux/cloud server (containerizable API)  
**Project Type**: Web service (RESTful API backend)  
**Performance Goals**: <500ms login endpoint p95, 1000+ concurrent authenticated users, <5min email delivery (99% within 24h)  
**Constraints**: HTTPS/TLS enforced, password hashing mandatory (bcrypt min cost 10), token expiry strict (24h JWT, 30d refresh), account lockout deterministic (5 attempts = 15min lock)  
**Scale/Scope**: Single authentication service, ~34 FR, ~19 SC, 9 data entities, 4 user stories (P1: registration + login, P2: session + password reset)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Principles Applied**:

| Principle | Check | Status |
|-----------|-------|--------|
| **I. Clean Code** | All services <50 lines; SRP applied; comprehensive error handling | ✅ PASS |
| **II. TypeScript Strict** | All code TypeScript; `strict: true`; no `any` types; type exports on boundaries | ✅ PASS |
| **III. Testing Pyramid 80%** | 70% unit (bcrypt, JWT, validation), 20% integration (endpoints, DB), 10% e2e (auth flows) | ✅ PASS |
| **IV. JSDoc Mandatory** | All exported functions/types have JSDoc; @param/@returns/@throws tags; README at service root | ✅ PASS |

**Pre-Design Compliance**: ✅ No violations. Technical stack (Express.js + TS + Jest + PostgreSQL) is compatible with all 4 principles.

**Re-check Post-Design**: Required before Phase 1 completion (see Phase 1 gate below).

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md              # This file (implementation plan)
├── spec.md              # Feature specification (34 FR, 19 SC)
├── research.md          # Phase 0: Technology & pattern research
├── data-model.md        # Phase 1: Entity definitions & schema
├── quickstart.md        # Phase 1: API reference & setup guide
├── contracts/           # Phase 1: API endpoint contracts
│   ├── auth-contract.md
│   ├── session-contract.md
│   ├── password-reset-contract.md
│   └── account-deletion-contract.md
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
src/
├── index.ts                  # Express app entry point
├── config/
│   ├── database.ts          # PostgreSQL connection
│   ├── jwt.ts               # JWT configuration
│   └── bcrypt.ts            # bcrypt configuration
├── models/
│   ├── User.ts              # User entity & validation
│   ├── AuthToken.ts         # JWT token entity
│   ├── RefreshToken.ts      # Refresh token entity
│   ├── SessionMetadata.ts   # Session tracking
│   ├── LoginAttempt.ts      # Brute force tracking
│   ├── QueuedEmail.ts       # Email queue entity
│   ├── DeletionRequest.ts   # Account deletion tracking
│   ├── AuditLog.ts          # Security audit log
│   └── PasswordReset.ts     # Password reset requests
├── services/
│   ├── AuthService.ts       # Registration, login, JWT issuance
│   ├── TokenService.ts      # Token validation, refresh, revocation
│   ├── SessionService.ts    # Multi-device session management
│   ├── PasswordService.ts   # Password hashing, reset, validation
│   ├── BruteForceService.ts # Account lockout logic
│   ├── EmailService.ts      # Email queue & async delivery
│   ├── AuditService.ts      # Security logging
│   └── DeletionService.ts   # Account deletion & data purge
├── middleware/
│   ├── auth.ts              # JWT verification middleware
│   ├── rateLimiter.ts       # API rate limiting
│   └── errorHandler.ts      # Error response normalization
├── routes/
│   ├── auth.routes.ts       # POST /register, /login, /logout
│   ├── token.routes.ts      # POST /refresh, DELETE /tokens/:id
│   ├── sessions.routes.ts   # GET /sessions, DELETE /sessions/:id
│   ├── password.routes.ts   # POST /password-reset, PUT /password-reset/:token
│   └── account.routes.ts    # DELETE /account, POST /account/delete/cancel
└── utils/
    ├── validators.ts        # Email, password, token validation
    ├── errors.ts            # Custom error classes
    └── logger.ts            # Structured logging

tests/
├── unit/                    # 70% of tests - fast, isolated
│   ├── services/
│   │   ├── AuthService.test.ts
│   │   ├── TokenService.test.ts
│   │   ├── PasswordService.test.ts
│   │   ├── BruteForceService.test.ts
│   │   ├── EmailService.test.ts
│   │   └── DeletionService.test.ts
│   ├── models/
│   │   ├── User.test.ts
│   │   └── AuthToken.test.ts
│   └── utils/
│       └── validators.test.ts
├── integration/             # 20% of tests - database + service interaction
│   ├── auth.integration.test.ts
│   ├── session.integration.test.ts
│   ├── email-queue.integration.test.ts
│   └── deletion.integration.test.ts
└── e2e/                     # 10% of tests - complete user journeys
    ├── registration-flow.test.ts
    ├── login-flow.test.ts
    ├── password-reset-flow.test.ts
    └── multi-device-session.test.ts

docker/
├── Dockerfile              # Containerize auth service
└── docker-compose.test.yml # PostgreSQL + auth service for testing

.env.example               # Environment variables template
tsconfig.json             # TypeScript strict mode enabled
jest.config.js            # Jest test configuration with coverage
```

**Structure Decision**: Single Express.js service (not microservices) - Authentication is a foundational service that benefits from tight integration. Monolithic approach simplifies token validation, session management, and audit trails. Easy to split into separate service later if scale demands.

## Complexity Tracking

| Design Decision | Why Needed | Simpler Alternative Rejected Because |
|-----------------|-----------|-------------------------------------|
| Separate refresh token | 30-day token needed for session continuity | Single JWT (24h max) forces users to re-enter passwords daily after 24h inactivity |
| SessionMetadata entity | Track device/IP for security audit + fraud detection | Requires per-token data which inflates JWT size and leaks PII |
| Async email queue | Email service may be unavailable; users shouldn't be blocked on delivery | Synchronous email causes registration/reset to fail during email outages; poor UX |
| Per-user account lockout | Prevent brute force without blocking service | Per-IP lockout allows distributed attacks via multiple IPs; per-user addresses the threat |
| 30-day grace period | Comply with GDPR "right to be forgotten" + reduce accidental deletions | Immediate deletion violates regulations and causes data loss for regret clicks |

---

## Phase 0: Research & Technology Decisions

**Status**: Ready to execute  
**Inputs**: Technical context (TypeScript, Express, PostgreSQL, bcrypt, JWT, Jest)  
**Output**: research.md with resolved decisions

### Research Tasks

1. **Database Design**: PostgreSQL schema optimization for authentication (user table indexes, token lookup speed)
2. **Password Hashing**: bcrypt cost factor trade-offs (security vs. performance; minimum cost 10)
3. **JWT Best Practices**: Token signing algorithms (HS256 vs RS256), secret management, clock skew handling
4. **Refresh Token Flow**: Database vs. JWT-based tracking; secure storage in cookies vs. localStorage
5. **Email Queue Pattern**: Job queue libraries (Bull, BullMQ, Agenda) vs. custom queue + worker
6. **Brute Force**: Account lockout duration (15min) vs. exponential backoff; database overhead per attempt
7. **Session Tracking**: Storing session metadata (device, IP) for audit trails; PII concerns
8. **Testing Strategy**: Mocking database, email service, JWT signing in unit tests
9. **Audit Logging**: Structured logging approach; what to log; log retention (2 years)
10. **Data Deletion**: Anonymization strategy; referential integrity when user_id is deleted

### Research Deliverable

Will be documented in **research.md** with:
- Decision rationale for each technology choice
- Trade-offs considered (performance vs. security vs. simplicity)
- Links to best practices documentation
- Implementation risks and mitigations

---

## Phase 1: Design & Contracts

**Status**: Ready to execute after Phase 0  
**Prerequisites**: research.md completed  
**Outputs**: data-model.md, contracts/, quickstart.md

### Phase 1a: Data Model Design

**Deliverable**: data-model.md

Will document:
1. **User Entity**
   - Fields: user_id (PK), email (unique), password_hash, created_at, updated_at, is_active, failed_login_attempts, account_locked_until
   - Validation: email format (RFC 5322), password strength
   - Indexes: email (unique), account_locked_until (for cleanup queries)

2. **AuthToken (JWT) Entity**
   - Fields: token_id (PK), user_id (FK), token_hash, expires_at, issued_at, revoked_at
   - Use: Track issued tokens; revoke on logout/password reset

3. **RefreshToken Entity**
   - Fields: refresh_token_id (PK), user_id (FK), token_hash, expires_at, issued_at, revoked_at, last_used_at
   - Use: 30-day tokens for session continuation

4. **SessionMetadata Entity**
   - Fields: session_id (PK), user_id (FK), device_name, device_type, ip_address, last_activity_at, created_at
   - Use: Track concurrent sessions; enable per-device logout

5. **LoginAttempt Entity**
   - Fields: attempt_id (PK), user_id (FK), attempt_timestamp, success, ip_address, user_agent
   - Use: Brute force detection (5 failed = 15min lockout)

6. **QueuedEmail Entity**
   - Fields: email_id (PK), recipient_email, email_type, template_data (JSON), retry_count, last_attempt_at, next_retry_at, status
   - Use: Async email delivery; retry on failure

7. **DeletionRequest Entity**
   - Fields: deletion_id (PK), user_id (FK), request_timestamp, grace_period_ends_at, executed_at, cancelled_at
   - Use: 30-day grace period for account deletion

8. **AuditLog Entity**
   - Fields: log_id (PK), user_id (nullable after deletion), event_type, event_timestamp, ip_address, user_agent, details (JSON, no PII), retention_until
   - Use: Security audit trail; anonymized after account deletion

9. **PasswordReset Entity**
   - Fields: reset_id (PK), user_id (FK), token_hash, expires_at, used_at
   - Use: One-time password reset links (1-hour expiry)

### Phase 1b: API Contracts

**Deliverable**: contracts/ directory with endpoint specifications

Will document:

1. **auth-contract.md**: Registration + Login endpoints
   - POST /register
   - POST /login
   - POST /logout

2. **token-contract.md**: Token refresh + revocation
   - POST /refresh
   - DELETE /tokens/:id
   - GET /tokens (list active)

3. **session-contract.md**: Multi-device session management
   - GET /sessions
   - DELETE /sessions/:id
   - DELETE /sessions (logout all)

4. **password-contract.md**: Password reset flow
   - POST /password-reset (initiate)
   - PUT /password-reset/:token (complete reset)
   - POST /password (change password when logged in)

5. **account-contract.md**: Account deletion
   - DELETE /account (request deletion)
   - POST /account/delete/cancel (cancel pending deletion)
   - GET /account/delete/status (check deletion status)

Each contract specifies:
- Request/response schemas (TypeScript interfaces)
- Error codes + messages
- Rate limiting rules
- Authentication requirements
- Example curl commands

### Phase 1c: Quickstart Guide

**Deliverable**: quickstart.md

Will include:
1. Prerequisites (Node 18+, PostgreSQL 12+)
2. Clone & install steps
3. Environment configuration (.env)
4. Database setup (psql commands + migrations)
5. Run tests (`npm test`)
6. Start dev server (`npm run dev`)
7. Example API calls (registration → login → refresh → logout)
8. Troubleshooting common issues

### Phase 1d: Constitution Re-Check (GATE)

After Phase 1 design completion:
- ✅ All services under 50 lines? (Complex services split into smaller functions)
- ✅ All code TypeScript with strict mode?
- ✅ Test structure enables 80% coverage on business logic? (70/20/10 pyramid)
- ✅ All exports have JSDoc with @param/@returns?

**Gate Pass Criteria**: All yes → Proceed to Phase 2 tasks
**Gate Fail Criteria**: Any no → Refactor design before task generation

---

## Implementation Order (Phase 2 - Task Generation)

**Status**: Generated by `/speckit.tasks` command (NOT created by /speckit.plan)

Will produce tasks.md organized by:

1. **Phase 1: Foundation** (shared infrastructure)
   - Project setup (TypeScript, Jest, ESLint, Prettier)
   - PostgreSQL schema & migrations
   - Base models & validation layer
   - Error handling & logging

2. **Phase 2: Core Auth** (blocking prerequisites)
   - AuthService (register, login, JWT issuance)
   - TokenService (validation, refresh, revocation)
   - PasswordService (hashing, validation)
   - BruteForceService (attempt tracking, lockout)

3. **Phase 3: User Story 1** (P1 - Registration)
   - Tests first (acceptance scenarios)
   - POST /register endpoint
   - Email confirmation delivery

4. **Phase 4: User Story 2** (P1 - Login)
   - Tests first (acceptance scenarios)
   - POST /login endpoint
   - JWT + refresh token issuance
   - Session creation

5. **Phase 5: User Story 3** (P2 - Session Management)
   - Tests first
   - GET /sessions, DELETE /sessions/:id
   - Token expiry validation
   - Multi-device logout

6. **Phase 6: User Story 4** (P2 - Password Reset)
   - Tests first
   - POST /password-reset
   - Email queue + async delivery
   - PUT /password-reset/:token

7. **Phase 7: Advanced Features** (P2 ancillary)
   - Account lockout UI + unlock emails
   - Account deletion + 30-day grace
   - Refresh token endpoint
   - Session metadata tracking

8. **Phase 8: Testing & Security** (cross-cutting)
   - E2E test suite (full user journeys)
   - Load testing (1000 concurrent users)
   - Security audit (password policies, token expiry)
   - Coverage report (verify 80% on business logic)

---

## Next Steps

1. ✅ **Phase 0 (Research)**: Run research tasks to finalize technology decisions
2. **Phase 1 (Design)**: Generate data-model.md, contracts/, quickstart.md
3. **Constitution Re-Check**: Verify design against 4 core principles
4. **Phase 2 (Tasks)**: Run `/speckit.tasks` to generate actionable development tasks

---

**Status**: 🟢 Plan ready for Phase 0 research execution
