import test from 'node:test';
import assert from 'node:assert/strict';
import { generateICS } from './calendar-export';

test('generateICS creates valid iCalendar output string', () => {
  const events = [
    {
      title: 'Operating Systems Lecture',
      location: 'C-301',
      description: 'Faculty: Dr. Smith',
      startDate: new Date('2026-09-01T09:00:00Z'),
      endDate: new Date('2026-09-01T10:00:00Z'),
    },
  ];

  const ics = generateICS(events);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('SUMMARY:Operating Systems Lecture'));
  assert.ok(ics.includes('LOCATION:C-301'));
  assert.ok(ics.includes('END:VEVENT'));
  assert.ok(ics.includes('END:VCALENDAR'));
});

test('generateICS formats academic metadata correctly in summary and description', () => {
  const events = [
    {
      title: 'Cloud Infrastructure',
      courseName: 'Cloud Infrastructure And Services',
      courseCode: '25CS2206E',
      component: 'Practical',
      section: 'S1',
      faculty: 'Dr. John Doe',
      credits: 4,
      location: 'HC-15D',
      startDate: new Date('2026-09-01T09:00:00Z'),
      endDate: new Date('2026-09-01T11:00:00Z'),
    },
  ];

  const ics = generateICS(events);
  assert.ok(ics.includes('SUMMARY:[Practical] Cloud Infrastructure And Services (25CS2206E)'), 'Summary should be properly formatted');
  assert.ok(ics.includes('LOCATION:HC-15D'), 'Location should be included');
  assert.ok(ics.includes('DESCRIPTION:Faculty: Dr. John Doe | Section: S1 | Component: Practical | Credits: 4'), 'Description should include academic metadata');
});

test('generateICS appends academic metadata to existing description', () => {
  const events = [
    {
      title: 'Audit Course',
      courseName: 'ISDG',
      courseCode: '25UC0032E',
      component: 'Lecture',
      location: 'H-005',
      description: 'Bring your laptop.',
      startDate: new Date('2026-09-01T09:00:00Z'),
      endDate: new Date('2026-09-01T11:00:00Z'),
    },
  ];

  const ics = generateICS(events);
  assert.ok(ics.includes('SUMMARY:[Lecture] ISDG (25UC0032E)'), 'Summary should be properly formatted');
  assert.ok(ics.includes('LOCATION:H-005'), 'Location should be included');
  assert.ok(ics.includes('DESCRIPTION:Bring your laptop. - Component: Lecture'), 'Description should append academic metadata to existing description');
});
