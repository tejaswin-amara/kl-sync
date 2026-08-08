## 2026-08-07T20:49:27Z

Implement Milestone 4: E2E Testing Suite & Quality Verification.

REQUIREMENTS:
1. Opaque-Box E2E Test Suite (Tiers 1-4):
   - Create comprehensive test cases covering all 16 implemented features across Attendance, Timetable, Marks, Fee, Profile, Captcha, Scraper, AI Tools, AI Executor, and AI Chat API (`/api/ai/chat`).
   - Tier 1: Feature Coverage (happy path tests for isolated features).
   - Tier 2: Boundary & Corner Cases (empty inputs, missing parameters, invalid responses, network/502 errors, rate limits).
   - Tier 3: Cross-Feature Combinations (e.g. fetching attendance + calculating targets; fetching marks + predicting CGPA; chat API tool calling across multiple tools).
   - Tier 4: Real-World Scenarios (full end-to-end user workflows: login simulation -> data fetch -> AI query -> target calculation).
   - Integrate test suites so they run cleanly with `npm run test` (or `npx tsx --test`). Ensure all existing 148 unit tests plus all new tests pass 100%.

2. Agent-as-Judge Test Script:
   - Create `scripts/agent-as-judge.ts` (executable via `npx tsx scripts/agent-as-judge.ts`).
   - Programmatically exercise AI capabilities (`src/lib/ai/tools.ts`, `src/lib/ai/executor.ts`, `/api/ai/chat` handler) using representative queries ("What is my attendance?", "Calculate classes needed for 85%", "Predict CGPA", etc.).
   - Verify tool call execution, schema validation, response formatting, and error handling.
   - Must exit with code 0 on success and print clear pass/fail breakdown without crashing Node.

3. TEST_READY.md:
   - Create `TEST_READY.md` at project root following the format in PROJECT.md and the Project Pattern system prompt:
     - Test runner invocation commands
     - Coverage summary table across Tiers 1-4
     - Feature checklist table for features 1-16.

4. Static Analysis & Build Verification:
   - Run and verify:
     - `npx tsc --noEmit` (0 errors)
     - `npm run lint` (0 errors/warnings)
     - `npm run test` (all unit and E2E tests pass)
     - `npx tsx scripts/agent-as-judge.ts` (exit code 0)
     - `npm run build` (production build succeeds)
