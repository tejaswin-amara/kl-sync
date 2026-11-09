import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGenericTable } from './scraper';
import { parseTimetable } from './timetable-parser';

describe('Timetable Parser Fixes (T05 Evening Format, up to P13, VAC/Audit, Period 6 LUNCH)', () => {
  it('correctly expands time slots up to Period 13, extracts components, and preserves Period 6 as LUNCH BREAK', () => {
    const htmlPayload = `
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Day / Period</th>
            <th>P1: 08:30-09:20</th>
            <th>P2: 09:20-10:10</th>
            <th>P3: 10:20-11:10</th>
            <th>P4: 11:10-12:00</th>
            <th>P5: 12:00-12:40</th>
            <th>P6: 12:40-01:20</th>
            <th>P7: 01:20-02:10</th>
            <th>P8: 02:10-03:00</th>
            <th>P9: 03:10-04:00</th>
            <th>P10: 04:10-05:00</th>
            <th>P11: 05:00-05:50</th>
            <th>P12: 06:00-06:50</th>
            <th>P13: 06:50-07:40</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Monday</td>
            <td>25CS2206E-L - S-11 - RoomNo-H006</td>
            <td>25CS2206E-P - S-11 - RoomNo-HC-15D</td>
            <td>25CS2207E-S - S-10 - RoomNo-HC-15C</td>
            <td>Free</td>
            <td>Free</td>
            <td>LUNCH BREAK</td>
            <td>25CS2207E-V - S-10</td>
            <td>25CS2207E-A - S-10</td>
            <td>Free</td>
            <td>Free</td>
            <td>Free</td>
            <td>Free</td>
            <td>Free</td>
          </tr>
        </tbody>
      </table>
    `;

    const rawRows = parseGenericTable(htmlPayload);
    const parsedTT = parseTimetable(rawRows);

    assert.equal(parsedTT.layout, 'matrix_days_rows');

    // Verify timeslots up to 13 are correctly expanded and normalized
    for (let i = 1; i <= 13; i++) {
      assert.ok(parsedTT.timeSlotsPresent.includes(String(i)), `Should include timeslot ${i}`);
    }

    const monSessions = parsedTT.matrixGrid['Monday'];
    assert.ok(monSessions);

    // Verify component extraction
    assert.equal(monSessions['1'][0].courseCode, '25CS2206E');
    assert.equal(monSessions['1'][0].component, 'Lecture');
    assert.equal(monSessions['2'][0].courseCode, '25CS2206E');
    assert.equal(monSessions['2'][0].component, 'Practical');
    assert.equal(monSessions['3'][0].courseCode, '25CS2207E');
    assert.equal(monSessions['3'][0].component, 'Skill');
    assert.equal(monSessions['7'][0].component, 'VAC');
    assert.equal(monSessions['8'][0].component, 'Audit');

    // Verify Period 6 is preserved
    assert.equal(monSessions['6'][0].courseCode, 'LUNCH BREAK');
  });

  it('populates Period 6 with LUNCH BREAK if missing from the raw html', () => {
    const htmlPayload = `
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Day / Period</th>
            <th>1</th>
            <th>2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tuesday</td>
            <td>25CS2206E-L - S-11 - RoomNo-H006</td>
            <td>Free</td>
          </tr>
        </tbody>
      </table>
    `;

    const rawRows = parseGenericTable(htmlPayload);
    const parsedTT = parseTimetable(rawRows);

    assert.ok(parsedTT.timeSlotsPresent.includes('6'), 'Should explicitly add slot 6');
    const tueSessions = parsedTT.matrixGrid['Tuesday'];
    assert.ok(tueSessions);
    assert.equal(tueSessions['6'][0].courseCode, 'LUNCH BREAK');
    assert.equal(tueSessions['6'][0].courseTitle, 'LUNCH BREAK');
  });
});
