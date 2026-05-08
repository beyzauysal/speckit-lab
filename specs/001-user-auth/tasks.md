# Tasks: User Authentication System

**Feature**: 001-user-auth  
**Status**: Phase 2 Task Generation Complete  
**Date**: 2026-05-08

**Input**: Design documents from `/specs/001-user-auth/`  
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ data-model.md, ✅ contracts/auth-endpoints.md, ✅ quickstart.md

---

## Overview

**4 User Stories | 9 Entities | 10 API Endpoints | 70/20/10 Test Pyramid**

### Task Organization

Tasks are organized by **phase** to enable parallel implementation:
- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (database, shared services, middleware)
- **Phase 3+**: User Stories (P1, P2) - can implement independently after Phase 2 completes
- **Final Phase**: Polish & advanced features

### Test-First Development

Tests are included for each user story following the Constitution's **Testing Pyramid (70% unit / 20% integration / 10% e2e)**. Write tests FIRST before implementation using Jest.

### Parallelization

Tasks marked with **[P]** can run in parallel (different files, no task dependencies). Group these to maximize parallel development velocity.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, tooling configuration

- [X] T001 Initialize TypeScript/Express.js project with `npm init -y` and install dependencies (express, typescript, ts-node, @types/express, @types/node) in root directory
- [X] T002 [P] Create project directories per implementation plan: `src/` (config, models, services, middleware, routes, utils), `tests/` (unit, integration, e2e), `migrations/`, `docker/` in root
- [X] T003 [P] Create `tsconfig.json` with strict mode enabled in root directory (strict: true, no implicit any, sourceMap enabled)
- [ ] T004 [P] Create `.env.example` file in root with all required environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, JWT_SECRET, REFRESH_SECRET, EMAIL_*, REDIS_URL, LOG_LEVEL)
- [ ] T005 [P] Create `jest.config.js` with ts-jest preset, test coverage threshold 80%, and supertest for API testing in root
- [ ] T006 [P] Create `.gitignore` file with node_modules, .env, .env.local, dist/, coverage/, *.log patterns
- [ ] T007 Create `package.json` scripts for build, dev, test:unit, test:integration, test:e2e, lint, type-check, and migrate in root
- [ ] T008 Initialize Git repository and create feature branch `001-user-auth` if not already created

**Checkpoint**: Project structure ready; all dependencies installed; TypeScript compilation works

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story implementation

**⚠️ CRITICAL**: No user story tasks can begin until Phase 2 is complete

### 2a: Database & Configuration

- [ ] T009 [P] Create PostgreSQL connection configuration in `src/config/database.ts` with connection pooling (pg library) and error handling
- [ ] T010 [P] Create JWT configuration in `src/config/jwt.ts` (sign/verify functions, HS256 algorithm, 24h expiry for JWT)
- [ ] T011 [P] Create bcrypt configuration in `src/config/bcrypt.ts` (hash/compare functions, cost factor 10 per OWASP)
- [ ] T012 [P] Create environment configuration loader in `src/config/env.ts` with validation for required variables
- [ ] T013 [P] Create `migrations/001_create_users_table.sql` with User entity schema (user_id, email, password_hash, created_at, updated_at, is_active, failed_login_attempts, account_locked_until) and UNIQUE (email) constraint
- [ ] T014 [P] Create `migrations/002_create_auth_tokens_table.sql` with AuthToken schema (token_id, user_id FK, token_hash, expires_at, issued_at, revoked_at) and composite index (user_id, expires_at)
- [ ] T015 [P] Create `migrations/003_create_refresh_tokens_table.sql` with RefreshToken schema (refresh_token_id, user_id FK, token_hash, expires_at, issued_at, revoked_at, last_used_at)
- [ ] T016 [P] Create `migrations/004_create_session_metadata_table.sql` with SessionMetadata schema (session_id, user_id FK, device_name, device_type, ip_address, last_activity_at, created_at)
- [ ] T017 [P] Create `migrations/005_create_login_attempts_table.sql` with LoginAttempt schema (attempt_id, user_id FK, attempt_timestamp, success, ip_address, user_agent)
- [ ] T018 [P] Create `migrations/006_create_queued_emails_table.sql` with QueuedEmail schema (email_id, recipient_email, email_type, template_data JSONB, retry_count, last_attempt_at, next_retry_at, status, expires_at)
- [ ] T019 [P] Create `migrations/007_create_deletion_requests_table.sql` with DeletionRequest schema (deletion_id, user_id FK, request_timestamp, grace_period_ends_at, executed_at, cancelled_at)
- [ ] T020 [P] Create `migrations/008_create_audit_logs_table.sql` with AuditLog schema (log_id, user_id FK nullable, event_type, event_timestamp, ip_address, user_agent, details JSON, retention_until)
- [ ] T021 [P] Create `migrations/009_create_password_resets_table.sql` with PasswordReset schema (reset_id, user_id FK, token_hash, expires_at, used_at, created_at)
- [ ] T022 Create migration runner script in `src/utils/migrate.ts` that executes SQL files sequentially

