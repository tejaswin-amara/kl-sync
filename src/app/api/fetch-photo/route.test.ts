import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { encodeSession } from '@/lib/session';

async function createSessionToken() {
  return encodeSession({
    cookies: [{ name: 'PHPSESSID', value: 'photo-test-session' }],
    csrfToken: 'photo-test-csrf',
  });
}

function photoRequest(sessionToken: string) {
  return new NextRequest(
    'http://localhost/api/fetch-photo?path=%2Fuploads%2Favatar.jpg',
    { headers: { cookie: `kl_erp_session=${sessionToken}` } }
  );
}

test('fetch-photo does not follow an ERP redirect to a different origin', async () => {
  const sessionToken = await createSessionToken();
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    redirect: RequestRedirect | undefined;
    cookie: string | null;
  }> = [];

  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requests.push({
      url: String(input),
      redirect: init?.redirect,
      cookie: new Headers(init?.headers).get('cookie'),
    });
    return new Response(null, {
      status: 302,
      headers: { location: 'https://169.254.169.254/latest/meta-data/' },
    });
  }) as typeof fetch;

  try {
    const response = await GET(photoRequest(sessionToken));

    assert.equal(response.status, 502);
    assert.equal(requests.length, 1);
    assert.equal(
      requests[0]?.url,
      'https://newerp.kluniversity.in/uploads/avatar.jpg'
    );
    assert.equal(requests[0]?.redirect, 'manual');
    assert.match(requests[0]?.cookie ?? '', /PHPSESSID=photo-test-session/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetch-photo follows redirects only within the ERP origin', async () => {
  const sessionToken = await createSessionToken();
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  globalThis.fetch = (async (input: URL | RequestInfo) => {
    requestedUrls.push(String(input));
    if (requestedUrls.length === 1) {
      return new Response(null, {
        status: 302,
        headers: { location: '/uploads/canonical-avatar.jpg' },
      });
    }
    return new Response('image-bytes', {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }) as typeof fetch;

  try {
    const response = await GET(photoRequest(sessionToken));

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'image-bytes');
    assert.deepEqual(requestedUrls, [
      'https://newerp.kluniversity.in/uploads/avatar.jpg',
      'https://newerp.kluniversity.in/uploads/canonical-avatar.jpg',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetch-photo preserves ERP rate-limit responses', async () => {
  const sessionToken = await createSessionToken();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(null, {
      status: 429,
      headers: { 'Retry-After': '17' },
    })) as typeof fetch;

  try {
    const response = await GET(photoRequest(sessionToken));

    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '17');
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('fetch-photo rejects session IDs supplied only in legacy headers', async () => {
  const sessionToken = await createSessionToken();
  const request = new NextRequest(
    'http://localhost/api/fetch-photo?path=%2Fuploads%2Favatar.jpg',
    { headers: { 'x-session-id': sessionToken } }
  );
  assert.equal((await GET(request)).status, 401);
});
