import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGenericTable, isLikelyTimetableData } from './scraper';
import {
  parseTimetable,
  normalizeDay,
  parseCellContent,
  normalizeSlotKey,
  isSameDay,
} from './timetable-parser';

describe('Timetable Day Normalization & DAY_MAP Coverage', () => {
  it('correctly normalizes day order variations (DAY ORDER 1 through 7)', () => {
    const do1Variations = [
      'DAY ORDER - 1',
      'DAY ORDER 1',
      'DAY ORDER 01',
      'DO 1',
      'DO-1',
      'DO 01',
      'D1',
      'DAY 1',
      'day1',
      'Mon',
      'Monday',
    ];

    do1Variations.forEach((varStr) => {
      const result = normalizeDay(varStr);
      assert.notEqual(result, null, `Failed for variation: ${varStr}`);
      assert.equal(result?.full, 'Monday');
      assert.equal(result?.short, 'Mon');
      assert.equal(result?.index, 1);
    });
  });

  it('correctly normalizes Day Order 7 to Sunday', () => {
    const do7Variations = ['DAY ORDER - 7', 'DAY ORDER 07', 'DO 7', 'D7', 'Sunday', 'Sun'];
    do7Variations.forEach((varStr) => {
      const result = normalizeDay(varStr);
      assert.notEqual(result, null, `Failed for variation: ${varStr}`);
      assert.equal(result?.full, 'Sunday');
      assert.equal(result?.short, 'Sun');
      assert.equal(result?.index, 0);
    });
  });

  it('rejects invalid or period-only numeric day strings', () => {
    assert.equal(normalizeDay('1'), null);
    assert.equal(normalizeDay('P1'), null);
    assert.equal(normalizeDay(''), null);
    assert.equal(normalizeDay('Unknown XYZ Day'), null);
  });

  it('isSameDay correctly matches day aliases', () => {
    assert.equal(isSameDay('DAY ORDER - 1', 'Monday'), true);
    assert.equal(isSameDay('DO 2', 'Tuesday'), true);
    assert.equal(isSameDay('DAY ORDER 5', 'Friday'), true);
    assert.equal(isSameDay('Monday', 'Tuesday'), false);
  });
});

describe('Cell Content Parser (parseCellContent)', () => {
  it('correctly parses cells with room numbers', () => {
    const cell = '25CS1302E-L - S-10 - RoomNo-H-005';
    const parsed = parseCellContent(cell);
    assert.equal(parsed.courseCode, '25CS1302E');
    assert.equal(parsed.component, 'Lecture');
    assert.equal(parsed.section, 'S-10');
    assert.equal(parsed.room, 'H-005');
  });

  it('correctly parses cells WITHOUT room numbers without mis-parsing section S-10', () => {
    const cell = '25CS1302E-L - S-10';
    const parsed = parseCellContent(cell);
    assert.equal(parsed.courseCode, '25CS1302E');
    assert.equal(parsed.component, 'Lecture');
    assert.equal(parsed.section, 'S-10');
    assert.equal(parsed.room, '');
  });

  it('correctly parses cells with Skill component and room', () => {
    const cell = '25SC2107E-S - S-10 - RoomNo-H-005';
    const parsed = parseCellContent(cell);
    assert.equal(parsed.courseCode, '25SC2107E');
    assert.equal(parsed.component, 'Skill');
    assert.equal(parsed.section, 'S-10');
    assert.equal(parsed.room, 'H-005');
  });

  it('preserves faculty name if present in cell text', () => {
    const cell = '25CS1302E-L - S-10 - RoomNo-H-005 - Dr. Smith';
    const parsed = parseCellContent(cell);
    assert.equal(parsed.courseCode, '25CS1302E');
    assert.equal(parsed.section, 'S-10');
    assert.equal(parsed.room, 'H-005');
    assert.equal(parsed.faculty, 'Dr. Smith');
  });

  it('handles free/empty/dash cell strings gracefully', () => {
    assert.equal(parseCellContent('-').courseCode, '');
    assert.equal(parseCellContent('Free').courseCode, '');
    assert.equal(parseCellContent('N/A').courseCode, '');
    assert.equal(parseCellContent('').courseCode, '');
  });
});

