# Quickstart: User Authentication System

**Feature**: User Authentication System (001-user-auth)  
**Date**: 2026-05-08  
**Status**: Phase 1c Quickstart Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone & Install](#clone--install)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Run Tests](#run-tests)
6. [Start Dev Server](#start-dev-server)
7. [Example API Calls](#example-api-calls)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Node.js**: Version 18.0 or higher
  ```bash
  node --version  # Should output v18.x.x or higher
  ```

- **npm**: Version 8.0 or higher (comes with Node.js)
  ```bash
  npm --version   # Should output 8.x.x or higher
  ```

- **PostgreSQL**: Version 12 or higher
  ```bash
  psql --version  # Should output PostgreSQL 12+
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

### Optional

- **Docker**: For containerized PostgreSQL (recommended)
  ```bash
  docker --version  # If using Docker Compose for database
  ```

- **VS Code**: Recommended editor
- **Insomnia** or **Postman**: For testing API endpoints

---

## Clone & Install

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/speckit-lab.git
cd speckit-lab
```

### 2. Checkout Feature Branch

```bash
git checkout 001-user-auth
```

### 3. Install Dependencies

```bash
npm install
```

**Expected output**:
```
added 450 packages in 12.5s
```

### 4. Verify Installation

```bash
npm run build
```

**Expected output**:
```
Successfully compiled 45 files in TypeScript
```

---

## Environment Setup

### 1. Create `.env` File

Copy the template:

```bash
cp .env.example .env
```

### 2. Edit `.env` with Your Configuration

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_system
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-change-in-production-min-32-chars
JWT_EXPIRY=24h

# Refresh Token
REFRESH_SECRET=your-refresh-secret-change-in-production-min-32-chars
REFRESH_EXPIRY=30d

# Email (using nodemailer for testing)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your-ethereal-user@ethereal.email
EMAIL_PASSWORD=your-ethereal-password
EMAIL_FROM=noreply@auth-system.local

# Redis (for email queue - BullMQ)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

### 3. Generate Secure Secrets

```bash
# Generate JWT_SECRET (32+ random characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Update `.env` with generated secrets**

---

## Database Setup

### Option A: PostgreSQL with Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name auth-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=auth_system \
  -p 5432:5432 \
  -d postgres:15

# Verify container is running
docker ps | grep auth-postgres
```

### Option B: PostgreSQL Locally Installed

```bash
# Start PostgreSQL service
# macOS (using Homebrew)
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Windows: Use PostgreSQL installer or WSL
```

### Create Database & User (if not using Docker)

```bash
psql -U postgres

# In psql prompt:
CREATE DATABASE auth_system;
CREATE USER auth_user WITH PASSWORD 'auth_password';
ALTER ROLE auth_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE auth_system TO auth_user;
\q
```

### Run Migrations

```bash
# This creates all tables (User, AuthToken, RefreshToken, etc.)
npm run migrate:up

# Expected output:
# ✓ 001_create_users_table.sql (12ms)
# ✓ 002_create_auth_tokens_table.sql (8ms)
# ✓ 003_create_refresh_tokens_table.sql (8ms)
# ✓ 004_create_session_metadata_table.sql (10ms)
# ✓ 005_create_login_attempts_table.sql (7ms)
# ✓ 006_create_queued_emails_table.sql (9ms)
# ✓ 007_create_deletion_requests_table.sql (8ms)
# ✓ 008_create_audit_logs_table.sql (10ms)
# ✓ 009_create_password_resets_table.sql (7ms)
# Total: 9 migrations in 79ms
```

### Verify Database Tables

```bash
psql -U postgres -d auth_system -c "\dt"

# Expected output (all 9 tables):
# audit_logs
# auth_tokens
# deletion_requests
# login_attempts
# password_resets
# queued_emails
# refresh_tokens
# session_metadata
# users
```

### (Optional) Start Redis for Email Queue

```bash
# Docker
docker run --name auth-redis \
  -p 6379:6379 \
  -d redis:7

# Or locally (macOS with Homebrew)
brew services start redis
```

---

## Run Tests

### Unit Tests (Fast - 70% of tests)

```bash
npm run test:unit

# With coverage
npm run test:unit -- --coverage

# Expected output:
# PASS  tests/unit/services/AuthService.test.ts
# PASS  tests/unit/services/PasswordService.test.ts
# PASS  tests/unit/services/TokenService.test.ts
# PASS  tests/unit/utils/validators.test.ts
#
# Test Suites: 4 passed, 4 total
# Tests: 45 passed, 45 total
# Coverage: 72% statements, 68% branches, 70% functions, 71% lines
```

### Integration Tests (20% of tests - requires database)

```bash
npm run test:integration

# Expected output:
# PASS  tests/integration/auth.integration.test.ts
# PASS  tests/integration/session.integration.test.ts
#
# Test Suites: 2 passed, 2 total
# Tests: 18 passed, 18 total
```

### E2E Tests (10% of tests - full user journeys)

```bash
npm run test:e2e

# Expected output:
# PASS  tests/e2e/registration-flow.test.ts
# PASS  tests/e2e/login-flow.test.ts
#
# Test Suites: 2 passed, 2 total
# Tests: 9 passed, 9 total
```

### Run All Tests

```bash
npm test

# Runs unit → integration → e2e in sequence
# Expected output:
# Test Suites: 8 passed, 8 total
# Tests: 72 passed, 72 total
# Coverage: 81% statements (exceeds 80% target)
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

---

## Start Dev Server

### 1. Verify Environment

```bash
npm run check:env

# Expected output:
# ✓ NODE_ENV = development
# ✓ PORT = 3000
# ✓ DATABASE = auth_system @ localhost:5432
# ✓ REDIS = localhost:6379
# ✓ JWT_SECRET = [configured]
```

### 2. Start Server

```bash
npm run dev

# Expected output:
# [auth-service] listening on http://localhost:3000
# [database] connected to postgres://auth_user@localhost:5432/auth_system
# [redis] connected to redis://localhost:6379
# [email-queue] worker started (listening for jobs)
```

### 3. Verify Server is Running

In another terminal:

```bash
curl -X GET http://localhost:3000/health

# Expected output:
# {"status":"ok","timestamp":"2026-05-08T10:30:00Z","uptime":2.3}
```

---

## Example API Calls

### 1. Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#"
  }'

# Expected response (201 Created):
# {
#   "success": true,
#   "user_id": "550e8400-e29b-41d4-a716-446655440000",
#   "email": "john.doe@example.com",
#   "created_at": "2026-05-08T10:30:00Z",
#   "message": "Registration successful. Confirmation email queued."
# }
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!@#",
    "device_name": "My MacBook"
  }'

# Expected response (200 OK):
# {
#   "success": true,
#   "user_id": "550e8400-e29b-41d4-a716-446655440000",
#   "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "jwt_expires_in": 86400,
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refresh_token_expires_in": 2592000,
#   "session_id": "session_550e8400..."
# }
```

**Store tokens**:
```bash
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Call Protected Endpoint (using JWT)

```bash
curl -X GET http://localhost:3000/auth/sessions \
  -H "Authorization: Bearer $JWT"

# Expected response (200 OK):
# {
#   "success": true,
#   "sessions": [
#     {
#       "session_id": "session_550e8400...",
#       "device_name": "My MacBook",
#       "device_type": "web",
#       "ip_address": "127.0.0.1",
#       "last_activity_at": "2026-05-08T10:30:00Z",
#       "created_at": "2026-05-08T10:30:00Z",
#       "is_current": true
#     }
#   ]
# }
```

### 4. Refresh JWT Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"

# Expected response (200 OK):
# {
#   "success": true,
#   "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "jwt_expires_in": 86400,
#   "message": "Token refreshed successfully"
# }
```

### 5. Password Reset Request

```bash
curl -X POST http://localhost:3000/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "john.doe@example.com"}'

# Expected response (200 OK):
# {
#   "success": true,
#   "message": "If email exists, password reset link will be sent within 5 minutes"
# }

# Email will be queued. Check server logs for reset token.
```

### 6. Logout

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"all_devices": false}'

# Expected response (200 OK):
# {
#   "success": true,
#   "message": "Logged out successfully"
# }
```

---

## Troubleshooting

### Database Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (macOS)
brew services start postgresql

# Or check Docker
docker ps | grep postgres
```

### Port 3000 Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution**:
```bash
# Use different port
PORT=3001 npm run dev

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Migrations Failed

```
Error: relation "users" does not exist
```

**Solution**:
```bash
# Run migrations
npm run migrate:up

# Or reset (development only)
npm run migrate:reset
```

### JWT Token Invalid

```
Error: invalid signature
```

**Solution**:
- JWT_SECRET changed in .env after token was issued
- Use same JWT_SECRET as when token was issued
- Regenerate token via login

### Tests Failing

```
FAIL tests/unit/AuthService.test.ts
```

**Solution**:
```bash
# Clear Jest cache
npm run test -- --clearCache

# Run in verbose mode
npm run test:unit -- --verbose

# Run specific test file
npm run test tests/unit/AuthService.test.ts
```

### Email Not Sending

```
EmailQueue: Failed to send email (connection timeout)
```

**Solution**:
- Check EMAIL_HOST, EMAIL_PORT in .env
- Verify REDIS_URL (email queue requires Redis)
- Check email provider credentials
- Use Ethereal (fake SMTP) for testing:
  1. Visit https://ethereal.email
  2. Create test account
  3. Update EMAIL_* variables in .env
  4. Check email preview in Ethereal dashboard

### Redis Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**:
```bash
# Start Redis
docker run -p 6379:6379 -d redis:7

# Or macOS
brew services start redis

# Or disable Redis (email will fail - development only)
# Comment out email queue startup in src/index.ts
```

---

## Project Structure

```
.
├── src/
│   ├── index.ts                 # Express app entry point
│   ├── config/
│   │   ├── database.ts
│   │   └── jwt.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── AuthToken.ts
│   │   └── ... (9 entities)
│   ├── services/
│   │   ├── AuthService.ts       # Registration, login
│   │   ├── TokenService.ts      # JWT validation, refresh
│   │   └── ... (8 services)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── ... (other routes)
│   └── middleware/
│       ├── auth.ts              # JWT verification
│       └── errorHandler.ts
├── tests/
│   ├── unit/                    # 70% of tests
│   ├── integration/             # 20% of tests
│   └── e2e/                     # 10% of tests
├── migrations/
│   ├── 001_create_users_table.sql
│   └── ... (9 migrations)
├── .env.example
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## Next Steps

1. ✅ **Setup complete** - Server running on http://localhost:3000
2. **Explore API** - Try example curl commands above
3. **Run tests** - `npm test` to verify everything works
4. **Review code** - Start in src/services/AuthService.ts
5. **Modify features** - Add phone verification, email confirmation, etc.
6. **Deploy** - Use Docker Compose for production

---

## Additional Resources

- **API Documentation**: See `contracts/auth-endpoints.md`
- **Data Model**: See `data-model.md`
- **Technical Decisions**: See `research.md`
- **Feature Specification**: See `spec.md`
- **Implementation Plan**: See `plan.md`

---

## Support

- **Issues**: Check existing GitHub issues or create new
- **Documentation**: See specs/001-user-auth/ directory
- **Code Comments**: JSDoc on all exported functions
- **Tests**: Review tests/ directory for usage examples

---

## Development Workflow

1. **Make changes** in `src/`
2. **Write tests** in `tests/`
3. **Verify tests pass**: `npm test`
4. **Verify coverage**: `npm run test:coverage` (minimum 80%)
5. **Check TypeScript**: `npm run type-check`
6. **Lint code**: `npm run lint`
7. **Commit changes**: `git commit -am "feat: description"`

---

**Ready to start building!** 🚀
