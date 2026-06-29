import { NextResponse } from 'next/server';
import { fetchProfileData } from '@/lib/scraper';
import { decodeSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const sessionId = req.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'No session provided' }, { status: 401 });
    }

    const { csrfToken } = await req.json();
    if (!csrfToken) {
      return NextResponse.json({ success: false, message: 'CSRF token required' }, { status: 400 });
    }

    const session = decodeSession(sessionId);
    const data = await fetchProfileData(session, csrfToken);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
