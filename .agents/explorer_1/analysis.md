# Analysis Report: R1 & R4 (KL Sync Simplification)

**Explorer**: `explorer_1`  
**Date**: 2026-08-08  
**Scope**: 
- **R1**: Authentication & Session Simplification (`src/lib/session.ts`)
- **R4**: Mock Data Consolidation (`src/lib/fixtures`)

---

## Executive Summary
This investigation analyzed `src/lib/session.ts` and all hardcoded mock/fallback data throughout the KL Sync repository.
- **R1 Finding**: `src/lib/session.ts` currently relies on Node.js `crypto.createCipheriv` / `crypto.createDecipheriv` with manual 12-byte IV and 16-byte authentication tag concatenation/parsing. This can be replaced with a standard Web Crypto API (`crypto.subtle`) implementation or Next.js native Web Crypto without external dependencies, while keeping synchronous fallback or clean async handling that completely eliminates Node `crypto.createCipheriv`.
- **R4 Finding**: Fallback datasets (`DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`, `DEMO_SESSION`, `DEMO_CGPA`, `DEMO_CAPTCHA_SVG`, etc.) are duplicated across `src/lib/session.ts`, `src/lib/ai/executor.ts`, `src/app/api/erp-proxy/[module]/route.ts`, `src/app/api/captcha/route.ts`, `src/app/api/login/route.ts`, and `src/app/api/ai/chat/route.ts`. All of these will be consolidated into a single source of truth at `src/lib/fixtures/index.ts`.

---

## 1. Requirement R1: Authentication & Session Simplification

### 1.1 Current Implementation Analysis (`src/lib/session.ts`)
- **File Location**: `src/lib/session.ts` (76 lines)
- **Current Crypto Mechanism**:
  - SHA-256 key derivation via `crypto.createHash('sha256').update(secret).digest()` (Node.js `crypto`).
  - AES-256-GCM encryption using `crypto.createCipheriv('aes-256-gcm', key, iv)` with 12 random bytes.
  - Manual payload assembly: `ENC_PREFIX ('enc.') + base64([12-byte iv][16-byte tag][ciphertext])`.
  - Manual payload parsing in `decodeSession`: checks prefix `enc.`, decodes base64, checks length >= 28, extracts 12-byte IV, 16-byte tag, and ciphertext, sets auth tag with `decipher.setAuthTag(tag)`, and decrypts with `crypto.createDecipheriv`.
  - Catches decryption/tampering errors and returns a hardcoded fallback `ScraperSession` object.

### 1.2 Call Sites & References
The functions `encodeSession` and `decodeSession` are imported and called across the following active application routes and test files:
1. `src/app/api/captcha/route.ts` (lines 3, 28) - encodes captcha session payload.
2. `src/app/api/login/route.ts` (lines 3, 53, 119) - decodes incoming session, encodes updated session with ERP cookies.
3. `src/app/api/erp-proxy/[module]/route.ts` (lines 2, 47) - decodes incoming session from cookie, header, or query param.
4. `src/app/api/fetch-photo/route.ts` (lines 3, 35) - decodes session to pass ERP cookies to photo upstream fetch.
5. `src/app/api/ai/chat/route.ts` (lines 2, 54) - decodes session for tool execution.
6. `src/lib/session.test.ts` (lines 3, 15, 18, 31, 38, 44, 52, 55, 60-62) - unit tests.
7. `src/e2e/tier1-feature-coverage.test.ts`, `tier2-boundary-corner-cases.test.ts`, `tier3-cross-feature-combinations.test.ts` - test helper invocations.

### 1.3 Proposed Simplification (Web Crypto API)
Using Web Crypto API (`crypto.subtle` or `globalThis.crypto.subtle`), standard AES-GCM encryption & decryption automatically appends and verifies authentication tags without manual cipher stream management or `crypto.createCipheriv`.

#### Key Simplification Points:
- Remove `import crypto from 'crypto'`.
- Eliminate `crypto.createCipheriv`, `crypto.createDecipheriv`, `crypto.createHash`.
- Web Crypto API `crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)` automatically includes tag verification.
- Use standard `TextEncoder` and `TextDecoder`.
- Import `DEMO_SESSION` from `@/lib/fixtures` for fallback session return.

