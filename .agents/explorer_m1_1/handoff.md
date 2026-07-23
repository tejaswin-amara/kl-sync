# Handoff Report: Milestone M1 (R1. Robust Scraper Table Parsing & Candidate Endpoint Resilience)

**Agent**: Explorer 1 (`explorer_m1_1`)  
**Date**: 2026-07-24  
**Target Files**: `src/lib/scraper.ts`, `src/app/api/erp-proxy/[module]/route.ts`, `src/app/dashboard/timetable/page.tsx`  

---

## 1. Observation

Direct examination of `src/lib/scraper.ts` and related API proxy routes revealed the following implementation details and structural vulnerabilities in `parseGenericTable` and `fetchTimetableData`:

### 1.1 `parseGenericTable` Implementation (`src/lib/scraper.ts`, lines 379–454)

```typescript
function parseGenericTable(html: string) {
  const $ = cheerio.load(html);

  let table = $('table').first();
  let maxRows = 0;
  $('table').each((_i, el) => {
    const rowCount = $(el).find('tr').length;
    if (rowCount > maxRows) {
      maxRows = rowCount;
      table = $(el);
    }
  });

  const data: any[] = [];

  const hasThead = table.find('thead tr').length > 0;
  let headerRow = hasThead
    ? table.find('thead tr').last()
    : table.find('tr').first();

  const headers: string[] = [];
  headerRow.find('th, td').each((i, el) => {
    let text = $(el).text().trim();
    if (!text) text = `Column_${i}`;
    // deduplicate headers
    let suffix = 0;
    let finalStr = text;
    while (headers.includes(finalStr)) {
      suffix++;
      finalStr = `${text}_${suffix}`;
    }
    headers.push(finalStr);
  });

  const rows = table.find('tr');
  const bodyRows = table.find('tbody tr');
  
  let rowsToIterate: any;
  if (hasThead) {
    rowsToIterate = bodyRows.length > 0 ? bodyRows : rows.slice(1);
  } else {
    const allRows = bodyRows.length > 0 ? bodyRows : rows;
    rowsToIterate = allRows.slice(1);
  }

  rowsToIterate.each((i: number, row: any) => {
    const rowData: any = {};
    const cells = $(row).find('td, th');

    if (
      cells.length === 1 &&
      $(cells[0]).text().trim().includes('No results found')
    ) {
      return;
    }
    if (cells.length === 0) return;

    cells.each((j: number, cell: any) => {
      const clone = $(cell).clone();
      clone.find('br, div, p').before(' ');
      const cellText = clone.text().replace(/\s+/g, ' ').trim();

      if (headers[j]) {
        rowData[headers[j]] = cellText;
      } else {
        rowData[`Column_${j}`] = cellText;
      }
    });

    if (Object.keys(rowData).length > 0) {
      data.push(rowData);
    }
  });

  return data;
}
```

#### Observed Vulnerabilities in `parseGenericTable`:
1. **Input Validation**: `cheerio.load(html)` is called directly on `html`. If `html` is `null`, `undefined`, empty string, or non-string, Cheerio behavior is undefined or throws an error.
2. **Table Selection via `.find('tr').length`**:
   - `$(el).find('tr')` recursively queries **all descendant** `tr` elements, including `tr`s inside sub-tables nested inside layout `td`s.
   - An outer layout table with multiple nested sub-tables will inflate `rowCount`, causing the parser to incorrectly select an outer layout container rather than the actual data table.
3. **Nested Table Cell Intermingling**:
   - `table.find('tr')` and `$(row).find('td, th')` perform deep descendant searches.
   - If a table cell contains a nested `<table>`, `$(row).find('td, th')` returns both the outer cell AND all inner cells of the nested table. This causes column index mismatch (`j`), putting inner cell text into wrong header keys.
4. **Header Identification & Multi-row / Title Rows**:
   - `table.find('tr').first()` assumes row 0 is the header when no `<thead>` exists. If row 0 is a full-width title row (e.g. `colspan="8"` with "Academic Timetable 2024"), row 0 is used as header, destroying column alignment.
   - `table.find('thead tr').last()` ignores `rowspan` headers defined in earlier `<thead>` rows.
5. **Lack of Colspan / Rowspan Handling**:
   - Data cells with `colspan="N"` or `rowspan="N"` shift subsequent cells left/right relative to the `headers` array, causing severe column misalignment.
6. **Nested Tag Text Merging**:
   - `clone.find('br, div, p').before(' ')` handles `<br>`, `<div>`, `<p>`. But `<span>`, `<a>`, `<b>`, `<i>`, `<small>` without spaces (e.g. `<span>CS101</span><span>Data Structures</span>`) get merged into `"CS101Data Structures"`.
   - Hidden elements (`<span style="display:none">...</span>`) or inline `<script>`/`<style>` tags inside cells are included in `.text()`.
7. **Incomplete Empty / Garbage Row Exclusion**:
   - Only checks `cells.length === 1 && text.includes('No results found')`. Does not catch "No records found", "Nil", "Data Not Available", pagination control rows, summary/total rows, or repeated header rows.