### 2b: Models & Base Entities

- [ ] T023 [P] Create User model in `src/models/User.ts` with email validation (RFC 5322), password strength validation, account lock checks, JSDoc documentation
- [ ] T024 [P] Create AuthToken model in `src/models/AuthToken.ts` with token expiry validation, revocation status checks, JSDoc documentation
- [ ] T025 [P] Create RefreshToken model in `src/models/RefreshToken.ts` with 30-day expiry, last_used_at tracking, JSDoc documentation
- [ ] T026 [P] Create SessionMetadata model in `src/models/SessionMetadata.ts` with device tracking, IP logging, JSDoc documentation
- [ ] T027 [P] Create LoginAttempt model in `src/models/LoginAttempt.ts` with attempt tracking and success flag, JSDoc documentation
- [ ] T028 [P] Create QueuedEmail model in `src/models/QueuedEmail.ts` with retry logic, email_type enum, template_data JSONB support, JSDoc documentation
- [ ] T029 [P] Create DeletionRequest model in `src/models/DeletionRequest.ts` with grace period tracking (30 days), JSDoc documentation
- [ ] T030 [P] Create AuditLog model in `src/models/AuditLog.ts` with PII-safe fields, event typing, anonymization support, JSDoc documentation
- [ ] T031 [P] Create PasswordReset model in `src/models/PasswordReset.ts` with 1-hour expiry, used_at tracking, JSDoc documentation

### 2c: Services & Business Logic

- [ ] T032 [P] Create TokenService in `src/services/TokenService.ts` with sign() (create JWT), verify() (validate JWT), refresh() (issue new JWT from refresh token), revoke() (mark token revoked) functions; <50 lines per function; JSDoc on all exports
- [ ] T033 [P] Create BruteForceService in `src/services/BruteForceService.ts` with recordFailedAttempt() (increment counter), isAccountLocked() (check if locked for 15min), unlockAccount() (reset counter), recordSuccessfulLogin() (reset counter after 1hr idle); <50 lines per function; JSDoc
- [ ] T034 [P] Create PasswordService in `src/services/PasswordService.ts` with hash() (bcrypt cost 10), compare() (verify), validate() (strength check: 8+ chars, mixed case, number, special char), checkReuse() (prevent reuse); <50 lines per function; JSDoc
- [ ] T035 [P] Create EmailService in `src/services/EmailService.ts` with queueEmail() (add to BullMQ), sendRegistrationConfirmation() (template), sendPasswordReset() (template with 1-hour link), sendAccountLocked() (template with unlock link), sendDeletionConfirmation() (template); <50 lines per function; JSDoc
- [ ] T036 [P] Create AuditService in `src/services/AuditService.ts` with logLoginSuccess() (event), logLoginFailure() (event), logRegistration() (event), logPasswordReset() (event), logAccountDeletion() (event), anonymizeUser() (remove PII from logs); <50 lines per function; JSDoc
- [ ] T037 [P] Create DeletionService in `src/services/DeletionService.ts` with initiateAccountDeletion() (schedule for 30d), cancelDeletion() (cancel within grace period), executeAccountDeletion() (delete PII, anonymize logs), scheduleGracePeriodReminders() (emails at day 7, 14, 25); <50 lines per function; JSDoc
- [ ] T038 Create AuthService in `src/services/AuthService.ts` with register() (validation, hash, create User, queue confirmation email), login() (validate credentials, issue JWT + refresh token, create session), logout() (revoke tokens, delete session); orchestrates other services; <50 lines per function; JSDoc

### 2d: Middleware & Infrastructure

- [ ] T039 [P] Create authentication middleware in `src/middleware/auth.ts` that validates JWT in Authorization header, attaches user_id to request.user, returns 401 if missing/expired/invalid; JSDoc
- [ ] T040 [P] Create error handling middleware in `src/middleware/errorHandler.ts` with standardized error response format (error code, message, status), logs errors via logger; JSDoc
- [ ] T041 [P] Create CORS middleware in `src/middleware/cors.ts` with proper headers (Access-Control-Allow-Origin, credentials, methods); JSDoc
- [ ] T042 [P] Create rate limiting middleware in `src/middleware/rateLimiter.ts` with per-endpoint thresholds (5 registrations/IP/hour, 10 login failures/user/hour); JSDoc
- [ ] T043 [P] Create request logging middleware in `src/middleware/requestLogger.ts` that logs method, path, status, duration; JSDoc
- [ ] T044 [P] Create Express app in `src/index.ts` that initializes database, starts Redis/BullMQ email worker, mounts all routes, error handler, listens on PORT from .env; <50 lines; JSDoc

