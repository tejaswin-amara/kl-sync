import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/parse-ocr', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle request without image file', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/parse-ocr', {
      method: 'POST',
      body: formData
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'No image file provided' });
  });

  it('should handle general processing error (e.g. invalid form data)', async () => {
    const req = new NextRequest('http://localhost:3000/api/parse-ocr', {
      method: 'POST'
    });

    // override formData to throw
    req.formData = vi.fn().mockRejectedValue(new Error('Invalid form data'));

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Failed to process image: Invalid form data');
  });

  it('should handle OCR recognition error when fetch fails', async () => {
    const formData = new FormData();
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    formData.append('image', file);

    const req = new NextRequest('http://localhost:3000/api/parse-ocr', {
      method: 'POST',
      body: formData
    });

    // Mock global fetch to simulate OCR failure across all fallbacks
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('OCR API fetch failed'));

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

    const req = new NextRequest('http://localhost:3000/api/parse-ocr', {
      method: 'POST',
      body: formData
    });

    // Mock global fetch to return an API error from OCR Space
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        IsErroredOnProcessing: true,
        ErrorMessage: ['Invalid API Key']
      })
    } as any);

    const response = await POST(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('OCR processing failed');
    expect(data.details).toBe('OCR extraction failed for both engines.');
  });
});
