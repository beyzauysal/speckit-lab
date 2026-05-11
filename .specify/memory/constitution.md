<!--
SYNC IMPACT REPORT
==================
Version Change: v1.2.3 → v1.2.4

Modified Principles:
  • III. Testing Principles (Section 8 added: tools, versions, commands, pre-commit, CI/CD; old 8-10 renumbered 9-11)

Added Sections:
  • None

Removed Sections:
  • None

Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md (already aligned)
  ✅ .specify/templates/tasks-template.md (already aligned)
  ✅ .specify/templates/spec-template.md (already aligned)
  ⚠ .specify/templates/commands/*.md (directory not present in repository; no action possible)

Runtime Guidance Updates:
  ✅ .github/copilot-instructions.md (already aligned)
  ✅ specs/001-user-auth/quickstart.md (already aligned; no update required)

Deferred Items:
  • None
-->

# SpecKit Lab Constitution

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)
Code MUST be readable, maintainable, and self-explanatory. Functions MUST follow
single-responsibility, and complexity MUST be justified in code comments where
it cannot be reduced. Names MUST be descriptive, with abbreviations allowed only
for domain-standard terms. Duplication MUST be removed through safe abstraction.
Functions SHOULD remain under 50 lines; exceptions MUST include rationale in the
PR description. Rationale: clean code reduces defects and review time while
preserving long-term maintainability.

### II. TypeScript with Strict Mode
All code MUST be written in TypeScript with `strict: true` enabled in
tsconfig.json. `any` MUST NOT be used unless explicitly justified with an inline
comment and tracked in PR review notes. Type inference SHOULD be preferred where
unambiguous. `unknown` MUST be used instead of `any` for untrusted inputs.
Module and service boundaries MUST declare explicit exported types. Rationale:
strict typing prevents runtime failures and preserves refactor safety.

### III. Testing Principles (MANDATORY)
All development MUST follow the Testing Principles section below. Tests MUST be
designed before implementation, aligned to product specifications, and validated
through automated quality gates. Rationale: testing-first development preserves
behavioral correctness and prevents regressions in auth-critical systems.

### IV. JSDoc Documentation (MANDATORY)
Every exported function, class, and module MUST include JSDoc. JSDoc MUST
include `@param`, `@returns`, and `@throws` when applicable. Complex logic MUST
include concise comments that explain intent and tradeoffs, not line-by-line
mechanics. Each package root MUST contain a README with purpose, usage, and
examples. Rationale: consistent documentation improves onboarding and lowers
maintenance cost.

## Testing Principles

### Section 1 - Testing Philosophy
- Development MUST follow Test-Driven Development (TDD).
- Work MUST progress in RED-GREEN-REFACTOR cycles.
- Tests MUST be written FIRST before implementation code.
- Tests MUST be generated from product specifications and acceptance scenarios,
  not reverse-engineered from implementation details.
- Each task definition MUST include explicit failing-test criteria before coding.
- Refactor steps MUST preserve behavior and MUST NOT remove assertions.

### Section 2 - Coverage Requirements
- Testing pyramid distribution MUST target approximately 70% unit, 20%
  integration, and 10% end-to-end tests.
- Unit tests MUST cover services, utilities, and business logic.
- Integration tests MUST cover Express API endpoints and PostgreSQL operations.
- E2E tests MUST cover critical user workflows only.
- Static analysis MUST pass with TypeScript strict mode and ESLint.
- Coverage thresholds in CI MUST be: >=80% line, >=75% branch, >=75% mutation
  score.
- Coverage exceptions MUST be approved in PR review with rationale and expiry.
- New modules SHOULD meet thresholds at introduction time; retroactive fixes MUST
  be scheduled with owner and milestone when not immediately feasible.

### Section 3 - Test Types & Organization
- Unit tests MUST be placed under `tests/unit/**/*.test.ts` and SHOULD mirror
  the `src/` directory structure.
- Integration tests MUST be placed under `tests/integration/**/*.test.ts` and
  grouped by feature (for example: auth, sessions, password-reset).
- E2E tests MUST be placed under `tests/e2e/**/*.spec.ts` and grouped by user
  journey.
- One unit test file MUST exist per source file that contains business logic.
- Unit test suites MUST use Jest and isolate services, utilities, controllers,
  and JWT/bcrypt helpers.
- Integration suites MUST use Jest + Supertest with PostgreSQL-backed flows to
  validate route, middleware, and persistence behavior together.
- E2E suites MUST use Playwright and focus on critical authentication journeys
  only.

### Section 4 - Naming Conventions
- Unit and integration test file names MUST use `ComponentName.test.ts`.
- E2E test file names MUST use `user-journey-name.spec.ts`.
- Test suites MUST follow `describe('ComponentName', ...)` for unit and
  integration tests, and `describe('User Journey: <name>', ...)` for E2E.
- Test cases MUST follow `it('should do X when Y', ...)`.
- Test names MUST express behavior and expected outcome, not implementation
  details.

### Section 5 - Test Anatomy
- Primary test structure MUST follow Arrange-Act-Assert.
- `beforeEach` MUST be used for test-specific setup; `beforeAll` MUST be
  avoided unless setup is immutable and safe for isolation.
- Each test MUST be independent and runnable alone.
- Shared global state is prohibited across test files and suites.
- For Express + Supertest integration tests, request/app/database setup MUST be
  reset per test or per suite with deterministic cleanup.
- For JWT/bcrypt tests, secrets and hashing configuration MUST be explicit and
  local to test context to avoid hidden coupling.

### Section 6 - Mocking & Test Data
- External services (email providers, third-party APIs) MUST be mocked at the
  service boundary in unit tests.
- Time-dependent functions (`Date.now()`, timers, JWT expiry checks) MUST be
  stubbed using Jest fake timers or explicit fixed timestamps.
- PostgreSQL integration tests MUST use a dedicated test database; test
  containers MAY be used where suite-level isolation is required.
- Complex authentication data (users, tokens, sessions) MUST be created via
  shared test fixture helpers rather than inline ad-hoc objects.
- Projects MUST expose helpers such as `createTestUser()`, `createAuthToken()`,
  `setupMockEmailProvider()`, and `setupTestDatabase()` in a shared
  `tests/helpers/` module.
- Code we own MUST NOT be mocked in unit tests: services, business-logic
  modules, simple utilities, and auth helpers such as password hashing or JWT
  signing MUST be exercised through real invocations.
- Mocks and stubs MUST be reset in `afterEach` to prevent cross-test leakage.

### Section 7 - Quality Criteria

**What Makes a Good Test**
- A test MUST assert observable behavior, not internal implementation details.
- Assertions MUST be meaningful; tautological assertions such as
  `expect(x).toBe(x)` are prohibited.
- Each test MUST cover exactly one behavior or scenario.
- Unit tests MUST complete in under 1 second; integration tests MUST complete
  in under 5 seconds.
- Tests MUST be deterministic and produce the same result on every run.

**Quality Gates**
- Mutation score MUST meet >=75% using Stryker for TypeScript on business-
  critical modules.
- Always-true assertions are prohibited; CI MUST report any detected cases.
- All expected values and test oracles MUST be human-validated before merge.
- Coverage targets remain >=80% line and >=75% branch (Section 2).

**Anti-Patterns (Prohibited)**
- Testing private methods or internal state.
- Interdependent tests where execution order affects outcome.
- Brittle tests that break on safe, behavior-preserving refactoring.
- Flaky tests with intermittent failures left unresolved.
- Tests that contain no assertions.
- Copy-pasted test logic that can be extracted into a shared helper.

### Section 8 - Tools & Stack

**Static Analysis**
- TypeScript strict mode (tsconfig.json `strict: true`) MUST pass on every
  build.
- ESLint MUST be configured for TypeScript and MUST pass with no errors.

**Unit & Integration Testing**
- Jest 29.x is the REQUIRED test runner for unit and integration suites.
- ts-jest MUST be used as the TypeScript preprocessor for Jest.
- Supertest MUST be used for Express API integration tests; it MUST receive the
  configured Express app instance, not a running server.
- `jest.expect()` assertions and Jest mocks (`jest.fn()`, `jest.spyOn()`,
  `jest.mock()`) are the REQUIRED assertion and mocking APIs.

**End-to-End Testing**
- Playwright 1.40 or higher is the REQUIRED E2E test runner.
- Playwright tests MUST target critical authentication user journeys only.

**Coverage & Mutation Quality**
- Jest coverage (via `--coverage`) MUST enforce: >=80% line, >=75% branch.
- Stryker mutation testing MUST enforce >=75% mutation score on business-
  critical modules (services, auth logic, token handling).

**Execution Commands**

All commands MUST be defined in `package.json` scripts and be reproducible in
CI without additional environment setup:

| Command | Purpose |
|---|---|
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint across the codebase |
| `npm test` | Full test suite (unit + integration) |
| `npm run test:unit` | Unit tests only (`tests/unit/**`) |
| `npm run test:integration` | Integration tests only (`tests/integration/**`) |
| `npm run test:e2e` | Playwright E2E tests (`tests/e2e/**`) |
| `npm run test:coverage` | Full suite with coverage report |
| `npm run test:mutation` | Stryker mutation test run |

**Pre-Commit Gates**
- Pre-commit hooks MUST execute `typecheck`, `lint`, and `test:unit` in that
  order before any commit is accepted.
- Pre-commit failures MUST block the commit; `--no-verify` bypasses are
  prohibited unless a PR documents and team approves the skip reason.

**CI/CD Gates**
- All CI pipelines on the main branch MUST run: `typecheck`, `lint`, `test`,
  `test:e2e`, `test:coverage`, and `test:mutation`.
- Any pipeline stage failure MUST block merges and release tagging.
- Coverage and mutation reports MUST be published as CI artifacts.

### Section 9 - CI/CD Quality Gates
- Pull requests MUST fail when any required test stage fails.
- CI MUST execute unit, integration, E2E (when impacted), lint, and type-check
  pipelines.
- CI MUST enforce the line/branch/mutation thresholds in Section 2.
- Mutation testing MAY run on a scheduled pipeline for full scope, but PRs that
  modify auth-critical code MUST run targeted mutation checks.
- Test reports MUST be attached or linked in each PR.
- Merge protection MUST require successful status checks for lint, type-check,
  and required test tiers.
- Failing gates MUST block release tagging until resolved or formally waived.

### Section 10 - Security and Authentication Testing
- Password workflows MUST verify bcrypt hashing and verification behavior.
- Token workflows MUST verify JWT issuance, signature validation, expiry,
  refresh, and revocation paths.
- Login hardening tests MUST cover brute-force protection and lockout behavior
  when those features are enabled.
- Sensitive fields (password hash, secrets, tokens) MUST NOT appear in logs or
  API responses.
- Authorization tests MUST verify protected routes reject missing/invalid tokens
  and honor role/permission constraints.
- Refresh-token rotation and revocation tests MUST cover replay and reuse
  prevention behavior.

### Section 11 - Ownership and Governance
- Every feature and bug fix MUST include corresponding automated tests.
- Reviewers MUST block merges that violate testing philosophy or thresholds.
- Any temporary test exclusion MUST include rationale, owner, and expiry date.
- Testing policy compliance MUST be reviewed at least once per release cycle.
- Changes to testing policy MUST be versioned under this Constitution.
- Each release candidate MUST include a documented test summary against these
  principles.
- Governance reviews MUST track repeated failure patterns and assign corrective
  actions.

## Technology Stack & Quality Standards

- **Language**: TypeScript (strict mode required)
- **Testing Frameworks**: Jest + Supertest + Playwright + Stryker
- **Code Quality**: ESLint + Prettier (must pass pre-commit)
- **Version Control**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Documentation**: JSDoc + Markdown + inline comments

## Development Workflow

1. **Code Review Gate**: All PRs MUST verify compliance with all four principles
  before merge.
2. **Automated Quality Gate**: Type checking, linting, and tests MUST pass in CI
  before merge.
3. **Coverage Verification**: Feature and bug-fix PRs MUST preserve >=80% line,
  >=75% branch, and >=75% mutation thresholds.
4. **Documentation Review**: Reviewers MUST verify JSDoc and README updates for
  changed exports.

## Governance

This Constitution supersedes conflicting local practices and MUST be enforced in
code review, CI policy, and planning artifacts.

Amendment Procedure:
1. Proposed amendment MUST include rationale, impacted principles/sections, and
  migration impact.
2. At least one maintainer review MUST approve the amendment.
3. Related templates and guidance documents MUST be updated in the same change.

Versioning Policy:
- MAJOR: backward-incompatible governance or principle removals/redefinitions.
- MINOR: new principles/sections or materially expanded mandatory guidance.
- PATCH: clarifications, wording improvements, and non-semantic refinements.

Compliance Review Expectations:
- Every PR MUST complete a constitution compliance check.
- Violations MUST be logged as technical debt with owner and due milestone.
- A lightweight governance review MUST run at least once per release cycle.

**Version**: 1.2.4 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-11
