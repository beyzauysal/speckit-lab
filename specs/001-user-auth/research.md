# Research: User Authentication System

**Feature**: User Authentication System (001-user-auth)  
**Date**: 2026-05-08  
**Status**: Phase 0 Research Complete

## Research Summary

Resolved 10 critical technology decisions affecting authentication design, security, performance, and testing strategy. All decisions leverage established best practices and production-proven patterns.

---

## 1. Database Design: PostgreSQL Authentication Schema

**Decision**: PostgreSQL with optimized indexes for authentication workloads

**Rationale**:
- ACID compliance ensures password reset tokens can't be re-used and concurrent logins don't create duplicate sessions
- B-tree indexes on `email` (unique), `user_id`, `expires_at` enable <10ms token lookups at scale
- JSON support for flexible `details` field in AuditLog (event context varies by event type)
- Stable on DigitalOcean, AWS RDS, Azure Database; widely supported in cloud environments

**Alternatives Considered**:
- MongoDB: Simpler schema (no migrations) but lacks transaction guarantees for token validity checks
- Redis: Fast but not durable; authentication state loss on restart is unacceptable
- DynamoDB: Pay-per-query model becomes expensive at 1000+ concurrent users

**Trade-offs**:
- Requires migrations (manageable with Knex.js or TypeORM)
- Slightly slower than in-memory Redis (mitigated by indexes + connection pooling)

**Implementation Details**:
- Primary key: `user_id` (UUID)
- Indexes: `(email)` unique, `(expires_at)` for cleanup queries, `(user_id, expires_at)` for token lookups
- Partitioning not needed initially (grow to 100M users before considering)

---

## 2. Password Hashing: bcrypt with Cost Factor 10

**Decision**: bcrypt with minimum cost factor 10

**Rationale**:
- OWASP standard for password hashing (2023 guidance)
- Cost 10 = ~100ms per hash (acceptable 0.1% latency overhead on registration)
- Built into Node.js ecosystem (bcryptjs pure JS, bcrypt native for speed)
- Adaptive: cost can increase as hardware speeds up (future-proof)

**Alternatives Considered**:
- Argon2: Stronger (memory-hard) but slower; overkill for username/password auth
- PBKDF2: Legacy; weaker than bcrypt against GPU attacks
- SHA-256: Cryptographically broken for passwords; vulnerable to rainbow tables

**Trade-offs**:
- ~100ms per registration/login (acceptable per SC-002: <500ms)
- Higher cost (12+) makes registration/login slower but more secure

**Implementation Details**:
```typescript
// Cost 10: ~100ms per hash
const hash = await bcrypt.hash(password, 10);

// On hardware upgrade, increase to 11 or 12
// Existing hashes automatically re-hashed on next login
```

---

## 3. JWT Best Practices: HS256 with Secure Secret

**Decision**: HS256 (HMAC-SHA256) for JWT signing; store secret in environment variables

**Rationale**:
- HS256 faster than RS256 (no public key operations); sufficient for single-service auth
- JSON Web Token RFC 7519 compliant
- `jsonwebtoken` library (npm) is production-battle-tested
- Expiry (24h) embedded in token prevents long-lived tokens if DB is unavailable

**Alternatives Considered**:
- RS256: Asymmetric; better for federated identity but unnecessary complexity here
- Opaque tokens: Requires DB lookup on every request (worse performance)

**Trade-offs**:
- HS256 requires secret sharing (safe only in single-service environment)
- Token size: ~300 bytes (acceptable in Authorization header)
- No token revocation during 24h window (mitigated by 30-day refresh token rotation)

**Implementation Details**:
```typescript
// Sign JWT with 24-hour expiry
const token = jwt.sign(
  { user_id, email, device_id },
  process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '24h' }
);

// Verify on protected endpoints
jwt.verify(token, process.env.JWT_SECRET);
```

---

## 4. Refresh Token Flow: Database-Backed with 30-Day Expiry

**Decision**: Separate refresh tokens (30-day expiry) stored in database; rotated on password reset

**Rationale**:
- Enables session continuation beyond 24h without forcing password re-entry
- Database tracking allows per-device revocation (login from new device invalidates old refresh tokens if desired)
- 30-day expiry balances UX (can stay logged in) with security (forcibly logs out after 30 days)
- Industry standard (Google, GitHub, Microsoft use this pattern)

**Alternatives Considered**:
- Single JWT (no refresh): Logout after 24h is poor UX
- Rotate on every use: Complex; race conditions between requests

**Trade-offs**:
- Extra database table + lookup (negligible: <1ms per refresh)
- Client must store refresh token securely (httpOnly cookies recommended)

**Implementation Details**:
```typescript
// Issue both tokens at login
const refreshToken = jwt.sign(
  { refresh_token_id },
  process.env.REFRESH_SECRET,
  { expiresIn: '30d' }
);

// Refresh endpoint validates refresh token, issues new JWT
POST /refresh { refresh_token } → { jwt, refresh_token }

// Password reset invalidates all refresh tokens
UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?
```