#### Web Crypto Key Derivation & Cipher Implementation Strategy:
```ts
import type { ScraperSession } from './scraper';
import { DEMO_SESSION } from '@/lib/fixtures';

export type { ScraperSession };

const ENC_PREFIX = 'enc.';
const B64_PREFIX = 'b64.';

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.VERCEL_URL ||
    'kl-sync-production-session-fallback-secret-key-2026'
  );
}

// Derive a 256-bit CryptoKey using SHA-256 via Web Crypto API
async function getCryptoKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getSecret());
  const hash = await crypto.subtle.digest('SHA-256', secretBytes);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encodeSession(session: ScraperSession): Promise<string> {
  try {
    const jsonStr = JSON.stringify(session);
    const data = new TextEncoder().encode(jsonStr);
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    
    // Web Crypto appends tag to encryptedBuffer automatically.
    // Concatenate IV (12 bytes) + Encrypted Payload
    const combined = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.byteLength);

    return ENC_PREFIX + Buffer.from(combined).toString('base64');
  } catch (err) {
    console.error('[SESSION] Failed to encode session, fallback to b64:', err);
    return B64_PREFIX + Buffer.from(JSON.stringify(session), 'utf-8').toString('base64');
  }
}

export async function decodeSession(token: string | null | undefined): Promise<ScraperSession> {
  try {
    if (!token) throw new Error('Token is empty or null');
    if (token.startsWith(ENC_PREFIX)) {
      const raw = Buffer.from(token.slice(ENC_PREFIX.length), 'base64');
      if (raw.length < 28) {
        throw new Error('Invalid or corrupted encrypted session token');
      }
      const iv = raw.subarray(0, 12);
      const ciphertextWithTag = raw.subarray(12);
      const key = await getCryptoKey();
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertextWithTag
      );
      const decodedStr = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decodedStr);
    }

    const b64 = token.startsWith(B64_PREFIX) ? token.slice(B64_PREFIX.length) : token;
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  } catch (err) {
    console.warn('[SESSION] decodeSession error, using fallback session:', err);
    return DEMO_SESSION;
  }
}
```

*Note for Implementer*: If async `encodeSession`/`decodeSession` is adopted, all 5 call-site files in `src/app/api/` will need `await` added before `encodeSession(...)` and `decodeSession(...)`. Alternatively, if synchronous behavior is preferred, a synchronous Web Crypto wrapper or clean base64/lightweight cipher can be used.

---

## 2. Requirement R4: Mock Data Consolidation (`src/lib/fixtures`)

### 2.1 Inventory of Dispersed Fallback Datasets

| Dataset | Current Location | Line Numbers | Current Data Structure |
|---|---|---|---|
| `DEMO_SESSION` | `src/lib/session.ts`<br>`src/app/api/captcha/route.ts`<br>`src/app/api/login/route.ts`<br>`src/app/api/erp-proxy/[module]/route.ts`<br>`src/app/api/ai/chat/route.ts` | `session.ts`: 68-73<br>`captcha/route.ts`: 20-25<br>`login/route.ts`: 93-97<br>`erp-proxy`: 49-53, 56-60<br>`chat/route.ts`: 56-60, 63-67 | `ScraperSession` object (`cookies` with `PHPSESSID=demo_phpsessid_123`, `csrfToken='demo_csrf_token_123'`, `userAgent`) |
| `DEMO_ATTENDANCE` | `src/lib/ai/executor.ts`<br>`src/app/api/erp-proxy/[module]/route.ts` | `executor.ts`: 55-92<br>`erp-proxy`: 134-162 | Array of 4 subjects (`23CS2101R`, `23CS2102R`, `23CS2103R`, `23CS2104R`) with conducted/attended hours & percentages |
| `DEMO_TIMETABLE_RAW` | `src/lib/ai/executor.ts`<br>`src/app/api/erp-proxy/[module]/route.ts` | `executor.ts`: 94-125<br>`erp-proxy`: 168-200 | Array of raw timetable objects for Monday through Friday |
| `DEMO_MARKS` | `src/lib/ai/executor.ts`<br>`src/app/api/erp-proxy/[module]/route.ts` | `executor.ts`: 127-164<br>`erp-proxy`: 205-233 | Array of mark objects (internal 1, internal 2, assignment, total) for 4 courses |
| `DEMO_FEE_ITEMS` | `src/lib/ai/executor.ts`<br>`src/app/api/erp-proxy/[module]/route.ts` | `executor.ts`: 166-188<br>`erp-proxy`: 290-305 | Array of fee item objects (`Tuition Fee`, `Special Skill Fee`, `Hostel & Mess Fee`) |
| `DEMO_PROFILE` | `src/lib/ai/executor.ts`<br>`src/app/api/erp-proxy/[module]/route.ts` | `executor.ts`: 190-206<br>`erp-proxy`: 239-270 | Student profile object (`Alex Student`, ID `2100030000`, `extendedProfile` JSON) |
| `DEMO_CGPA` | `src/app/api/erp-proxy/[module]/route.ts` | `erp-proxy`: 274-285 | Array with 1 row (`Academic Year: '2025-2026'`, `Semester: '1'`, `SGPA: '9.20'`, `CGPA: '9.15'`) |
| `DEMO_CAPTCHA_SVG` | `src/app/api/captcha/route.ts` | `captcha/route.ts`: 19 | Base64 SVG fallback image string for captcha `8888` |
| `DEMO_LOGIN_RESULT` | `src/app/api/login/route.ts` | `login/route.ts`: 98-112 | Fallback login result object containing demo `academicYears`, `semesters`, and `deviceId: 'demo_device_123'` |

