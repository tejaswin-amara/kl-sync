# Handoff Report — Milestone M2: Accurate & Flexible CGPA Calculation

## 1. Observation

### 1.1 Existing Implementation Locations
- **`src/app/dashboard/page.tsx`** (Lines 45–134): Background fetch to `/api/erp-proxy/cgpa` and inline CGPA/credits parsing loop.
- **`src/app/dashboard/tools/page.tsx`** (Lines 22–96): Duplicate copy of the same CGPA and credits parsing loop inside `fetchData()`.
- **`src/lib/scraper.ts`** (Lines 14, 489–516): Endpoint definition `ERP_ENDPOINTS.cgpa` pointing to `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fsearchgetmycgpa` and `fetchGenericModuleData()` which parses raw HTML tables into JavaScript arrays of key-value row objects.
- **`src/app/api/erp-proxy/[module]/route.ts`** (Lines 108–118): Proxy handler routing `/api/erp-proxy/cgpa` to `fetchGenericModuleData`.

### 1.2 Verbatim Code Snippets

#### Dashboard Overview (`src/app/dashboard/page.tsx` lines 50–133):
```ts
// 1. First try to find official direct CGPA value from summary column
let directCgpa: number | null = null;
let directCredits: number | null = null;

for (const row of rows) {
  const cgpaKey = Object.keys(row).find(
    (k) =>
      k.toLowerCase().includes('cgpa') ||
      k.toLowerCase() === 'gpa' ||
      k.toLowerCase().includes('cumulative')
  );
  if (cgpaKey && row[cgpaKey]) {
    const parsed = parseFloat(String(row[cgpaKey]).trim());
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      directCgpa = parsed;
    }
  }

  const credKey = Object.keys(row).find(
    (k) =>
      k.toLowerCase().includes('total credit') ||
      k.toLowerCase().includes('earned credit') ||
      k.toLowerCase().includes('credits earned')
  );
  if (credKey && row[credKey]) {
    const parsedCred = parseFloat(String(row[credKey]).trim());
    if (!isNaN(parsedCred) && parsedCred > 0) {
      directCredits = parsedCred;
    }
  }
}

let totalCredits = 0;
let totalPoints = 0;

rows.forEach((row: any) => {
  const gradeKey = Object.keys(row).find((k) =>
    k.toLowerCase().includes('grade')
  );
  const credKey = Object.keys(row).find(
    (k) =>
      k.toLowerCase().includes('credit') ||
      k.toLowerCase().includes('cred')
  );
  const pointKey = Object.keys(row).find(
    (k) =>
      k.toLowerCase().includes('point') ||
      k.toLowerCase().includes('gp')
  );

  const grade = gradeKey
    ? String(row[gradeKey] || '').trim().toUpperCase()
    : '';
  const credits = credKey ? parseFloat(String(row[credKey])) || 0 : 0;
  const gradePoint = pointKey
    ? parseFloat(String(row[pointKey])) || 0
    : 0;

  if (grade !== 'F' && credits > 0) {
    totalCredits += credits;
    totalPoints += gradePoint * credits;
  }
});
```

#### Tools Page (`src/app/dashboard/tools/page.tsx` lines 27–96):
Identical inline loop duplicated line-for-line.

---

## 2. Logic Chain

### Step 2.1: Deficiencies in Current Summary Detection
1. **Narrow Key Range**: `cgpaKey` matching only checks `k.toLowerCase().includes('cgpa')`, `k.toLowerCase() === 'gpa'`, or `k.toLowerCase().includes('cumulative')`.
   - ERP data variations (e.g. from profile, student info, or marks summary tables) often use alternative column or property names like `'sgpa'`, `'overall cgpa'`, `'academic gpa'`, `'sec gpa'`, `'cur_cgpa'`, `'gpa obtained'`.
2. **Single Endpoint Limitation**: Current pages query strictly `/api/erp-proxy/cgpa`. If this ERP endpoint is unavailable or returns an empty table, the app does not check student profile data (`extendedProfile`) or marks summary objects where official CGPA/SGPA summaries also reside.

### Step 2.2: Deficiencies in Dynamic GPA Fallback Calculation
1. **Missing Grade-to-Point Mapping**:
   - `gradePoint` relies entirely on finding a column key matching `point` or `gp` (`pointKey`).
   - If the ERP result table only provides letter grades (e.g., `Grade: 'A+'`, `Grade: 'S'`, `Grade: 'O'`) without an explicit grade point column, `gradePoint` defaults to `0`.
   - `totalPoints` evaluates to `0`, resulting in a calculated CGPA of `0.00` even when grades and credits are present!
