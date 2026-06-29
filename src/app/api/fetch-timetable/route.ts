import { NextResponse } from 'next/server';
import { fetchTimetableData } from '@/lib/scraper';
import { decodeSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'No session provided' }, { status: 401 });
    }

    const { csrfToken, academicYear, semesterId } = await req.json();
    if (!csrfToken) {
      return NextResponse.json({ success: false, message: 'CSRF token required' }, { status: 400 });
    }

    const session = decodeSession(sessionId);
    const data = await fetchTimetableData(session, csrfToken, academicYear, semesterId);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch Timetable Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}
