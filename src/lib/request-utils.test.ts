import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  checkRateLimitDistributed,
  resolveSessionToken,
} from './request-utils';

const env = process.env as Record<string, string | undefined>;

test('checkRateLimit allows requests up to limit and blocks excess', () => {
  const key = 'test-ip-123';
  const limit = 5;
  const windowMs = 10000;

  for (let i = 0; i < limit; i++) {
    const res = checkRateLimit(key, limit, windowMs);
    assert.strictEqual(res.allowed, true, `Request ${i + 1} should be allowed`);
    assert.strictEqual(res.remaining, limit - 1 - i);
  }

  const blockedRes = checkRateLimit(key, limit, windowMs);
  assert.strictEqual(
    blockedRes.allowed,
    false,
    'Request exceeding limit should be blocked'
  );
  assert.strictEqual(blockedRes.remaining, 0);
});


test('resolveSessionToken accepts only the HttpOnly ERP session cookie', () => {
  const token = 'enc.valid-session-token';

  const cookieRequest = new NextRequest('http://localhost/api/example', {
    headers: { cookie: `kl_erp_session=${token}` },
  });
  assert.equal(resolveSessionToken(cookieRequest), token);

  const legacyHeaders: Array<Record<string, string>> = [
    { 'x-session-id': token },
    { authorization: `Bearer ${token}` },
  ];
  for (const headers of legacyHeaders) {
    const request = new NextRequest('http://localhost/api/example', {
      headers,
    });
    assert.equal(resolveSessionToken(request), undefined);
  }
});

test('production distributed rate limiting fails closed when Redis is unconfigured', async () => {
  const previousNodeEnv = env.NODE_ENV;
  const previousUrl = env.UPSTASH_REDIS_REST_URL;
  const previousToken = env.UPSTASH_REDIS_REST_TOKEN;

  env.NODE_ENV = 'production';
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const result = await checkRateLimitDistributed(
      `production-missing-redis-${Date.now()}`,
      5,
      10_000
    );
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
    assert.equal(result.resetMs, 10_000);
  } finally {
    if (previousNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
    else env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
    else env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
