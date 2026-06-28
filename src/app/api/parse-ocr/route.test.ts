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

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
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
});
