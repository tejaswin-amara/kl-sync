import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSubjectTitle,
  getSubjectCode,
  registerCourseTitles,
} from './course-utils';

describe('Course Utils & Title Resolution', () => {
  test('resolves explicit distinct course titles', () => {
    const title = getSubjectTitle('25CS1302E', 'Object Oriented Programming');
    assert.equal(title, 'Object Oriented Programming');
  });

  test('falls back to KNOWN_COURSE_MAP when title is equal to code', () => {
    const title = getSubjectTitle('25CS1302E', '25CS1302E');
    assert.equal(title, 'Data Structures & Algorithms');
  });

  test('handles suffix codes e.g. 25CS1302E-L', () => {
    const title = getSubjectTitle('25CS1302E-L');
    assert.equal(title, 'Data Structures & Algorithms');
  });

  test('registers and resolves dynamic course titles from ERP datasets', () => {
    const mockErpAttendance = [
      {
        'Course Code': '25CS9999E',
        'Course Title': 'Advanced Quantum Computing Systems',
        'Attendance Percentage': '95%',
      },
    ];

    registerCourseTitles(mockErpAttendance);

    const resolvedTitle = getSubjectTitle('25CS9999E');
    assert.equal(resolvedTitle, 'Advanced Quantum Computing Systems');
  });

  test('extracts clean course codes via getSubjectCode', () => {
    assert.equal(getSubjectCode('25CS1302E-L'), '25CS1302E-L');
    assert.equal(
      getSubjectCode('', '25CS1302E-L - S-10 - RoomNo-H-005'),
      '25CS1302E'
    );
  });
});
