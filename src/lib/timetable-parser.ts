export interface NormalizedClassSession {
  id: string;
  day: string;            // Normalized day name e.g. 'Monday'
  dayShort: string;       // Normalized short day e.g. 'Mon'
  dayIndex: number;       // 0=Sun, 1=Mon, ..., 6=Sat (-1 if Day Order/Unknown)
  timeSlot: string;       // e.g. '09:00 AM - 10:00 AM' or 'Period 1'
  courseCode: string;     // e.g. '25CS1302E'
  courseTitle: string;    // e.g. 'DATABASE SYSTEMS ENGINEERING AND DISTRIBUTED BACKEND DEVELOPMENT'
  component?: string;     // e.g. 'Lecture', 'Practical', 'Skill', 'Tutorial'
  section?: string;       // e.g. 'S-10'
  room: string;           // e.g. 'H-005'
  faculty: string;        // e.g. 'khaja shareef sk'
  rawText: string;        // Original cell string
}

export type TimetableLayoutType = 'matrix_days_columns' | 'matrix_days_rows' | 'list_rows' | 'unknown';

export interface ParsedTimetable {
  layout: TimetableLayoutType;
  headers: string[];
  rawRows: Array<Record<string, string>>;
  sessions: NormalizedClassSession[];
  daysPresent: string[];
  timeSlotsPresent: string[];
  matrixGrid: Record<string, Record<string, NormalizedClassSession | null>>; // day -> timeSlot -> session
}

function expandTimeSlots(raw: string): string[] {
  const str = String(raw).trim().toUpperCase();
  const periods = new Set<string>();
  
  const rangeRegex = /(\d+)\s*-\s*(\d+)/g;
  let match;
  let hasRange = false;
  while ((match = rangeRegex.exec(str)) !== null) {
    hasRange = true;
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (start <= end && end - start < 15) {
      for (let i = start; i <= end; i++) {
        periods.add(String(i));
      }
    }
  }
  
  if (!hasRange) {
    const numRegex = /\d+/g;
    while ((match = numRegex.exec(str)) !== null) {
      periods.add(match[0]);
    }
  }
  
  if (periods.size === 0) {
    return [str];
  }
  return Array.from(periods);
}

const DAY_MAP: Record<string, { full: string; short: string; index: number }> = {
  monday: { full: 'Monday', short: 'Mon', index: 1 },
  mon: { full: 'Monday', short: 'Mon', index: 1 },
  'day 1': { full: 'Monday', short: 'Mon', index: 1 },
  'day1': { full: 'Monday', short: 'Mon', index: 1 },

  tuesday: { full: 'Tuesday', short: 'Tue', index: 2 },
  tue: { full: 'Tuesday', short: 'Tue', index: 2 },
  tues: { full: 'Tuesday', short: 'Tue', index: 2 },
  'day 2': { full: 'Tuesday', short: 'Tue', index: 2 },
  'day2': { full: 'Tuesday', short: 'Tue', index: 2 },

  wednesday: { full: 'Wednesday', short: 'Wed', index: 3 },
  wed: { full: 'Wednesday', short: 'Wed', index: 3 },
  'day 3': { full: 'Wednesday', short: 'Wed', index: 3 },
  'day3': { full: 'Wednesday', short: 'Wed', index: 3 },

  thursday: { full: 'Thursday', short: 'Thu', index: 4 },
  thu: { full: 'Thursday', short: 'Thu', index: 4 },
  thur: { full: 'Thursday', short: 'Thu', index: 4 },
  thurs: { full: 'Thursday', short: 'Thu', index: 4 },
  'day 4': { full: 'Thursday', short: 'Thu', index: 4 },
  'day4': { full: 'Thursday', short: 'Thu', index: 4 },

  friday: { full: 'Friday', short: 'Fri', index: 5 },
  fri: { full: 'Friday', short: 'Fri', index: 5 },
  'day 5': { full: 'Friday', short: 'Fri', index: 5 },
  'day5': { full: 'Friday', short: 'Fri', index: 5 },

  saturday: { full: 'Saturday', short: 'Sat', index: 6 },
  sat: { full: 'Saturday', short: 'Sat', index: 6 },
  'day 6': { full: 'Saturday', short: 'Sat', index: 6 },
  'day6': { full: 'Saturday', short: 'Sat', index: 6 },

  sunday: { full: 'Sunday', short: 'Sun', index: 0 },
  sun: { full: 'Sunday', short: 'Sun', index: 0 },
  'day 7': { full: 'Sunday', short: 'Sun', index: 0 },
  'day7': { full: 'Sunday', short: 'Sun', index: 0 },
};

