import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  checkRateLimitDistributed,
  resolveSessionToken,
} from './request-utils';

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

  for (const headers of [
    { 'x-session-id': token },
    { authorization: `Bearer ${token}` },
  ]) {
    const request = new NextRequest('http://localhost/api/example', {
      headers,
    });
    assert.equal(resolveSessionToken(request), undefined);
  }
});

test('production distributed rate limiting fails closed when Redis is unconfigured', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  process.env.NODE_ENV = 'production';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

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
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
