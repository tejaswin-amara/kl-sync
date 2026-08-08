import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const path = searchParams.get('path');
  if (!id && !path)
    return new NextResponse('Missing ID or path', { status: 400 });

  // Validate inputs to prevent path traversal
  if (id && !/^[a-zA-Z0-9]+$/.test(id)) {
    return new NextResponse('Invalid ID format', { status: 400 });
  }
  if (
    path &&
    (path.includes('..') || path.includes('%2e') || path.includes('%2E'))
  ) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const headerSessionId = request.headers.get('x-session-id');
  let sessionCookie: string | undefined = undefined;
  try {
    const cookieStore = await cookies();
    sessionCookie = cookieStore.get('kl_erp_session')?.value;
  } catch {}
  const rawSession = headerSessionId || sessionCookie;

  if (!rawSession) return new NextResponse('Unauthorized', { status: 401 });

  const session = await decodeSession(rawSession);

  // If this is the demo fallback session, return a dummy SVG
  if (session.csrfToken?.includes('demo') || session.cookies.some((c) => c.value.includes('demo'))) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ccc"/></svg>';
    return new NextResponse(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }

  try {
    const base = 'https://newerp.kluniversity.in';
    let urls: string[] = [];

    if (path) {
      const sanitizedPath = path.startsWith('/') ? path : '/' + path;
      if (!sanitizedPath.toLowerCase().startsWith('/uploads/')) {
        return new NextResponse('Invalid photo path', { status: 400 });
      }
      urls = [path.startsWith('http') ? path : `${base}${sanitizedPath}`];
    } else {
      urls = [
        `${base}/uploads/studentphotos/${id}.jpg`,
        `${base}/uploads/StudentPhotos/${id}.jpg`,
      ];
    }

    if (path && urls[0].startsWith('http') && !urls[0].startsWith(base)) {
      return new NextResponse('Invalid photo URL', { status: 400 });
    }

    const headers = {
      Cookie: session.cookies
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join('; '),
      Referer: `${base}/`,
      'User-Agent': 'Mozilla/5.0',
    };

    let res;
    for (const u of urls) {
      res = await fetch(u, { headers });
      if (res.ok) break;
    }

    if (!res || !res.ok) {
      return new NextResponse('Photo not found', {
        status: res?.status || 404,
      });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Error fetching photo', { status: 500 });
  }
}
