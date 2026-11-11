import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { encodeSession, decodeSession, ScraperSession } from '@/lib/session';
import { GET as captchaGET } from '@/app/api/captcha/route';
import { POST as loginPOST } from '@/app/api/login/route';
import {
  GET as erpProxyGET,
  POST as erpProxyPOST,
} from '@/app/api/erp-proxy/[module]/route';
import { GET as fetchPhotoGET } from '@/app/api/fetch-photo/route';
import { POST as aiChatPOST } from '@/app/api/ai/chat/route';

const TEST_SESSION: ScraperSession = {
  cookies: [
    { name: 'PHPSESSID', value: 'sess_prod_998877' },
    { name: 'kl_device', value: 'device_mac_112233' },
  ],
  csrfToken: 'csrf_test_live_token_777',
  userAgent: 'Mozilla/5.0 Challenger Test Suite',
};

function cookieValue(response: Response, name: string): string {
  const value = response.headers
    .get('set-cookie')
    ?.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`))?.[1];
  assert.ok(value, `Expected ${name} in Set-Cookie`);
  return value;
}

test('Challenger M1 - CAPTCHA session is issued only as a short-lived HttpOnly cookie', async () => {
  const response = await captchaGET();
  assert.equal(response.status, 200);

  const data = (await response.json()) as Record<string, unknown>;
  assert.equal(typeof data.captchaImage, 'string');
  assert.equal(Object.hasOwn(data, 'solvedCaptcha'), false);
  assert.equal(response.headers.get('x-session-id'), null);

  const sessionToken = cookieValue(response, 'kl_captcha_session');
  assert.ok(sessionToken.startsWith('enc.'));
  assert.match(response.headers.get('set-cookie') || '', /HttpOnly/i);
  assert.match(response.headers.get('set-cookie') || '', /SameSite=Lax/i);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);

  const decoded = await decodeSession(sessionToken);
  assert.ok(decoded.csrfToken);
});

test('Challenger M1 - login accepts the HttpOnly CAPTCHA cookie and rejects legacy session channels', async () => {
  const captchaResponse = await captchaGET();
  const captchaSession = cookieValue(captchaResponse, 'kl_captcha_session');

  const cookieRequest = new NextRequest('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `kl_captcha_session=${captchaSession}`,
    },
    body: JSON.stringify({
      username: 'demo',
      password: 'password123',
      captcha: 'abcd',
      captchaToken: '',
    }),
  });

  const loginResponse = await loginPOST(cookieRequest);
  assert.equal(loginResponse.status, 200);

  const loginData = (await loginResponse.json()) as Record<string, unknown>;
  assert.equal(loginData.success, true);
  assert.equal(Object.hasOwn(loginData, 'sessionId'), false);
  assert.equal(loginResponse.headers.get('x-session-id'), null);

  const erpSession = loginResponse.cookies.get('kl_erp_session')?.value;
  assert.ok(erpSession?.startsWith('enc.'));
  assert.equal(loginResponse.cookies.get('kl_erp_session')?.httpOnly, true);
  assert.equal(loginResponse.cookies.get('kl_captcha_session')?.maxAge, 0);

  const decoded = await decodeSession(erpSession);
  assert.ok(decoded.csrfToken);

  const legacyHeaderRequest = new NextRequest('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-session-id': erpSession,
    },
    body: JSON.stringify({
      username: 'demo',
      password: 'password123',
      captcha: 'abcd',
      captchaToken: '',
    }),
  });
  const legacyHeaderResponse = await loginPOST(legacyHeaderRequest);
  assert.equal(legacyHeaderResponse.status, 400);
  const legacyHeaderData = (await legacyHeaderResponse.json()) as {
    field?: string;
  };
  assert.equal(legacyHeaderData.field, 'captcha');

  const legacyBodyRequest = new NextRequest('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sessionId: erpSession,
      username: 'demo',
      password: 'password123',
      captcha: 'abcd',
      captchaToken: '',
    }),
  });
  const legacyBodyResponse = await loginPOST(legacyBodyRequest);
  assert.equal(legacyBodyResponse.status, 400);
  const legacyBodyData = (await legacyBodyResponse.json()) as {
    field?: string;
  };
  assert.equal(legacyBodyData.field, 'captcha');
});

test('Challenger M1 - ERP proxy authenticates through the HttpOnly session cookie', async () => {
  const token = await encodeSession({
    ...TEST_SESSION,
    csrfToken: 'demo_csrf_9999',
  });
  const params = Promise.resolve({ module: 'attendance' });

  const request = new NextRequest(
    'http://localhost:3000/api/erp-proxy/attendance?academicYear=2025-2026&semesterId=1',
    {
      headers: { cookie: `kl_erp_session=${token}` },
    }
  );

  const response = await erpProxyGET(request, { params });
  assert.equal(response.status, 200);

  const postRequest = new NextRequest(
    'http://localhost:3000/api/erp-proxy/attendance',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `kl_erp_session=${token}`,
      },
      body: JSON.stringify({
        academicYear: '2025-2026',
        semesterId: '1',
      }),
    }
  );
  const postResponse = await erpProxyPOST(postRequest, { params });
  assert.equal(postResponse.status, 200);
});

test('Challenger M1 - photo endpoint accepts the encrypted session cookie', async () => {
  const token = await encodeSession(TEST_SESSION);

  const noSession = new NextRequest(
    'http://localhost:3000/api/fetch-photo?id=2100030000'
  );
  const noSessionResponse = await fetchPhotoGET(noSession);
  assert.equal(noSessionResponse.status, 401);

  const cookieRequest = new NextRequest(
    'http://localhost:3000/api/fetch-photo?id=2100030000',
    {
      headers: { cookie: `kl_erp_session=${token}` },
    }
  );
  const cookieResponse = await fetchPhotoGET(cookieRequest);
  assert.notEqual(
    cookieResponse.status,
    401,
    'A valid HttpOnly session cookie must pass the authentication boundary'
  );
});

test('Challenger M1 - AI chat continues to work with the authenticated session cookie', async () => {
  const token = await encodeSession(TEST_SESSION);
  const request = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `kl_erp_session=${token}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What is my attendance?' }],
    }),
  });

  const response = await aiChatPOST(request);
  assert.equal(response.status, 200);
  const data = (await response.json()) as { success?: boolean };
  assert.equal(data.success, true);
});

