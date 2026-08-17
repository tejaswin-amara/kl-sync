# Original User Request

## Initial Request — 2026-08-17T03:14:25Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: full team

Execute a system-wide execution of the entire ponytail system (debt cleanup, audit, and review) on the codebase to remove over-engineering, then verify the frontend with the browser.

Working directory: C:\Users\speed\Documents\antigravity\optimistic-pascal
Integrity mode: development

## Requirements

### R1. Pay down Ponytail Debt
Find all `ponytail:` comments in the codebase. Resolve the debt they represent (such as hardcoded values or deferred mappings) and remove the comments. 

### R2. Ponytail Audit & Review
Audit `package.json` and components for over-engineering. Apply `ponytail-review` rules: YAGNI, standard library over external dependencies, and native elements over custom ones. Simplify the codebase without breaking functionality.

### R3. Browser Verification
Use the `browser` subagent tools to navigate to `http://localhost:3000/dashboard` and verify that the application correctly authenticates, routes, and renders after all the ponytail code removals.

## Verification Resources
- The project has a comprehensive test suite. Run `npm test` to verify changes.
- Ensure the project builds cleanly via `npx tsc --noEmit` and passes `npm run lint`.

## Acceptance Criteria

### Objective Checks
- [ ] No `ponytail:` debt comments remain in the codebase.
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm test` passes all tests.
- [ ] Browser subagent successfully logs in and navigates the dashboard without console errors.
