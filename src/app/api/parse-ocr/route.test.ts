import { NextRequest } from 'next/server';
import { POST } from './route';
import { optimizeImageSize, preprocessImageForOCR } from './image-utils';

describe('Image Optimization and Preprocessing', () => {
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
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

      expect(console.error).toHaveBeenCalledWith(
        'Image optimization failed, using original:',
        expect.any(Error)
      );
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

      expect(console.error).toHaveBeenCalledWith(
        'Image preprocessing failed, using original:',
        expect.any(TypeError)
      );
      expect(result).toBe(invalidBuffer);
    });
  });
});

describe('POST /api/parse-ocr', () => {
  let originalConsoleError: typeof console.error;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
    originalFetch = global.fetch;
  });

  afterAll(() => {
    console.error = originalConsoleError;
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

    // Mock formData to throw
    request.formData = () => Promise.reject(new Error('Simulated formData error'));

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toMatch(/Failed to process image: Simulated formData error/);
  });

  it('should handle general errors thrown as Error instances', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    req.formData = async () => { throw new Error('Test error message') };

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({
      error: 'Failed to process image: Test error message'
    });
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

  it('should handle OCR recognition errors thrown as Error instances', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    const formData = new FormData();
    const buffer = Buffer.alloc(100);
    const file = new File([buffer], 'test.png', { type: 'image/png' });
    formData.append('image', file);
    req.formData = async () => formData;

    global.fetch = jest.fn().mockRejectedValue(new Error('OCR API Failed'));

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('OCR processing failed');
    expect(data.details).toBe('OCR extraction failed for both engines.');
    expect(data.debug.errorType).toBe('Error');
  });

  it('should handle OCR recognition errors gracefully when fetch resolves but fails processing', async () => {
    const req = new NextRequest('http://localhost/api/parse-ocr', { method: 'POST' });
    const formData = new FormData();
    const buffer = Buffer.alloc(100);
    const file = new File([buffer], 'test.png', { type: 'image/png' });
    formData.append('image', file);
    req.formData = async () => formData;

    global.fetch = jest.fn().mockResolvedValue({
       json: async () => ({
         IsErroredOnProcessing: true,
         ErrorMessage: 'Fake OCR processing error'
       })
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('OCR processing failed');
    expect(data.details).toBe('OCR extraction failed for both engines.');
    expect(data.debug.errorType).toBe('Error');
  });
});