### 2e: Utilities & Helpers

- [ ] T045 [P] Create validators utility in `src/utils/validators.ts` with validateEmail() (RFC 5322), validatePassword() (strength), validateJWT(), validateRefreshToken(); JSDoc
- [ ] T046 [P] Create error classes in `src/utils/errors.ts` with ValidationError, AuthenticationError, AccountLockedError, NotFoundError, DuplicateError; each with custom message + code; JSDoc
- [ ] T047 [P] Create logger utility in `src/utils/logger.ts` with debug(), info(), warn(), error() functions using structured logging (json format); JSDoc

**Checkpoint**: Database, models, services, middleware infrastructure complete. All Phase 2 deliverables compiled with no TypeScript errors. Foundation ready for user story implementation.

---

## Phase 3: User Story 1 - User Registration (Priority: P1) 🎯 MVP

**Goal**: Users can create accounts with email/password; system sends confirmation email and validates input

**Independent Test**: Attempt registration with valid email + strong password → account created, visible in database, confirmation email queued

### 3a: Unit Tests for User Story 1

> **Test-First**: Write these tests BEFORE implementation; they should FAIL initially

- [ ] T048 [P] [US1] Create unit test for PasswordService.validate() in `tests/unit/services/PasswordService.test.ts` covering valid password (8+ chars, mixed case, number, special char), invalid passwords (too short, no mixed case, no number, no special char)
- [ ] T049 [P] [US1] Create unit test for PasswordService.hash() and compare() in `tests/unit/services/PasswordService.test.ts` with bcrypt cost 10 verification
- [ ] T050 [P] [US1] Create unit test for validators.validateEmail() in `tests/unit/utils/validators.test.ts` with valid RFC 5322 emails and invalid formats
- [ ] T051 [P] [US1] Create unit test for User model validation in `tests/unit/models/User.test.ts` checking email uniqueness constraint, password hash format

### 3b: Integration Tests for User Story 1

- [ ] T052 [P] [US1] Create integration test for registration flow in `tests/integration/registration.integration.test.ts` covering: valid registration → user created in database with hashed password; duplicate email → error; weak password → error; email confirmation queued
- [ ] T053 [P] [US1] Create integration test for email service in `tests/integration/email-queue.integration.test.ts` verifying: queueEmail() adds job to Redis queue; job is processed and marked success/retry based on delivery

### 3c: Implementation for User Story 1

- [ ] T054 [US1] Create registration endpoint POST /register in `src/routes/auth.routes.ts` accepting { email, password }, validating input, calling AuthService.register(), returning { user_id, email, created_at, message }, status 201 on success; JSDoc with examples
- [ ] T055 [US1] Implement AuthService.register() in `src/services/AuthService.ts` that: validates email (RFC 5322, not duplicate), validates password strength, hashes password using PasswordService, creates User record, queues confirmation email, returns user_id + metadata; orchestrates other services; <50 lines; JSDoc
- [ ] T056 [US1] Add input validation middleware to registration endpoint (email format, password length, SQL injection prevention) in `src/routes/auth.routes.ts`
- [ ] T057 [US1] Implement AuditService.logRegistration() integration to record all registrations (success + failure) in AuditLog for compliance

### 3d: E2E Tests for User Story 1

- [ ] T058 [US1] Create E2E test for registration journey in `tests/e2e/registration-flow.test.ts` covering: POST /register with valid credentials → 201 response with user_id; can query GET /sessions (after login) to see new user's session

**Checkpoint**: User Story 1 complete. Users can register with email/password. Confirmation emails queued. All unit/integration/E2E tests pass with 80%+ coverage on AuthService.register().

---

## Phase 4: User Story 2 - User Login with JWT Tokens (Priority: P1)

**Goal**: Registered users can login and receive JWT token (24h expiry) + refresh token (30d expiry); JWT required for protected endpoints

**Independent Test**: Register account → login with correct credentials → receive valid JWT + refresh_token → use JWT to call protected endpoint /sessions → returns 200

### 4a: Unit Tests for User Story 2

> **Test-First**: Write these tests BEFORE implementation; they should FAIL initially

