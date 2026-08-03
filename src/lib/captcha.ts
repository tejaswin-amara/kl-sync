import { Redis } from "@upstash/redis";

const hasRedisEnv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasRedisEnv ? Redis.fromEnv() : null;

// In-memory fallback for development environments without active Upstash Redis env vars
const memoryNonces = new Map<string, number>();
const memoryTokens = new Map<string, number>();

function cleanExpired() {
  const now = Date.now();
  for (const [k, exp] of memoryNonces.entries()) {
    if (exp <= now) memoryNonces.delete(k);
  }
  for (const [k, exp] of memoryTokens.entries()) {
    if (exp <= now) memoryTokens.delete(k);
  }
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Prevents a captured PoW submission from being redeemed twice.
export async function consumeNonce(sigHex: string, ttlMs: number): Promise<boolean> {
  if (redis) {
    const ok = await redis.set(`cap-nonce:${sigHex}`, "1", { nx: true, px: ttlMs });
    return ok === "OK";
  }
  cleanExpired();
  const key = `cap-nonce:${sigHex}`;
  if (memoryNonces.has(key)) return false;
  memoryNonces.set(key, Date.now() + ttlMs);
  return true;
}

// Records a successfully redeemed CAPTCHA token so it can be checked later.
export async function storeRedeemedToken(tokenKey: string, expiresAtMs: number) {
  if (redis) {
    const ttlSec = Math.max(1, Math.ceil((expiresAtMs - Date.now()) / 1000));
    await redis.set(`cap-token:${tokenKey}`, expiresAtMs, { ex: ttlSec });
    return;
  }
  cleanExpired();
  memoryTokens.set(`cap-token:${tokenKey}`, expiresAtMs);
}

// Call inside any route gated behind a solved CAPTCHA. Single-use: burns
// the token on first successful check.
export async function verifyCaptchaToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !token.includes(":")) return false;

  const [id, verToken] = token.split(":");
  const tokenKey = `${id}:${await sha256Hex(verToken)}`;

  if (redis) {
    const expires = await redis.get<number>(`cap-token:${tokenKey}`);
    if (!expires || expires < Date.now()) return false;

    await redis.del(`cap-token:${tokenKey}`);
    return true;
  }

  cleanExpired();
  const key = `cap-token:${tokenKey}`;
  const expires = memoryTokens.get(key);
  if (!expires || expires < Date.now()) return false;

  memoryTokens.delete(key);
  return true;
}
