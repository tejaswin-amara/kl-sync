import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  verifyCaptchaToken,
  consumeNonce,
  getCapSecret,
} from './captcha';

const env = process.env as Record<string, string | undefined>;

function createSignedToken(
  overrides: Partial<{
    scope: unknown;
    exp: unknown;
    iat: unknown;
    rnd: unknown;
  }> = {}
): string {
  const secret = getCapSecret();
  const now = Date.now();
  const payload = {
    scope: 'login',
    exp: now + 60_000,
    iat: now,
    rnd: crypto.randomBytes(16).toString('hex'),
    ...overrides,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `signed:${encoded}.${signature}`;
}

test('getCapSecret returns a usable server secret', () => {
  const secret = getCapSecret();
  assert.equal(typeof secret, 'string');
  assert.ok(secret.length >= 16);
});

test('verifyCaptchaToken rejects missing, malformed, and legacy tokens', async () => {
  assert.equal(await verifyCaptchaToken(null), false);
  assert.equal(await verifyCaptchaToken(undefined), false);
  assert.equal(await verifyCaptchaToken(''), false);
  assert.equal(await verifyCaptchaToken('not-a-token'), false);
  assert.equal(await verifyCaptchaToken('challenge-id:legacy-secret'), false);
  assert.equal(await verifyCaptchaToken('signed:broken'), false);
});

test('verifyCaptchaToken enforces login scope, expiry, issued-at, and nonce claims', async () => {
  assert.equal(await verifyCaptchaToken(createSignedToken()), true);

  assert.equal(
    await verifyCaptchaToken(createSignedToken({ scope: 'signup' })),
    false
  );
  assert.equal(
    await verifyCaptchaToken(createSignedToken({ exp: Date.now() - 1000 })),
    false
  );
  assert.equal(
    await verifyCaptchaToken(createSignedToken({ exp: undefined })),
    false
  );
  assert.equal(
    await verifyCaptchaToken(
      createSignedToken({ iat: Date.now() + 5 * 60_000 })
    ),
    false
  );
  assert.equal(
    await verifyCaptchaToken(createSignedToken({ rnd: 'short' })),
    false
  );
});

test('verifyCaptchaToken burns a valid signed token after its first use', async () => {
  const token = createSignedToken();
  assert.equal(await verifyCaptchaToken(token), true);
  assert.equal(await verifyCaptchaToken(token), false);
});

test('verifyCaptchaToken rejects tampered signatures and expired signed tokens', async () => {
  const token = createSignedToken();
  const [prefix, encoded, signature] = token.split(/[:.]/);
  assert.equal(prefix, 'signed');
  assert.equal(
    await verifyCaptchaToken(`signed:${encoded}.${signature.slice(0, -1)}x`),
    false
  );

  const expired = createSignedToken({
    exp: Date.now() - 1000,
    iat: Date.now() - 10_000,
  });
  assert.equal(await verifyCaptchaToken(expired), false);
});

test('consumeNonce enforces single-use nonce consumption in development', async () => {
  const signature = `nonce-${crypto.randomBytes(12).toString('hex')}`;
  assert.equal(await consumeNonce(signature, 10_000), true);
  assert.equal(await consumeNonce(signature, 10_000), false);
  assert.equal(await consumeNonce('invalid-ttl', 0), false);
});

test('distributed nonce and token replay checks use atomic Redis SET NX PX', async () => {
  const previousUrl = env.UPSTASH_REDIS_REST_URL;
  const previousToken = env.UPSTASH_REDIS_REST_TOKEN;
  const previousFetch = globalThis.fetch;
  const commands: (string | number)[][] = [];

  env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

  globalThis.fetch = async (_input, init) => {
    commands.push(JSON.parse(String(init?.body)) as (string | number)[]);
    return new Response(
      JSON.stringify({ result: commands.length % 2 === 1 ? 'OK' : null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const nonce = `redis-nonce-${crypto.randomBytes(12).toString('hex')}`;
    assert.equal(await consumeNonce(nonce, 20_000), true);
    assert.equal(await consumeNonce(nonce, 20_000), false);

    const signedToken = createSignedToken();
    assert.equal(await verifyCaptchaToken(signedToken), true);
    assert.equal(await verifyCaptchaToken(signedToken), false);

    assert.equal(commands.length, 4);
    for (const command of commands) {
      assert.equal(command[0], 'SET');
      assert.ok(command.includes('NX'));
      assert.ok(command.includes('PX'));
    }
    assert.match(String(commands[2][1]), /^cap-consumed:/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
    else env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
    else env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});

test('production CAPTCHA replay protection fails closed without distributed storage', async () => {
  const previousNodeEnv = env.NODE_ENV;
  const previousUrl = env.UPSTASH_REDIS_REST_URL;
  const previousToken = env.UPSTASH_REDIS_REST_TOKEN;

  env.NODE_ENV = 'production';
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;

  try {
    assert.equal(
      await verifyCaptchaToken(createSignedToken()),
      false
    );
    assert.equal(
      await consumeNonce(
        `production-nonce-${crypto.randomBytes(8).toString('hex')}`,
        10_000
      ),
      false
    );
  } finally {
    if (previousNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
    else env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
    else env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
