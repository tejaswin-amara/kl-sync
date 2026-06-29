import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/parse-ocr', () => {
  let originalConsoleError: typeof console.error;
  let originalFetch: typeof global.fetch;

  before(() => {
    originalConsoleError = console.error;
    console.error = () => {}; // Suppress console.error during tests
    originalFetch = global.fetch;
  });

  after(() => {
    console.error = originalConsoleError;
    global.fetch = originalFetch;
  });

  test('should handle general errors thrown as Error instances', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    req.formData = async () => { throw new Error('Test error message') };

    const response = await POST(req);

    assert.strictEqual(response.status, 500);
    const data = await response.json();
    assert.deepStrictEqual(data, {
      error: 'Failed to process image: Test error message'
    });
  });

  test('should handle general errors thrown as non-Error objects', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    req.formData = async () => { throw 'String error' };

    const response = await POST(req);

    assert.strictEqual(response.status, 500);
    const data = await response.json();
    assert.deepStrictEqual(data, {
      error: 'Failed to process image: Unknown error'
    });
  });

  test('should handle OCR recognition errors thrown as Error instances', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    const formData = new FormData();
    const buffer = Buffer.alloc(100);
    const file = new File([buffer], 'test.png', { type: 'image/png' });
    formData.append('image', file);
    req.formData = async () => formData;

    global.fetch = async () => { throw new Error('OCR API Failed') };

    const response = await POST(req);
    assert.strictEqual(response.status, 500);
    const data = await response.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'OCR processing failed');
    assert.strictEqual(data.details, 'OCR extraction failed for both engines.');
    assert.strictEqual(data.debug.errorType, 'Error');
  });

  test('should handle OCR recognition errors gracefully when fetch resolves but fails processing', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    const formData = new FormData();
    const buffer = Buffer.alloc(100);
    const file = new File([buffer], 'test.png', { type: 'image/png' });
    formData.append('image', file);
    req.formData = async () => formData;

    // global.fetch returning a json that indicates IsErroredOnProcessing = true
    global.fetch = async () => ({
       json: async () => ({
         IsErroredOnProcessing: true,
         ErrorMessage: 'Fake OCR processing error'
       })
    } as any);

    const response = await POST(req);
    assert.strictEqual(response.status, 500);
    const data = await response.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'OCR processing failed');
    assert.strictEqual(data.details, 'OCR extraction failed for both engines.');
    assert.strictEqual(data.debug.errorType, 'Error');
  });
});
