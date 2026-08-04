# Concrete Step-by-Step Orchestration Plan: KL Sync Frontend Redesign

## Phase 0: Survey & Architecture Discovery
- [ ] Dispatch 3 parallel survey subagents (`teamwork_preview_explorer` / `teamwork_preview_spec_miner`) to analyze existing codebase, project structure, component hierarchy, build/test scripts, styling framework, and exact feature requirements from `ORIGINAL_REQUEST.md`.
- [ ] Aggregate survey findings into `PROJECT.md` at project root (`C:\Users\speed\Documents\antigravity\optimistic-pascal\PROJECT.md`).

## Phase 1: Architecture & Milestone Decomposition (`PROJECT.md`)
- [ ] Define feature inventory mapping R1 (Landing, Login, Dashboard modules: Attendance, Timetable, Marks, Fee, Profile, Circulars, Hostels, Library, Tools), R2 (Cap CAPTCHA & ERP image captcha, clear feedback, error alerts), and R3 (Dark-mode, micro-interactions, glassmorphism, typography).
- [ ] Define modular milestones (3-7 milestones) with clear module boundaries and interface contracts.
- [ ] Establish parallel Dual Track: Implementation Track + E2E / Unit Testing Track.

## Phase 2: Milestone Execution & Quality Gates
- [ ] Iterative execution per milestone using the standard cycle:
  1. Explorer(s) analyze target files, dependencies, and fix strategy.
  2. Worker implements changes, verifies local build and tests.
  3. Reviewers (2) evaluate code quality, visual aesthetics, accessibility, and correctness.
  4. Challengers (2) stress test and verify edge cases.
  5. Forensic Auditor (`teamwork_preview_auditor`) verifies non-cheating, authentic implementations.
  6. Gate Check (`GATE_STATUS.md`): ALL pass -> advance; ANY fail -> iteration loop back with failure report.

## Phase 3: Final Acceptance & Quality Audit
- [ ] Verify `npm run build` (0 TS errors).
- [ ] Verify `npm run lint` (0 warnings/errors).
- [ ] Verify `npm run test` (all 30 tests pass cleanly).
- [ ] Verify responsive rendering across mobile (320px+), tablet, desktop, and ultra-wide viewports.
- [ ] Perform final forensic audit.
- [ ] Report victory to Sentinel & parent caller.
