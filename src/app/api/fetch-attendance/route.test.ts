import { NextRequest } from 'next/server';
import { POST } from './route';
import { fetchAttendanceData } from '@/lib/scraper';
import { decodeSession } from '@/lib/session';

// Mock the dependencies
jest.mock('@/lib/scraper', () => ({
  fetchAttendanceData: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  decodeSession: jest.fn(),
}));

describe('POST /api/fetch-attendance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn((name) => headers[name] || null),
      },
    } as unknown as NextRequest;
  };

  it('returns 400 if required fields are missing', async () => {
    const req = createMockRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ success: false, message: 'Missing required fields' });
  });

  it('returns 400 if session decoding fails', async () => {
    const req = createMockRequest({
      sessionId: 'invalid-session',
      csrfToken: 'token',
      academicYear: '2023',
      semesterId: '1',
    });

    (decodeSession as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({ success: false, message: 'Invalid session' });
  });

  it('returns 200 on success', async () => {
    const req = createMockRequest({
      sessionId: 'valid-session',
      csrfToken: 'token',
      academicYear: '2023',
      semesterId: '1',
    });

    const mockSession = { cookies: [] };
    (decodeSession as jest.Mock).mockReturnValue(mockSession);

    const mockAttendanceResult = { success: true, attendanceData: [] };
    (fetchAttendanceData as jest.Mock).mockResolvedValue(mockAttendanceResult);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockAttendanceResult);
    expect(fetchAttendanceData).toHaveBeenCalledWith(mockSession, 'token', '2023', '1');
  });

  it('returns 500 if fetchAttendanceData throws an error', async () => {
    const req = createMockRequest({
      sessionId: 'valid-session',
      csrfToken: 'token',
      academicYear: '2023',
      semesterId: '1',
    });

    const mockSession = { cookies: [] };
    (decodeSession as jest.Mock).mockReturnValue(mockSession);

    (fetchAttendanceData as jest.Mock).mockRejectedValue(new Error('Scraper error'));

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data).toEqual({ success: false, message: 'Scraper error' });

    consoleSpy.mockRestore();
  });
});
