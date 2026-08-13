/**
 * Course Code to Subject Name Resolver and Formatters
 */

export const KNOWN_COURSE_MAP: Record<string, string> = {
  // 25 Series Courses
  '25CS1302E': 'Data Structures & Algorithms',
  '25CS2103E': 'Computer Organization & Architecture',
  '25CS2104E': 'Operating Systems & Systems Programming',
  '25EC2206E': 'Signal Processing & Signals Systems',
  '25SC2107E': 'Discrete Mathematics & Graph Theory',
  '25FL2112E': 'Foreign Language - Elective',
  '25CS1101E': 'Object Oriented Programming with Java',
  '25CS2205E': 'Database Management Systems',
  '25CS3108E': 'Software Engineering & Agile',

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
 * Resolves a course code (e.g. "25CS1302E") or raw string to a friendly Subject Name.
 * If title is already a distinct subject name, returns title.
 * Otherwise looks up in KNOWN_COURSE_MAP or generates a formatted subject title.
 */
export function getSubjectTitle(code: string, title?: string): string {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanTitle = (title || '').trim();

  // If a distinct title exists and is not identical to code
  if (
    cleanTitle &&
    cleanTitle.toUpperCase() !== cleanCode &&
    !cleanTitle.toUpperCase().startsWith('PERIOD') &&
    cleanTitle.length > 3
  ) {
    return cleanTitle;
  }

  // Lookup in known dictionary
  if (cleanCode && KNOWN_COURSE_MAP[cleanCode]) {
    return KNOWN_COURSE_MAP[cleanCode];
  }

  // Handle codes with component suffixes e.g. 25CS1302E-L -> 25CS1302E
  const baseCode = cleanCode.replace(/[-_][LTPSS]$/i, '');
  if (baseCode && KNOWN_COURSE_MAP[baseCode]) {
    return KNOWN_COURSE_MAP[baseCode];
  }

  // If title is valid non-code string
  if (cleanTitle && cleanTitle.toUpperCase() !== cleanCode) {
    return cleanTitle;
  }

  // Fallback to Code if no name available
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
