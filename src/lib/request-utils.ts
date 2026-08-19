import { NextRequest } from 'next/server';

export function resolveSessionToken(request: NextRequest): string | undefined {
  const cookieValue = request.cookies.get('kl_erp_session')?.value;
  if (cookieValue) return cookieValue;


  return undefined;
}

const MAX_RATE_LIMIT_KEYS = 10_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function pruneRateLimitMap(now: number): void {
  if (rateLimitMap.size < MAX_RATE_LIMIT_KEYS) return;
  for (const [key, value] of rateLimitMap) {
    if (value.resetAt <= now) rateLimitMap.delete(key);
    if (rateLimitMap.size < MAX_RATE_LIMIT_KEYS) break;
  }
}

export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeWindow = Math.max(1_000, Math.floor(windowMs));
  pruneRateLimitMap(now);

  const current = rateLimitMap.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + safeWindow });
    return { allowed: true, remaining: safeLimit - 1, resetMs: safeWindow };
  }

  if (current.count >= safeLimit) {
    return { allowed: false, remaining: 0, resetMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  return { allowed: true, remaining: safeLimit - current.count, resetMs: Math.max(0, current.resetAt - now) };
}

export function getClientIP(request: NextRequest): string {
  if (process.env.TRUST_PROXY_HEADERS === 'true') {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim().slice(0, 128) || 'unknown';
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp.trim().slice(0, 128) || 'unknown';
  }

  return 'unknown';
}
