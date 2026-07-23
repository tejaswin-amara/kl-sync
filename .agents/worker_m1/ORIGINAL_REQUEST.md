## 2026-07-23T19:17:29Z
You are the Implementation Worker for Milestone M1 (R1. Robust Scraper Table Parsing & Candidate Endpoint Resilience).
Your working directory is C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m1.
Project root is C:\Users\speed\Documents\antigravity\optimistic-pascal.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task Scope (Requirement R1):
Improve `parseGenericTable` and `fetchTimetableData` (and related module fetchers) in `src/lib/scraper.ts` and `src/app/api/erp-proxy/[module]/route.ts` to handle arbitrary table structures, nested HTML elements, missing table headers, and varied ERP response endpoints gracefully without throwing unhandled exceptions or returning empty data structures.

Specific Requirements to Implement:
1. `parseGenericTable`:
   - Add top-level safety: handle empty, null, or non-string input safely, returning `[]`.
   - Strip `<script>`, `<style>`, `<noscript>`, and HTML comments before Cheerio parsing.
   - Implement Table Scoring & Selection: pick the best data table using direct child row evaluation (`> tr`, `> tbody > tr`, `> thead > tr`), scoring TH tags, data rows, and avoiding nested layout tables or navigation menus.
   - Implement 2D Grid Matrix Resolver: accurately map `colspan` and `rowspan` attributes into a 2D matrix so cell indices match header names without column shift or missing keys.
   - Title Banner Skipping: detect and skip full-width single-cell title banner rows (`colspan` >= total cols or single title cell) when identifying column header row.
   - Direct-Child Cell Selection: scope cell selection to direct row children (`> th, > td`) to isolate rows from nested tables.
   - Cell Text Normalization: inject spaces around `<br>`, `<div>`, `<p>`, `<span>`, `<li>`, normalize `&nbsp;` (`\u00a0`) to space, collapse whitespace `\s+`, and trim.
   - Filter Garbage Rows: skip empty rows, notice rows ("No results found", "No records found", "Nil"), and pagination/summary control rows.
   - Link Preservation: optional support for extracting hyperlink `href` values.
2. `fetchTimetableData` & ERP Candidate Endpoints:
   - Add timeout (`AbortSignal.timeout(12000)`) and validate HTTP response status (`res.ok`).
   - Wrap candidate URL request strategies (POST with form params, GET with params, Plain GET) in individual try-catch blocks so one failed request strategy does not abort remaining fallbacks for that URL.
   - Expand candidate URLs for timetable endpoints.
   - Add `isLikelyTimetableData` helper to validate that parsed table objects are actual timetable data (containing day/time/course keywords) rather than sidebar navigation menus.
   - Proper Session Expiry Handling: when `html.includes('id="login-form"')`, throw or propagate session expiry error so `erp-proxy` returns HTTP 401 instead of returning `{ success: true, data: [] }`.

Verification Required:
- Run `npm run build` and ensure 0 TypeScript and Next.js build errors.
- Document all changes and build output in `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\worker_m1\handoff.md`.
- Send a completion message back to parent orchestrator.
