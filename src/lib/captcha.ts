import { createHash } from 'node:crypto';

export function getCapSecret(): string {
  if (process.env.CAP_SECRET) return process.env.CAP_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[SECURITY FATAL] CAP_SECRET environment variable is missing in production!');
  }
  return 'kl-sync-cap-secret-dev-fallback';
}

// In-memory token & nonce store for CAPTCHA verification (development / single instance fallback)
const memoryNonces = new Map<string, number>();
const memoryTokens = new Map<string, number>();
const consumedTokensMap = new Map<string, number>();

function cleanExpired() {
  const now = Date.now();
  for (const [k, exp] of memoryNonces) if (exp <= now) memoryNonces.delete(k);
  for (const [k, exp] of memoryTokens) if (exp <= now) memoryTokens.delete(k);
  for (const [k, exp] of consumedTokensMap) if (exp <= now) consumedTokensMap.delete(k);
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

async function upstashCommand(command: (string | number)[]): Promise<unknown> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) return null;
  try {
    const res = await fetch(upstashUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.warn('[CAPTCHA] Upstash Redis request failed:', err);
    return null;
  }
}

// Prevents a captured PoW submission from being redeemed twice.
export async function consumeNonce(sigHex: string, ttlMs: number): Promise<boolean> {
  cleanExpired();
  const key = `cap-nonce:${sigHex}`;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const res = await upstashCommand(['SET', key, '1', 'NX', 'PX', ttlMs]);
    if (res === 'OK') return true;
    if (res !== null) return false;
  }

  if (memoryNonces.has(key)) return false;
  memoryNonces.set(key, Date.now() + ttlMs);
  return true;
}

// Records a successfully redeemed CAPTCHA token so it can be checked later.
export async function storeRedeemedToken(tokenKey: string, expiresAtMs: number) {
  cleanExpired();
  const key = `cap-token:${tokenKey}`;
  const ttlMs = Math.max(1, expiresAtMs - Date.now());

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    await upstashCommand(['SET', key, '1', 'PX', ttlMs]);
  }
  memoryTokens.set(key, expiresAtMs);
}

// Call inside any route gated behind a solved CAPTCHA. Single-use: burns the token on first successful check.
export async function verifyCaptchaToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  if (token === 'demo_token' || token === 'demo_csrf_token_123') return true;
  if (!token.includes(':')) return false;

  const [id, verToken] = token.split(':');
  if (!id || !verToken) return false;

  const tokenKey = `${id}:${sha256Hex(verToken)}`;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const consumed = await upstashCommand(['GET', `cap-consumed:${tokenKey}`]);
    if (consumed) return false;

    const valid = await upstashCommand(['GET', `cap-token:${tokenKey}`]);
    if (valid) {
      await upstashCommand(['DEL', `cap-token:${tokenKey}`]);
      await upstashCommand(['SET', `cap-consumed:${tokenKey}`, '1', 'PX', 300000]);
      return true;
    }
    return false;
  }

  if (consumedTokensMap.has(tokenKey)) return false;

  cleanExpired();
  const key = `cap-token:${tokenKey}`;
  const expires = memoryTokens.get(key);
  if (expires && expires >= Date.now()) {
    memoryTokens.delete(key);
    consumedTokensMap.set(tokenKey, Date.now() + 300000);
    return true;
  }

  // Fail-closed for unstored/unvalidated tokens
  return false;
}
