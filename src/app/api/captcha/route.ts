import { NextResponse, NextRequest } from 'next/server';
import { getCaptcha } from '@/lib/scraper';
import { encodeSession } from '@/lib/session';
import { authRateLimiter } from '@/lib/rate-limit';

function getIP(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function GET(request: NextRequest) {
  const ip = getIP(request);
  const rateLimit = authRateLimiter.check(ip);
  if (!rateLimit.success) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  try {
    const { captchaImage, session } = await getCaptcha();

    // Encode (and encrypt, when SESSION_SECRET is set) the session to send as session_id
    const sessionId = encodeSession(session);

    return NextResponse.json(
      {
        captchaImage,
      },
      {
        headers: {
          'x-session-id': sessionId,
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Error in captcha route:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
