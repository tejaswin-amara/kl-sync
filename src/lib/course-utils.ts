/**
 * Course Code to Subject Name Resolver and Dynamic Registry
 */

// Global runtime registry populated from live ERP Attendance, Marks, & Profile data
const COURSE_TITLE_REGISTRY: Record<string, string> = {};

export const KNOWN_COURSE_MAP: Record<string, string> = {
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
      const key = k.toLowerCase();
      const val = String(v ?? '').trim();
      if (!val) continue;

      if (key.includes('code') || key.includes('coursecode') || key.includes('subjectcode')) {
        if (!code) code = val.toUpperCase();
      } else if (key.includes('title') || key.includes('subject') || key.includes('coursename') || key.includes('coursedesc')) {
        if (!title) title = val;
      }
    }

    if (code && title && title.toUpperCase() !== code && title.length > 3) {
      // Strip component prefix if code has suffix (e.g. 25CS1302E-L -> 25CS1302E)
      const baseCode = code.replace(/[-_][LTPSS]$/i, '');
      COURSE_TITLE_REGISTRY[code] = title;
      COURSE_TITLE_REGISTRY[baseCode] = title;
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
  const cleanTitle = (title || '').trim();

  // 1. Explicit title if distinct and valid
  if (
    cleanTitle &&
    cleanTitle.toUpperCase() !== cleanCode &&
    !cleanTitle.toUpperCase().startsWith('PERIOD') &&
    cleanTitle.length > 3
  ) {
    return cleanTitle;
  }

  const baseCode = cleanCode.replace(/[-_][LTPSS]$/i, '');

  // 2. Dynamic registry from live ERP attendance/marks/profile data
  if (cleanCode && COURSE_TITLE_REGISTRY[cleanCode]) {
    return COURSE_TITLE_REGISTRY[cleanCode];
  }
  if (baseCode && COURSE_TITLE_REGISTRY[baseCode]) {
    return COURSE_TITLE_REGISTRY[baseCode];
  }

  // 3. Known static dictionary fallback
  if (cleanCode && KNOWN_COURSE_MAP[cleanCode]) {
    return KNOWN_COURSE_MAP[cleanCode];
  }
  if (baseCode && KNOWN_COURSE_MAP[baseCode]) {
    return KNOWN_COURSE_MAP[baseCode];
  }

  // 4. Fallback cleanTitle if valid
  if (cleanTitle && cleanTitle.toUpperCase() !== cleanCode) {
    return cleanTitle;
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
