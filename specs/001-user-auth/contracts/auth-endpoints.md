# Authentication Endpoint Contracts

**Feature**: User Authentication System (001-user-auth)  
**Date**: 2026-05-08  
**Protocol**: HTTP/REST over HTTPS  
**Base URL**: `https://api.example.com/auth` (or `/api/v1/auth`)

## 1. POST /register - User Registration

**Purpose**: Create a new user account

### Request

```typescript
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@#"
}
```

**Request Schema**:

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| email | string | RFC 5322 format, unique | Yes |
| password | string | Min 8 chars, uppercase, lowercase, number, special char | Yes |

### Response - Success (201 Created)

```json
{
  "success": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2026-05-08T10:30:00Z",
  "message": "Registration successful. Confirmation email sent."
}
```

### Response - Error (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already registered",
    "details": [
      {
        "field": "email",
        "error": "Email already in use"
      }
    ]
  }
}
```

**Error Codes**:

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Invalid email format or password too weak |
| EMAIL_DUPLICATE | 409 | Email already registered |
| RATE_LIMIT_EXCEEDED | 429 | Too many registration attempts from this IP |

### Side Effects

- Creates User record in database
- Queues confirmation email (async delivery)
- Logs registration event to AuditLog
- Password is hashed with bcrypt (cost 10)

### Rate Limiting

- 5 registrations per IP per hour
- 10 registrations per IP per day

---

## 2. POST /login - User Login

**Purpose**: Authenticate user and issue JWT + refresh token

### Request

```typescript
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@#",
  "device_name": "Chrome on MacBook"
}
```

**Request Schema**:

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| email | string | RFC 5322 format | Yes |
| password | string | Non-empty | Yes |
| device_name | string | Max 255 chars | No (defaults to user agent) |

### Response - Success (200 OK)

```json
{
  "success": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "jwt_expires_in": 86400,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token_expires_in": 2592000,
  "session_id": "session_550e8400-e29b-41d4-a716-446655440001",
  "message": "Login successful"
}
```

**Response Schema**:

| Field | Type | Description |
|-------|------|-------------|
| jwt | string | Bearer token for protected endpoints (24h expiry) |
| jwt_expires_in | number | Token lifetime in seconds (86400 = 24 hours) |
| refresh_token | string | Token for obtaining new JWT (30d expiry) |
| refresh_token_expires_in | number | Refresh token lifetime in seconds (2592000 = 30 days) |
| session_id | string | Session identifier (for logout from specific device) |

### Response - Error (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Error Codes**:

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_CREDENTIALS | 401 | Email not found or password incorrect |
| ACCOUNT_LOCKED | 403 | Account locked due to brute force (5 failed attempts) |
| ACCOUNT_INACTIVE | 403 | User account deactivated |
| RATE_LIMIT_EXCEEDED | 429 | Too many login attempts from this IP |

### Side Effects

- Creates AuthToken (JWT) record
- Creates RefreshToken record
- Creates SessionMetadata record (tracks device)
- Logs login attempt to LoginAttempt table
- Logs login event to AuditLog
- Resets failed_login_attempts counter on success
- Increments failed_login_attempts on failure

### Rate Limiting

- 10 failed login attempts per user per hour → account locked for 15 minutes
- 100 login requests per IP per minute → 429 Too Many Requests

### Token Storage Recommendation

```javascript
// Client-side: Store tokens securely
// httpOnly cookie (recommended for web)
Set-Cookie: jwt=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
Set-Cookie: refresh_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000

// Mobile: Secure enclave / keychain
// Avoid localStorage (XSS vulnerable)
```

---

## 3. POST /login/:session_id/refresh - Token Refresh (Alternative: POST /refresh)

**Purpose**: Obtain new JWT using refresh token (no password re-entry)

### Request

```typescript
POST /refresh
Content-Type: application/json
Authorization: Bearer <refresh_token>

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response - Success (200 OK)

```json
{
  "success": true,
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "jwt_expires_in": 86400,
  "message": "Token refreshed successfully"
}
```

