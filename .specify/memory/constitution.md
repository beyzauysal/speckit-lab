<!-- 
SYNC IMPACT REPORT
==================
Version Change: v0.0.0 (template) → v1.0.0 (initialized)

Principles Established (4 total):
  • I. Clean Code (new)
  • II. TypeScript with Strict Mode (new)
  • III. Testing Pyramid with 80% Coverage (new)
  • IV. JSDoc Documentation (new)

New Sections Added:
  • Technology Stack & Quality Standards
  • Development Workflow
  • Governance

Template Files Alignment Status:
  ✅ spec-template.md - No changes needed (generic, supports all testing scenarios)
  ✅ plan-template.md - No changes needed (generic, supports all tech stacks)
  ✅ tasks-template.md - No changes needed (generic, supports all testing phases)

Documentation Update Status:
  ⚠ .github/copilot-instructions.md - References plan but is minimal (no action required)

Deferred Items: None - all placeholders completed

Constitution enforces:
  - TypeScript strict mode mandatory
  - 4 core principles as non-negotiable development standards
  - 80% coverage requirement on business logic
  - JSDoc documentation mandatory for all exports
  - Code review gates for principle compliance
-->

# SpecKit Lab Constitution

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)
Code MUST be readable, maintainable, and self-explanatory. All functions MUST follow single responsibility principle; complexity MUST be justified and documented. Names MUST be descriptive; abbreviations prohibited except where domain-standard. Code duplication MUST be eliminated through abstraction. Functions MUST be under 50 lines; nested conditions MUST be extracted. Rationale: Clean code reduces bugs, speeds maintenance, enables team collaboration.

### II. TypeScript with Strict Mode
All code MUST be written in TypeScript with `strict: true` enabled in tsconfig.json. No `any` types permitted without explicit justification in a code comment. Type inference MUST be preferred over explicit annotations where unambiguous. Union types MUST be specific; `unknown` MUST be used over `any`. Module boundaries MUST have explicit type exports. Rationale: Type safety prevents runtime errors; strict mode enforces compile-time verification.

### III. Testing Pyramid with 80% Coverage
Unit tests MUST form the pyramid base (70% of test count); integration tests MUST comprise 20%; end-to-end tests MUST comprise 10%. Business logic MUST achieve minimum 80% code coverage. All critical paths MUST have tests. Coverage MUST be tracked per PR. Rationale: Layered testing strategy balances speed with confidence; high coverage on business logic ensures reliability.

### IV. JSDoc Documentation (MANDATORY)
Every function, class, and module export MUST have JSDoc comments. JSDoc MUST include `@param`, `@returns`, and `@throws` tags where applicable. Complex logic MUST have inline comments explaining "why", not "what". README files MUST exist at package root with purpose, usage, and examples. Rationale: Documentation enables discoverability and reduces onboarding time.

## Technology Stack & Quality Standards

- **Language**: TypeScript (strict mode required)
- **Testing Frameworks**: Jest or Vitest (coverage reports mandatory)
- **Code Quality**: ESLint + Prettier (must pass pre-commit)
- **Version Control**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Documentation**: JSDoc + Markdown + inline comments

## Development Workflow

1. **Code Review Gate**: All PRs MUST verify compliance with four core principles before merge
2. **Pre-commit Checks**: TypeScript compilation, lint, and test coverage must pass
3. **Coverage Verification**: PRs adding features MUST include tests maintaining 80% coverage
4. **Documentation Review**: Reviewers MUST verify JSDoc completeness and accuracy

## Governance

This Constitution supersedes all other practices and MUST be verified in every code review. Amendments require documented rationale, team discussion, and migration plan for existing code. Violations are tracked as technical debt and prioritized accordingly.

**Version**: 1.0.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-08