---

### 1.2 `fetchTimetableData` & ERP Proxy Endpoint Handling (`src/lib/scraper.ts`, lines 520–616)

```typescript
export async function fetchTimetableData(
  session: ScraperSession,
  csrfToken: string,
  academicYear: string,
  semesterId: string
) {
  // ...
  const candidateUrls = [
    ERP_ENDPOINTS['timetable'],
    `${ERP_URL}/index.php?r=timetables%2Funiversitymasteracademictimetableview%2Fstudenttimetable`,
    `${ERP_URL}/index.php?r=timetables%2Funiversitymasteracademictimetableview%2Findex`,
    `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fstudenttimetable`,
  ];

  let data: any[] = [];

  for (const url of candidateUrls) {
    try {
      // 1. Try POST
      // 2. Try GET with query params
      // 3. Try plain GET
    } catch (err) {
      console.error(`Failed timetable fetch for ${url}:`, err);
    }
  }

  return { success: true, data };
}
```

#### Observed Vulnerabilities in `fetchTimetableData`:
1. **Unbounded Request Cascade**: Up to 12 HTTP requests (4 candidate URLs × 3 request methods) are executed sequentially if responses don't contain table data.
2. **Session Expiry Handling Asymmetry**:
   - `fetchMarksData` and `fetchEndExamResults` throw `new Error('Session expired or invalid ERP route.')` when `html.includes('id="login-form"')`.
   - `fetchTimetableData` silently skips parsing when `id="login-form"` is found and returns `{ success: true, data: [] }`. The dashboard then displays "No timetable data found" instead of prompting the user to re-authenticate (401 status).
3. **HTTP Error & Content-Type Ignorance**:
   - `fetchWithJar` does not throw on HTTP status codes like 404, 500, 502.
   - `res.text()` fetches server error HTML ("500 Server Error"). `!html.includes('id="login-form"')` evaluates to `true`, passing error HTML into `parseGenericTable`, which returns `[]` and forces the retry loop to continue through all 12 combinations.
4. **JSON / Non-HTML Responses**:
   - If an endpoint returns JSON (e.g. `{ "error": "Invalid request" }` or `{ "html": "<table>...</table>" }`), `parseGenericTable` is invoked on JSON string, producing `[]`.

---

## 2. Logic Chain

From our direct observations of `scraper.ts` and `route.ts`, we trace the failure mechanisms as follows:

```
[Input HTML / HTTP Response]
        │
        ├── Raw HTML with nested tables / spans / missing thead / colspans
        │       │
        │       └──> parseGenericTable()
        │               ├── Recursive .find('tr') includes child table rows -> Table score corrupted
        │               ├── Recursive .find('td') inside cell includes inner subtable cells -> Cell index j corrupted
        │               ├── Single-row .first() title row chosen as headers -> Header names = Title text
        │               ├── Nested <span> tags without spaces -> Merged text ("CS101Data")
        │               └──> Returns corrupt data array OR empty array []
        │
        └── Candidate ERP Endpoint Fetch (fetchTimetableData)
                │
                ├── HTTP 500 / 404 / 502 Error Page or JSON response
                │       │
                │       └──> html.includes('id="login-form"') is FALSE
                │               └──> parseGenericTable(errorHtml) returns []
                │                       └──> Retries all 12 URL/method combos (High latency)
                │
                └── Session Expired (HTML contains login-form)
                        │
                        └──> Silently catches, loops through all candidates
                                └──> Returns { success: true, data: [] }
                                        └──> Frontend UI displays "No timetable data found" (Misleading user)
```

---

## 3. Caveats

1. **Live ERP Endpoint Behavior**: Specific candidate URL response formats from `newerp.kluniversity.in` can vary depending on student role, active semester state, or server maintenance. Investigation was performed via static codebase inspection without active credentials to a live ERP instance.
2. **Other Scraper Modules**: `fetchProfileData` uses a separate `parseProfileData` function which handles key-value pairs. While `parseGenericTable` is the primary table engine (used by attendance, timetable, marks, end-exam, fee, circulars, etc.), profile parser improvements are complementary.

---

## 4. Conclusion & Proposed Fix Strategy

To eliminate unhandled exceptions, corrupt data structures, and silent failures, the implementation should be enhanced with a resilient parsing and endpoint strategy across two main areas:

### 4.1 Comprehensive Fix Strategy for `parseGenericTable`

1. **Input Normalization & Sanitization**:
   - Add top-level guard: return `[]` immediately if `html` is empty, non-string, or falsy.
   - Pre-clean HTML: Strip `<script>`, `<style>`, `<noscript>`, and HTML comments `<!-- ... -->` using regex prior to loading with Cheerio.
   - Detect JSON responses: If input starts with `{` or `[`, attempt `JSON.parse()`. If JSON contains an HTML string property (e.g. `json.html` or `json.data`), pass that property to the table parser. If JSON is an array of objects, map directly to row objects.

