# M1 Unit Test Suite Analysis & Technical Specification Plan

## Executive Summary
This report presents a comprehensive investigation of the Milestone 1 (M1: Architecture & Data Fetching Foundation) unit testing requirements for the KL Sync repository. The existing test suite comprises 49 unit tests across 5 test files (`src/**/*.test.ts`), all passing cleanly under `npx tsx --test`. 

To complete M1 unit test coverage, three core components currently lack dedicated unit tests: `src/lib/session.ts`, `src/lib/scrapers/http-jar.ts`, and `src/app/api/erp-proxy/[module]/route.ts`. This document establishes the detailed technical specifications and concrete test implementations for `src/lib/session.test.ts`, `src/lib/scrapers/http-jar.test.ts`, and `src/app/api/erp-proxy.test.ts`.

---

## 1. Audit of Existing Test Suite (`src/**/*.test.ts`)

| Test File | Test Count | Test Framework | Primary Focus / Methodology |
|---|---|---|---|
| `src/components/ui/primitives.test.ts` | 17 | `node:test`, `node:assert/strict` | Server-Side Rendering (`react-dom/server`) & HTML regex matching for UI components (`Button`, `Input`, `Badge`, `Card`, `Dialog`, `Skeleton`). |
| `src/lib/scraper.test.ts` | 15 | `node:test`, `node:assert/strict` | Parsing algorithms for Timetable matrix layouts (`matrix_days_rows`, `matrix_days_columns`), day order normalization, slot keys, and multi-session delimiters (`\n`, `<br/>`, `||`, `---`). |
| `src/lib/captcha.test.ts` | 3 | `node:test`, `node:assert` | Verification token lifecycle, SHA-256 hash checking, single-use token burn storage, and nonce replay prevention. |
| `src/lib/cgpa.test.ts` | 5 | `node:test`, `node:assert` | Official CGPA summary extraction, profile fallback CGPA retrieval, dynamic credit-weighted GPA calculation, and audit/non-credit course filtering. |
| `src/lib/fee-utils.test.ts` | 4 | `node:test`, `node:assert` | Multi-currency formatting (`₹`, `$`, `INR`, `Rs.`, accounting parentheses `(₹1,500)`), status key detection, summary row identification, and pending fee aggregation. |
| **Total Existing** | **49** | | **All 49 tests pass in ~650ms via `npx tsx --test`** |

---

## 2. Plan for Un-Tested M1 Components

### Component 1: `src/lib/session.ts`
- **Target File**: `src/lib/session.test.ts`
- **Purpose**: Authenticated AES-256-GCM encryption/decryption of `ScraperSession` objects carrying user cookies across browser roundtrips.
- **Key Logic & Edge Cases**:
  - `encodeSession`: JSON stringification, AES-256-GCM encryption using key derived from `SESSION_SECRET` (SHA-256), random 12-byte IV, auth tag appending, `enc.` prefix output. Base64 fallback with `b64.` prefix on error.
  - `decodeSession`: Prefix check (`enc.`), base64 decoding, minimum length validation (`raw.length >= 28`), auth tag verification, AES-256-GCM decryption, JSON parsing. Catches decryption/tampering errors and returns a safe demo fallback `ScraperSession`.

#### Proposed Test Cases for `src/lib/session.test.ts`:
1. **Encrypted Session Roundtrip**:
   - Verify `encodeSession(session)` returns a string starting with `enc.`.
   - Verify `decodeSession(encoded)` successfully decrypts back to the exact initial `ScraperSession` object (`cookies`, `csrfToken`, `userAgent`).
2. **Legacy / Unencrypted Base64 Compatibility**:
   - Verify `decodeSession` with `b64.` prefix correctly decodes base64-encoded JSON session.
   - Verify `decodeSession` with raw base64 JSON string correctly parses and returns session.
3. **Invalid Secret & Tamper Resistance**:
   - Encode a session with `SESSION_SECRET = 'secret-alpha'`.
   - Change `SESSION_SECRET = 'secret-beta'`.
   - Call `decodeSession` -> AES-256-GCM auth tag verification fails -> returns safe demo fallback session without throwing unhandled exceptions.
4. **Corrupted & Malformed Payload Handling**:
   - Truncated encrypted payload (`enc.` + base64 of string `< 28` bytes) -> returns fallback session.
   - Invalid base64 characters -> returns fallback session.
   - Bit-flipped ciphertext (corrupted tag/data) -> returns fallback session.
   - Non-session JSON structure -> returns fallback session.

---

