import { NextRequest, NextResponse } from 'next/server';
import { decodeSession } from '@/lib/session';
import { fetchAttendanceData, ScraperSession } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('kl_erp_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please login again.' }, { status: 401 });
    }

    let session: ScraperSession;
    try {
      session = decodeSession(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { academicYear, semesterId, csrfToken } = body;
    if (!academicYear || !semesterId) {
       return NextResponse.json({ success: false, error: 'Missing academicYear or semesterId' }, { status: 400 });
    }

    const result = await fetchAttendanceData(session, csrfToken || session.csrfToken, academicYear, semesterId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[fetch-attendance] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}