- [ ] T059 [P] [US2] Create unit test for TokenService.sign() in `tests/unit/services/TokenService.test.ts` verifying: JWT created with user_id + iat claim, HS256 algorithm, 24h expiry embedded in exp claim, JWT is valid when verified immediately
- [ ] T060 [P] [US2] Create unit test for TokenService.verify() in `tests/unit/services/TokenService.test.ts` verifying: valid JWT passes verification, expired JWT (issued >24h ago) fails, tampered JWT fails, missing signature fails
- [ ] T061 [P] [US2] Create unit test for TokenService.refresh() in `tests/unit/services/TokenService.test.ts` verifying: valid refresh token → new JWT issued; expired refresh token → error; revoked refresh token → error
- [ ] T062 [P] [US2] Create unit test for auth middleware in `tests/unit/middleware/auth.test.ts` verifying: valid JWT in Authorization header → request continues; missing header → 401; invalid JWT → 401; expired JWT → 401

### 4b: Integration Tests for User Story 2

- [ ] T063 [P] [US2] Create integration test for login flow in `tests/integration/login.integration.test.ts` covering: POST /login with correct email + password → JWT + refresh_token issued; invalid email → 401; invalid password → 401; incorrect password 5 times → account locked 403
- [ ] T064 [P] [US2] Create integration test for protected endpoints in `tests/integration/protected-endpoints.integration.test.ts` verifying: GET /sessions with valid JWT → 200 with session data; without JWT → 401; with expired JWT → 401

### 4c: Implementation for User Story 2

- [ ] T065 [US2] Create login endpoint POST /login in `src/routes/auth.routes.ts` accepting { email, password, device_name }, validating credentials, calling AuthService.login(), returning { user_id, jwt, jwt_expires_in, refresh_token, refresh_token_expires_in, session_id }, status 200; JSDoc with examples
- [ ] T066 [US2] Implement AuthService.login() in `src/services/AuthService.ts` that: looks up user by email, compares password using PasswordService, checks if account is locked (BruteForceService), creates AuthToken + RefreshToken records, creates SessionMetadata, queues email confirmation, returns tokens + session_id; orchestrates services; <50 lines; JSDoc
- [ ] T067 [US2] Implement TokenService.sign() in `src/services/TokenService.ts` using jsonwebtoken.sign() with HS256, user_id claim, 24h expiry, JSDoc
- [ ] T068 [US2] Implement TokenService.verify() in `src/services/TokenService.ts` using jsonwebtoken.verify(), checking token expiry, JSDoc
- [ ] T069 [US2] Implement TokenService.refresh() in `src/services/TokenService.ts` that validates refresh token expiry, creates new JWT, optionally rotates refresh token, JSDoc
- [ ] T070 [US2] Implement auth middleware in `src/middleware/auth.ts` that extracts JWT from Authorization header, verifies using TokenService, attaches user_id to request.user, returns 401 if invalid/expired; JSDoc
- [ ] T071 [US2] Create protected endpoint GET /sessions in `src/routes/sessions.routes.ts` that returns list of user's active sessions (SessionMetadata records); requires auth middleware; JSDoc

### 4d: E2E Tests for User Story 2

- [ ] T072 [US2] Create E2E test for login journey in `tests/e2e/login-flow.test.ts` covering: POST /register → POST /login → GET /sessions (protected) → 200 with session list; invalid credentials → 401

**Checkpoint**: User Story 2 complete. Users can login and receive JWT + refresh_token. Protected endpoints require JWT. All unit/integration/E2E tests pass with 80%+ coverage on TokenService + AuthService.login().

---

## Phase 5: User Story 3 - Session Management with Token Expiry & Multi-Device Support (Priority: P2)

**Goal**: Users can view active sessions, logout from specific devices or all devices, tokens expire after 24h, refresh tokens enable session continuation for 30 days

**Independent Test**: Login on Device A → Login on Device B (same user) → GET /sessions shows 2 active sessions → DELETE /sessions/:id for Device A → GET /sessions shows 1 session; Device A JWT no longer works

### 5a: Unit Tests for User Story 3

> **Test-First**: Write these tests BEFORE implementation

- [ ] T073 [P] [US3] Create unit test for SessionMetadata model in `tests/unit/models/SessionMetadata.test.ts` verifying: session_id creation, device_name/device_type storage, IP address tracking, last_activity_at updates
- [ ] T074 [P] [US3] Create unit test for TokenService.revoke() in `tests/unit/services/TokenService.test.ts` verifying: revoked_at timestamp set on auth_tokens, subsequent verify() fails for revoked token
- [ ] T075 [P] [US3] Create unit test for session cleanup in `tests/unit/services/SessionService.test.ts` verifying: inactive sessions (>30 days) marked for cleanup, getActiveSessions() returns only non-expired sessions

### 5b: Integration Tests for User Story 3

