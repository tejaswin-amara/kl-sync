import { NextResponse } from 'next/server';
import { decodeSession, isDemoModeEnabled, isDemoSession } from '@/lib/session';
import { ERPRateLimitError, ERP_URL, fetchWithJar } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const path = searchParams.get('path');
  if (!id && !path)
    return new NextResponse('Missing ID or path', { status: 400 });
  if (id && !/^[a-zA-Z0-9]+$/.test(id))
    return new NextResponse('Invalid ID format', { status: 400 });
  if (
    path &&
    (path.includes('..') ||
      /%2e/i.test(path) ||
      path.includes('://') ||
      path.includes('//'))
  ) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const rawSession =
    cookieHeader.match(/(?:^|;\s*)kl_erp_session=([^;]+)/)?.[1];
  const demoMode = isDemoModeEnabled();
  if (!rawSession) return new NextResponse('Unauthorized', { status: 401 });

  const session = await decodeSession(rawSession).catch(() => null);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  if (isDemoSession(session) && demoMode) {
    return new NextResponse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#273142"/></svg>',
      {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
  if (isDemoSession(session))
    return new NextResponse('Unauthorized', { status: 401 });

  const targetRelativePaths: string[] = [];
  if (path) {
    const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
    if (
      !sanitizedPath.toLowerCase().startsWith('/uploads/') ||
      !/^\/uploads\/[a-zA-Z0-9._\-/]+$/i.test(sanitizedPath)
    ) {
      return new NextResponse('Invalid photo path', { status: 400 });
    }
    targetRelativePaths.push(sanitizedPath);
  } else if (id) {
    targetRelativePaths.push(
      `/uploads/studentphotos/${encodeURIComponent(id)}.jpg`,
      `/uploads/StudentPhotos/${encodeURIComponent(id)}.jpg`
    );
  }

  try {
    const cookieJar = Object.fromEntries(
      session.cookies.map(({ name, value }) => [name, value])
    );
    let response: Response | undefined;
    for (const relativePath of targetRelativePaths) {
      const targetUrl = new URL(relativePath, ERP_URL);
      if (
        targetUrl.origin !== ERP_URL ||
        !targetUrl.pathname.toLowerCase().startsWith('/uploads/')
      ) {
        return new NextResponse('Invalid photo path', { status: 400 });
      }
      response = await fetchWithJar(targetUrl.href, cookieJar, {
        signal: AbortSignal.timeout(8_000),
        extraHeaders: {
          Referer: ERP_URL + '/',
          'User-Agent': 'KL-Sync/2.4',
        },
      });
      if (response.ok) break;
    }
    if (!response?.ok)
      return new NextResponse('Photo not found', {
        status: response?.status || 404,
      });

    const contentType =
      response.headers.get('content-type')?.split(';')[0].toLowerCase() ||
      'image/jpeg';
    if (!ALLOWED_IMAGE_TYPES.has(contentType))
      return new NextResponse('Unsupported photo type', { status: 415 });
    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof ERPRateLimitError) {
      return new NextResponse(error.message, {
        status: 429,
        headers: {
          'Retry-After': String(error.retryAfter),
          'Cache-Control': 'no-store',
        },
      });
    }
    console.error(
      '[PHOTO] Upstream fetch failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return new NextResponse('Error fetching photo', { status: 502 });
  }
}
