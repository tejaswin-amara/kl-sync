import { NextRequest, NextResponse } from 'next/server';
import { loginAndFetchSemesters, ScraperSession } from '@/lib/scraper';
import {
  decodeSession,
  encodeSession,
  isDemoModeEnabled,
} from '@/lib/session';
import { consumeCaptchaSession, verifyCaptchaToken } from '@/lib/captcha';
import { isValidCaptchaInput } from '@/lib/captcha-input';
import { DEMO_LOGIN_RESULT, DEMO_SESSION } from '@/lib/fixtures';
import { checkRateLimitDistributed, getClientIP } from '@/lib/request-utils';

export const dynamic = 'force-dynamic';

const CAPTCHA_COOKIE = 'kl_captcha_session';
const SESSION_COOKIE = 'kl_erp_session';
const MAX_LOGIN_BODY_BYTES = 16 * 1024;
const NO_STORE = 'no-store, max-age=0, must-revalidate';

function privateJson(
  body: unknown,
  init: ResponseInit = {}
): NextResponse {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', NO_STORE);
  return NextResponse.json(body, { ...init, headers });
}

function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number
): NextResponse {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return response;
}

function clearCookie(response: NextResponse, name: string): NextResponse {
  response.cookies.set(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

function safeLoginError(error: unknown): {
  message: string;
  status: number;
  isOffline?: boolean;
} {
  const message = error instanceof Error ? error.message : '';
  if (
    message.includes('fetch failed') ||
    message.includes('ENOTFOUND') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ECONNREFUSED') ||
    message.includes('KLU ERP server error') ||
    message.includes('ERP login page structure')
  ) {
    return {
      message:
        'KL ERP server is currently unreachable. Please try again later.',
      status: 502,
      isOffline: true,
    };
  }
  return {
    message: 'Login failed. Please verify your credentials and try again.',
    status: 401,
  };
}

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = request.headers.get('origin');
    if (requestOrigin) {
      try {
        if (new URL(requestOrigin).origin !== request.nextUrl.origin) {
          return privateJson(
            { success: false, message: 'Cross-origin login requests are not allowed.' },
            { status: 403 }
          );
        }
      } catch {
        return privateJson(
          { success: false, message: 'Invalid login request origin.' },
          { status: 403 }
        );
      }
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return privateJson(
        { success: false, message: 'Login requests must use JSON.' },
        { status: 415 }
      );
    }

    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_LOGIN_BODY_BYTES) {
      return privateJson(
        { success: false, message: 'Login request is too large.' },
        { status: 413 }
      );
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_LOGIN_BODY_BYTES) {
      return privateJson(
        { success: false, message: 'Login request is too large.' },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return privateJson(
        { success: false, message: 'Invalid login request.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return privateJson(
        { success: false, message: 'Invalid login request.' },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const username =
      typeof payload.username === 'string' ? payload.username.trim() : '';
    const password =
      typeof payload.password === 'string' ? payload.password : '';
    const captcha =
      typeof payload.captcha === 'string' ? payload.captcha : '';
    const captchaToken =
      typeof payload.captchaToken === 'string' ? payload.captchaToken : '';
    const deviceId =
      typeof payload.deviceId === 'string' &&
      payload.deviceId.length <= 128
        ? payload.deviceId
        : '';
    const rememberMe = payload.rememberMe === true;

    if (
      !username ||
      username.length > 128 ||
      !password ||
      password.length > 1024
    ) {
      return privateJson(
        { success: false, message: 'Enter a valid student ID and password.' },
        { status: 400 }
      );
    }

    // Do not silently lowercase, trim, or strip invalid characters on the
    // server. The exact string submitted must be a-z only and match the
    // visual challenge format used by the login UI.
    if (!isValidCaptchaInput(captcha)) {
      return privateJson(
        {
          success: false,
          message:
            'The security code must contain 4–7 lowercase letters (a–z).',
          field: 'captcha',
        },
        { status: 400 }
      );
    }

    const clientIp = getClientIP(request);
    const accountKey = username.toLowerCase().slice(0, 128);
    const ipLimit = await checkRateLimitDistributed(
      `login:ip:${clientIp}`,
      10,
      10 * 60 * 1000
    );
    const accountLimit = await checkRateLimitDistributed(
      `login:account:${accountKey}`,
      8,
      10 * 60 * 1000
    );

    if (!ipLimit.allowed || !accountLimit.allowed) {
      const retryAfter = Math.ceil(
        Math.max(ipLimit.resetMs, accountLimit.resetMs) / 1000
      );
      return privateJson(
        {
          success: false,
          message: 'Too many login attempts. Please try again later.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    const demoMode = isDemoModeEnabled();
    const isExplicitDemoUser =
      demoMode &&
      (username === 'demo' ||
        username === 'teststudent' ||
        username === '2100030000');

    // The encrypted ERP session must also have a live, server-side issuance
    // record. Atomically consume it so concurrent or later login attempts
    // cannot reuse the same university image challenge.
    const captchaSessionId = request.cookies.get(CAPTCHA_COOKIE)?.value;
    if (!captchaSessionId || !(await consumeCaptchaSession(captchaSessionId))) {
      const response = privateJson(
        {
          success: false,
          message: 'Your security-code challenge expired or was already used. Refresh the image.',
          field: 'captcha',
        },
        { status: 400 }
      );
      return clearCookie(response, CAPTCHA_COOKIE);
    }

    if (!isExplicitDemoUser && !(await verifyCaptchaToken(captchaToken))) {
      const response = privateJson(
        {
          success: false,
          message: 'Browser verification expired or failed. Please verify again.',
          field: 'captchaToken',
        },
        { status: 400 }
      );
      return clearCookie(response, CAPTCHA_COOKIE);
    }

    let session: ScraperSession;
    try {
      session = await decodeSession(captchaSessionId);
    } catch {
      if (
        demoMode &&
        (isExplicitDemoUser || captchaSessionId.includes('demo'))
      ) {
        session = DEMO_SESSION;
      } else {
        const response = privateJson(
          {
            success: false,
            message: 'Your security-code session is invalid. Refresh the image.',
            field: 'captcha',
          },
          { status: 400 }
        );
        return clearCookie(response, CAPTCHA_COOKIE);
      }
    }

    let result;
    try {
      if (
        isExplicitDemoUser ||
        session.csrfToken.includes('demo_csrf') ||
        session.csrfToken.includes('csrf_test_live')
      ) {
        if (!demoMode) throw new Error('Invalid login request');
        result = {
          ...DEMO_LOGIN_RESULT,
          deviceId: deviceId || DEMO_LOGIN_RESULT.deviceId,
        };
      } else {
        result = await loginAndFetchSemesters(
          username,
          password,
          captcha,
          session,
          deviceId
        );
      }
    } catch (error) {
      const safe = safeLoginError(error);
      const response = privateJson(
        {
          success: false,
          message: safe.message,
          ...(safe.isOffline ? { isOffline: true } : {}),
        },
        { status: safe.status }
      );
      return clearCookie(response, CAPTCHA_COOKIE);
    }

    if (result.needsCaptchaRetry) {
      const response = privateJson({
        success: false,
        needsCaptchaRetry: true,
        message: result.message,
      });
      clearCookie(response, SESSION_COOKIE);
      return clearCookie(response, CAPTCHA_COOKIE);
    }

    const updatedSessionId = await encodeSession(result.session);
    const response = privateJson({
      success: true,
      message: 'Login successful',
      deviceId: result.deviceId,
      academicYears: result.academicYears,
      semesters: result.semesters,
    });
    clearCookie(response, CAPTCHA_COOKIE);
    return setCookie(
      response,
      SESSION_COOKIE,
      updatedSessionId,
      rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24
    );
  } catch (error) {
    console.error(
      '[AUTH_ERROR]',
      error instanceof Error ? error.message : 'Unknown login error'
    );
    return privateJson(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 400 }
    );
  }
}
