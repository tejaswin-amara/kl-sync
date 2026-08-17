import { NextRequest } from 'next/server';

export function resolveSessionToken(
  request: NextRequest,
  body?: Record<string, unknown>
): string | undefined {
  // 1. Strict Priority: httpOnly cookie
  const cookieValue = request.cookies.get('kl_erp_session')?.value;
  if (cookieValue) return cookieValue;

  // 2. Strict Priority: x-session-id header
  const headerValue = request.headers.get('x-session-id');
  if (headerValue) return headerValue;

  // 3. Fallback: Body session ID (if provided)
  if (body && typeof body.sessionId === 'string' && body.sessionId) return body.sessionId;
  if (body && typeof body.session_id === 'string' && body.session_id) return body.session_id;

  // 4. Fallback: Query search parameter (if provided)
  try {
    const searchParams = request.nextUrl?.searchParams;
    if (searchParams) {
      const qSession = searchParams.get('sessionId') || searchParams.get('session_id');
      if (qSession) return qSession;
    }
  } catch {}

  return undefined;
}

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 1000,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const current = rateLimitMap.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: current.resetAt - now };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetMs: current.resetAt - now };
}

export function getClientIP(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