describe('HTML Parsing (parseGenericTable & parseTimetable)', () => {
  it('parses matrix format timetable HTML payload cleanly', () => {
    const htmlPayload = `
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Time/Day</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DAY ORDER - 1</td>
            <td>25CS1302E-L - S-10 - RoomNo-H-005</td>
            <td>25SC2107E-S - S-10</td>
            <td>Free</td>
          </tr>
          <tr>
            <td>DAY ORDER - 2</td>
            <td>22CS1101-L - S-05 - RoomNo-C-101</td>
            <td>-</td>
            <td>25CS1302E-P - S-10 - RoomNo-LAB-2</td>
          </tr>
        </tbody>
      </table>
    `;

    const rawRows = parseGenericTable(htmlPayload);
    assert.equal(rawRows.length, 2);
    assert.equal(isLikelyTimetableData(rawRows), true);

    const parsedTT = parseTimetable(rawRows);
    assert.equal(parsedTT.layout, 'matrix_days_rows');
    assert.ok(parsedTT.sessions.length >= 3);
    assert.ok(Array.isArray(parsedTT.matrixGrid['Monday']['1']));
    assert.equal(parsedTT.matrixGrid['Monday']['1'][0].courseCode, '25CS1302E');

    const session1 = parsedTT.sessions.find((s) => s.courseCode === '25CS1302E' && s.timeSlot === '1');
    assert.ok(session1);
    assert.equal(session1?.day, 'Monday');
    assert.equal(session1?.component, 'Lecture');
    assert.equal(session1?.section, 'S-10');
    assert.equal(session1?.room, 'H-005');

    const session2 = parsedTT.sessions.find((s) => s.courseCode === '25SC2107E' && s.timeSlot === '2');
    assert.ok(session2);
    assert.equal(session2?.day, 'Monday');
    assert.equal(session2?.component, 'Skill');
    assert.equal(session2?.section, 'S-10');
    assert.equal(session2?.room, '');
  });

  it('parses list format timetable HTML payload cleanly', () => {
    const htmlPayload = `
      <table class="table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Time Slot</th>
            <th>Course Code</th>
            <th>Course Title</th>
            <th>Section</th>
            <th>Venue</th>
            <th>Faculty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Day Order 2</td>
            <td>09:00 AM - 09:50 AM</td>
            <td>25CS1302E-L</td>
            <td>Database Systems</td>
            <td>S-10</td>
            <td>H-005</td>
            <td>Dr. John Doe</td>
          </tr>
        </tbody>
      </table>
    `;

    const rawRows = parseGenericTable(htmlPayload);
    assert.equal(rawRows.length, 1);
    assert.equal(isLikelyTimetableData(rawRows), true);

    const parsedTT = parseTimetable(rawRows);
    assert.equal(parsedTT.sessions.length, 1);
    const session = parsedTT.sessions[0];
    assert.equal(session.day, 'Tuesday');
    assert.equal(session.timeSlot, '09:00 AM - 09:50 AM');
    assert.equal(session.courseCode, '25CS1302E');
    assert.equal(session.courseTitle, 'Database Systems');
    assert.equal(session.room, 'H-005');
    assert.equal(session.faculty, 'Dr. John Doe');
  });
});

describe('Slot Key Normalization', () => {
  it('normalizes P1, Period 1, and numeric strings', () => {
    assert.equal(normalizeSlotKey('1'), '1');
    assert.equal(normalizeSlotKey('P1'), '1');
    assert.equal(normalizeSlotKey('Period 2'), '2');
    assert.equal(normalizeSlotKey('09:00 AM - 09:50 AM'), '09:00 AM - 09:50 AM');
  });
});
