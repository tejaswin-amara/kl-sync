import { NextRequest, NextResponse } from 'next/server';
import { getCaptcha } from '@/lib/scraper';
import { registerCaptchaSession } from '@/lib/captcha';
import { encodeSession, isDemoModeEnabled } from '@/lib/session';
import { DEMO_SESSION, DEMO_CAPTCHA_SVG } from '@/lib/fixtures';
import { checkRateLimitDistributed, getClientIP } from '@/lib/request-utils';
import {
  KLU_CAPTCHA_MAX_LENGTH,
  KLU_CAPTCHA_MIN_LENGTH,
} from '@/lib/captcha-input';

export const dynamic = 'force-dynamic';

const CAPTCHA_COOKIE = 'kl_captcha_session';
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
};

function withCaptchaCookie(
  response: NextResponse,
  sessionId: string
): NextResponse {
  // Keep the upstream ERP session in an HttpOnly cookie. It is not a
  // client-readable bearer token and must never be returned in JSON/headers.
  response.cookies.set(CAPTCHA_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 5 * 60,
  });
  return response;
}

export async function GET(request?: NextRequest) {
  const effectiveRequest =
    request ?? new NextRequest('http://localhost/api/captcha');

  const limit = await checkRateLimitDistributed(
    `captcha:ip:${getClientIP(effectiveRequest)}`,
    30,
    60_000
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many security-code requests. Please try again later.',
      },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(Math.ceil(limit.resetMs / 1000)),
        },
      }
    );
  }

  try {
    const demoMode = isDemoModeEnabled();
    let captchaImage: string;
    let session;

    if (demoMode) {
      captchaImage = DEMO_CAPTCHA_SVG;
      session = DEMO_SESSION;
    } else {
      try {
        const captchaResponse = await getCaptcha({
          signal: AbortSignal.timeout(8000),
        });
        captchaImage = captchaResponse.captchaImage;
        session = captchaResponse.session;
      } catch (error) {
        console.error('[CAPTCHA] ERP unreachable:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'The university security-code service is temporarily unavailable.',
          },
          { status: 503, headers: NO_STORE_HEADERS }
        );
      }
    }

    const sessionId = await encodeSession(session);
    const registered = await registerCaptchaSession(sessionId, 5 * 60_000);
    if (!registered) {
      return NextResponse.json(
        {
          success: false,
          error: 'The security-code session could not be created. Please try again.',
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    return withCaptchaCookie(
      NextResponse.json(
        {
          captchaImage,
          rule: 'lowercase_letters_only',
          minLength: KLU_CAPTCHA_MIN_LENGTH,
          maxLength: KLU_CAPTCHA_MAX_LENGTH,
        },
        { headers: NO_STORE_HEADERS }
      ),
      sessionId
    );
  } catch (error) {
    console.error('[CAPTCHA] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load the security code.' },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}