2. **Incorrect Credit Calculation for Failed Courses**:
   - The current code checks `if (grade !== 'F' && credits > 0)`.
   - In standard academic GPA systems (including KL University's 10-point scale), failed courses (`F`, `FAIL`, `AB`, `DT`) contribute `0` grade points but their credits **must remain in the total credits denominator** ($\sum \text{Credits}$) for accurate CGPA calculation. Excluding failed credits inflates the calculated CGPA.
   - Non-standard fail representations (`'FAIL'`, `'AB'`, `'ABSENT'`, `'DT'`, `'F'`) are not normalized.
3. **Fragile String Parsing**:
   - Values like `"3.0 Cr"`, `"10.00 / 10"`, or `" 4 "` cause `parseFloat` to return `NaN` or incorrect values if leading non-digit characters exist.

### Step 2.3: Recommended 2-Phase Extraction Architecture

```
                       [Raw ERP Data (Array or Object)]
                                      │
                                      ▼
             Phase 1: Detect Official ERP Summary Values
             (Check CGPA, SGPA, Cumulative GPA, GPA, etc.)
                                      │
                         ┌────────────┴────────────┐
                 Found   │                         │ Absent / Invalid
                         ▼                         ▼
                  Return Summary          Phase 2: Dynamic Fallback
                  CGPA & Credits           Weighted GPA Calculation
                                                   │
                                                   ├── Case-insensitive Column Matching
                                                   │   (Grade, Credit, Points)
                                                   ├── Letter Grade -> Points Mapping
                                                   │   (S/O:10, A+:9, A:8, B+:7, B:6, C:5, D:4, F:0)
                                                   └── Edge-Case Handling (0 credits, NaN, strings)
```

#### Proposed Code Structure for `src/lib/cgpa.ts`:

```ts
/**
 * Letter Grade to Numerical Points Mapping (Standard 10-Point Scale)
 */
export function mapGradeToPoints(gradeStr: string): number | null {
  const g = gradeStr.trim().toUpperCase();
  if (!g) return null;

  switch (g) {
    case 'O':
    case 'S':
    case '10':
      return 10;
    case 'A+':
    case '9':
      return 9;
    case 'A':
    case '8':
      return 8;
    case 'B+':
    case '7':
      return 7;
    case 'B':
    case '6':
      return 6;
    case 'C':
    case '5':
      return 5;
    case 'D':
    case '4':
      return 4;
    case 'F':
    case 'FAIL':
    case 'AB':
    case 'ABSENT':
    case 'DT':
    case '0':
      return 0;
    default:
      // Pass/Audit/Satisfactory/Non-credit courses
      if (['P', 'PASS', 'SATISFACTORY', 'NC', 'AUDIT', 'W'].includes(g)) {
        return null; // Exclude from GPA calculation
      }
      const num = parseFloat(g);
      return !isNaN(num) && num >= 0 && num <= 10 ? num : null;
  }
}

/**
 * Sanitizes numeric string (e.g. " 3.0 Cr " -> 3.0)
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim();
  const match = str.match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const parsed = parseFloat(match[0]);
  return isNaN(parsed) ? null : parsed;
}

export interface CGPAResult {
  cgpa: number;
  credits: number;
  isOfficial: boolean;
  sgpa?: number | null;
}

/**
 * Main Extraction and Fallback Function
 */
export function processERPDataForCGPA(
  rawRows: any[],
  profileData?: any
): CGPAResult {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    // Attempt profile fallback if available
    if (profileData) {
      const summaryFromProfile = extractOfficialSummary(profileData);
      if (summaryFromProfile.cgpa !== null) {
        return {
          cgpa: summaryFromProfile.cgpa,
          credits: summaryFromProfile.credits || 0,
          isOfficial: true,
          sgpa: summaryFromProfile.sgpa,
        };
      }
    }
    return { cgpa: 0, credits: 0, isOfficial: false };
  }

  // --- Phase 1: Direct Official Summary Lookup ---
  let officialCgpa: number | null = null;
  let officialSgpa: number | null = null;
  let officialCredits: number | null = null;

  for (const row of rawRows) {
    if (!row || typeof row !== 'object') continue;

    const keys = Object.keys(row);
    
    // CGPA key match
    const cgpaKey = keys.find((k) => {
      const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        lk.includes('cgpa') ||
        lk === 'gpa' ||
        lk.includes('cumulativegpa') ||
        lk.includes('overallgpa') ||
        lk.includes('totalcgpa')
      );
    });
    if (cgpaKey) {
      const val = parseNumericValue(row[cgpaKey]);
      if (val !== null && val > 0 && val <= 10) {
        officialCgpa = val;
      }
    }

    // SGPA key match
    const sgpaKey = keys.find((k) => {
      const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return lk.includes('sgpa') || lk.includes('semgpa') || lk.includes('termgpa');
    });
    if (sgpaKey) {
      const val = parseNumericValue(row[sgpaKey]);
      if (val !== null && val > 0 && val <= 10) {
        officialSgpa = val;
      }
    }

    // Credits key match
    const credKey = keys.find((k) => {
      const lk = k.toLowerCase();
      return (
        lk.includes('total credit') ||
        lk.includes('earned credit') ||
        lk.includes('credits earned') ||
        lk.includes('completed credit') ||
        lk === 'total_credits'
      );
    });
    if (credKey) {
      const val = parseNumericValue(row[credKey]);
      if (val !== null && val > 0) {
        officialCredits = val;
      }
    }
  }

  if (officialCgpa !== null) {
    return {
      cgpa: Number(officialCgpa.toFixed(2)),
      credits: officialCredits || 0,
      isOfficial: true,
      sgpa: officialSgpa,
    };
  }

  // --- Phase 2: Dynamic Fallback Calculation ---
  let totalPoints = 0;
  let totalCredits = 0;

  for (const row of rawRows) {
    if (!row || typeof row !== 'object') continue;
    const keys = Object.keys(row);

    // 1. Column Identification
    const gradeKey = keys.find((k) => {
      const lk = k.toLowerCase();
      return lk.includes('grade') || lk === 'grd' || lk.includes('letter');
    });

    const credKey = keys.find((k) => {
      const lk = k.toLowerCase();
      return (
        lk.includes('credit') ||
        lk.includes('cred') ||
        lk === 'cr' ||
        lk === 'creds'
      );
    });

    const pointKey = keys.find((k) => {
      const lk = k.toLowerCase();
      return (
        lk.includes('point') ||
        lk.includes('gp') ||
        lk === 'pts' ||
        lk === 'grade_point'
      );
    });

    // 2. Value Extraction
    const credits = credKey ? parseNumericValue(row[credKey]) || 0 : 0;
    if (credits <= 0) continue; // Skip zero-credit / non-academic rows

    const gradeStr = gradeKey ? String(row[gradeKey] || '') : '';
    let gradePoint: number | null = pointKey ? parseNumericValue(row[pointKey]) : null;

    // Fallback to letter grade mapping if grade points column is absent or invalid
    if (gradePoint === null || isNaN(gradePoint)) {
      gradePoint = mapGradeToPoints(gradeStr);
    }

    if (gradePoint !== null) {
      totalCredits += credits;
      totalPoints += gradePoint * credits;
    }
  }

  const finalCredits = officialCredits || totalCredits;
  const calculatedCgpa =
    totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

  return {
    cgpa: calculatedCgpa,
    credits: finalCredits,
    isOfficial: false,
    sgpa: officialSgpa,
  };
}
```

---

## 3. Caveats

1. **Academic Scale Assumptions**: KL University uses a standard 10.0 relative grading scale (`O/S: 10`, `A+: 9`, `A: 8`, `B+: 7`, `B: 6`, `C: 5`, `D: 4`, `F: 0`). Non-standard letter grades (e.g., E, F+, numerical marks 0-100 without grade headers) will be parsed via `parseNumericValue` fallback if available.
2. **Audit / Non-Credit Courses**: Courses marked as `P` (Pass), `SATISFACTORY`, or `NC` with 0 credits are automatically excluded from the GPA calculation denominator.
3. **No Direct Code Changes Applied**: As a read-only Explorer agent, no changes have been written to `src/app/` or `src/lib/`. The code implementer should implement `src/lib/cgpa.ts` and refactor `src/app/dashboard/page.tsx` and `src/app/dashboard/tools/page.tsx` to consume it.

---

## 4. Conclusion

1. **Centralize Implementation**: Create `src/lib/cgpa.ts` containing `processERPDataForCGPA`, `mapGradeToPoints`, and `parseNumericValue`.
2. **Eliminate Code Duplication**: Replace inline extraction loops in `src/app/dashboard/page.tsx` (lines 50–133) and `src/app/dashboard/tools/page.tsx` (lines 27–96) with `processERPDataForCGPA(rows)`.
3. **Ensure Resilience**: Phase 1 checks expanded summary keys (`cgpa`, `sgpa`, `cumulative gpa`, `overall gpa`, `gpa`). Phase 2 dynamically calculates weighted GPA using case-insensitive column matching (`grade`, `credit`, `point`), letter grade mapping, and safe numeric parsing.

---

## 5. Verification Method

### 5.1 Verification Commands
Run local build and type checks to confirm no syntax or type errors:
```bash
npx tsc --noEmit
npm run lint
npm run build
```

### 5.2 Unit Verification Test Cases to Implement in `src/lib/cgpa.test.ts` (or manual test):
1. **Official Summary Priority**: Input containing `{ "CGPA": "8.75", "Credits": "120" }` returns `{ cgpa: 8.75, credits: 120, isOfficial: true }`.
2. **Letter Grade Mapping Fallback**: Input table with `{ "Subject": "Math", "Credits": "4", "Grade": "A+" }` (no points column) returns `{ cgpa: 9.00, credits: 4, isOfficial: false }`.
3. **Failed Course Credit Denominator**: Input table with `{ "Credits": "3", "Grade": "A" }` (24 pts) and `{ "Credits": "3", "Grade": "F" }` (0 pts) returns $\frac{24}{6} = 4.00$ CGPA with `credits: 6`.
4. **Zero Credits / Null Inputs**: Input `[]`, `null`, or rows with `0` credits returns `{ cgpa: 0, credits: 0, isOfficial: false }` without `NaN` or division-by-zero errors.
