import { loginAndFetchSemesters, fetchAttendanceData, ScraperSession } from './scraper';

// Mock the global console.error to avoid noise in the test output
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as any).mockRestore();
});

describe('loginAndFetchSemesters', () => {
  let mockFetch: any;
  const mockSession: ScraperSession = {
    cookies: [{ name: 'PHPSESSID', value: '123' }],
    csrfToken: 'test-csrf-token',
    userAgent: 'test-agent',
  };

  const createMockResponse = (
    status: number,
    text: string,
    headers: Record<string, string> = {}
  ): Partial<Response> => ({
    status,
    text: vi.fn().mockResolvedValue(text),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || null,
      // For getSetCookie logic in scraper.ts
      getSetCookie: headers['set-cookie'] ? () => [headers['set-cookie']] : () => [],
    } as any,
  });

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should handle happy path with 302 redirect on login', async () => {
    const attendanceHtml = `
      <html>
        <input name="_csrf" value="new-csrf-token">
        <select name="DynamicModel[academicyear]">
          <option value="2023">2023</option>
          <option value="2024">2024</option>
        </select>
        <select name="DynamicModel[semesterid]">
          <option value="1">Odd</option>
          <option value="2">Even</option>
        </select>
      </html>
    `;

    // 1. POST Login -> 302
    mockFetch.mockResolvedValueOnce(
      createMockResponse(302, '', {
        location: '/index.php?r=site/index',
        'set-cookie': 'kl_erp_device_id=new-device-id; path=/',
      })
    );

    // 2. GET redirected page -> 200
    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Redirected Page'));

    // 3. GET attendance page -> 200
    mockFetch.mockResolvedValueOnce(createMockResponse(200, attendanceHtml));

    const result = await loginAndFetchSemesters('user', 'pass', 'cap', mockSession);

    expect(result.success).toBe(true);
    expect(result.csrfToken).toBe('new-csrf-token');
    expect(result.academicYears).toHaveLength(2);
    expect(result.academicYears[0]).toEqual({ value: '2023', label: '2023' });
    expect(result.semesters).toHaveLength(2);
    expect(result.deviceId).toBe('new-device-id');
  });

  it('should handle happy path with 200 on login', async () => {
    const attendanceHtml = `
      <html>
        <input name="_csrf" value="new-csrf-token">
        <select name="DynamicModel[academicyear]">
          <option value="2023">2023</option>
        </select>
        <select name="DynamicModel[semesterid]">
          <option value="1">Odd</option>
        </select>
      </html>
    `;

    // 1. POST Login -> 200 (Success but no redirect)
    mockFetch.mockResolvedValueOnce(
      createMockResponse(200, 'Login Success Page', {
        'set-cookie': 'kl_erp_device_id=new-device-id; path=/',
      })
    );

    // 2. GET attendance page -> 200
    mockFetch.mockResolvedValueOnce(createMockResponse(200, attendanceHtml));

    const result = await loginAndFetchSemesters('user', 'pass', 'cap', mockSession);

    expect(result.success).toBe(true);
    expect(result.academicYears).toHaveLength(1);
    expect(result.semesters).toHaveLength(1);
    expect(result.deviceId).toBe('new-device-id');
  });

  it('should throw error for incorrect username or password', async () => {
    const errorHtml = `
      <html>
        <div class="help-block">Incorrect username or password.</div>
      </html>
    `;

    // 1. POST Login -> 200 (Failed)
    mockFetch.mockResolvedValueOnce(createMockResponse(200, errorHtml));

    // 2. GET attendance page -> 200 (Bounced back to login)
    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Login Form'));

    await expect(
      loginAndFetchSemesters('user', 'pass', 'cap', mockSession)
    ).rejects.toThrow('Incorrect username or password.');
  });

  it('should throw error for incorrect captcha', async () => {
    const errorHtml = `
      <html>
        <div class="help-block">The verification code is incorrect.</div>
      </html>
    `;

    mockFetch.mockResolvedValueOnce(createMockResponse(200, errorHtml));
    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Login Form'));

    await expect(
      loginAndFetchSemesters('user', 'pass', 'cap', mockSession)
    ).rejects.toThrow('Captcha incorrect — please re-enter the captcha and try again.');
  });

  it('should throw general login failed error with parsed text', async () => {
    const errorHtml = `
      <html>
        <div class="help-block">Account is deactivated.</div>
      </html>
    `;

    mockFetch.mockResolvedValueOnce(createMockResponse(200, errorHtml));
    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Login Form'));

    await expect(
      loginAndFetchSemesters('user', 'pass', 'cap', mockSession)
    ).rejects.toThrow('Login failed: Account is deactivated.');
  });

  it('should return needsCaptchaRetry when UserAccessToken crash happens WITH a harvested device cookie', async () => {
    const crashHtml = `
      <html>
        Exception: Unknown Property – yii\base\UnknownPropertyException
        Getting unknown property: app\models\UserAccessToken
      </html>
    `;

    // 1. POST Login -> 200 (Crash page but issues cookie)
    mockFetch.mockResolvedValueOnce(
      createMockResponse(200, crashHtml, {
        'set-cookie': 'kl_erp_device_id=harvested-device; path=/',
      })
    );

    // 2. GET attendance page -> 200 (Login Form, not authenticated)
    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Login Form'));

    const result = await loginAndFetchSemesters('user', 'pass', 'cap', mockSession);

    expect(result.success).toBe(false);
    expect(result.needsCaptchaRetry).toBe(true);
    expect(result.deviceId).toBe('harvested-device');
  });

  it('should throw UserAccessToken crash error WITHOUT a harvested device cookie', async () => {
    const crashHtml = `
      <html>
        Exception: Unknown Property – yii\base\UnknownPropertyException
        Getting unknown property: app\models\UserAccessToken
      </html>
    `;

    // 1. POST Login -> 200 (Crash page, NO cookie)
    mockFetch.mockResolvedValueOnce(createMockResponse(200, crashHtml));

    // 2. GET attendance page -> 200 (Login Form, not authenticated)
    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Login Form'));

    await expect(
      loginAndFetchSemesters('user', 'pass', 'cap', mockSession)
    ).rejects.toThrow("KLU ERP server error during login (an issue on the university's side). Please refresh the captcha and try again.");
  });

  it('should inject provided deviceId on login', async () => {
    const attendanceHtml = `
      <html>
        <input name="_csrf" value="new-csrf-token">
        <select name="DynamicModel[academicyear]">
          <option value="2023">2023</option>
        </select>
        <select name="DynamicModel[semesterid]">
          <option value="1">Odd</option>
        </select>
      </html>
    `;

    mockFetch.mockResolvedValueOnce(createMockResponse(200, 'Success'));
    mockFetch.mockResolvedValueOnce(createMockResponse(200, attendanceHtml));

    await loginAndFetchSemesters('user', 'pass', 'cap', mockSession, 'my-known-device');

    // Verify fetch was called with the device cookie
    const loginCall = mockFetch.mock.calls[0];
    const headers = loginCall[1].headers;
    expect(headers['Cookie']).toContain('kl_erp_device_id=my-known-device');
  });
});

describe('fetchAttendanceData', () => {
  let mockSession: ScraperSession;
  let mockFetch: any;

  beforeEach(() => {
    mockSession = {
      cookies: [{ name: 'PHPSESSID', value: '12345' }, { name: 'SERVERID', value: 'node1' }],
      csrfToken: 'test-csrf-token',
      userAgent: 'test-agent',
    };
    mockFetch = global.fetch as any;
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
      text: vi.fn().mockResolvedValueOnce(htmlResponse),
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
      text: vi.fn().mockResolvedValueOnce(htmlResponse),
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
      text: vi.fn().mockResolvedValueOnce(htmlResponse),
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
