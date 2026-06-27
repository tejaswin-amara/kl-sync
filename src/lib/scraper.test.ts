import { fetchAttendanceData, ScraperSession } from './scraper';

// Mock the global fetch function
global.fetch = jest.fn();

describe('fetchAttendanceData', () => {
  let mockSession: ScraperSession;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockSession = {
      cookies: [{ name: 'PHPSESSID', value: '12345' }, { name: 'SERVERID', value: 'node1' }],
      csrfToken: 'test-csrf-token',
      userAgent: 'test-agent',
    };
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
  });

  it('should fetch and parse attendance data correctly on success', async () => {
    const htmlResponse = `
      <table>
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CS101</td>
            <td>Intro to CS</td>
            <td>90%</td>
          </tr>
          <tr>
            <td>MATH101</td>
            <td>Calculus</td>
            <td>85%</td>
          </tr>
        </tbody>
      </table>
    `;

    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      text: jest.fn().mockResolvedValueOnce(htmlResponse),
    });

    const result = await fetchAttendanceData(mockSession, 'mock-csrf-token', '2023', 'SEM1');

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://newerp.kluniversity.in/index.php?r=studentattendance%2Fstudentdailyattendance%2Fcourselist');
    expect(options.method).toBe('POST');
    expect(options.headers['Cookie']).toBe('PHPSESSID=12345; SERVERID=node1');
    expect(options.headers['X-Requested-With']).toBe('XMLHttpRequest');

    const bodyParams = new URLSearchParams(options.body as string);
    expect(bodyParams.get('_csrf')).toBe('mock-csrf-token');
    expect(bodyParams.get('DynamicModel[academicyear]')).toBe('2023');
    expect(bodyParams.get('DynamicModel[semesterid]')).toBe('SEM1');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Attendance Data Fetched Successfully');
    expect(result.attendanceData).toHaveLength(2);
    expect(result.attendanceData[0]).toEqual({
      'Course Code': 'CS101',
      'Course Name': 'Intro to CS',
      'Attendance %': '90%',
    });
    expect(result.attendanceData[1]).toEqual({
      'Course Code': 'MATH101',
      'Course Name': 'Calculus',
      'Attendance %': '85%',
    });
  });

  it('should handle "No results found" correctly', async () => {
    const htmlResponse = `
      <table>
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="3">No results found.</td>
          </tr>
        </tbody>
      </table>
    `;

    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      text: jest.fn().mockResolvedValueOnce(htmlResponse),
    });

    const result = await fetchAttendanceData(mockSession, 'mock-csrf-token', '2023', 'SEM1');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.attendanceData).toHaveLength(0);
  });

  it('should handle tables without explicit thead', async () => {
    const htmlResponse = `
      <table>
        <tr>
          <th>Course</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>CS102</td>
          <td>Present</td>
        </tr>
      </table>
    `;

    mockFetch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      text: jest.fn().mockResolvedValueOnce(htmlResponse),
    });

    const result = await fetchAttendanceData(mockSession, 'mock-csrf-token', '2023', 'SEM1');

    expect(result.success).toBe(true);
    expect(result.attendanceData).toHaveLength(1);
    expect(result.attendanceData[0]).toEqual({
      'Course': 'CS102',
      'Status': 'Present',
    });
  });
});
