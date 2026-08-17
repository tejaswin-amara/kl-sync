import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSession, decodeSession, ScraperSession } from './session';

test('encodeSession and decodeSession roundtrip with AES-256-GCM', async () => {
  const sampleSession: ScraperSession = {
    cookies: [
      { name: 'PHPSESSID', value: 'session_abc123' },
      { name: 'kl_token', value: 'token_xyz789' },
    ],
    csrfToken: 'csrf_test_secret_123',
    userAgent: 'Mozilla/5.0 Test Agent',
  };

  const encoded = await encodeSession(sampleSession);
  assert.ok(encoded.startsWith('enc.'), 'Encoded session should start with enc. prefix');

  const decoded = await decodeSession(encoded);
  assert.deepEqual(decoded, sampleSession, 'Decoded session should match original session object');
});

test('decodeSession handles b64. prefixed legacy base64 sessions', async () => {
  const sampleSession: ScraperSession = {
    cookies: [{ name: 'PHPSESSID', value: 'legacy_sess' }],
    csrfToken: 'legacy_csrf',
  };

  const jsonStr = JSON.stringify(sampleSession);
  const b64Str = 'b64.' + Buffer.from(jsonStr).toString('base64');

  const decoded = await decodeSession(b64Str);
  assert.deepEqual(decoded, sampleSession, 'Legacy b64 session should decode correctly');
});

test('decodeSession returns demo fallback session on invalid secret or corrupted payload', async () => {
  // Corrupted prefix payload
  const corruptedPayload = 'enc.invalidbase64characters!!!';
  const decodedCorrupted = await decodeSession(corruptedPayload);
  assert.ok(decodedCorrupted.cookies.length > 0, 'Should fall back to valid session');
  assert.strictEqual(decodedCorrupted.csrfToken, 'demo_csrf_token_123');

  // Short raw string
  const shortPayload = 'enc.aGVsbG8='; // Base64 of 'hello' (< 28 bytes)
  const decodedShort = await decodeSession(shortPayload);
  assert.strictEqual(decodedShort.csrfToken, 'demo_csrf_token_123');

  // Tampered tag/ciphertext
  const sampleSession: ScraperSession = {
    cookies: [{ name: 'PHPSESSID', value: 'session_secret' }],
    csrfToken: 'csrf_secret',
  };
  const encoded = await encodeSession(sampleSession);
  // Mutate ciphertext bits
  const tampered = encoded.substring(0, encoded.length - 4) + 'AAAA';
  const decodedTampered = await decodeSession(tampered);
  assert.strictEqual(decodedTampered.csrfToken, 'demo_csrf_token_123');
});

test('decodeSession returns demo fallback on null, undefined, or empty input', async () => {
  assert.strictEqual((await decodeSession(null)).csrfToken, 'demo_csrf_token_123');
  assert.strictEqual((await decodeSession(undefined)).csrfToken, 'demo_csrf_token_123');
  assert.strictEqual((await decodeSession('')).csrfToken, 'demo_csrf_token_123');
});

test('isDemoSession correctly identifies demo vs real sessions', async () => {
  const { isDemoSession } = await import('./session');
  assert.strictEqual(isDemoSession(null), true);
  assert.strictEqual(isDemoSession(undefined), true);

  const demoSess: ScraperSession = {
    cookies: [{ name: 'PHPSESSID', value: 'demo_session' }],
    csrfToken: 'demo_csrf_token_123',
  };
  assert.strictEqual(isDemoSession(demoSess), true);

  const realSess: ScraperSession = {
    cookies: [{ name: 'PHPSESSID', value: 'real_php_session_999' }],
    csrfToken: 'real_csrf_abc',
  };
  assert.strictEqual(isDemoSession(realSess), false);
});

test('encodeSession throws [SECURITY FATAL] in production when SESSION_SECRET is missing', async () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origSecret = process.env.SESSION_SECRET;
  const origNextAuthSecret = process.env.NEXTAUTH_SECRET;

  try {
    delete process.env.SESSION_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

    const sampleSession: ScraperSession = {
      cookies: [{ name: 'PHPSESSID', value: 'val' }],
      csrfToken: 'csrf',
    };

    await assert.rejects(
      async () => {
        await encodeSession(sampleSession);
      },
      (err: Error) => err.message.includes('[SECURITY FATAL]')
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
    if (origSecret) process.env.SESSION_SECRET = origSecret;
    if (origNextAuthSecret) process.env.NEXTAUTH_SECRET = origNextAuthSecret;
  }
});

