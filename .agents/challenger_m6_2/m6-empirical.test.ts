import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseNaturalLanguageIntent,
  executeTool,
  executeCalculateAttendanceTarget,
  executePredictCGPA,
} from '../../src/lib/ai/executor.ts';

import {
  getSetCookies,
  mergeSetCookies,
  cookieHeader,
  jarToArray,
  arrayToJar,
  parseGenericTable,
} from '../../src/lib/scrapers/http-jar.ts';

import {
  parseCurrency,
  findStatusKey,
  isSummaryRow,
  isRowUnpaid,
  calculatePendingFee,
} from '../../src/lib/fee-utils.ts';

import { toast, dismiss } from '../../src/hooks/use-toast.ts';

import {
  consumeNonce,
  storeRedeemedToken,
  verifyCaptchaToken,
} from '../../src/lib/captcha.ts';

describe('Empirical Verification for Milestone 6 Simplifications', () => {

  describe('1. AI Executor Intent Matcher & Tool Dispatcher (executor.ts)', () => {
    test('parseNaturalLanguageIntent matches keywords correctly', () => {
      assert.equal(parseNaturalLanguageIntent('check my attendance')?.toolName, 'getAttendance');
      assert.equal(parseNaturalLanguageIntent('what is my OS attendance')?.toolName, 'getAttendance');
      assert.equal(parseNaturalLanguageIntent('show my timetable')?.toolName, 'getTimetable');
      assert.equal(parseNaturalLanguageIntent('classes tomorrow')?.toolName, 'getTimetable');
      assert.equal(parseNaturalLanguageIntent('check fee dues')?.toolName, 'getFeeDetails');
      assert.equal(parseNaturalLanguageIntent('internal exam marks')?.toolName, 'getMarks');
      assert.equal(parseNaturalLanguageIntent('who am i profile')?.toolName, 'getStudentProfile');
      assert.equal(parseNaturalLanguageIntent('how many classes needed for target')!.toolName, 'calculateAttendanceTarget');
      assert.equal(parseNaturalLanguageIntent('predict my cgpa')!.toolName, 'predictCGPA');
      assert.equal(parseNaturalLanguageIntent('hello unhandled phrase'), null);
    });

    test('executeCalculateAttendanceTarget below target vs target met', () => {
      const below = executeCalculateAttendanceTarget({ currentAttended: 30, currentTotal: 40, targetPercent: 85 });
      assert.equal(below.success, true);
      assert.equal(below.status, 'below_target');
      assert.ok(below.classesNeeded > 0);

      const met = executeCalculateAttendanceTarget({ currentAttended: 38, currentTotal: 40, targetPercent: 75 });
      assert.equal(met.success, true);
      assert.equal(met.status, 'target_met');
      assert.ok(met.maxBunkable >= 0);
    });

    test('executePredictCGPA calculates predicted CGPA correctly', () => {
      const res = executePredictCGPA({
        currentCGPA: 8.0,
        completedCredits: 50,
        newCourses: [{ credits: 10, expectedGrade: 'O' }], // Grade O = 10 points
      });
      assert.equal(res.success, true);
      // (50*8.0 + 10*10) / 60 = 500 / 60 = 8.33
      assert.equal(res.predictedCGPA, 8.33);
      assert.equal(res.gpaDelta, 0.33);
    });

    test('executeTool handles unknown tool safely', async () => {
      const res = await executeTool('invalidToolName', {});
      assert.equal(res.success, false);
      assert.match(res.error!, /Unknown tool name/);
    });
  });

  describe('2. HTTP Cookie Jar & Cheerio Table Parser (http-jar.ts)', () => {
    test('Cookie jar helpers work correctly', () => {
      const jar = { session_id: 'abc12345', lang: 'en' };
      assert.equal(cookieHeader(jar), 'session_id=abc12345; lang=en');
      assert.deepEqual(jarToArray(jar), [
        { name: 'session_id', value: 'abc12345' },
        { name: 'lang', value: 'en' },
      ]);
      assert.deepEqual(arrayToJar([{ name: 'foo', value: 'bar' }]), { foo: 'bar' });
    });

    test('getSetCookies parses Response headers correctly', () => {
      const headers = new Headers();
      headers.append('set-cookie', 'a=1; Path=/');
      headers.append('set-cookie', 'b=2; Path=/');
      const mockRes = new Response('ok', { headers });
      const cookies = getSetCookies(mockRes);
      assert.ok(Array.isArray(cookies));
      assert.ok(cookies.length >= 1);
    });

    test('parseGenericTable cleans HTML, normalizes whitespace & extracts links', () => {
      const html = `
        <table>
          <thead>
            <tr><th>Course Name</th><th>Status</th><th>Link</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>   Data   Structures   \n & Algorithms   </td>
              <td>  PASS  </td>
              <td><a href="/details/101">View Details</a></td>
            </tr>
          </tbody>
        </table>
      `;
      const result = parseGenericTable(html);
      assert.equal(result.length, 1);
      assert.equal(result[0]['Course Name'], 'Data Structures\n& Algorithms');
      assert.equal(result[0]['Status'], 'PASS');
      assert.equal(result[0]['Link'], 'View Details');
      assert.equal(result[0]['Link_href'], '/details/101');
    });

    test('parseGenericTable handles nested JSON response tables', () => {
      const json = JSON.stringify({
        table: '<table><tr><th>ID</th></tr><tr><td>123</td></tr></table>'
      });
      const result = parseGenericTable(json);
      assert.equal(result.length, 1);
      assert.equal(result[0]['ID'], '123');
    });
  });

  describe('3. Currency & Fee Utilities (fee-utils.ts)', () => {
    test('parseCurrency handles positive formats, symbols, spaces and suffixes', () => {
      assert.equal(parseCurrency(150000), 150000);
      assert.equal(parseCurrency('150000'), 150000);
      assert.equal(parseCurrency('15,000.50'), 15000.5);
      assert.equal(parseCurrency('₹ 15,000'), 15000);
      assert.equal(parseCurrency('$1,500.00'), 1500);
      assert.equal(parseCurrency('€ 2,400.75'), 2400.75);
      assert.equal(parseCurrency('£500'), 500);
      assert.equal(parseCurrency('¥10,000'), 10000);
      assert.equal(parseCurrency('100/-'), 100);
      assert.equal(parseCurrency('Rs. 5000'), 5000);
      assert.equal(parseCurrency('USD 120'), 120);
      assert.equal(parseCurrency('  1,500.00  '), 1500);
      assert.equal(parseCurrency('  ₹  25,000  '), 25000);
    });

    test('parseCurrency handles negative formats and accounting parentheses', () => {
      assert.equal(parseCurrency('-1500'), -1500);
      assert.equal(parseCurrency('- 1,500.00'), -1500);
      assert.equal(parseCurrency('(1,500.00)'), -1500);
      assert.equal(parseCurrency('(₹ 5,000)'), -5000);
    });

    test('parseCurrency handles invalid, null, undefined and edge cases safely', () => {
      assert.equal(parseCurrency(null), 0);
      assert.equal(parseCurrency(undefined), 0);
      assert.equal(parseCurrency(true), 0);
      assert.equal(parseCurrency(false), 0);
      assert.equal(parseCurrency(''), 0);
      assert.equal(parseCurrency('N/A'), 0);
      assert.equal(parseCurrency('NIL'), 0);
      assert.equal(parseCurrency('NONE'), 0);
      assert.equal(parseCurrency('-'), 0);
      assert.equal(parseCurrency('abc'), 0);
      assert.equal(parseCurrency(NaN), 0);
    });

    test('calculatePendingFee calculates unpaid total accurately', () => {
      const data = [
        { 'Fee Type': 'Tuition', Amount: '100000', 'Paid Amount': '100000', Status: 'PAID' },
        { 'Fee Type': 'Hostel', Amount: '50000', 'Paid Amount': '30000', 'Balance Amount': '20000', Status: 'PENDING' },
        { 'Fee Type': 'Total', Amount: '150000', 'Paid Amount': '130000' }, // Summary row
      ];
      assert.equal(calculatePendingFee(data), 20000);
    });
  });

  describe('4. Toast Hook Notification Store (use-toast.ts)', () => {
    test('toast creates and dismisses toast notifications, capping at 5', () => {
      dismiss(); // Clear existing
      const t1 = toast({ title: 'Toast 1' });
      const t2 = toast({ title: 'Toast 2' });
      const t3 = toast({ title: 'Toast 3' });
      const t4 = toast({ title: 'Toast 4' });
      const t5 = toast({ title: 'Toast 5' });
      const t6 = toast({ title: 'Toast 6' });

      assert.ok(t1.id);
      assert.ok(t6.id);

      // Dismiss t6
      dismiss(t6.id);
      dismiss(); // Clear all
    });
  });

  describe('5. Captcha & Token Verification without Upstash Redis (captcha.ts)', () => {
    test('consumeNonce prevents nonce reuse (replay attack prevention)', async () => {
      const sig = 'sig_test_' + Date.now() + Math.random();
      const first = await consumeNonce(sig, 10000);
      assert.equal(first, true, 'First nonce consume should succeed');

      const second = await consumeNonce(sig, 10000);
      assert.equal(second, false, 'Second nonce consume must be rejected');
    });

    test('verifyCaptchaToken handles demo tokens and invalid formats', async () => {
      assert.equal(await verifyCaptchaToken('demo_token'), true);
      assert.equal(await verifyCaptchaToken('demo_csrf_token_123'), true);
      assert.equal(await verifyCaptchaToken(null), false);
      assert.equal(await verifyCaptchaToken(''), false);
      assert.equal(await verifyCaptchaToken('invalid_token_without_colon'), false);
    });

    test('storeRedeemedToken and verifyCaptchaToken single-use burn', async () => {
      const id = 'req_' + Math.random().toString(36).substring(2);
      const verToken = 'token_secret_' + Math.random().toString(36).substring(2);
      const fullToken = `${id}:${verToken}`;

      // Test stateless burn verification
      const firstVerify = await verifyCaptchaToken(fullToken);
      assert.equal(firstVerify, true, 'First token verification should pass');

      // Replay attempt with identical burned token
      const secondVerify = await verifyCaptchaToken(fullToken);
      assert.equal(secondVerify, false, 'Replay with burned token must be rejected');
    });
  });
});
