import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cookieHeader,
  mergeSetCookies,
  jarToArray,
  arrayToJar,
  ERP_ENDPOINTS,
  CookieJar,
} from './http-jar';

test('cookieHeader converts jar dictionary to HTTP Cookie header string', () => {
  const jar: CookieJar = {
    PHPSESSID: 'sess123',
    kl_token: 'tok456',
  };

  const header = cookieHeader(jar);
  assert.strictEqual(header, 'PHPSESSID=sess123; kl_token=tok456');

  assert.strictEqual(cookieHeader({}), '');
});

test('jarToArray and arrayToJar bidirectional conversion', () => {
  const jar: CookieJar = {
    PHPSESSID: 'sess123',
    user_id: '1001',
  };

  const arr = jarToArray(jar);
  assert.deepEqual(arr, [
    { name: 'PHPSESSID', value: 'sess123' },
    { name: 'user_id', value: '1001' },
  ]);

  const reconstructed = arrayToJar(arr);
  assert.deepEqual(reconstructed, jar);

  assert.deepEqual(arrayToJar(undefined), {});
  assert.deepEqual(arrayToJar([]), {});
});

test('mergeSetCookies extracts cookies from Set-Cookie headers', () => {
  const jar: CookieJar = {};
  const mockHeaders = new Headers();
  mockHeaders.append('Set-Cookie', 'PHPSESSID=new_sess_789; Path=/; HttpOnly; Secure');
  mockHeaders.append('Set-Cookie', 'remember_me=true; Path=/; SameSite=Lax');

  const mockResponse = new Response(null, { headers: mockHeaders });
  mergeSetCookies(jar, mockResponse);

  assert.strictEqual(jar.PHPSESSID, 'new_sess_789');
  assert.strictEqual(jar.remember_me, 'true');
});

test('ERP_ENDPOINTS dictionary completeness and valid URLs', () => {
  const requiredModules = [
    'marks',
    'timetable',
    'fee',
    'profile',
    'cgpa',
    'end-exam',
    'exam-seating',
    'circulars',
    'hostel',
    'library',
  ];

  for (const mod of requiredModules) {
    assert.ok(mod in ERP_ENDPOINTS, `ERP_ENDPOINTS must include key '${mod}'`);
    assert.ok(
      ERP_ENDPOINTS[mod].startsWith('https://newerp.kluniversity.in'),
      `Endpoint for '${mod}' must point to newerp.kluniversity.in`
    );
  }
});
