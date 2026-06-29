import { NextRequest } from 'next/server';
import { POST } from './route';
import { optimizeImageSize, preprocessImageForOCR } from './image-utils';

describe('Image Optimization and Preprocessing', () => {
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = () => {};
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('optimizeImageSize', () => {
    it('should return the original buffer if size is within limits', async () => {
      const buffer = Buffer.alloc(1024);
      const result = await optimizeImageSize(buffer);
      expect(result).toBe(buffer);
    });

    it('should catch errors and return original buffer', async () => {
      const mockBuffer = {} as Buffer;
      Object.defineProperty(mockBuffer, 'length', {
        get() { throw new Error('Simulated access error'); }
      });

      const result = await optimizeImageSize(mockBuffer);
      expect(result).toBe(mockBuffer);
    });
  });

  describe('preprocessImageForOCR', () => {
    it('should return the original buffer on success', async () => {
      const buffer = Buffer.alloc(1024);
      const result = await preprocessImageForOCR(buffer);
      expect(result).toBe(buffer);
    });

    it('should catch errors and return original buffer', async () => {
      const invalidBuffer = {} as Buffer;
      const result = await preprocessImageForOCR(invalidBuffer);
      expect(result).toBe(invalidBuffer);
    });
  });
});

describe('POST /api/parse-ocr', () => {
  let originalConsoleError: typeof console.error;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = () => {};
    originalFetch = global.fetch;
  });

  afterAll(() => {
    console.error = originalConsoleError;
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return 400 if no image is provided', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost/api/parse-ocr', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('No image file provided');
  });

  it('should handle general processing errors in POST', async () => {
    const request = new NextRequest('http://localhost/api/parse-ocr', {
      method: 'POST',
    });

    request.formData = async () => { throw new Error('Simulated formData error') };

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to process image: Simulated formData error');
  });

  it('should handle general errors thrown as non-Error objects', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    req.formData = async () => { throw 'String error' };

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Failed to process image: Unknown error'
    });
  });

  it('should handle OCR recognition error when fetch fails', async () => {
    const formData = new FormData();
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    formData.append('image', file);

    const req = new NextRequest('http://localhost/api/parse-ocr', {
      method: 'POST',
    });
    req.formData = async () => formData;

    global.fetch = async () => { throw new Error('OCR API fetch failed') };

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('OCR processing failed');
    expect(data.details).toBe('OCR extraction failed for both engines.');
    expect(data.debug.fileType).toBe('image/png');
    expect(data.debug.errorType).toBe('Error');
  });

  it('should handle OCR API error response', async () => {
    const formData = new FormData();
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    formData.append('image', file);

    const req = new NextRequest('http://localhost/api/parse-ocr', {
      method: 'POST',
    });
    req.formData = async () => formData;

    global.fetch = async () => ({
      json: async () => ({
        IsErroredOnProcessing: true,
        ErrorMessage: ['Invalid API Key']
      })
    } as unknown);

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('OCR processing failed');
    expect(data.details).toBe('OCR extraction failed for both engines.');
  });
});
