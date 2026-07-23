# Handoff Report: Scraper Endpoint Resilience & Table Parsing (Milestone M1 - Task R1)

**Agent**: Explorer 2 (Milestone M1)  
**Target Path**: `src/lib/scraper.ts`, `src/app/api/erp-proxy/[module]/route.ts`  
**Working Directory**: `C:\Users\speed\Documents\antigravity\optimistic-pascal\.agents\explorer_m1_2`  
**Date**: 2026-07-24  

---

## 1. Observation

Direct code observations from `src/lib/scraper.ts`, `src/app/api/erp-proxy/[module]/route.ts`, and frontend page components:

### A. Candidate Endpoint & Network Resilience Observations
1. **Single Point of Failure in Module Fetchers (`fetchAttendanceData`, `fetchMarksData`, `fetchEndExamResults`, `fetchGenericModuleData`)**:
   - `fetchAttendanceData` (`src/lib/scraper.ts:456-487`):
     - Line 468: `fetchWithJar(COURSE_LIST_URL, jar, ...)` calls a single static URL (`COURSE_LIST_URL`).
     - Lacks session expiration check (`html.includes('id="login-form"')`). If session expires, raw login HTML is passed to table parser.
   - `fetchMarksData` (`src/lib/scraper.ts:618-645`):
     - Line 631: `fetchWithJar(ERP_ENDPOINTS['marks'], jar, ...)` tries only 1 static URL.
   - `fetchEndExamResults` (`src/lib/scraper.ts:647-673`):
     - Line 659: `fetchWithJar(ERP_ENDPOINTS['end-exam'], jar, ...)` tries only 1 static URL.
   - `fetchGenericModuleData` (`src/lib/scraper.ts:489-516`):
     - Line 495: `fetchWithJar(targetUrl, jar, ...)` uses a single GET request for 7 modules (`fee`, `profile`, `cgpa`, `exam-seating`, `circulars`, `hostel`, `library`).

2. **Flaws in `fetchTimetableData` Fallback Loop (`src/lib/scraper.ts:520-616`)**:
   - Lines 554-613:
     ```ts
     for (const url of candidateUrls) {
       try {
         // 1. Try POST with form params
         const res = await fetchWithJar(url, jar, ...);
         ...
         // 2. Try GET with query parameters
         ...
         // 3. Try plain GET
         ...
       } catch (err) {
         console.error(`Failed timetable fetch for ${url}:`, err);
       }
     }
     ```
   - **Observation**: All 3 request strategies (POST, GET with params, Plain GET) for a candidate URL are wrapped inside a single outer `try` block. If strategy 1 throws a network exception (e.g. `TypeError: fetch failed`, `ECONNRESET`, or socket timeout), execution jumps straight to `catch` at line 610, skipping strategies 2 and 3 for that URL.
   - **Observation**: If all candidate URLs fail or return empty data, line 615 returns `{ success: true, data: [] }`. The caller receives `success: true` with an empty array, hiding fetch/session failures behind an empty result.

3. **HTTP Status & Network Timeout Deficiencies (`src/lib/scraper.ts:74-120`)**:
   - Line 96: `fetchWithJar` executes `fetch(currentUrl, ...)` without `AbortSignal.timeout(...)`. A hung ERP socket blocks node process execution indefinitely.
   - Line 117: `fetchWithJar` returns `res` without checking `res.ok` or HTTP status code (e.g. 500, 502, 503, 403, 404). Callers proceed to call `res.text()` without validating HTTP status.

### B. Generic Table Parsing Observations (`parseGenericTable`, `src/lib/scraper.ts:379-454`)
1. **Single Table Selection Logic (`src/lib/scraper.ts:382-390`)**:
   - Lines 384-389:
     ```ts
     $('table').each((_i, el) => {
       const rowCount = $(el).find('tr').length;
       if (rowCount > maxRows) {
         maxRows = rowCount;
         table = $(el);
       }
     });
     ```
   - **Observation**: Selects solely the table with the highest total `tr` count. If a page has multiple data tables (e.g., Mid 1 and Mid 2 marks tables, or Fee breakdown tables), all other tables are discarded. If a page contains a wrapper/layout table with many nested rows, the layout table is incorrectly selected.

2. **Header Extraction Flaws (`src/lib/scraper.ts:394-411`)**:
   - Line 395: `const hasThead = table.find('thead tr').length > 0;`
   - Line 396: `let headerRow = hasThead ? table.find('thead tr').last() : table.find('tr').first();`
   - **Observation**:
     - `table.find('tr').first()` will select a top title banner row (e.g. `<tr class="header"><td colspan="8">STUDENT MARKS SUMMARY</td></tr>`) when `<thead>` is missing. This banner cell becomes the sole header key (`STUDENT MARKS SUMMARY`), destroying column alignment for all rows.
     - `thead tr.last()` selects only the lowest row in multi-row headers, discarding top-level category context.

