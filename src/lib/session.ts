import type { ScraperSession } from './scraper';
import { DEMO_SESSION } from '@/lib/fixtures';

export type { ScraperSession };

const ENC_PREFIX = 'enc.';
const B64_PREFIX = 'b64.';

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.VERCEL_URL ||
    'kl-sync-production-session-fallback-secret-key-2026'
  );
}

async function getCryptoKey(): Promise<CryptoKey> {
  const secretBytes = new TextEncoder().encode(getSecret());
  const hash = await crypto.subtle.digest('SHA-256', secretBytes);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encodeSession(session: ScraperSession): Promise<string> {
  try {
    const jsonStr = JSON.stringify(session);
    const data = new TextEncoder().encode(jsonStr);
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.byteLength);

    return ENC_PREFIX + Buffer.from(combined).toString('base64');
  } catch (err) {
    console.error('[SESSION] Failed to encode session, fallback to b64:', err);
    return B64_PREFIX + Buffer.from(JSON.stringify(session), 'utf-8').toString('base64');
  }
}

export async function decodeSession(token: string | null | undefined): Promise<ScraperSession> {
  try {
    if (!token) throw new Error('Token is empty or null');
    if (token.startsWith(ENC_PREFIX)) {
      const raw = Buffer.from(token.slice(ENC_PREFIX.length), 'base64');
      if (raw.length < 28) {
        throw new Error('Invalid or corrupted encrypted session token');
      }
      const iv = raw.subarray(0, 12);
      const key = await getCryptoKey();

      try {
        // Try Web Crypto standard format: [IV 12][Ciphertext][Tag 16]
        const ciphertextWithTag = raw.subarray(12);
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          ciphertextWithTag
        );
        const decodedStr = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decodedStr);
      } catch {
        // Try legacy Node format fallback: [IV 12][Tag 16][Ciphertext] -> rearrange tag to end
        const tag = raw.subarray(12, 28);
        const ciphertext = raw.subarray(28);
        const rearranged = new Uint8Array(ciphertext.byteLength + tag.byteLength);
        rearranged.set(ciphertext, 0);
        rearranged.set(tag, ciphertext.byteLength);

        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          rearranged
        );
        const decodedStr = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decodedStr);
      }
    }

    const b64 = token.startsWith(B64_PREFIX) ? token.slice(B64_PREFIX.length) : token;
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  } catch (err) {
    console.warn('[SESSION] decodeSession error, using fallback session:', err);
    return DEMO_SESSION;
  }
}

