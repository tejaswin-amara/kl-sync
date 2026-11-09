import type { ScraperSession, LoginResult } from '@/lib/scraper';
import type { AttendanceSubject, FeeItem } from '@/lib/ai/tools';

export const DEMO_SESSION: ScraperSession = {
  cookies: [{ name: 'PHPSESSID', value: 'demo_phpsessid_123' }],
  csrfToken: 'demo_csrf_token_123',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export const DEMO_ATTENDANCE: AttendanceSubject[] = [
  {
    'Course Code': '23CS2101R',
    'Course Title': 'Data Structures & Algorithms',
    Component: 'Lecture',
    'Conducted Hours': '45',
    'Attended Hours': '40',
    'Attendance Percentage': '88.89%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
  {
    'Course Code': '23CS2102R',
    'Course Title': 'Computer Organization & Architecture',
    Component: 'Lecture',
    'Conducted Hours': '40',
    'Attended Hours': '36',
    'Attendance Percentage': '90.00%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
  {
    'Course Code': '23CS2103R',
    'Course Title': 'Database Management Systems',
    Component: 'Lecture',
    'Conducted Hours': '42',
    'Attended Hours': '38',
    'Attendance Percentage': '90.48%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
  {
    'Course Code': '23CS2104R',
    'Course Title': 'Operating Systems',
    Component: 'Lecture',
    'Conducted Hours': '40',
    'Attended Hours': '33',
    'Attendance Percentage': '82.50%',
    'Academic Year': '2025-2026',
    Semester: '1',
  },
];

export const T05_DEMO_ATTENDANCE: AttendanceSubject[] = [
  {
    'Course Code': '25CS3112E-S',
    'Course Title': 'Deep Learning With Accelerated Computing',
    Component: 'Skill',
    'Conducted Hours': '32',
    'Attended Hours': '30',
    'Attendance Percentage': '93.75%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS3112E-L',
    'Course Title': 'Deep Learning With Accelerated Computing',
    Component: 'Lecture',
    'Conducted Hours': '8',
    'Attended Hours': '8',
    'Attendance Percentage': '100.00%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS2206E-L',
    'Course Title': 'Cloud Infrastructure And Services',
    Component: 'Lecture',
    'Conducted Hours': '8',
    'Attended Hours': '7',
    'Attendance Percentage': '87.50%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS2206E-P',
    'Course Title': 'Cloud Infrastructure And Services',
    Component: 'Practical',
    'Conducted Hours': '24',
    'Attended Hours': '22',
    'Attendance Percentage': '91.67%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS2207E-S',
    'Course Title': 'Generative AI And AI Platform Engineering',
    Component: 'Skill',
    'Conducted Hours': '32',
    'Attended Hours': '31',
    'Attendance Percentage': '96.88%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS2207E-L',
    'Course Title': 'Generative AI And AI Platform Engineering',
    Component: 'Lecture',
    'Conducted Hours': '8',
    'Attended Hours': '8',
    'Attendance Percentage': '100.00%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS2208E-L',
    'Course Title': 'Computer Networks And Network Programming',
    Component: 'Lecture',
    'Conducted Hours': '8',
    'Attended Hours': '7',
    'Attendance Percentage': '87.50%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25CS2208E-P',
    'Course Title': 'Computer Networks And Network Programming',
    Component: 'Practical',
    'Conducted Hours': '16',
    'Attended Hours': '15',
    'Attendance Percentage': '93.75%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25SP2108E-V',
    'Course Title': 'Kabaddi',
    Component: 'VAC',
    'Conducted Hours': '8',
    'Attended Hours': '8',
    'Attendance Percentage': '100.00%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
  {
    'Course Code': '25UC0032E-A',
    'Course Title': 'Insights to Sustainable Development Goals',
    Component: 'Audit',
    'Conducted Hours': '8',
    'Attended Hours': '8',
    'Attendance Percentage': '100.00%',
    'Academic Year': '2026-2027',
    Semester: 'T05',
  },
];

export const DEMO_TIMETABLE_RAW = [
  {
    'Day / Period': 'Monday',
    '1': '23CS2101R-L - S-10 - RoomNo-101 - Dr. Smith',
    '2': '23CS2102R-P - S-10 - RoomNo-LAB-3 - Prof. Johnson',
    '3': 'Free',
    '4': '23CS2103R-L - S-10 - RoomNo-105 - Dr. Allen',
  },
  {
    'Day / Period': 'Tuesday',
    '1': '23CS2102R-L - S-10 - RoomNo-102 - Prof. Johnson',
    '2': '23CS2101R-P - S-10 - RoomNo-LAB-1 - Dr. Smith',
    '3': 'Free',
    '4': '23CS2103R-P - S-10 - RoomNo-LAB-2 - Dr. Allen',
  },
  {
    'Day / Period': 'Wednesday',
    '1': '23CS2103R-L - S-10 - RoomNo-105 - Dr. Allen',
    '2': '23CS2101R-L - S-10 - RoomNo-101 - Dr. Smith',
    '3': '23CS2104R-L - S-10 - RoomNo-102 - Prof. Davis',
  },
  {
    'Day / Period': 'Thursday',
    '1': '23CS2101R-P - S-10 - RoomNo-LAB-1 - Dr. Smith',
    '2': '23CS2103R-P - S-10 - RoomNo-LAB-2 - Dr. Allen',
  },
  {
    'Day / Period': 'Friday',
    '1': '23CS2102R-P - S-10 - RoomNo-LAB-3 - Prof. Johnson',
    '2': '23CS2104R-L - S-10 - RoomNo-101 - Prof. Davis',
  },
];

export const DEMO_MARKS = [
  {
    'Course Code': '23CS2101R',
    'Course Name': 'Data Structures & Algorithms',
    'Faculty Name': 'Dr. Smith',
    'Internal 1': '22',
    'Internal 2': '24',
    Assignment: '10',
    'Total Marks': '56',
  },
  {
    'Course Code': '23CS2102R',
    'Course Name': 'Computer Organization & Architecture',
    'Faculty Name': 'Prof. Johnson',
    'Internal 1': '20',
    'Internal 2': '23',
    Assignment: '9',
    'Total Marks': '52',
  },
  {
    'Course Code': '23CS2103R',
    'Course Name': 'Database Management Systems',
    'Faculty Name': 'Dr. Allen',
    'Internal 1': '23',
    'Internal 2': '25',
    Assignment: '10',
    'Total Marks': '58',
  },
  {
    'Course Code': '23CS2104R',
    'Course Name': 'Operating Systems',
    'Faculty Name': 'Prof. Davis',
    'Internal 1': '21',
    'Internal 2': '22',
    Assignment: '9',
    'Total Marks': '52',
  },
];

export const T05_DEMO_MARKS = [
  {
    'Course Code': '25CS3112E',
    'Course Name': 'Deep Learning With Accelerated Computing',
    'Faculty Name': 'Ms. Ch. Anitha',
    'Internal 1': '24',
    'Internal 2': '25',
    Assignment: '10',
    'Total Marks': '59',
  },
  {
    'Course Code': '25CS2206E',
    'Course Name': 'Cloud Infrastructure And Services',
    'Faculty Name': 'Ms. D. Divya Priya',
    'Internal 1': '23',
    'Internal 2': '24',
    Assignment: '9',
    'Total Marks': '56',
  },
  {
    'Course Code': '25CS2207E',
    'Course Name': 'Generative AI And AI Platform Engineering',
    'Faculty Name': 'Dr. Y. Lakshmi Prasanna',
    'Internal 1': '25',
    'Internal 2': '25',
    Assignment: '10',
    'Total Marks': '60',
  },
  {
    'Course Code': '25CS2208E',
    'Course Name': 'Computer Networks And Network Programming',
    'Faculty Name': 'Mrs. D. Alekhya',
    'Internal 1': '22',
    'Internal 2': '23',
    Assignment: '9',
    'Total Marks': '54',
  },
  {
    'Course Code': '25SP2108E',
    'Course Name': 'Kabaddi',
    'Faculty Name': 'Physical Education',
    'Internal 1': '10',
    'Internal 2': '10',
    Assignment: '5',
    'Total Marks': '25',
  },
  {
    'Course Code': '25UC0032E',
    'Course Name': 'Insights to Sustainable Development Goals',
    'Faculty Name': 'Faculty',
    'Internal 1': '20',
    'Internal 2': '20',
    Assignment: '10',
    'Total Marks': '50',
  },
];

export const T05_DEMO_EXAM_SEATING = [
  {
    'Subject Code': '25CS3112E',
    'Subject Name': 'Deep Learning With Accelerated Computing',
    'Exam Date': '2026-12-15',
    Session: 'FN (09:30 AM - 12:30 PM)',
    'Room No': 'H-005',
    'Desk No': 'D-14',
    'Faculty Name': 'Ms. Ch. Anitha',
  },
  {
    'Subject Code': '25CS2206E',
    'Subject Name': 'Cloud Infrastructure And Services',
    'Exam Date': '2026-12-17',
    Session: 'AN (01:30 PM - 04:30 PM)',
    'Room No': 'H006',
    'Desk No': 'D-14',
    'Faculty Name': 'Ms. D. Divya Priya',
  },
  {
    'Subject Code': '25CS2207E',
    'Subject Name': 'Generative AI And AI Platform Engineering',
    'Exam Date': '2026-12-19',
    Session: 'FN (09:30 AM - 12:30 PM)',
    'Room No': 'H-005',
    'Desk No': 'D-14',
    'Faculty Name': 'Dr. Y. Lakshmi Prasanna',
  },
  {
    'Subject Code': '25CS2208E',
    'Subject Name': 'Computer Networks And Network Programming',
    'Exam Date': '2026-12-21',
    Session: 'AN (01:30 PM - 04:30 PM)',
    'Room No': 'H006',
    'Desk No': 'D-14',
    'Faculty Name': 'Mrs. D. Alekhya',
  },
];

export const DEMO_FEE_ITEMS: FeeItem[] = [
  {
    'Fee Type': 'Tuition Fee',
    Amount: '150000',
    'Paid Amount': '150000',
    'Balance Amount': '0',
    Status: 'PAID',
  },
  {
    'Fee Type': 'Special Skill Fee',
    Amount: '15,000',
    'Paid Amount': '10,000',
    'Balance Amount': '5,000',
    Status: 'PENDING',
  },
  {
    'Fee Type': 'Hostel & Mess Fee',
    Amount: '45,000',
    'Paid Amount': '35,000',
    'Balance Amount': '10,000',
    Status: 'PENDING',
  },
];

export const DEMO_PROFILE = {
  name: 'Alex Student',
  universityId: '2100030000',
  photoUrl: '/logo.png',
  program: 'B.Tech Computer Science & Engineering',
  department: 'Computer Science',
  academicYear: '2025-2026',
  semester: '1',
  extendedProfile: {
    'Personal Information': [
      { Field: 'Name', Value: 'Alex Student' },
      { Field: 'University ID', Value: '2100030000' },
      { Field: 'Program', Value: 'B.Tech Computer Science & Engineering' },
      { Field: 'Department', Value: 'Computer Science' },
    ],
    courses: [
      {
        Coursecode: '23CS2101R',
        Coursedesc: 'Data Structures & Algorithms',
        FacultyName: 'Dr. Smith',
      },
      {
        Coursecode: '23CS2102R',
        Coursedesc: 'Computer Organization & Architecture',
        FacultyName: 'Prof. Johnson',
      },
      {
        Coursecode: '23CS2103R',
        Coursedesc: 'Database Management Systems',
        FacultyName: 'Dr. Allen',
      },
    ],
  },
};

export const DEMO_CGPA = [
  {
    'Academic Year': '2025-2026',
    Semester: '1',
    SGPA: '9.20',
    CGPA: '9.15',
    Credits: '42',
    'Credits Completed': '42',
  },
];

export const DEMO_CAPTCHA_SVG =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMCwyMCBRMzAsNSA2MCwyMCBUMTIwLDIwIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAsMTAgUTQwLDMwIDgwLDEwIFQxMjAsMzAiIHN0cm9rZT0iI2Q1ZDVkNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxMTExMTEiIGxldHRlci1zcGFjaW5nPSIzIj5hYmNkPC90ZXh0Pjwvc3ZnPg==';

export const DEMO_LOGIN_RESULT: LoginResult = {
  success: true,
  message: 'Login successful (Demo/Fallback Mode)',
  session: DEMO_SESSION,
  csrfToken: 'demo_csrf_token_123',
  academicYears: [
    { value: '2026-2027', label: '2026-2027' },
    { value: '2025-2026', label: '2025-2026' },
    { value: '2024-2025', label: '2024-2025' },
  ],
  semesters: [
    { value: '2', label: 'Even Semester (T05)' },
    { value: '1', label: 'Odd Semester' },
  ],
  deviceId: 'demo_device_123',
  needsCaptchaRetry: false,
};
