import { NextRequest, NextResponse } from 'next/server';
import { decodeSession } from '@/lib/session';
import { fetchCGPAData, ScraperSession } from '@/lib/scraper';

export async function GET(request: NextRequest) {
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

    const result = await fetchCGPAData(session);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[fetch-cgpa] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
