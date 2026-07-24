export interface NormalizedClassSession {
  id: string;
  day: string;            // Normalized day name e.g. 'Monday'
  dayShort: string;       // Normalized short day e.g. 'Mon'
  dayIndex: number;       // 0=Sun, 1=Mon, ..., 6=Sat (-1 if Day Order/Unknown)
  timeSlot: string;       // e.g. '09:00 AM - 10:00 AM' or 'Period 1'
  courseCode: string;     // e.g. '22CS1101'
  courseTitle: string;    // e.g. 'Data Structures'
  room: string;           // e.g. 'C101'
  faculty: string;        // e.g. 'Dr. Smith'
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

const DAY_MAP: Record<string, { full: string; short: string; index: number }> = {
  monday: { full: 'Monday', short: 'Mon', index: 1 },
  mon: { full: 'Monday', short: 'Mon', index: 1 },
  '1': { full: 'Monday', short: 'Mon', index: 1 },
  'day 1': { full: 'Monday', short: 'Mon', index: 1 },
  'day1': { full: 'Monday', short: 'Mon', index: 1 },

  tuesday: { full: 'Tuesday', short: 'Tue', index: 2 },
  tue: { full: 'Tuesday', short: 'Tue', index: 2 },
  tues: { full: 'Tuesday', short: 'Tue', index: 2 },
  '2': { full: 'Tuesday', short: 'Tue', index: 2 },
  'day 2': { full: 'Tuesday', short: 'Tue', index: 2 },
  'day2': { full: 'Tuesday', short: 'Tue', index: 2 },

  wednesday: { full: 'Wednesday', short: 'Wed', index: 3 },
  wed: { full: 'Wednesday', short: 'Wed', index: 3 },
  '3': { full: 'Wednesday', short: 'Wed', index: 3 },
  'day 3': { full: 'Wednesday', short: 'Wed', index: 3 },
  'day3': { full: 'Wednesday', short: 'Wed', index: 3 },

  thursday: { full: 'Thursday', short: 'Thu', index: 4 },
  thu: { full: 'Thursday', short: 'Thu', index: 4 },
  thur: { full: 'Thursday', short: 'Thu', index: 4 },
  thurs: { full: 'Thursday', short: 'Thu', index: 4 },
  '4': { full: 'Thursday', short: 'Thu', index: 4 },
  'day 4': { full: 'Thursday', short: 'Thu', index: 4 },
  'day4': { full: 'Thursday', short: 'Thu', index: 4 },

  friday: { full: 'Friday', short: 'Fri', index: 5 },
  fri: { full: 'Friday', short: 'Fri', index: 5 },
  '5': { full: 'Friday', short: 'Fri', index: 5 },
  'day 5': { full: 'Friday', short: 'Fri', index: 5 },
  'day5': { full: 'Friday', short: 'Fri', index: 5 },

  saturday: { full: 'Saturday', short: 'Sat', index: 6 },
  sat: { full: 'Saturday', short: 'Sat', index: 6 },
  '6': { full: 'Saturday', short: 'Sat', index: 6 },
  'day 6': { full: 'Saturday', short: 'Sat', index: 6 },
  'day6': { full: 'Saturday', short: 'Sat', index: 6 },

  sunday: { full: 'Sunday', short: 'Sun', index: 0 },
  sun: { full: 'Sunday', short: 'Sun', index: 0 },
  '7': { full: 'Sunday', short: 'Sun', index: 0 },
  'day 7': { full: 'Sunday', short: 'Sun', index: 0 },
  'day7': { full: 'Sunday', short: 'Sun', index: 0 },
};

/**
 * Normalizes day string representation (e.g. 'Mon', 'Monday', '1', 'Day 1') into a structured object.
 */
export function normalizeDay(dayStr: string): { full: string; short: string; index: number } | null {
  if (!dayStr) return null;
  const clean = dayStr.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').trim();
  if (DAY_MAP[clean]) return DAY_MAP[clean];

  for (const [key, val] of Object.entries(DAY_MAP)) {
    if (key.length > 2 && (clean === key || clean.startsWith(key + ' ') || clean.endsWith(' ' + key))) {
      return val;
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
 * Parses raw cell content from a timetable cell to extract course code, course title, room/venue, and faculty.
 */
export function parseCellContent(text: string): { courseCode: string; courseTitle: string; room: string; faculty: string } {
  if (!text || text.trim() === '' || text.trim() === '-' || text.toLowerCase().trim() === 'free' || text.toLowerCase().trim() === 'n/a') {
    return { courseCode: '', courseTitle: '', room: '', faculty: '' };
  }

  const raw = text.trim();

  let parts: string[] = [];
  if (raw.includes('\n') || raw.includes('|') || raw.includes('/') || raw.includes(' - ')) {
    parts = raw.split(/[\n|/]|(?:\s+-\s+)/).map(p => p.trim()).filter(Boolean);
  } else if (raw.includes('-')) {
    parts = raw.split('-').map(p => p.trim()).filter(Boolean);
  } else {
    parts = [raw];
  }

  let courseCode = '';
  let courseTitle = '';
  let room = '';
  let faculty = '';

  const codeRegex = /^([0-9]{2}[-.]?[A-Z]{2,4}[-.]?[0-9]{3,4}[A-Z]?|[A-Z]{2,4}[-.]?[0-9]{3,4}[A-Z]?)$/i;
  const facultyRegex = /^(dr\.|prof\.|mr\.|mrs\.|ms\.)/i;
  const roomRegex = /^(room|venue|hall|lab|c|r|b|l|m|tp|fed|lbr)?\s*[-]?\s*[0-9]{3,4}[a-z]?$/i;

  const unmapped: string[] = [];

  for (const part of parts) {
    if (!courseCode && codeRegex.test(part)) {
      courseCode = part;
    } else if (!faculty && (facultyRegex.test(part) || part.toLowerCase().includes('dr.') || part.toLowerCase().includes('prof.'))) {
      faculty = part;
    } else if (!room && (roomRegex.test(part) || part.toLowerCase().includes('room') || part.toLowerCase().includes('lab') || part.toLowerCase().includes('hall') || part.toLowerCase().includes('venue'))) {
      room = part;
    } else {
      unmapped.push(part);
    }
  }

  if (unmapped.length > 0) {
    courseTitle = unmapped[0];
    if (unmapped.length > 1 && !faculty) {
      faculty = unmapped[1];
    } else if (unmapped.length > 1 && !room) {
      room = unmapped[unmapped.length - 1];
    }
  }

  if (!courseCode && parts.length > 0 && /^[A-Z0-9-]{4,12}$/i.test(parts[0])) {
    courseCode = parts[0];
  }
  if (!room && parts.length > 1 && !facultyRegex.test(parts[parts.length - 1])) {
    room = parts[parts.length - 1];
  }

  return { courseCode, courseTitle, room, faculty };
}

/**
 * Universal timetable parser that classifies layout and normalizes raw ERP rows into ParsedTimetable.
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
      const timeSlot = String(row[timeColKey] || `Period ${rIdx + 1}`).trim();
      timeSlotsSet.add(timeSlot);

      dayHeaders.forEach(dayHeader => {
        const normDay = normalizeDay(dayHeader);
        if (!normDay) return;
        daysSet.add(normDay.full);

        const cellVal = String(row[dayHeader] || '').trim();
        if (cellVal && cellVal !== '-' && cellVal.toLowerCase() !== 'free' && cellVal.toLowerCase() !== 'n/a') {
          const parsedCell = parseCellContent(cellVal);
          const session: NormalizedClassSession = {
            id: `matrix-col-${normDay.full}-${timeSlot}-${rIdx}`,
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
        }
      });
    });
  } else if (layout === 'matrix_days_rows') {
    const dayColKey = headers[0];
    const timeSlotHeaders = headers.slice(1);
    timeSlotHeaders.forEach(ts => timeSlotsSet.add(ts));

    rawRows.forEach((row, rIdx) => {
      const dayVal = String(row[dayColKey] || '').trim();
      const normDay = normalizeDay(dayVal);
      if (!normDay) return;
      daysSet.add(normDay.full);

      timeSlotHeaders.forEach(tsHeader => {
        const cellVal = String(row[tsHeader] || '').trim();
        if (cellVal && cellVal !== '-' && cellVal.toLowerCase() !== 'free' && cellVal.toLowerCase() !== 'n/a') {
          const parsedCell = parseCellContent(cellVal);
          const session: NormalizedClassSession = {
            id: `matrix-row-${normDay.full}-${tsHeader}-${rIdx}`,
            day: normDay.full,
            dayShort: normDay.short,
            dayIndex: normDay.index,
            timeSlot: tsHeader,
            ...parsedCell,
            rawText: cellVal,
          };
          sessions.push(session);
          if (!matrixGrid[normDay.full]) matrixGrid[normDay.full] = {};
          matrixGrid[normDay.full][tsHeader] = session;
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