- [ ] T076 [P] [US3] Create integration test for multi-device login in `tests/integration/multi-device-sessions.integration.test.ts` covering: same user login on 2 devices → 2 SessionMetadata records created; each has independent JWT; logout from Device A doesn't affect Device B
- [ ] T077 [P] [US3] Create integration test for token expiry in `tests/integration/token-expiry.integration.test.ts` verifying: JWT expires after 24h (simulated in test), refresh_token expires after 30d (simulated); expired tokens rejected by auth middleware
- [ ] T078 [P] [US3] Create integration test for session logout in `tests/integration/session-logout.integration.test.ts` covering: POST /logout without all_devices=true → only current session revoked; POST /logout with all_devices=true → all sessions revoked

### 5c: Implementation for User Story 3

- [ ] T079 [US3] Create SessionService in `src/services/SessionService.ts` with: createSession() (insert SessionMetadata), getActiveSessions() (query non-expired sessions for user), revokeSession() (delete specific session + revoke its tokens), revokeAllSessions() (revoke all tokens for user); <50 lines per function; JSDoc
- [ ] T080 [US3] Create logout endpoint POST /logout in `src/routes/auth.routes.ts` accepting { all_devices: boolean }, calling SessionService based on flag, revoking tokens via TokenService, returning { success: true, message }; JSDoc
- [ ] T081 [US3] Create list sessions endpoint GET /sessions in `src/routes/sessions.routes.ts` calling SessionService.getActiveSessions(), returning array of sessions with device info, IP, last_activity_at, is_current flag; requires auth; JSDoc
- [ ] T082 [US3] Create logout specific device endpoint DELETE /sessions/:session_id in `src/routes/sessions.routes.ts` that revokes that session only, returns 200; requires auth; JSDoc
- [ ] T083 [US3] Implement token revocation checks in auth middleware: before verifying JWT signature, check if AuthToken record exists and revoked_at is null; return 401 if revoked
- [ ] T084 [US3] Create periodic cleanup job in `src/utils/cleanup.ts` (runs every hour) to delete expired sessions, expired tokens, and update last_activity_at from request logs

### 5d: E2E Tests for User Story 3

- [ ] T085 [US3] Create E2E test for session management in `tests/e2e/multi-device-session.test.ts` covering: login on 2 devices → GET /sessions shows both; DELETE /sessions for device 1 → device 1 JWT no longer works; device 2 JWT still works

**Checkpoint**: User Story 3 complete. Multi-device sessions working. Token expiry enforced. Session logout granular (per-device or all). All unit/integration/E2E tests pass with 80%+ coverage on SessionService + TokenService.

---

## Phase 6: User Story 4 - Password Reset via Email (Priority: P2)

**Goal**: Users can request password reset, receive secure 1-hour link via email, set new password, all old tokens revoked

**Independent Test**: POST /password-reset with email → email queued → retrieve reset link from queue → PUT /password-reset/:token with new_password → password updated, can login with new password, old JWT no longer works

### 6a: Unit Tests for User Story 4

> **Test-First**: Write these tests BEFORE implementation

- [ ] T086 [P] [US4] Create unit test for PasswordReset model in `tests/unit/models/PasswordReset.test.ts` verifying: reset_id creation, token_hash generation (SHA-256), expires_at set to 1 hour from now, used_at null until reset completes
- [ ] T087 [P] [US4] Create unit test for PasswordService.checkReuse() in `tests/unit/services/PasswordService.test.ts` verifying: same password as before → error; different password → allowed
- [ ] T088 [P] [US4] Create unit test for password reset token generation in `tests/unit/services/AuthService.test.ts` verifying: token is cryptographically random, 1-hour expiry, SHA-256 hashed before storage

### 6b: Integration Tests for User Story 4

- [ ] T089 [P] [US4] Create integration test for password reset request in `tests/integration/password-reset.integration.test.ts` covering: POST /password-reset with existing email → PasswordReset record created, email queued; with non-existing email → success (no email leak); within 5 min → email delivered
- [ ] T090 [P] [US4] Create integration test for password reset completion in `tests/integration/password-reset-completion.integration.test.ts` covering: valid reset token + new password → User.password_hash updated, all old AuthTokens revoked; expired token → error; used token (already reset) → error

### 6c: Implementation for User Story 4