test('Challenger M1 - multi-hop CAPTCHA-to-dashboard chain preserves the cookie boundary', async () => {
  const captchaResponse = await captchaGET();
  const captchaSession = cookieValue(captchaResponse, 'kl_captcha_session');

  const loginRequest = new NextRequest('http://localhost:3000/api/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `kl_captcha_session=${captchaSession}`,
    },
    body: JSON.stringify({
      username: 'demo',
      password: 'password123',
      captcha: 'abcd',
      captchaToken: '',
    }),
  });

  const loginResponse = await loginPOST(loginRequest);
  assert.equal(loginResponse.status, 200);

  const loginData = (await loginResponse.json()) as Record<string, unknown>;
  assert.equal(loginData.success, true);
  assert.equal(Object.hasOwn(loginData, 'sessionId'), false);

  const sessionToken = loginResponse.cookies.get('kl_erp_session')?.value;
  assert.ok(sessionToken);

  const proxyRequest = new NextRequest(
    'http://localhost:3000/api/erp-proxy/attendance',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `kl_erp_session=${sessionToken}`,
      },
      body: JSON.stringify({
        academicYear: '2025-2026',
        semesterId: '1',
      }),
    }
  );
  const proxyResponse = await erpProxyPOST(proxyRequest, {
    params: Promise.resolve({ module: 'attendance' }),
  });
  assert.equal(proxyResponse.status, 200);

  const photoRequest = new NextRequest(
    'http://localhost:3000/api/fetch-photo?id=2100030000',
    { headers: { cookie: `kl_erp_session=${sessionToken}` } }
  );
  const photoResponse = await fetchPhotoGET(photoRequest);
  assert.notEqual(photoResponse.status, 401);

  const chatRequest = new NextRequest('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `kl_erp_session=${sessionToken}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'What is my profile?' }],
    }),
  });
  const chatResponse = await aiChatPOST(chatRequest);
  assert.equal(chatResponse.status, 200);
  const chatData = (await chatResponse.json()) as { success?: boolean };
  assert.equal(chatData.success, true);
});
