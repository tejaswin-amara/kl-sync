import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from './route';

test('GET /api/captcha returns an uncached image challenge without disclosing its answer', async () => {
  const previousDemoMode = process.env.KL_SYNC_DEMO_MODE;
  process.env.KL_SYNC_DEMO_MODE = 'true';

  try {
    const response = await GET(
      new NextRequest('http://localhost/api/captcha')
    );
    const data = (await response.json()) as Record<string, unknown>;

    assert.equal(response.status, 200);
    assert.equal(typeof data.captchaImage, 'string');
    assert.ok(String(data.captchaImage).startsWith('data:image/svg+xml'));
    assert.equal(data.rule, 'lowercase_letters_only');
    assert.equal(data.minLength, 4);
    assert.equal(data.maxLength, 7);
    assert.equal(Object.hasOwn(data, 'solvedCaptcha'), false);

    const cacheControl = response.headers.get('cache-control') || '';
    assert.match(cacheControl, /no-store/);

    const setCookie = response.headers.get('set-cookie') || '';
    assert.match(setCookie, /kl_captcha_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.doesNotMatch(response.headers.get('x-session-id') || '', /.+/);
  } finally {
    if (previousDemoMode === undefined) delete process.env.KL_SYNC_DEMO_MODE;
    else process.env.KL_SYNC_DEMO_MODE = previousDemoMode;
  }
});