3. **Cell Selection & Alignment Flaws (`src/lib/scraper.ts:426-447`)**:
   - Line 426: `const cells = $(row).find('td, th');`
   - **Observation**: `$(row).find('td, th')` searches recursively into child subtrees. If a cell contains a nested `<table>`, `<div>`, or sub-grid, `cells` includes all `td`s of the nested structure, corrupting cell indexing.
   - **Observation**: `colspan` and `rowspan` are not handled. A cell with `colspan="2"` reduces the row's cell count, causing subsequent cells to map to incorrect header keys (`headers[j]`).
   - **Observation**: Plain text extraction `clone.text().replace(/\s+/g, ' ').trim()` strips HTML links (`<a href="...">`), dropping document download URLs (e.g., circular attachments, library resource links).

---

## 2. Logic Chain

1. **Endpoint Resilience Logic**:
   - *Premise*: ERP deployments (Yii framework) frequently vary route parameters, rename endpoint controllers, or return HTTP 500/502 error pages during peak load.
   - *Deduction*: A resilient fetcher must not rely on a single URL or request method. It must attempt prioritized candidate URLs and fallback request strategies (POST with model params -> GET with query params -> GET plain).
   - *Inference*: Each strategy attempt must be individually wrapped in a `try-catch` block with an `AbortSignal` timeout (e.g., 10–12 seconds). HTTP status codes (`res.ok`) and session validity (`login-form`, `site/login`, `Session expired`) must be validated before attempting table parsing.
   - *Inference*: If all candidate attempts fail, the function must throw an explicit error rather than returning `{ success: true, data: [] }`, enabling `erp-proxy` to return an appropriate HTTP status (401 for session expiry, 500 for network/ERP failure).

2. **Table Parsing Logic**:
   - *Premise*: Raw ERP HTML tables present non-standard structures: banner rows, missing `<thead>` tags, filter inputs, `colspan`/`rowspan` attributes, and nested tables inside cells.
   - *Deduction*:
     - To prevent nested table contamination, cell selection must be scoped to direct child cells using `$row.children('td, th')`.
     - Header selection must scan initial table rows, skip full-width title banner rows (`colspan` >= total columns), and clean header strings (strip sorting icons, remove excess whitespace, handle `<br>` tags).
     - Cell extraction must account for `colspan` by expanding values or padding column indices to maintain header-to-column alignment.
     - Link attributes (`<a href="...">`) should be preserved alongside plain text when links are present.

---

## 3. Caveats

- **Unexplored Areas**:
  - Live network tests against `https://newerp.kluniversity.in` were not executed during read-only investigation (working in CODE_ONLY mode).
  - Specific captcha OCR solving logic in `src/lib/ocr.ts` was not modified as it is outside the scope of M1 endpoint resilience and table parsing.
- **Assumptions**:
  - The ERP backend continues to run on Yii/Yii2 PHP framework structures.
  - Existing frontend pages expect parsed table data as an array of row objects (`Record<string, any>[]`) where keys correspond to header names.

---

## 4. Conclusion

The current `src/lib/scraper.ts` implementation suffers from brittle single-endpoint fetchers, unsafe try-catch scoping in `fetchTimetableData`, missing HTTP timeout/status checks, and rigid table parsing in `parseGenericTable` that fails on banner rows, `colspan`, and nested tables.

### Proposed Implementation Strategy:

1. **Refactor `fetchWithJar`**:
   - Add `AbortSignal.timeout(12000)` to all `fetch` calls.
   - Add status code validation (`res.ok`) and standardize header keys.

2. **Centralize & Expand Candidate Endpoints**:
   - Define a `MODULE_CANDIDATES` dictionary mapping each module (`timetable`, `marks`, `end-exam`, `attendance`, `fee`, etc.) to a prioritized list of candidate URLs and payload parameter formats.
   - Refactor `fetchTimetableData`, `fetchMarksData`, `fetchEndExamResults`, `fetchAttendanceData`, and `fetchGenericModuleData` to use a unified execution engine (`fetchResilientModuleData`) that executes fallback strategies cleanly across candidate URLs.

3. **Enhance `parseGenericTable`**:
   - Use `$row.children('td, th')` to isolate row cells.
   - Implement title-banner detection to skip full-width banner rows during header identification.
   - Sanitize header text (strip sort arrows, collapse spaces, handle `<br>`).
   - Implement `colspan` column index alignment.
   - Preserve hyperlink targets (`href`) when present in cells.
   - Support parsing multiple data tables when present.

---

## 5. Verification Method

To verify the implementation once applied by the implementer:

1. **Lint & Type Check**:
   ```bash
   npm run lint
   ```
2. **Build Verification**:
   ```bash
   npm run build
   ```
3. **Unit / Integration Inspection**:
   - Inspect `src/lib/scraper.ts` to confirm `fetchWithJar` handles timeouts and HTTP status checks.
   - Verify `parseGenericTable` correctly processes HTML snippets containing banner rows, `colspan`, and nested tables.
   - Confirm `erp-proxy` handles error propagation cleanly without masking fetch failures as empty `success: true` responses.