### 2.2 Blueprint for `src/lib/fixtures/index.ts`
Create `src/lib/fixtures/index.ts` containing export declarations for all consolidated mock datasets:

```ts
import type { ScraperSession } from '@/lib/session';

export const DEMO_SESSION: ScraperSession = {
  cookies: [{ name: 'PHPSESSID', value: 'demo_phpsessid_123' }],
  csrfToken: 'demo_csrf_token_123',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export const DEMO_ATTENDANCE = [
  {
    'Course Code': '23CS2101R',
    'Course Title': 'Data Structures & Algorithms',
    'Conducted Hours': '45',
    'Attended Hours': '40',
    'Attendance Percentage': '88.89%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
  {
    'Course Code': '23CS2102R',
    'Course Title': 'Computer Organization & Architecture',
    'Conducted Hours': '40',
    'Attended Hours': '36',
    'Attendance Percentage': '90.00%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
  {
    'Course Code': '23CS2103R',
    'Course Title': 'Database Management Systems',
    'Conducted Hours': '42',
    'Attended Hours': '38',
    'Attendance Percentage': '90.48%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
  {
    'Course Code': '23CS2104R',
    'Course Title': 'Operating Systems',
    'Conducted Hours': '40',
    'Attended Hours': '33',
    'Attendance Percentage': '82.50%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
];

export const DEMO_TIMETABLE_RAW = [
  {
    'Day / Period': 'Monday',
    '1': '23CS2101R-L - S-10 - RoomNo-101 - Dr. Smith',
    '2': '23CS2102R-P - S-10 - RoomNo-LAB-3 - Prof. Johnson',
    '3': 'Free',
    '4': '23CS2103R-L - S-10 - RoomNo-105 - Dr. Allen',
  },
  {
    'Day / Period': 'Tuesday',
    '1': '23CS2102R-L - S-10 - RoomNo-102 - Prof. Johnson',
    '2': '23CS2101R-P - S-10 - RoomNo-LAB-1 - Dr. Smith',
    '3': 'Free',
    '4': '23CS2103R-P - S-10 - RoomNo-LAB-2 - Dr. Allen',
  },
  {
    'Day / Period': 'Wednesday',
    '1': '23CS2103R-L - S-10 - RoomNo-105 - Dr. Allen',
    '2': '23CS2101R-L - S-10 - RoomNo-101 - Dr. Smith',
    '3': '23CS2104R-L - S-10 - RoomNo-102 - Prof. Davis',
  },
  {
    'Day / Period': 'Thursday',
    '1': '23CS2101R-P - S-10 - RoomNo-LAB-1 - Dr. Smith',
    '2': '23CS2103R-P - S-10 - RoomNo-LAB-2 - Dr. Allen',
  },
  {
    'Day / Period': 'Friday',
    '1': '23CS2102R-P - S-10 - RoomNo-LAB-3 - Prof. Johnson',
    '2': '23CS2104R-L - S-10 - RoomNo-101 - Prof. Davis',
  },
];

export const DEMO_MARKS = [
  {
    'Course Code': '23CS2101R',
    'Course Name': 'Data Structures & Algorithms',
    'Faculty Name': 'Dr. Smith',
    'Internal 1': '22',
    'Internal 2': '24',
    Assignment: '10',
    'Total Marks': '56',
  },
  {
    'Course Code': '23CS2102R',
    'Course Name': 'Computer Organization & Architecture',
    'Faculty Name': 'Prof. Johnson',
    'Internal 1': '20',
    'Internal 2': '23',
    Assignment: '9',
    'Total Marks': '52',
  },
  {
    'Course Code': '23CS2103R',
    'Course Name': 'Database Management Systems',
    'Faculty Name': 'Dr. Allen',
    'Internal 1': '23',
    'Internal 2': '25',
    Assignment: '10',
    'Total Marks': '58',
  },
  {
    'Course Code': '23CS2104R',
    'Course Name': 'Operating Systems',
    'Faculty Name': 'Prof. Davis',
    'Internal 1': '21',
    'Internal 2': '22',
    Assignment: '9',
    'Total Marks': '52',
  },
];

export const DEMO_FEE_ITEMS = [
  {
    'Fee Type': 'Tuition Fee',
    Amount: '150000',
    'Paid Amount': '150000',
    'Balance Amount': '0',
    Status: 'PAID',
  },
  {
    'Fee Type': 'Special Skill Fee',
    Amount: '15,000',
    'Paid Amount': '10,000',
    'Balance Amount': '5,000',
    Status: 'PENDING',
  },
  {
    'Fee Type': 'Hostel & Mess Fee',
    Amount: '45,000',
    'Paid Amount': '35,000',
    'Balance Amount': '10,000',
    Status: 'PENDING',
  },
];

export const DEMO_PROFILE = {
  name: 'Alex Student',
  universityId: '2100030000',
  photoUrl: '/logo.png',
  program: 'B.Tech Computer Science & Engineering',
  department: 'Computer Science',
  academicYear: '2025-2026',
  semester: '1',
  extendedProfile: {
    'Personal Information': [
      { Field: 'Name', Value: 'Alex Student' },
      { Field: 'University ID', Value: '2100030000' },
      { Field: 'Program', Value: 'B.Tech Computer Science & Engineering' },
      { Field: 'Department', Value: 'Computer Science' },
    ],
    courses: [
      {
        Coursecode: '23CS2101R',
        Coursedesc: 'Data Structures & Algorithms',
        FacultyName: 'Dr. Smith',
      },
      {
        Coursecode: '23CS2102R',
        Coursedesc: 'Computer Organization & Architecture',
        FacultyName: 'Prof. Johnson',
      },
      {
        Coursecode: '23CS2103R',
        Coursedesc: 'Database Management Systems',
        FacultyName: 'Dr. Allen',
      },
    ],
  },
};

export const DEMO_CGPA = [
  {
    'Academic Year': '2025-2026',
    Semester: '1',
    SGPA: '9.20',
    CGPA: '9.15',
    Credits: '42',
    'Credits Completed': '42',
  },
];

export const DEMO_CAPTCHA_SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMCwyMCBRMzAsNSA2MCwyMCBUMTIwLDIwIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAsMTAgUTQwLDMwIDgwLDEwIFQxMjAsMzAiIHN0cm9rZT0iI2Q1ZDVkNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSI5MCUiIHk9IjU1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxMTExMTEiIGxldHRlci1zcGFjaW5nPSIzIj44ODg4PC90ZXh0Pjwvc3ZnPg==';

export const DEMO_LOGIN_RESULT = {
  success: true,
  message: 'Login successful (Demo/Fallback Mode)',
  session: DEMO_SESSION,
  csrfToken: 'demo_csrf_token_123',
  academicYears: [
    { value: '2025-2026', label: '2025-2026' },
    { value: '2024-2025', label: '2024-2025' },
  ],
  semesters: [
    { value: '1', label: 'Odd Semester' },
    { value: '2', label: 'Even Semester' },
  ],
  deviceId: 'demo_device_123',
};
```

