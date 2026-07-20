import crypto from 'crypto';
import { ScraperSession } from './scraper';

// Session tokens carry the user's live ERP cookies as they round-trip through
// the browser between captcha -> login -> fetch-attendance. Those cookies are
// sensitive, so when SESSION_SECRET is configured we authenticated-encrypt the
// token (AES-256-GCM) so the client can neither read nor tamper with it.
//
// If no secret is set we fall back to plain base64 (the original behaviour) so
// the app keeps working in local/dev setups — set SESSION_SECRET in production.

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error(
    '[SECURITY] SESSION_SECRET is not set in production! Sessions will use plain base64 encoding. Set SESSION_SECRET for encryption.'
  );
}

const ALGO = 'aes-256-gcm';
const ENC_PREFIX = 'enc.';
const B64_PREFIX = 'b64.';

function getKey(): Buffer | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  // Derive a fixed 32-byte key from the secret of any length.
  return crypto.createHash('sha256').update(secret).digest();
}

export function encodeSession(session: ScraperSession): string {
  const json = JSON.stringify(session);
  const key = getKey();

  if (!key) {
    return B64_PREFIX + Buffer.from(json, 'utf-8').toString('base64');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(json, 'utf-8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Layout: [12-byte iv][16-byte auth tag][ciphertext]
  return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decodeSession(token: string): ScraperSession {
  if (token.startsWith(ENC_PREFIX)) {
    const key = getKey();
    if (!key) {
      throw new Error(
        'Encrypted session received but SESSION_SECRET is not configured'
      );
    }
    const raw = Buffer.from(token.slice(ENC_PREFIX.length), 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(decrypted.toString('utf-8'));
  }

  // Legacy/plain base64 token (with or without the b64. prefix).
  const b64 = token.startsWith(B64_PREFIX)
    ? token.slice(B64_PREFIX.length)
    : token;
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
}