---

## 5. Email Queue Pattern: Bull + Redis with 3-Retry Strategy

**Decision**: Use BullMQ (Redis-backed job queue) for async email delivery with exponential backoff

**Rationale**:
- Queuing allows registration/reset to complete despite email service outages (meets SC-013: 99% delivery within 24h)
- BullMQ is production-proven (used by Slack, Figma, many SaaS)
- Exponential backoff: 1min → 5min → 1hr prevents hammering failed email service
- Dead-letter queue captures permanently failed emails for manual review

**Alternatives Considered**:
- Synchronous email (old-school): Blocks registration for 5+ seconds; fails if email service down
- Simple database queue + cron: Possible but reinventing wheels; harder to debug
- AWS SQS: Cloud-specific; requires AWS lock-in

**Trade-offs**:
- Adds Redis dependency (requires containerization plan)
- Email delivery no longer guaranteed immediate (async)
- Users must receive confirmation link within a few minutes, not seconds

**Implementation Details**:
```typescript
// Enqueue email on registration
const job = await emailQueue.add('send-email', {
  to, subject, template, data
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Worker processes queue
emailQueue.process(async (job) => {
  await sendEmailViaProvider(job.data);
});
```

---

## 6. Brute Force Protection: Per-User Account Lockout (5 attempts, 15min)

**Decision**: Lock user account for 15 minutes after 5 failed login attempts

**Rationale**:
- Per-user (not per-IP) prevents attackers from bypassing via multiple IPs
- 15 minutes balances security with UX (not too punitive)
- Users can self-unlock via email link (faster than waiting)
- Database query is fast: `SELECT failed_attempts, account_locked_until FROM users WHERE email = ?`

**Alternatives Considered**:
- Rate limit by IP: Distributed attacks bypass; legitimate users blocked if sharing IP (corporate networks)
- Progressive delay: Theoretically better but hard to implement correctly across devices
- CAPTCHA: Requires client UI; out of scope for API

**Trade-offs**:
- Legitimate users get locked out after 5 failed attempts
- Support burden if users forget passwords frequently
- Database overhead: +2 columns (failed_attempts, account_locked_until)

**Implementation Details**:
```typescript
// On failed login
UPDATE users SET failed_attempts = failed_attempts + 1 WHERE user_id = ?;

// After 5 failures, lock account
IF failed_attempts >= 5:
  UPDATE users SET account_locked_until = NOW() + INTERVAL 15 MINUTE;

// Email user unlock link (optional self-service recovery)
// Account auto-unlocks after 15 minutes
```

---

## 7. Session Tracking: Metadata Table for Device/IP Auditing

**Decision**: Track session metadata (device name, IP, last activity) in SessionMetadata table

**Rationale**:
- Enables per-device logout (users can "logout from other devices")
- Supports security audit: "login from suspicious IP? logout that session"
- Minimal DB overhead: <100 bytes per session
- Industry standard (Gmail shows device locations, activity)

**Alternatives Considered**:
- JWT-only (no session table): Can't revoke specific device sessions; only option is full logout
- Store device info in JWT: Inflates token size; leaks device info to client

**Trade-offs**:
- Extra database table (negligible storage)
- Developer must maintain session lifecycle (create on login, clean up on logout)

**Implementation Details**:
```typescript
// Create session on login
INSERT INTO session_metadata 
  (session_id, user_id, device_name, device_type, ip_address, created_at)
VALUES (uuid, user_id, 'Chrome on MacOS', 'web', ip, now);

// Allow per-device logout
DELETE FROM session_metadata WHERE session_id = ?;
// Invalidate any active tokens from that session
```

---

## 8. Testing Strategy: 70/20/10 Pyramid with Jest

**Decision**: Jest for all test levels (unit, integration, e2e); 70% unit, 20% integration, 10% e2e

**Rationale**:
- Jest is the de-facto TypeScript testing standard (Facebook, Google recommend)
- Fast unit tests (<5ms each) catch bugs early
- Integration tests validate database interaction (critical for auth)
- E2E tests verify complete user journeys (catch integration gaps)
- 80% coverage on business logic (Service classes, not controllers)

**Alternatives Considered**:
- Mocha + Chai: Older; less developer experience
- Vitest: Newer; similar speed to Jest but less ecosystem maturity

**Trade-offs**:
- E2E tests slow (need live database); keep count low (10%)
- Mocking database/email in unit tests requires discipline
- 80% coverage target means some code paths not tested (acceptable trade-off)

**Implementation Details**:
```typescript
// Unit test: isolated function
test('bcrypt hashes password correctly', async () => {
  const password = 'Test123!@#';
  const hash = await hashPassword(password);
  const match = await verifyPassword(password, hash);
  expect(match).toBe(true);
});

// Integration test: with real database
test('login endpoint with invalid password returns 401', async () => {
  const user = await createTestUser();
  const res = await request(app)
    .post('/login')
    .send({ email: user.email, password: 'WrongPassword' });
  expect(res.status).toBe(401);
});

// E2E test: full user journey
test('complete registration and login flow', async () => {
  const res1 = await request(app).post('/register')
    .send({ email: 'new@example.com', password: 'Test123!@#' });
  expect(res1.status).toBe(201);
  
  const res2 = await request(app).post('/login')
    .send({ email: 'new@example.com', password: 'Test123!@#' });
  expect(res2.body.jwt).toBeDefined();
});
```

