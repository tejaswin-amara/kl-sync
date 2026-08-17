/**
 * Course Code to Subject Name Resolver and Dynamic Registry
 */

// Global runtime registry populated from live ERP Attendance, Marks, & Profile data
const COURSE_TITLE_REGISTRY: Record<string, string> = {};

export const KNOWN_COURSE_MAP: Record<string, string> = {
  // Core Department Codes (Matches any academic year prefix or variant suffix)
  'CS1302': 'Data Structures & Algorithms',
  'CS2101': 'Data Structures & Algorithms',
  'CS1101': 'Object Oriented Programming with Java',
  'CS1102': 'Object Oriented Programming',
  'CS2102': 'Computer Organization & Architecture',
  'CS2103': 'Database Management Systems',
  'CS2205': 'Database Management Systems',
  'CS2104': 'Operating Systems',
  'EC2206': 'Signal Processing & Communication Systems',
  'EC1201': 'Basic Electrical & Electronics',
  'SC2107': 'Discrete Mathematics & Graph Theory',
  'FL2112': 'Foreign Language - Elective',
  'CS3108': 'Software Engineering & Agile',

  // 25 Series Courses
  '25CS1302E': 'Data Structures & Algorithms',
  '25CS2103E': 'Computer Organization & Architecture',
  '25CS2104E': 'Operating Systems',
  '25EC2206E': 'Signal Processing & Communication Systems',
  '25SC2107E': 'Discrete Mathematics & Graph Theory',
  '25FL2112E': 'Foreign Language - Elective',
  '25CS1101E': 'Object Oriented Programming with Java',
  '25CS2205E': 'Database Management Systems',
  '25CS3108E': 'Software Engineering & Agile',

  // 24 Series Courses
  '24CS1302E': 'Data Structures & Algorithms',
  '24CS2103E': 'Computer Organization & Architecture',
  '24CS2104E': 'Operating Systems',
  '24EC2206E': 'Signal Processing & Communication Systems',
  '24SC2107E': 'Discrete Mathematics & Graph Theory',
  '24FL2112E': 'Foreign Language - Elective',

  // 23 Series Courses
  '23CS2101R': 'Data Structures & Algorithms',
  '23CS2102R': 'Computer Organization & Architecture',
  '23CS2103R': 'Database Management Systems',
  '23CS2104R': 'Operating Systems',

  // 22 Series Courses
  '22CS1101': 'Data Structures & Algorithms',
  '22CS1102': 'Object Oriented Programming',
  '22EC1201': 'Basic Electrical & Electronics',
};

/**
 * Extracts core department code (e.g. "CS1302" from "25CS1302E-L" or "23CS2101R")
 */
export function extractCoreCode(code: string): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  const base = clean.replace(/[-_]([LTPSS]|LAB|PRAC|THEORY|\d+)$/i, '');
  const coreMatch = base.match(/(?:[0-9]{2})?([A-Z]{2,5}[0-9]{3,4})[A-Z]?/i);
  return coreMatch ? coreMatch[1].toUpperCase() : base;
}

/**
 * Strips embedded course code prefixes/suffixes from raw title strings
 */
export function cleanTitleString(title: string, code?: string): string {
  let str = (title || '').trim();
  if (!str) return '';

  if (code) {
    const cleanCode = code.trim();
    if (cleanCode) {
      const escaped = cleanCode.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
      str = str.replace(new RegExp(`^${escaped}\\s*[-:_\\/\\s]*`, 'i'), '');
      str = str.replace(new RegExp(`\\s*[-:_\\/\\s]*${escaped}$`, 'i'), '');
    }
  }

  // Strip leading code patterns e.g. "25CS1302E - ", "CS1302: ", "23CS2101R / "
  str = str.replace(/^(?:[0-9]{2})?[A-Z]{2,5}[0-9]{3,4}[A-Z]?(?:[-_][LTPSS])?\s*[-:_\\/]\s*/i, '');

  return str.trim();
}

/**
 * Registers course code -> title pairs dynamically from ERP datasets (Attendance, Marks, Profile)
 */