### Response - Error (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token expired or invalid"
  }
}
```

**Error Codes**:

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_REFRESH_TOKEN | 401 | Token invalid, expired, or revoked |
| REFRESH_TOKEN_EXPIRED | 401 | Token lifetime exceeded (30 days) |

### Rate Limiting

- 1 refresh per second per user (prevent abuse)
- 100 refreshes per hour per user (reasonable)

---

## 4. POST /logout - User Logout

**Purpose**: Revoke tokens for current session (or all sessions)

### Request

```typescript
POST /logout
Authorization: Bearer <jwt>

{
  "all_devices": false
}
```

**Request Schema**:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| all_devices | boolean | If true, logout from ALL devices; if false, current device only | No (default: false) |

### Response - Success (200 OK)

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Side Effects

- Revokes AuthToken (jwt) for current session
- Revokes RefreshToken for current session
- Deletes SessionMetadata record
- If all_devices=true: Revokes ALL AuthToken + RefreshToken records for user
- Logs logout event to AuditLog

---

## 5. GET /sessions - List Active Sessions

**Purpose**: Show all concurrent sessions across devices

### Request

```typescript
GET /sessions
Authorization: Bearer <jwt>
```

### Response - Success (200 OK)

```json
{
  "success": true,
  "sessions": [
    {
      "session_id": "session_550e8400-e29b-41d4-a716-446655440001",
      "device_name": "Chrome on MacBook",
      "device_type": "web",
      "ip_address": "192.0.2.1",
      "last_activity_at": "2026-05-08T10:30:00Z",
      "created_at": "2026-05-08T09:00:00Z",
      "is_current": true
    },
    {
      "session_id": "session_550e8400-e29b-41d4-a716-446655440002",
      "device_name": "Safari on iPhone",
      "device_type": "mobile_ios",
      "ip_address": "203.0.113.45",
      "last_activity_at": "2026-05-07T15:20:00Z",
      "created_at": "2026-05-06T08:00:00Z",
      "is_current": false
    }
  ]
}
```

### Response - Error (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid JWT token required"
  }
}
```

---

## 6. DELETE /sessions/:session_id - Logout from Specific Device

**Purpose**: Revoke tokens for a specific session (logout from another device)

### Request

```typescript
DELETE /sessions/session_550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <jwt>
```

### Response - Success (204 No Content)

```
No content returned
```

### Response - Error (404 Not Found)

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session does not exist or belongs to another user"
  }
}
```

### Side Effects

- Revokes AuthToken + RefreshToken for that session
- Deletes SessionMetadata record
- Logs logout event for that session

---

## 7. POST /password-reset - Request Password Reset

**Purpose**: Initiate password reset via email

### Request

```typescript
POST /password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Response - Success (200 OK)

```json
{
  "success": true,
  "message": "If email exists, password reset link will be sent within 5 minutes"
}
```