### Component 2: `src/lib/scrapers/http-jar.ts`
- **Target File**: `src/lib/scrapers/http-jar.test.ts`
- **Purpose**: HTTP Client cookie jar management, header formatting, cookie merging from `Set-Cookie` headers, endpoint constant validation, and HTTP redirect handling.
- **Key Logic & Edge Cases**:
  - `cookieHeader(jar)`: Converting `{ key: value }` dictionary to HTTP `Cookie` header string.
  - `mergeSetCookies(jar, res)`: Parsing `Set-Cookie` header strings (including attributes like `Path=/; HttpOnly; Secure`) and updating jar.
  - `jarToArray` / `arrayToJar`: Bidirectional conversion between dictionary and array representations.
  - `ERP_ENDPOINTS`: Correct endpoint mapping for all 10 ERP modules (`marks`, `timetable`, `fee`, `profile`, `cgpa`, `end-exam`, `exam-seating`, `circulars`, `hostel`, `library`).
  - `fetchWithJar`: Cookie injection, automatic redirect following (301/302/303 method switching), and max redirect limit error guard.

#### Proposed Test Cases for `src/lib/scrapers/http-jar.test.ts`:
1. **Cookie Jar Storage & Serialization**:
   - `cookieHeader`: `{ PHPSESSID: 'sess123', token: 'xyz' }` -> `'PHPSESSID=sess123; token=xyz'`. Empty jar -> `''`.
   - `jarToArray`: `{ a: '1', b: '2' }` -> `[{ name: 'a', value: '1' }, { name: 'b', value: '2' }]`.
   - `arrayToJar`: `[{ name: 'a', value: '1' }, { name: 'b', value: '2' }]` -> `{ a: '1', b: '2' }`. Handles null/empty array gracefully.
2. **Response `Set-Cookie` Header Merging**:
   - `mergeSetCookies`: Handles single `Set-Cookie` string, multiple comma-separated cookies, and strips trailing directives (`Path=/`, `HttpOnly`, `SameSite=Lax`, `Secure`).
3. **ERP Endpoints Dictionary Validation**:
   - Verify `ERP_ENDPOINTS` contains all 10 expected module keys.
   - Verify every endpoint URL begins with `https://newerp.kluniversity.in`.
4. **`fetchWithJar` Header & Redirect Integration**:
   - Verify `User-Agent` and `Cookie` headers are populated in request.
   - Verify redirect limit enforcement: throws `'Too many redirects while contacting the ERP'` if redirects exceed `maxRedirects`.

---

### Component 3: Proxy Route Handler (`src/app/api/erp-proxy/[module]/route.ts`)
- **Target File**: `src/app/api/erp-proxy.test.ts`
- **Purpose**: Serverless API route proxy handling session decoding, CSRF token validation, module routing, parameter checks, demo session fallback responses, and ERP error fallback.
- **Key Logic & Edge Cases**:
  - GET / POST export functions accepting `NextRequest` and `{ params: Promise<{ module: string }> }`.
  - Missing CSRF token check for stateful modules (`attendance`, `timetable`, `marks`, `end-exam`) -> returns HTTP 400 `{ success: false, error: 'CSRF token missing' }`.
  - Missing `academicYear` / `semesterId` parameter check -> returns HTTP 400 `{ success: false, error: 'Missing academicYear or semesterId' }`.
  - Unknown module route -> returns HTTP 404 `{ success: false, error: 'Unknown module: ...' }`.
  - Demo session detection (`demo_csrf` or demo cookies) -> returns structured mock JSON payload (`success: true`).

#### Proposed Test Cases for `src/app/api/erp-proxy.test.ts`:
1. **CSRF Token Guard**:
   - Dispatch POST request to `/api/erp-proxy/attendance` with no CSRF token -> returns HTTP 400 JSON response with error `'CSRF token missing'`.
2. **Required Parameter Guard**:
   - Dispatch POST request to `/api/erp-proxy/attendance` with valid CSRF token but missing `academicYear` or `semesterId` -> returns HTTP 400 JSON response with error `'Missing academicYear or semesterId'`.
3. **Unknown Module Route Guard**:
   - Dispatch GET request to `/api/erp-proxy/non-existent-module` -> returns HTTP 404 JSON response with error `'Unknown module: non-existent-module'`.
4. **Demo Session Mock Dispatch**:
   - Dispatch POST request with demo session to `/api/erp-proxy/attendance` -> returns HTTP 200 with `{ success: true, attendanceData: [...] }`.
   - Dispatch GET request with demo session to `/api/erp-proxy/profile` -> returns HTTP 200 with `{ success: true, data: { name: 'Alex Student', ... } }`.
   - Dispatch GET request with demo session to `/api/erp-proxy/cgpa` -> returns HTTP 200 with `{ success: true, data: [...] }`.

---

## 3. Verification & Execution Strategy

1. **Test Runner Invocation**:
   ```bash
   npx tsx --test src/**/*.test.ts
   ```
2. **Zero Dependencies Required**:
   All proposed tests use standard Node.js built-in modules (`node:test`, `node:assert/strict`, `crypto`) along with existing project imports.
3. **Expected Post-Implementation Results**:
   - 8 total test files executed.
   - ~65-70 total unit tests executed.
   - 0 failing tests, 0 skipped tests, 0 errors.
