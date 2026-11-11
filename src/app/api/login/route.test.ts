import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { GET as getCaptcha } from '@/app/api/captcha/route';

const env = process.env as Record<string, string | undefined>;

function jsonRequest(body: Record<string, unknown>, headers: HeadersInit = {}) {
  return new NextRequest('http://localhost/api/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test('login route rejects uppercase, punctuation, whitespace, and non-ASCII CAPTCHA values', async () => {
  const previousDemoMode = env.KL_SYNC_DEMO_MODE;
  env.KL_SYNC_DEMO_MODE = 'false';

  try {
    for (const captcha of ['ABCD', 'ab1d', 'ab d', ' abcd', 'abcd ', 'ábcde', 'abc', 'abcdefgh']) {
      const response = await POST(
        jsonRequest({
          username: 'student',
          password: 'not-a-real-password',
          captcha,
          captchaToken: 'invalid',
        })
      );
      const data = (await response.json()) as { field?: string };

      assert.equal(response.status, 400, `expected rejection for ${JSON.stringify(captcha)}`);
      assert.equal(data.field, 'captcha');
    }
  } finally {
    if (previousDemoMode === undefined) delete env.KL_SYNC_DEMO_MODE;
    else env.KL_SYNC_DEMO_MODE = previousDemoMode;
  }
});

test('login route rejects a cross-origin request before processing credentials', async () => {
  const request = jsonRequest(
    {
      username: 'student',
      password: 'not-a-real-password',
      captcha: 'abcd',
    },
    { origin: 'https://attacker.example' }
  );

  const response = await POST(request);
  assert.equal(response.status, 403);
});

test('login route ignores body and header session IDs; only the HttpOnly cookie is accepted', async () => {
  const previousDemoMode = env.KL_SYNC_DEMO_MODE;
  env.KL_SYNC_DEMO_MODE = 'true';

  try {
    const response = await POST(
      jsonRequest(
        {
          username: '2100030000',
          password: 'demo_password',
          captcha: 'abcd',
          captchaToken: '',
          sessionId: 'enc.demo_session_data',
        },
        {
          'x-session-id': 'enc.demo_session_data',
          authorization: 'Bearer enc.demo_session_data',
        }
      )
    );
    const data = (await response.json()) as { field?: string };

    assert.equal(response.status, 400);
    assert.equal(data.field, 'captcha');
    assert.doesNotMatch(response.headers.get('set-cookie') || '', /kl_erp_session=/);
  } finally {
    if (previousDemoMode === undefined) delete env.KL_SYNC_DEMO_MODE;
    else env.KL_SYNC_DEMO_MODE = previousDemoMode;
  }
});

test('explicit demo login succeeds with the short-lived HttpOnly ERP CAPTCHA session cookie', async () => {
  const previousDemoMode = env.KL_SYNC_DEMO_MODE;
  env.KL_SYNC_DEMO_MODE = 'true';

  try {
    const captchaResponse = await getCaptcha();
    const captchaCookie = captchaResponse.headers
      .get('set-cookie')
      ?.match(/kl_captcha_session=[^;]+/)?.[0];
    assert.ok(captchaCookie);
    const response = await POST(
      jsonRequest(
        {
          username: '2100030000',
          password: 'demo_password',
          captcha: 'abcd',
          captchaToken: '',
          rememberMe: false,
        },
        { cookie: captchaCookie }
      )
    );
    const data = (await response.json()) as {
      success?: boolean;
      sessionId?: string;
    };

    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.sessionId, undefined);
    assert.equal(response.headers.get('x-session-id'), null);
    assert.ok(response.cookies.get('kl_erp_session')?.value);
    assert.equal(response.cookies.get('kl_erp_session')?.httpOnly, true);
    assert.equal(response.cookies.get('kl_captcha_session')?.maxAge, 0);
    const replayResponse = await POST(
      jsonRequest(
        {
          username: '2100030000',
          password: 'demo_password',
          captcha: 'abcd',
          captchaToken: '',
        },
        { cookie: `kl_captcha_session=${captchaCookie}` }
      )
    );
    assert.equal(replayResponse.status, 400);
    const replayData = (await replayResponse.json()) as { field?: string };
    assert.equal(replayData.field, 'captcha');

  } finally {
    if (previousDemoMode === undefined) delete env.KL_SYNC_DEMO_MODE;
    else env.KL_SYNC_DEMO_MODE = previousDemoMode;
  }
});
