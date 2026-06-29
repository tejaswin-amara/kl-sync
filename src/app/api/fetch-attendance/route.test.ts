import { POST } from './route';
import { NextRequest } from 'next/server';
import { fetchAttendanceData } from '@/lib/scraper';
import { decodeSession } from '@/lib/session';

jest.mock('@/lib/scraper');
jest.mock('@/lib/session');

const mockFetchAttendanceData = fetchAttendanceData as jest.Mock;
const mockDecodeSession = decodeSession as jest.Mock;

describe('POST /api/fetch-attendance', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    const createRequest = (body: any, headers = new Headers()) => {
        return new NextRequest('http://localhost:3000/api/fetch-attendance', {
            method: 'POST',
            body: JSON.stringify(body),
            headers,
        });
    };

    it('returns 400 if missing required fields', async () => {
        const req = createRequest({});
        const res = await POST(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ success: false, message: 'Missing required fields' });
    });

    it('returns 400 if session is invalid', async () => {
        mockDecodeSession.mockImplementation(() => {
            throw new Error('Invalid session');
        });

        const req = createRequest({
            sessionId: 'invalid',
            csrfToken: 'token',
            academicYear: '2023',
            semesterId: '1'
        });

        const res = await POST(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ success: false, message: 'Invalid session' });
    });

    it('returns 200 on success', async () => {
        const mockSession = { cookies: 'mock-cookie' };
        mockDecodeSession.mockReturnValue(mockSession);

        const mockResult = { success: true, data: { attendance: '95%' } };
        mockFetchAttendanceData.mockResolvedValue(mockResult);

        const req = createRequest({
            sessionId: 'valid-session',
            csrfToken: 'token',
            academicYear: '2023',
            semesterId: '1'
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual(mockResult);
        expect(mockFetchAttendanceData).toHaveBeenCalledWith(mockSession, 'token', '2023', '1');
    });

    it('returns 500 when fetchAttendanceData throws an error', async () => {
        const mockSession = { cookies: 'mock-cookie' };
        mockDecodeSession.mockReturnValue(mockSession);

        const errorMessage = 'Failed to connect to ERP';
        mockFetchAttendanceData.mockRejectedValue(new Error(errorMessage));

        const req = createRequest({
            sessionId: 'valid-session',
            csrfToken: 'token',
            academicYear: '2023',
            semesterId: '1'
        });

        const res = await POST(req);

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ success: false, message: errorMessage });
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns 500 with default message when fetchAttendanceData throws an error without message', async () => {
        const mockSession = { cookies: 'mock-cookie' };
        mockDecodeSession.mockReturnValue(mockSession);

        mockFetchAttendanceData.mockRejectedValue(new Error());

        const req = createRequest({
            sessionId: 'valid-session',
            csrfToken: 'token',
            academicYear: '2023',
            semesterId: '1'
        });

        const res = await POST(req);

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ success: false, message: 'Failed to fetch attendance' });
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