---

## 9. Audit Logging: Structured Logs with PII Anonymization

**Decision**: Log all authentication events to AuditLog table; anonymize after account deletion

**Rationale**:
- Compliance: Track 100% of auth events (FR-012)
- Security: Detect compromised accounts (unusual login patterns)
- Anonymization: Meets GDPR data deletion requirements (retain logs, remove PII)
- Structured logging: JSON details field allows flexible event context

**Alternatives Considered**:
- No audit log: Can't investigate security incidents
- Application logs only (no database): Harder to query; require log aggregation

**Trade-offs**:
- Extra database table (modest storage: ~200 bytes/event)
- Must anonymize PII on account deletion (requires cleanup job)

**Implementation Details**:
```typescript
// Log on every auth event
INSERT INTO audit_log (user_id, event_type, ip_address, details, created_at) VALUES
  (user_id, 'login_success', ip, { device: 'Chrome', location: 'US' }, now);

// Query recent suspicious activity
SELECT * FROM audit_log WHERE user_id = ? AND event_type = 'login_failed' 
  AND created_at > NOW() - INTERVAL 1 DAY ORDER BY created_at DESC;

// On account deletion, anonymize PII
UPDATE audit_log SET user_id = NULL, email = NULL WHERE user_id = ? 
  AND created_at < NOW() - INTERVAL 2 YEAR;
```

---

## 10. Data Deletion: 30-Day Grace Period + PII Purge

**Decision**: GDPR-compliant deletion with 30-day grace period; anonymize audit logs

**Rationale**:
- Compliance: GDPR "right to be forgotten" requires user-initiated deletion
- UX: 30-day grace period prevents accidental data loss
- Security: Retain anonymized logs for fraud investigation
- Implementation: Clean separation between PII deletion and audit trail retention

**Alternatives Considered**:
- Immediate deletion: Violates GDPR spirit (no recovery period)
- No deletion: Non-compliant; limits market (EU not allowed)
- Soft delete only: Wastes storage; doesn't truly forget data

**Trade-offs**:
- Complexity: Track pending deletions, schedule batch cleanup
- User confusion: Account deleted but data might still exist in backups
- Support requests: Users asking why data still exists after "deletion"

**Implementation Details**:
```typescript
// User requests deletion
INSERT INTO deletion_request (user_id, grace_period_ends_at) VALUES
  (user_id, NOW() + INTERVAL 30 DAY);
// Email: "You requested deletion. Click to cancel: [link]"

// 30 days later, batch job runs
SELECT * FROM deletion_request WHERE grace_period_ends_at <= NOW() AND executed_at IS NULL;
// For each: DELETE User, AuthToken, RefreshToken records
// Then: UPDATE audit_log SET user_id = NULL WHERE user_id = ? (anonymize)
```

---

## Technology Decisions Summary

| Technology | Decision | Confidence | Risk |
|------------|----------|------------|------|
| PostgreSQL | ✅ Selected | High | Low (mature) |
| bcrypt (cost 10) | ✅ Selected | High | Low (industry standard) |
| JWT (HS256, 24h) | ✅ Selected | High | Low (RFC 7519 standard) |
| Refresh Tokens (DB-backed, 30d) | ✅ Selected | High | Medium (requires DB design care) |
| BullMQ + Redis | ✅ Selected | Medium | Medium (Redis operational overhead) |
| Account Lockout (per-user, 5/15m) | ✅ Selected | High | Low (proven by competitors) |
| SessionMetadata Table | ✅ Selected | High | Low (standard pattern) |
| Jest (70/20/10 pyramid) | ✅ Selected | High | Low (mature, widely adopted) |
| Structured Audit Logs (AuditLog table) | ✅ Selected | High | Low (standard practice) |
| 30-Day Deletion Grace Period | ✅ Selected | High | Medium (GDPR compliance required) |

---

## Implementation Readiness

**All unknowns resolved**: ✅ No remaining NEEDS CLARIFICATION items

**Technical Decisions**: ✅ All 10 researched and documented

**Next Phase**: Ready for Phase 1 design (data-model.md, contracts/, quickstart.md)

---

## References & Best Practices

- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- RFC 7519 (JSON Web Tokens): https://tools.ietf.org/html/rfc7519
- NIST SP 800-63B (Authentication & Lifecycle): https://pages.nist.gov/800-63-3/sp800-63b.html
- GDPR Article 17 (Right to Erasure): https://gdpr-info.eu/art-17-gdpr/
- BullMQ Documentation: https://docs.bullmq.io/
- bcrypt npm package: https://www.npmjs.com/package/bcrypt
