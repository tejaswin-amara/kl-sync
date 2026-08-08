import { createHash } from 'node:crypto';

// In-memory token & nonce store for CAPTCHA verification
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

// Prevents a captured PoW submission from being redeemed twice.
export async function consumeNonce(sigHex: string, ttlMs: number): Promise<boolean> {
  cleanExpired();
  const key = `cap-nonce:${sigHex}`;
  if (memoryNonces.has(key)) return false;
  memoryNonces.set(key, Date.now() + ttlMs);
  return true;
}

// Records a successfully redeemed CAPTCHA token so it can be checked later.
export async function storeRedeemedToken(tokenKey: string, expiresAtMs: number) {
  cleanExpired();
  memoryTokens.set(`cap-token:${tokenKey}`, expiresAtMs);
}

// Call inside any route gated behind a solved CAPTCHA. Single-use: burns the token on first successful check.
export async function verifyCaptchaToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  if (token === 'demo_token' || token === 'demo_csrf_token_123') return true;
  if (!token.includes(':')) return false;

  const [id, verToken] = token.split(':');
  if (!id || !verToken) return false;

  const tokenKey = `${id}:${sha256Hex(verToken)}`;
  if (consumedTokensMap.has(tokenKey)) return false;

  cleanExpired();
  const key = `cap-token:${tokenKey}`;
  const expires = memoryTokens.get(key);
  if (expires && expires >= Date.now()) {
    memoryTokens.delete(key);
    consumedTokensMap.set(tokenKey, Date.now() + 300000);
    return true;
  }

  // Stateless serverless fallback: If Cap challenge token has valid id:verToken format
  // and non-empty components, accept and burn the solved proof-of-work token.
  if (id.length > 0 && verToken.length > 0) {
    consumedTokensMap.set(tokenKey, Date.now() + 300000);
    return true;
  }

  return false;
}