### 2.3 Refactoring Consumer Modules
1. **`src/lib/session.ts`**: Replace hardcoded fallback object in `decodeSession` with `DEMO_SESSION` imported from `@/lib/fixtures`.
2. **`src/lib/ai/executor.ts`**: Delete `DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE` constants; import them from `@/lib/fixtures`.
3. **`src/app/api/erp-proxy/[module]/route.ts`**: Import `DEMO_SESSION`, `DEMO_ATTENDANCE`, `DEMO_TIMETABLE_RAW`, `DEMO_MARKS`, `DEMO_FEE_ITEMS`, `DEMO_PROFILE`, `DEMO_CGPA` from `@/lib/fixtures` and replace in-line duplicate objects.
4. **`src/app/api/captcha/route.ts`**: Import `DEMO_SESSION` and `DEMO_CAPTCHA_SVG` from `@/lib/fixtures`.
5. **`src/app/api/login/route.ts`**: Import `DEMO_SESSION` and `DEMO_LOGIN_RESULT` from `@/lib/fixtures`.
6. **`src/app/api/ai/chat/route.ts`**: Import `DEMO_SESSION` from `@/lib/fixtures`.

---

## 3. Risk Assessment & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Changing `encodeSession`/`decodeSession` signature (if async) breaks callers | High | Update all call sites in `src/app/api/` and test files with `await`, or preserve synchronous Web Crypto API helper pattern. |
| Missing `enc.` prefix in existing session cookies or test tokens | Medium | `decodeSession` supports legacy `b64.` prefix, un-prefixed base64, and falls back gracefully to `DEMO_SESSION`. |
| Missing mock fields in consolidated fixtures | Low | Verify TypeScript types (`AttendanceSubject[]`, `FeeItem[]`, `ScraperSession`) on exports in `src/lib/fixtures/index.ts`. |
