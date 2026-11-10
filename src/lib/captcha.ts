import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { isDemoModeEnabled } from '@/lib/session';

let devCapSecret: string | null = null;

const CAPTCHA_CHALLENGE_TTL_MS = 5 * 60_000;
const MAX_CLOCK_SKEW_MS = 60_000;
const memoryNonces = new Map<string, number>();
const consumedTokensMap = new Map<string, number>();

function hasDistributedStore(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function getCapSecret(): string {
  const secret =
    process.env.CAP_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SECURITY FATAL] CAP_SECRET or SESSION_SECRET is required in production.'
      );
    }
    if (!devCapSecret) {
      devCapSecret = createHash('sha256')
        .update(Math.random().toString() + Date.now().toString())
        .digest('hex');
    }
    return devCapSecret;
  }

  if (secret.length >= 16) return secret;
  return createHash('sha256').update(secret).digest('hex');
}

function cleanExpired(): void {
  const now = Date.now();
  for (const [key, expiresAt] of memoryNonces) {
    if (expiresAt <= now) memoryNonces.delete(key);
  }
  for (const [key, expiresAt] of consumedTokensMap) {
    if (expiresAt <= now) consumedTokensMap.delete(key);
  }
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

async function upstashCommand(
  command: (string | number)[]
): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(1500),
  });

  if (!response.ok) {
    throw new Error('Distributed CAPTCHA store request failed.');
  }

  const data = (await response.json()) as {
    result?: unknown;
    error?: string;
  };
  if (data.error) {
    throw new Error('Distributed CAPTCHA store command failed.');
  }

  return data.result ?? null;
}

/**
 * Atomically consumes the CapJS challenge signature.
 *
 * Redis SET NX PX is the distributed single-use primitive. The in-memory
 * fallback is deliberately development-only: production must fail closed
 * rather than accepting a replay on another serverless instance.
 */
export async function consumeNonce(
  signatureHex: string,
  ttlMs: number
): Promise<boolean> {
  if (
    typeof signatureHex !== 'string' ||
    signatureHex.length < 1 ||
    signatureHex.length > 256 ||
    !Number.isFinite(ttlMs) ||
    ttlMs <= 0
  ) {
    return false;
  }

  const ttl = Math.max(1, Math.ceil(ttlMs));
  const key = `cap-nonce:${sha256Hex(signatureHex)}`;

  if (hasDistributedStore()) {
    try {
      const result = await upstashCommand([
        'SET',
        key,
        '1',
        'NX',
        'PX',
        ttl,
      ]);
      return result === 'OK';
    } catch {
      console.warn(
        '[CAPTCHA] Distributed nonce consumption failed; rejecting challenge.'
      );
      return false;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  cleanExpired();
  if (memoryNonces.has(key)) return false;
  memoryNonces.set(key, Date.now() + ttl);
  return true;
}

/**
 * Verifies a server-issued CapJS login token and burns it exactly once.
 * Tokens are short-lived, scope-bound, signed, and replay-protected.
 */
export async function verifyCaptchaToken(
  token: string | undefined | null
): Promise<boolean> {
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
    return false;
  }

  if (
    isDemoModeEnabled() &&
    (token === 'demo_token' || token === 'demo_csrf_token_123')
  ) {
    return true;
  }

  if (!token.startsWith('signed:')) return false;

  const tokenPart = token.slice('signed:'.length);
  const separator = tokenPart.indexOf('.');
  if (
    separator <= 0 ||
    separator !== tokenPart.lastIndexOf('.') ||
    separator === tokenPart.length - 1
  ) {
    return false;
  }

  const encodedPayload = tokenPart.slice(0, separator);
  const signature = tokenPart.slice(separator + 1);
  if (
    !/^[A-Za-z0-9_-]+$/.test(encodedPayload) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  ) {
    return false;
  }

  try {
    const secret = getCapSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest();
    const receivedSignature = Buffer.from(signature, 'base64url');

    if (
      receivedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(receivedSignature, expectedSignature)
    ) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as {
      scope?: unknown;
      exp?: unknown;
      iat?: unknown;
      rnd?: unknown;
    };

    const now = Date.now();
    if (
      payload.scope !== 'login' ||
      !Number.isSafeInteger(payload.exp) ||
      !Number.isSafeInteger(payload.iat) ||
      typeof payload.exp !== 'number' ||
      typeof payload.iat !== 'number' ||
      typeof payload.rnd !== 'string' ||
      !/^[a-f0-9]{32}$/.test(payload.rnd) ||
      payload.iat > now + MAX_CLOCK_SKEW_MS ||
      payload.iat < now - CAPTCHA_CHALLENGE_TTL_MS - MAX_CLOCK_SKEW_MS ||
      payload.exp <= now ||
      payload.exp <= payload.iat ||
      payload.exp - payload.iat >
        CAPTCHA_CHALLENGE_TTL_MS + MAX_CLOCK_SKEW_MS
    ) {
      return false;
    }

    const ttlMs = payload.exp - now;
    const consumedKey = `cap-consumed:${sha256Hex(tokenPart)}`;

    if (hasDistributedStore()) {
      const result = await upstashCommand([
        'SET',
        consumedKey,
        '1',
        'NX',
        'PX',
        Math.max(1, ttlMs),
      ]);
      return result === 'OK';
    }

    // A local Map cannot guarantee single-use verification across production
    // instances. Do not silently downgrade to it in production.
    if (process.env.NODE_ENV === 'production') return false;

    cleanExpired();
    if (consumedTokensMap.has(consumedKey)) return false;
    consumedTokensMap.set(consumedKey, payload.exp);
    return true;
  } catch {
    // Verification and storage errors are intentionally fail-closed.
    return false;
  }
}