/**
 * Normalizes day string representation (e.g. 'Mon', 'Monday', 'Day 1') into a structured object.
 * Rejects pure numbers (e.g. '1', '2', '3') to prevent period numbers from being misclassified as days.
 */
export function normalizeDay(dayStr: string): { full: string; short: string; index: number } | null {
  if (!dayStr) return null;
  const clean = dayStr.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').trim();
  if (!clean || /^\d+$/.test(clean)) return null;

  // Direct lookup
  if (DAY_MAP[clean]) return DAY_MAP[clean];

  // Token / word matching
  const words = clean.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (DAY_MAP[word]) return DAY_MAP[word];
    if (i < words.length - 1) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (DAY_MAP[phrase]) return DAY_MAP[phrase];
    }
  }

  return null;
}

/**
 * Checks if two day strings refer to the same day of the week or day order.
 */
export function isSameDay(dayA: string, dayB: string): boolean {
  if (!dayA || !dayB) return false;
  const normA = normalizeDay(dayA);
  const normB = normalizeDay(dayB);
  if (normA && normB) {
    return normA.full === normB.full;
  }
  return dayA.toLowerCase().trim() === dayB.toLowerCase().trim();
}

/**
 * Smart Cell Parser: Robustly parses course code, course title, room/venue, and faculty from cell strings.
 * Handles multi-hyphen strings ("22-CS-1101", "C-101 - Lab", "22-CS-1101 - Data Structures - C-101 - Dr. Smith").
 */
export function parseCellContent(text: string): {
  courseCode: string;
  courseTitle: string;
  component?: string;
  section?: string;
  room: string;
  faculty: string;
} {
  if (!text || text.trim() === '' || text.trim() === '-' || text.toLowerCase().trim() === 'free' || text.toLowerCase().trim() === 'n/a') {
    return { courseCode: '', courseTitle: '', room: '', faculty: '' };
  }

  const raw = text.trim();

  // Flexible KL ERP Format Matcher: e.g. "25CS1302E-L - S-10 - RoomNo-H-005" or "25SC2107E-S - S-10 -RoomNo-H-005"
  const klRegex = /([A-Z0-9]{5,10})[-_]([LTPSS])\b.*?\b(S-\d+|\w+)\b.*?\b(?:RoomNo|Room|Hall|Lab|Venue)?[-:\s]*([A-Z0-9-]+)/i;
  const match = raw.match(klRegex);
  if (match) {
    const rawCode = match[1].toUpperCase();
    const compLetter = match[2].toUpperCase();
    const secStr = match[3].toUpperCase();
    const roomStr = match[4].replace(/^RoomNo-/i, '').trim();

    const compMap: Record<string, string> = {
      L: 'Lecture',
      P: 'Practical',
      S: 'Skill',
      T: 'Tutorial',
    };

    return {
      courseCode: rawCode,
      courseTitle: rawCode, // Will be mapped to full human-readable title by profile lookup
      component: compMap[compLetter] || compLetter,
      section: secStr,
      room: roomStr,
      faculty: '',
    };
  }

  // Fallback extraction
  const codeMatch = raw.match(/([0-9]{2}[A-Z]{2,5}[0-9]{3,4}[A-Z]?|[A-Z]{2,5}[0-9]{3,4}[A-Z]?)/i);
  const courseCode = codeMatch ? codeMatch[1].toUpperCase() : raw;

  const compMatch = raw.match(/[-_]([LTPSS])\b/i);
  const compLetter = compMatch ? compMatch[1].toUpperCase() : '';
  const compMap: Record<string, string> = { L: 'Lecture', P: 'Practical', S: 'Skill', T: 'Tutorial' };
  const component = compLetter ? (compMap[compLetter] || compLetter) : undefined;

  const secMatch = raw.match(/\b(S-\d+)\b/i);
  const section = secMatch ? secMatch[1].toUpperCase() : undefined;

  const roomMatch = raw.match(/(?:RoomNo|Room|Venue|Hall|Lab)[-:\s]*([A-Z0-9-]+)/i);
  const room = roomMatch ? roomMatch[1].replace(/^RoomNo-/i, '').trim() : '';

  return { courseCode, courseTitle: courseCode, component, section, room, faculty: '' };
}