- [ ] T091 [US4] Create password reset request endpoint POST /password-reset in `src/routes/password.routes.ts` accepting { email }, looking up user (no email leak), creating PasswordReset record, queuing reset email, returning { success: true, message }; JSDoc
- [ ] T092 [US4] Implement EmailService.sendPasswordReset() that creates reset link (reset_id + token_hash), embeds link in template, queues to BullMQ with recipient_email + template_data; JSDoc
- [ ] T093 [US4] Create password reset completion endpoint PUT /password-reset/:token in `src/routes/password.routes.ts` accepting { user_id, new_password }, validating password strength, looking up PasswordReset by token (1-hour expiry check), updating User.password_hash via PasswordService.hash(), revoking all AuthTokens, setting PasswordReset.used_at, returning { success: true, message }; JSDoc
- [ ] T094 [US4] Implement PasswordService.checkReuse() that hashes new_password and compares against previous password hashes (stored in User for this feature) to prevent reuse; JSDoc
- [ ] T095 [US4] Implement TokenService.revokeAllUserTokens() that marks all AuthTokens + RefreshTokens for user as revoked (set revoked_at = NOW()); JSDoc
- [ ] T096 [US4] Add rate limiting to password reset endpoint: 5 attempts per IP per hour (configurable)

### 6d: E2E Tests for User Story 4

- [ ] T097 [US4] Create E2E test for password reset journey in `tests/e2e/password-reset-flow.test.ts` covering: POST /password-reset → retrieve link from mock email queue → PUT /password-reset/:token with new_password → 200; login with old password → 401; login with new password → 200 + JWT issued

**Checkpoint**: User Story 4 complete. Password reset flow working end-to-end. Reset links 1-hour expiry enforced. Old tokens revoked on password change. All unit/integration/E2E tests pass with 80%+ coverage on PasswordService + EmailService.

---

## Phase 7: Advanced Features (P2 - Brute Force, Account Deletion)

**Goal**: Account lockout after failed attempts, GDPR-compliant account deletion with 30-day grace period

### 7a: Unit Tests for Advanced Features

- [ ] T098 [P] Create unit test for BruteForceService.recordFailedAttempt() in `tests/unit/services/BruteForceService.test.ts` covering: 1-4 attempts → counter increments; 5th attempt → account locked for 15min
- [ ] T099 [P] Create unit test for BruteForceService.isAccountLocked() in `tests/unit/services/BruteForceService.test.ts` verifying: locked account returns true; lock expired returns false
- [ ] T100 [P] Create unit test for DeletionService in `tests/unit/services/DeletionService.test.ts` covering: initiateAccountDeletion() creates DeletionRequest with 30-day grace, cancelDeletion() removes request within grace period, executeAccountDeletion() deletes PII + anonymizes logs

### 7b: Integration Tests for Advanced Features

- [ ] T101 [P] Create integration test for brute force protection in `tests/integration/brute-force-protection.integration.test.ts` covering: 5 failed login attempts → account locked 403; account locked email sent; 15min later → auto-unlock or via email link → account unlocked
- [ ] T102 [P] Create integration test for account deletion in `tests/integration/account-deletion.integration.test.ts` covering: DELETE /account → DeletionRequest created with 30-day grace, user receives emails at 0d/7d/14d/25d; POST /account/delete/cancel within grace → deletion cancelled; after 30d → account + PII deleted, logs anonymized

### 7c: Implementation for Advanced Features

- [ ] T103 Create account lockout on failed login: in AuthService.login(), call BruteForceService.recordFailedAttempt() on password mismatch; if isAccountLocked(), return 403 with message; on success, call recordSuccessfulLogin() to reset counter; JSDoc
- [ ] T104 Create unlock account email in EmailService.sendAccountLocked() that includes link user can click to unlock immediately (or wait 15min for auto-unlock)
- [ ] T105 Create account deletion endpoint DELETE /account in `src/routes/account.routes.ts` that requires auth, calls DeletionService.initiateAccountDeletion(), returns 202 Accepted with grace period end date; JSDoc
- [ ] T106 Create cancel deletion endpoint POST /account/delete/cancel in `src/routes/account.routes.ts` that requires auth, calls DeletionService.cancelDeletion() within grace period, returns 200; JSDoc
- [ ] T107 Create scheduled deletion job in `src/utils/scheduler.ts` that runs daily to: find DeletionRequests where grace_period_ends_at <= NOW(), call DeletionService.executeAccountDeletion() to delete PII + anonymize logs, send final deletion notification email
- [ ] T108 Implement DeletionService.executeAccountDeletion() that: sets User.is_active=false, deletes User.email + password_hash, deletes associated AuthTokens + RefreshTokens + SessionMetadata + LoginAttempts + PasswordResets + DeletionRequest records, anonymizes AuditLog.user_id (set to NULL) for retention 2 years; JSDoc

### 7d: E2E Tests for Advanced Features

- [ ] T109 Create E2E test for account deletion in `tests/e2e/account-deletion-flow.test.ts` covering: DELETE /account → POST /account/delete/cancel within 30d → deletion cancelled, user remains active; wait 30d (simulated) → executeAccountDeletion() called → user cannot login

