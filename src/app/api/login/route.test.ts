import { test, describe } from 'node:test';
import assert from 'node:assert';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/login error handling', () => {
  test('returns 401 when an unexpected error occurs', async () => {
    const mockRequest = {
      json: async () => { throw new Error('Simulated internal error'); }
    } as unknown as NextRequest;

    const response = await POST(mockRequest);

    assert.strictEqual(response.status, 401);

    const body = await response.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Simulated internal error');
  });

  test('returns 401 with default message when error has no message', async () => {
    const mockRequest = {
      json: async () => { throw 'String error'; }
    } as unknown as NextRequest;

    const response = await POST(mockRequest);

    assert.strictEqual(response.status, 401);

    const body = await response.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, 'Login failed');
  });
});