2. **Direct-Child Table & Cell Querying (Nested Table Isolation)**:
   - Calculate row count using **direct child rows**: `$table.children('tbody, thead, tfoot').children('tr').add($table.children('tr'))`.
   - Score tables based on:
     - Count of direct `tr` children.
     - Presence of `<th>` tags or standard table classes (`.table`, `.grid-view`).
     - Absence of layout wrapper attributes (e.g. ignore tables used purely for page header/footer layout).
   - When inspecting row cells, query ONLY direct child cells: `$row.children('td, th')` (NOT `$row.find('td, th')`). This prevents nested sub-table cells from corrupting row cell arrays.

3. **Intelligent Header Detection & Grid Matrix Alignment**:
   - Inspect top 3 rows of the selected table:
     - Check for `<th>` elements.
     - Detect if row 0 is a full-width title row (`colspan` equal to total columns or single cell with title text). If so, skip row 0 and treat row 1 as the header candidate.
     - If no `<thead>` or `<th>` tags exist, check if cells in row 0 have bold styling or header-like text.
   - Colspan & Rowspan Virtual Matrix:
     - Construct a 2D grid matrix `matrix[rowIndex][colIndex]` to track occupied slots.
     - Map `colspan="N"` and `rowspan="M"` into matrix slots so multi-row headers merge into combined header keys (e.g. `"Theory - Internal"`), and data cells with `colspan` don't shift subsequent column data left.

4. **Cell Text Extraction & Cleanup**:
   - Inject spaces around block AND inline tags (`br`, `div`, `p`, `span`, `a`, `b`, `i`, `small`, `li`) prior to extracting text.
   - Normalize whitespace: replace non-breaking spaces (`&nbsp;` / `\u00a0`) with standard spaces, collapse multiple spaces `\s+` to `' '`, and trim.
   - Form inputs: If cell text is empty, check for `<input value="...">` or `<select>` option text.

5. **Garbage & Non-Data Row Filtering**:
   - Filter out empty rows (where all cell values are empty string).
   - Filter out "No results found", "No records found", "Nil", "Data Not Available", "Search result empty" single-cell notice rows.
   - Filter out pagination rows (`.pagination`, `td.pager`) and summary/footer total rows.

---

### 4.2 Comprehensive Fix Strategy for `fetchTimetableData` & Candidate Endpoints

1. **HTTP Status & Content-Type Validation**:
   - Check `res.status`: if status is not 2xx (e.g. 404, 500, 502), log warning and skip immediately to next candidate endpoint without attempting to parse error HTML.
   - Check `res.headers.get('content-type')`: handle JSON vs HTML appropriately.

2. **Strict Session Expiry Propagation**:
   - Standardize session expiry check across all endpoints:
     - Check if `html.includes('id="login-form"')` OR matches login page signals (`action="...site/login"`, `"LoginForm"`).
     - If session is expired, immediately `throw new Error('Session expired or invalid ERP route.')`.
     - `app/api/erp-proxy/[module]/route.ts` will catch this error and return HTTP 401, prompting the frontend to redirect the user to login.

3. **Optimized Candidate Loop & Early Exit**:
   - Candidate Endpoints:
     1. Primary POST endpoint with form body (`UniversityMasterAcademicTimetableView[...]` and `DynamicModel[...]`).
     2. Fallback POST candidate endpoints.
     3. GET fallback endpoints (only executed if POST returns 200 OK with no tables/data).
   - Break loop immediately as soon as a request returns non-empty parsed table data (`parsed.length > 0`).

4. **Structured Return & Error Handling**:
   - If valid table data is found: return `{ success: true, data: parsedData }`.
   - If all candidate endpoints returned 200 OK but table is genuinely empty (e.g., student has no classes enrolled): return `{ success: true, data: [] }`.
   - If session expired: throw session expiry error (HTTP 401).
   - If all candidate endpoints fail due to network/server errors: throw descriptive error `{ success: false, error: 'Failed to connect to ERP timetable services' }` (HTTP 500).

---

## 5. Verification Method

To independently verify the proposed fixes during implementation:

1. **Unit Test / Mock Fixture Verification**:
   - Create mock HTML string test cases for `parseGenericTable`:
     - Test Case A: HTML table with nested `<table>` inside `<td>`.
     - Test Case B: HTML table without `<thead>` or `<th>` tags, with title row 0 (`colspan="5"`).
     - Test Case C: HTML table with `colspan="2"` and `rowspan="2"` in headers and body.
     - Test Case D: HTML table with `<span>` tags without whitespace (`<span>CS101</span><span>Data</span>`).
     - Test Case E: HTML page with HTTP 500 error body or empty string.
     - Test Case F: HTML page containing ERP login form (Session expired).
   - Run tests with `vitest` or `jest` / `ts-node` to verify `parseGenericTable` returns expected clean JSON objects for all cases without throwing unhandled exceptions.

2. **Integration & API Proxy Verification**:
   - Test `/api/erp-proxy/timetable` with expired session token -> verify HTTP 401 JSON response `{ success: false, error: "Session expired..." }`.
   - Test `/api/erp-proxy/timetable` with valid session -> verify HTTP 200 JSON response with parsed timetable rows.
