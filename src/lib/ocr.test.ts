import { solveCaptchaWithOCRSpace } from './ocr';
import sharp from 'sharp';

// Mock sharp to control preprocessing behavior
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => {
    return {
      ensureAlpha: jest.fn().mockReturnThis(),
      extractChannel: jest.fn().mockReturnThis(),
      trim: jest.fn().mockReturnThis(),
      resize: jest.fn().mockReturnThis(),
      blur: jest.fn().mockReturnThis(),
      threshold: jest.fn().mockReturnThis(),
      negate: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed')),
      extend: jest.fn().mockReturnThis(),
    };
  });
});

describe('solveCaptchaWithOCRSpace error handling', () => {
  let fetchSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Add global.fetch if not present (since jsdom might not have it or Node version < 18)
    if (!global.fetch) {
      global.fetch = jest.fn();
    }
  });

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const mockBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('should fall back to engine 1 when engine 2 returns no text', async () => {
    // Engine 2 mock
    fetchSpy.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        ParsedResults: [{ ParsedText: '' }],
      }),
    });

    // Engine 1 mock
    fetchSpy.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        ParsedResults: [{ ParsedText: 'SUCCESS' }],
      }),
    });

    const result = await solveCaptchaWithOCRSpace(mockBase64Image);
    expect(result).toBe('success');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    // Check formData engine values
    expect(fetchSpy.mock.calls[0][1].body.get('OCREngine')).toBe('2');
    expect(fetchSpy.mock.calls[1][1].body.get('OCREngine')).toBe('1');
  });

  it('should handle OCR rate-limit errors (result.error)', async () => {
    fetchSpy.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        error: 'Monthly limit reached',
      }),
    });

    const result = await solveCaptchaWithOCRSpace(mockBase64Image);
    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith('OCR.space error:', 'Monthly limit reached');
  });

  it('should handle OCR processing errors (result.IsErroredOnProcessing)', async () => {
    fetchSpy.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        IsErroredOnProcessing: true,
        ErrorMessage: 'Image too large',
      }),
    });

    const result = await solveCaptchaWithOCRSpace(mockBase64Image);
    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith('OCR.space processing error:', 'Image too large');
  });

  it('should handle network fetch errors', async () => {
    const error = new Error('Network failure');
    fetchSpy.mockRejectedValue(error);

    const result = await solveCaptchaWithOCRSpace(mockBase64Image);
    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith('OCR.space engine 2 fetch failed:', error);
  });

  it('should handle sharp preprocessing errors and fallback to raw buffer', async () => {
    // Mock sharp to throw an error on the first call (during preprocessCaptcha)
    const sharpMock = sharp as unknown as jest.Mock;
    sharpMock.mockImplementationOnce(() => {
      throw new Error('Sharp processing failed');
    });

    // Make engine 2 return success to verify it still proceeds
    fetchSpy.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        ParsedResults: [{ ParsedText: 'RAWBUFFER' }],
      }),
    });

    const result = await solveCaptchaWithOCRSpace(mockBase64Image);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Captcha preprocessing failed, using raw image:', expect.any(Error));
    expect(result).toBe('rawbuffer');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Verify that fetch was called with the raw buffer
    const body = fetchSpy.mock.calls[0][1].body as FormData;
    const base64Body = body.get('base64Image') as string;
    const rawBufferBase64 = Buffer.from(mockBase64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64').toString('base64');
    expect(base64Body).toBe(`data:image/png;base64,${rawBufferBase64}`);
  });

  it('should catch unexpected errors in outer try-catch', async () => {
    // We can force the outer try-catch to fail by passing a type that replace() will fail on,
    // but since it expects a string, let's spy on Buffer.from and make it throw.
    const bufferFromSpy = jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
      throw new Error('Buffer creation failed');
    });

    const result = await solveCaptchaWithOCRSpace(mockBase64Image);
    expect(result).toBe('');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Captcha OCR failed:', expect.any(Error));

    bufferFromSpy.mockRestore();
  });
});