**Checkpoint**: Advanced features complete. Account lockout + grace period deletion working. All unit/integration/E2E tests pass with 80%+ coverage on BruteForceService + DeletionService.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Testing, deployment, documentation, performance optimization

### 8a: Test Suite Completion

- [ ] T110 [P] Review test coverage report: `npm run test:coverage`; ensure all services, models, middleware have 80%+ line coverage
- [ ] T111 [P] Add missing unit tests to reach 80% coverage on edge cases (boundary conditions, error paths)
- [ ] T112 [P] Verify all integration tests use test database (separate test DB via TEST_DB_* env vars)
- [ ] T113 [P] Add E2E test for complete auth journey: register → login → multi-device session → password reset → account deletion
- [ ] T114 [P] Create performance test in `tests/e2e/performance.test.ts` verifying: login <500ms p95, register <500ms p95, 1000+ concurrent authenticated users

### 8b: Database & Deployment

- [ ] T115 [P] Create Docker Compose file in `docker/docker-compose.yml` with PostgreSQL 15, Redis 7, Express service; volumes for data persistence
- [ ] T116 [P] Create `docker/Dockerfile` for Express service: Node 18 base, TypeScript compilation, PORT 3000 expose
- [ ] T117 [P] Create health check endpoint GET /health in `src/routes/health.routes.ts` returning { status, timestamp, uptime, database: connected?, redis: connected? }; no auth required
- [ ] T118 [P] Create database backup script in `scripts/backup-db.sh` (pg_dump with compression, S3 upload optional)
- [ ] T119 Create documentation in `DEPLOYMENT.md` with Docker Compose setup, environment variables, migrations, scaling notes

### 8c: Security & Monitoring

- [ ] T120 [P] Add security headers middleware in `src/middleware/securityHeaders.ts`: HSTS, X-Content-Type-Options, X-Frame-Options, CSP
- [ ] T121 [P] Configure CORS in `src/middleware/cors.ts` for allowed origins (from .env)
- [ ] T122 [P] Implement structured logging in logger utility: all logs include timestamp, level, message, context (user_id if authenticated), duration for requests
- [ ] T123 [P] Add audit logging for sensitive operations: log all registration/login/password-reset/deletion events with IP + user-agent via AuditService
- [ ] T124 Create monitoring dashboard suggestion in `MONITORING.md` with key metrics: login success rate, password reset completion rate, account lockout frequency, email delivery latency, error rates

### 8d: Code Quality & Documentation

- [ ] T125 [P] Run TypeScript compiler check: `npm run type-check` with no errors
- [ ] T126 [P] Run linter: `npm run lint` with no warnings (or document necessary exceptions)
- [ ] T127 [P] Verify all exported functions have JSDoc with @param, @returns, @throws, code examples
- [ ] T128 [P] Create ARCHITECTURE.md documenting: service layer, data model, API routing, middleware stack, error handling, test structure
- [ ] T129 Create CODE_REVIEW_CHECKLIST.md with Constitution principles: function length <50 lines, no `any` types, JSDoc on all exports, 80% test coverage

### 8e: Final Quality Gate

- [ ] T130 [P] Run full test suite: `npm test` (unit + integration + e2e) with 80%+ coverage
- [ ] T131 [P] Run build: `npm run build` producing dist/ folder with no errors
- [ ] T132 [P] Verify .env.example has all required variables with descriptions
- [ ] T133 Create RELEASE_NOTES.md summarizing Phase 1 (Phase 1 complete) with feature list, known limitations, next features (MFA, OAuth, session analytics)
- [ ] T134 [P] Final commit: `git commit -am "feat: complete user authentication system phase 1 with JWT, refresh tokens, multi-device sessions, password reset, account deletion, 80% test coverage"`

**Checkpoint**: Phase 1 complete. All features implemented, tested, documented, deployed. Ready for production release or Phase 2 (MFA, OAuth, etc.).

---

## Dependencies & Execution Order

### Critical Path (Blocking Dependencies)

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ├→ Phase 3 (US1 Registration) ← Can start after Phase 2
    ├→ Phase 4 (US2 Login) ← Depends on Phase 3 (need users to login)
    ├→ Phase 5 (US3 Sessions) ← Can start after Phase 2 (independent)
    └→ Phase 6 (US4 Password Reset) ← Can start after Phase 2 (independent)
        ↓
Phase 7 (Advanced - Brute Force, Deletion)
        ↓