export function registerCourseTitles(data: unknown): void {
  if (!data) return;

  const items = Array.isArray(data) ? data : [data];

  items.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    const row = item as Record<string, unknown>;
    let code = '';
    let title = '';

    for (const [k, v] of Object.entries(row)) {
      const key = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      const val = String(v ?? '').trim();
      if (!val) continue;

      if (key === 'coursecode' || key === 'subjectcode' || key === 'code') {
        if (!code) code = val.toUpperCase();
      } else if (
        key === 'coursetitle' ||
        key === 'subjecttitle' ||
        key === 'coursename' ||
        key === 'subjectname' ||
        key === 'title' ||
        key === 'subject'
      ) {
        if (!title) title = val;
      }
    }

    if (code && title) {
      const cleanedTitle = cleanTitleString(title, code);
      if (cleanedTitle && cleanedTitle.toUpperCase() !== code.toUpperCase() && cleanedTitle.length > 3) {
        const baseCode = code.replace(/[-_]([LTPSS]|LAB|PRAC|THEORY|\d+)$/i, '');
        const coreCode = extractCoreCode(code);

        COURSE_TITLE_REGISTRY[code] = cleanedTitle;
        if (baseCode) COURSE_TITLE_REGISTRY[baseCode] = cleanedTitle;
        if (coreCode) COURSE_TITLE_REGISTRY[coreCode] = cleanedTitle;
      }
    }
  });
}

/**
 * Resolves a course code (e.g. "25CS1302E") or raw string to a friendly Subject Name.
 * Priority:
 * 1. Explicit title if provided and non-code
 * 2. Dynamic COURSE_TITLE_REGISTRY (from attendance/marks/profile)
 * 3. KNOWN_COURSE_MAP dictionary
 * 4. Fallback code or formatted string
 */
export function getSubjectTitle(code: string, title?: string): string {
  const cleanCode = (code || '').trim().toUpperCase();
  const rawTitle = (title || '').trim();
  const cleanedTitle = cleanTitleString(rawTitle, cleanCode);

  // 1. Explicit title if distinct and valid
  if (
    cleanedTitle &&
    cleanedTitle.toUpperCase() !== cleanCode &&
    !cleanedTitle.toUpperCase().startsWith('PERIOD') &&
    cleanedTitle.length > 3
  ) {
    return cleanedTitle;
  }

  const baseCode = cleanCode.replace(/[-_]([LTPSS]|LAB|PRAC|THEORY|\d+)$/i, '');
  const coreCode = extractCoreCode(cleanCode);

  // 2. Dynamic registry from live ERP data (full code, base code, or core code)
  if (cleanCode && COURSE_TITLE_REGISTRY[cleanCode]) return COURSE_TITLE_REGISTRY[cleanCode];
  if (baseCode && COURSE_TITLE_REGISTRY[baseCode]) return COURSE_TITLE_REGISTRY[baseCode];
  if (coreCode && COURSE_TITLE_REGISTRY[coreCode]) return COURSE_TITLE_REGISTRY[coreCode];

  // 3. Known static dictionary fallback (full code, base code, or core code)
  if (cleanCode && KNOWN_COURSE_MAP[cleanCode]) return KNOWN_COURSE_MAP[cleanCode];
  if (baseCode && KNOWN_COURSE_MAP[baseCode]) return KNOWN_COURSE_MAP[baseCode];
  if (coreCode && KNOWN_COURSE_MAP[coreCode]) return KNOWN_COURSE_MAP[coreCode];

  // 4. Fallback cleanTitle if valid
  if (cleanedTitle && cleanedTitle.toUpperCase() !== cleanCode) {
    return cleanedTitle;
  }

  // 5. Final fallback to Code
  return cleanCode || 'Subject Course';
}

/**
 * Gets formatted subject code (e.g. "25CS1302E")
 */
export function getSubjectCode(code: string, rawText?: string): string {
  if (code && code.trim()) {
    return code.trim().toUpperCase();
  }
  if (rawText) {
    const match = rawText.match(/([0-9]{2}[A-Z]{2,5}[0-9]{3,4}[A-Z]?|[A-Z]{2,5}[0-9]{3,4}[A-Z]?)/i);
    if (match) return match[1].toUpperCase();
  }
  return '';
}
