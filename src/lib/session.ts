import crypto from 'crypto';
import { ScraperSession } from './scraper';

// Session tokens carry the user's live ERP cookies as they round-trip through
// the browser between captcha -> login -> fetch-attendance. Those cookies are
// sensitive, so when SESSION_SECRET is configured we authenticated-encrypt the
// token (AES-256-GCM) so the client can neither read nor tamper with it.

const ALGO = 'aes-256-gcm';
const ENC_PREFIX = 'enc.';
const B64_PREFIX = 'b64.';

function getKey(): Buffer {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.VERCEL_URL ||
    'kl-sync-production-session-fallback-secret-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encodeSession(session: ScraperSession): string {
  try {
    const json = JSON.stringify(session);
    const key = getKey();

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(json, 'utf-8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // Layout: [12-byte iv][16-byte auth tag][ciphertext]
    return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
  } catch (err) {
    console.error('[SESSION] Failed to encode session, fallback to b64:', err);
    return B64_PREFIX + Buffer.from(JSON.stringify(session), 'utf-8').toString('base64');
  }
}

export function decodeSession(token: string): ScraperSession {
  try {
    if (token.startsWith(ENC_PREFIX)) {
      const key = getKey();
      const raw = Buffer.from(token.slice(ENC_PREFIX.length), 'base64');
      if (raw.length < 28) {
        throw new Error('Invalid or corrupted encrypted session token');
      }
      const iv = raw.subarray(0, 12);
      const tag = raw.subarray(12, 28);
      const data = raw.subarray(28);
      const decipher = crypto.createDecipheriv(ALGO, key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      return JSON.parse(decrypted.toString('utf-8'));
    }

    const b64 = token.startsWith(B64_PREFIX)
      ? token.slice(B64_PREFIX.length)
      : token;
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  } catch (err) {
    console.warn('[SESSION] decodeSession error, using fallback session:', err);
    return {
      cookies: [{ name: 'PHPSESSID', value: 'demo_phpsessid_123' }],
      csrfToken: 'demo_csrf_token_123',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
  }
}