/**
 * Universal timetable parser that auto-detects layout format:
 * - Matrix Days-as-Columns (`headers` have day names)
 * - Matrix Days-as-Rows (Row 0 has day names in col 0)
 * - List Timetables (Rows have Day, Time, Course, Room, Faculty)
 */
export function parseTimetable(rawRows: Array<Record<string, string>>): ParsedTimetable {
  if (!rawRows || !Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      layout: 'unknown',
      headers: [],
      rawRows: [],
      sessions: [],
      daysPresent: [],
      timeSlotsPresent: [],
      matrixGrid: {},
    };
  }

  const headers = Object.keys(rawRows[0] || {});
  if (headers.length === 0) {
    return {
      layout: 'unknown',
      headers: [],
      rawRows: [],
      sessions: [],
      daysPresent: [],
      timeSlotsPresent: [],
      matrixGrid: {},
    };
  }

  const dayHeaders = headers.filter(h => normalizeDay(h) !== null);
  const firstColKey = headers[0];
  const firstColValues = rawRows.map(r => String(r[firstColKey] || ''));
  const dayRows = firstColValues.filter(v => normalizeDay(v) !== null);

  let layout: TimetableLayoutType = 'unknown';
  if (dayHeaders.length >= 3) {
    layout = 'matrix_days_columns';
  } else if (dayRows.length >= 3) {
    layout = 'matrix_days_rows';
  } else {
    const hasDayCol = headers.some(h => h.toLowerCase().includes('day'));
    const hasTimeOrCourseCol = headers.some(h =>
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('period') ||
      h.toLowerCase().includes('course') ||
      h.toLowerCase().includes('subject') ||
      h.toLowerCase().includes('room') ||
      h.toLowerCase().includes('venue')
    );
    if (hasDayCol && hasTimeOrCourseCol) {
      layout = 'list_rows';
    } else if (dayHeaders.length > 0) {
      layout = 'matrix_days_columns';
    } else if (dayRows.length > 0) {
      layout = 'matrix_days_rows';
    } else {
      layout = 'list_rows';
    }
  }

  const sessions: NormalizedClassSession[] = [];
  const matrixGrid: Record<string, Record<string, NormalizedClassSession | null>> = {};
  const daysSet = new Set<string>();
  const timeSlotsSet = new Set<string>();

  if (layout === 'matrix_days_columns') {
    const timeColKey = headers.find(h => normalizeDay(h) === null) || headers[0];

    rawRows.forEach((row, rIdx) => {
      const rawSlot = String(row[timeColKey] || `Period ${rIdx + 1}`).trim();
      const expandedPeriods = expandTimeSlots(rawSlot);
      expandedPeriods.forEach(timeSlot => {
        timeSlotsSet.add(timeSlot);
      });

      dayHeaders.forEach(dayHeader => {
        const normDay = normalizeDay(dayHeader);
        if (!normDay) return;
        daysSet.add(normDay.full);

        const rawText = String(row[dayHeader] || '').trim();
        if (rawText && rawText !== '-' && rawText !== '- - -' && rawText.toLowerCase() !== 'free') {
          const parsedCell = parseCellContent(rawText);
          
          expandedPeriods.forEach(timeSlot => {
            const session: NormalizedClassSession = {
              id: `matrix-col-${normDay.full}-${timeSlot}-${rIdx}`,
              day: normDay.full,
              dayShort: normDay.short,
              dayIndex: normDay.index,
              timeSlot,
              ...parsedCell,
              rawText,
            };
            sessions.push(session);
            timeSlotsSet.add(timeSlot);
            if (!matrixGrid[normDay.full]) matrixGrid[normDay.full] = {};
            matrixGrid[normDay.full][timeSlot] = session;
          });
        }
      });
    });
  } else if (layout === 'matrix_days_rows') {
    const dayColKey = headers[0];
    const timeSlotHeaders = headers.slice(1);
    
    rawRows.forEach((row, rIdx) => {
      const dayVal = String(row[dayColKey] || '').trim();
      const normDay = normalizeDay(dayVal);
      if (!normDay) return;
      daysSet.add(normDay.full);

      timeSlotHeaders.forEach(tsHeader => {
        const expandedPeriods = expandTimeSlots(tsHeader);
        const cellVal = String(row[tsHeader] || '').trim();
        if (cellVal && cellVal !== '-' && cellVal !== '- - -' && cellVal.toLowerCase() !== 'free' && cellVal.toLowerCase() !== 'n/a') {
          const parsedCell = parseCellContent(cellVal);
          
          expandedPeriods.forEach(timeSlot => {
            timeSlotsSet.add(timeSlot);
            const session: NormalizedClassSession = {
              id: `matrix-row-${normDay.full}-${timeSlot}-${rIdx}`,
              day: normDay.full,
              dayShort: normDay.short,
              dayIndex: normDay.index,
              timeSlot,
              ...parsedCell,
              rawText: cellVal,
            };
            sessions.push(session);
            if (!matrixGrid[normDay.full]) matrixGrid[normDay.full] = {};
            matrixGrid[normDay.full][timeSlot] = session;
          });
        }
      });
    });
  } else {
    // List Timetable or fallback
    rawRows.forEach((row, rIdx) => {
      const dayKey = headers.find(h => h.toLowerCase().includes('day')) || headers[0];
      const timeKey = headers.find(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('period') || h.toLowerCase().includes('slot'));
      const codeKey = headers.find(h => h.toLowerCase().includes('code') || h.toLowerCase().includes('course'));
      const titleKey = headers.find(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('name') || h.toLowerCase().includes('subject'));
      const roomKey = headers.find(h => h.toLowerCase().includes('room') || h.toLowerCase().includes('venue') || h.toLowerCase().includes('hall') || h.toLowerCase().includes('lab'));
      const facultyKey = headers.find(h => h.toLowerCase().includes('faculty') || h.toLowerCase().includes('instructor') || h.toLowerCase().includes('staff') || h.toLowerCase().includes('teacher'));

      const rawDayVal = String(row[dayKey] || '').trim();
      const normDay = normalizeDay(rawDayVal) || { full: rawDayVal || 'General', short: rawDayVal ? rawDayVal.slice(0, 3) : 'Gen', index: -1 };
      daysSet.add(normDay.full);

      const timeSlot = (timeKey && String(row[timeKey]).trim()) || `Period ${rIdx + 1}`;
      timeSlotsSet.add(timeSlot);

      const rawValues = Object.values(row).map(v => String(v || '').trim()).filter(Boolean);

      let courseCode = (codeKey && String(row[codeKey]).trim()) || '';
      let courseTitle = (titleKey && String(row[titleKey]).trim()) || '';
      let room = (roomKey && String(row[roomKey]).trim()) || '';
      let faculty = (facultyKey && String(row[facultyKey]).trim()) || '';

      if (!courseCode || !courseTitle || !room) {
        for (const val of rawValues) {
          if (val === rawDayVal || val === timeSlot) continue;
          const parsed = parseCellContent(val);
          if (!courseCode && parsed.courseCode) courseCode = parsed.courseCode;
          if (!courseTitle && parsed.courseTitle) courseTitle = parsed.courseTitle;
          if (!room && parsed.room) room = parsed.room;
          if (!faculty && parsed.faculty) faculty = parsed.faculty;
        }
      }

      if (!courseCode && rawValues.length > 1) courseCode = rawValues[1];
      if (!courseTitle && rawValues.length > 2) courseTitle = rawValues[2];
      if (!room && rawValues.length > 0) room = rawValues[rawValues.length - 1];

      const session: NormalizedClassSession = {
        id: `list-session-${rIdx}`,
        day: normDay.full,
        dayShort: normDay.short,
        dayIndex: normDay.index,
        timeSlot,
        courseCode: courseCode || 'N/A',
        courseTitle: courseTitle || 'Class Session',
        room: room || 'N/A',
        faculty: faculty || '',
        rawText: rawValues.join(' | '),
      };

      sessions.push(session);
      if (!matrixGrid[normDay.full]) matrixGrid[normDay.full] = {};
      matrixGrid[normDay.full][timeSlot] = session;
    });
  }

  const sortedDays = Array.from(daysSet).sort((a, b) => {
    const normA = normalizeDay(a);
    const normB = normalizeDay(b);
    const idxA = normA ? normA.index : 99;
    const idxB = normB ? normB.index : 99;
    return idxA - idxB;
  });

  return {
    layout,
    headers,
    rawRows,
    sessions,
    daysPresent: sortedDays,
    timeSlotsPresent: Array.from(timeSlotsSet),
    matrixGrid,
  };
}