**Note**: Response is same whether email exists or not (security: don't leak registered emails)

### Side Effects

- Queries user by email (no error if not found)
- If found: Generates random reset token, creates PasswordReset record
- Queues password reset email (async delivery)
- Logs password reset request to AuditLog
- Reset link valid for 1 hour only

### Rate Limiting

- 5 password reset requests per IP per hour
- 10 password reset requests per user per day

### Email Content

```
Subject: Reset Your Password

Hello,

You requested to reset your password. Click the link below to set a new password:

https://app.example.com/reset-password?token=TOKEN&user_id=USER_ID

This link expires in 1 hour.

If you did not request this, ignore this email.

---
Best regards,
Your App Team
```

---

## 8. PUT /password-reset/:token - Complete Password Reset

**Purpose**: Set new password using reset token from email

### Request

```typescript
PUT /password-reset/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_password": "NewSecurePass456!@#"
}
```

**Request Schema**:

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| user_id | string | UUID format | Yes |
| new_password | string | Min 8 chars, uppercase, lowercase, number, special char | Yes |

### Response - Success (200 OK)

```json
{
  "success": true,
  "message": "Password reset successfully. All other sessions have been logged out.",
  "redirect": "/login"
}
```

### Response - Error (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "Reset token expired or invalid"
  }
}
```

**Error Codes**:

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_RESET_TOKEN | 400 | Token invalid, expired, or already used |
| PASSWORD_WEAK | 400 | New password doesn't meet requirements |
| PASSWORD_REUSED | 400 | Cannot reuse a previous password |

### Side Effects

- Validates reset token (not expired, not already used)
- Updates User.password_hash with bcrypt(new_password, 10)
- Marks PasswordReset.used_at = NOW() (one-time use)
- **Revokes ALL AuthToken + RefreshToken** for user (force re-login)
- Clears failed_login_attempts (reset brute force counter)
- Logs password reset event to AuditLog

### Important Note

Users are forcibly logged out from all devices after password reset. They must login again.

---

## 9. DELETE /account - Request Account Deletion

**Purpose**: Request permanent account deletion (30-day grace period)

### Request

```typescript
DELETE /account
Authorization: Bearer <jwt>
```

### Response - Success (202 Accepted)

```json
{
  "success": true,
  "message": "Account deletion scheduled. You have 30 days to cancel.",
  "grace_period_ends_at": "2026-06-07T10:30:00Z",
  "cancel_instructions": "Visit https://app.example.com/account/delete/cancel to undo this request"
}
```

### Side Effects

- Creates DeletionRequest record (grace_period_ends_at = 30 days from now)
- Queues deletion notification emails (day 0, 7, 14, 25, 30)
- Logs deletion request to AuditLog
- User can still login during grace period

### Email (Day 0)

```
Subject: Your Account Deletion Request

Hello,

You requested to delete your account and all associated data.
This will happen in 30 days (DATE).

Your account will remain functional until then. You can cancel this request:

https://app.example.com/account/delete/cancel?deletion_id=DELETION_ID

If you did not request this, please contact support.

---
Best regards,
Your App Team
```

---

## 10. POST /account/delete/cancel - Cancel Account Deletion

**Purpose**: Cancel a pending account deletion request

### Request

```typescript
POST /account/delete/cancel
Authorization: Bearer <jwt>

{
  "deletion_id": "del_550e8400-e29b-41d4-a716-446655440000"
}
```

### Response - Success (200 OK)

```json
{
  "success": true,
  "message": "Account deletion cancelled. Your account is active."
}
```

### Response - Error (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "DELETION_NOT_FOUND",
    "message": "Deletion request not found or already executed"
  }
}
```

### Side Effects

- Updates DeletionRequest.cancelled_at = NOW()
- Logs cancellation to AuditLog
- Queues confirmation email

---

## Authentication

### JWT Bearer Token Usage

All protected endpoints require Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Validation

- Signature verified with JWT_SECRET (HS256)
- Expiry checked (24 hours from issued_at)
- Token not in revoked list (AuthToken.revoked_at IS NULL)
- User still active (User.is_active = TRUE)

### Token Claims

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "device_id": "session_id",
  "iat": 1662604800,
  "exp": 1662691200
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      {
        "field": "fieldname",
        "error": "Specific error for this field"
      }
    ]
  },
  "timestamp": "2026-05-08T10:30:00Z",
  "request_id": "req_550e8400-e29b-41d4-a716-446655440000"
}
```

---

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Resource created |
| 202 | Accepted (async operation) |
| 204 | No content (success, no response body) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (auth failed) |
| 403 | Forbidden (account locked, inactive) |
| 404 | Not found |
| 409 | Conflict (email duplicate) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Security Headers

All responses include:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

## CORS Policy

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

---

## Example Usage (cURL)

### Register

```bash
curl -X POST https://api.example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test123!@#"}'
```

### Login

```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Test123!@#","device_name":"CLI"}'
```

### Protected Request (using JWT)

```bash
curl -X GET https://api.example.com/auth/sessions \
  -H "Authorization: Bearer eyJhbGc..."
```

### Password Reset

```bash
# Step 1: Request reset
curl -X POST https://api.example.com/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Step 2: Submit new password (token from email)
curl -X PUT https://api.example.com/auth/password-reset/TOKEN \
  -H "Content-Type: application/json" \
  -d '{"user_id":"550e8400...","new_password":"NewTest456!@#"}'
```
