<!--
SYNC IMPACT REPORT
==================
Version Change: v1.0.0 → v1.1.0

Modified Principles:
  • I. Clean Code (clarified measurable constraints)
  • II. TypeScript with Strict Mode (clarified boundary typing requirements)
  • III. Testing Pyramid with 80% Coverage (clarified CI and PR enforcement)
  • IV. JSDoc Documentation (clarified export-level documentation scope)

Added Sections:
  • None

Removed Sections:
  • None

Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md (Constitution Check converted to explicit gates)
  ✅ .specify/templates/tasks-template.md (testing changed from optional to constitution-driven mandatory)
  ✅ .specify/templates/spec-template.md (already aligned; no update required)
  ⚠ .specify/templates/commands/*.md (directory not present in repository; no action possible)

Runtime Guidance Updates:
  ✅ .github/copilot-instructions.md (already aligned; no update required)
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

### III. Testing Pyramid with 80% Coverage
The project MUST follow a testing pyramid target of 70% unit tests, 20%
integration tests, and 10% end-to-end tests. Business logic MUST maintain at
least 80% coverage in CI. Every critical path and regression fix MUST include
automated tests. PRs MUST include coverage output and MUST NOT reduce business
logic coverage below the threshold without explicit approval. Rationale: layered
testing balances speed and confidence while preventing silent regressions.

### IV. JSDoc Documentation (MANDATORY)
Every exported function, class, and module MUST include JSDoc. JSDoc MUST
include `@param`, `@returns`, and `@throws` when applicable. Complex logic MUST
include concise comments that explain intent and tradeoffs, not line-by-line
mechanics. Each package root MUST contain a README with purpose, usage, and
examples. Rationale: consistent documentation improves onboarding and lowers
maintenance cost.

## Technology Stack & Quality Standards

- **Language**: TypeScript (strict mode required)
- **Testing Frameworks**: Jest or Vitest (coverage reports mandatory)
- **Code Quality**: ESLint + Prettier (must pass pre-commit)
- **Version Control**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Documentation**: JSDoc + Markdown + inline comments

## Development Workflow

1. **Code Review Gate**: All PRs MUST verify compliance with all four principles
  before merge.
2. **Automated Quality Gate**: Type checking, linting, and tests MUST pass in CI
  before merge.
3. **Coverage Verification**: Feature and bug-fix PRs MUST include tests that
  preserve the 80% business-logic coverage floor.
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

**Version**: 1.1.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-11