Phase 8 (Polish, Deployment)
```

### Suggested Implementation Order

1. **Week 1**: Phases 1-2 (Setup + Foundational) - all developers
2. **Week 2**: Phases 3-4 (Registration + Login) - parallel team A
3. **Week 2**: Phases 5-6 (Sessions + Password Reset) - parallel team B
4. **Week 3**: Phase 7 (Advanced Features) - all developers
5. **Week 3**: Phase 8 (Polish + Deployment) - all developers

### Parallelization Opportunities

**During Phase 2** (after project setup):
- T009-T047: All foundational tasks marked with [P] can run in parallel across team members
- Each developer can own: 1 configuration file, 1-2 models, 1-2 services, 1-2 routes

**During Phases 3-6** (user story implementation):
- Each user story can be implemented by independent team
- US1 blocks US2 (need users), but US3 + US5 are independent
- All test tasks ([P] marked) within same story can parallelize

**During Phase 8** (polish):
- All [P] marked tasks can parallelize across full team

---

## Test Coverage Summary

**Target**: 80% coverage on business logic

| Layer | Task Count | Examples |
|-------|-----------|----------|
| **Unit** | T048-T088, T098-T100 | PasswordService, TokenService, BruteForceService |
| **Integration** | T052-T053, T063-T064, T076-T078, T089-T090, T101-T102 | Database + service interaction, email queue, token expiry |
| **E2E** | T058, T072, T085, T097, T109, T113 | Complete user journeys across features |

**Total Tests**: 30+ test tasks covering ~150 individual test cases

**Coverage Command**: `npm run test:coverage` should show 80%+ line coverage on src/ directory

---

## Success Criteria Verification

All Phase deliverables verified against spec.md success criteria:

| SC | Verification Task | Phase |
|----|-------------------|-------|
| SC-001 | Registration <2 min | T054 test |
| SC-002 | Login <500ms | T114 perf test |
| SC-003 | Password reset email <5 min | T089 integration test |
| SC-004 | 1000+ concurrent users | T114 perf test |
| SC-005 | Invalid tokens rejected | T064 integration test |
| SC-006 | Reset links 1-hour expiry | T090 integration test |
| SC-007 | JWT 24h expiry | T077 integration test |
| SC-010 | Session refresh <1 sec | T069 unit test |
| SC-011 | Refresh tokens 30d expiry | T077 integration test |
| SC-012 | 10 concurrent sessions | T076 integration test |
| SC-013 | Email delivery 99% in 24h | T089 integration test |
| SC-014 | 5 attempts → 15min lock | T101 integration test |
| SC-017 | Account deletion 30-day grace | T102 integration test |
| SC-018 | PII deleted, logs anonymized | T108 implementation |
| SC-019 | Deletion reminders at 0/7/14/25d | T107 scheduled job |

---

## Constitution Compliance Checklist

**All code must comply with 4 principles**:

- [ ] **Clean Code**: All functions <50 lines (enforced in each service task)
- [ ] **TypeScript Strict**: `strict: true` in tsconfig.json (T003); no `any` types allowed
- [ ] **Testing Pyramid 80%**: 70% unit / 20% integration / 10% e2e (T048-T114); coverage 80%+ (T110)
- [ ] **JSDoc Mandatory**: All exports documented with @param/@returns/@throws (verified in T127)

**Code Review Gate** (before any PR merge):
1. Function length <50 lines: ✅
2. No `any` types: ✅
3. TypeScript compilation: `npm run type-check` ✅
4. Linting: `npm run lint` ✅
5. Test coverage: 80%+ ✅
6. JSDoc on all exports: ✅
7. Tests pass: `npm test` ✅

---

## Notes for Implementation Team

### For Service Implementation (T032-T038, T055, T065-T069, T079, T103-T108)

- Keep each function <50 lines (Constitution I)
- All parameters + returns fully typed (Constitution II)
- Add JSDoc with @param, @returns, @throws, example (Constitution IV)
- Export only public API; use private functions for helpers

### For Route Implementation (T054, T065, T081, T082, T091, T093, T105, T106)

- Validate all inputs in route handler
- Call appropriate service
- Return standardized error response on validation fail
- Return 201 for create, 200 for success, 4xx for client error, 5xx for server error
- Add JSDoc with example request/response

### For Test Implementation (All T0XX tests)

- Write tests FIRST before implementing feature
- Test should initially FAIL (red)
- Implement feature until test PASSES (green)
- Refactor if needed (TDD cycle)
- Aim for 80%+ coverage on business logic (services)

### For Middleware Implementation (T039-T043)

- Keep middleware functions simple (<30 lines)
- Add JSDoc with explanation of what middleware does
- Always add error handling
- Return appropriate HTTP status codes

---

**Status**: ✅ Ready to execute Phase 1 (Setup) → Phase 2 (Foundational) → Phases 3-6 (User Stories in parallel) → Phase 7-8 (Polish)

🚀 Begin with Task T001!
