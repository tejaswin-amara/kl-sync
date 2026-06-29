import { solveCaptchaWithOCRSpace } from './ocr'
import sharp from 'sharp'

import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest'

// Mock sharp module
vi.mock('sharp', () => {
  const mockChain = {
    ensureAlpha: vi.fn().mockReturnThis(),
    extractChannel: vi.fn().mockReturnThis(),
    trim: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    blur: vi.fn().mockReturnThis(),
    threshold: vi.fn().mockReturnThis(),
    negate: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-core')),
    extend: vi.fn().mockReturnThis(),
  }

  const sharpMock = vi.fn().mockImplementation(() => mockChain) as unknown
  return { default: sharpMock }
})

describe('solveCaptchaWithOCRSpace', () => {
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {}) // Suppress console.errors in tests

    // Default fetch mock
    vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({
      json: () => Promise.resolve({
        ParsedResults: [{ ParsedText: 'AbC123XyZ' }]
      })
    } as Response))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should successfully parse captcha on happy path', async () => {
    const result = await solveCaptchaWithOCRSpace(sampleBase64)
    expect(result).toBe('abclzexyz') // 'AbC123XyZ' cleaned
    expect(global.fetch).toHaveBeenCalledTimes(2) // Both engines called in parallel
    expect(sharp).toHaveBeenCalledTimes(2) // Core and extended
  })

  it('should fallback to raw buffer when sharp preprocessing fails', async () => {
    // Make sharp throw an error
    ;(vi.mocked(sharp)).mockImplementationOnce(() => {
      throw new Error('Sharp processing failed')
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('Captcha preprocessing failed, using raw image:', expect.any(Error))
    expect(result).toBe('abclzexyz')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fallback to Engine 1 when Engine 2 returns no text', async () => {
    // Engine 2 returns no text, Engine 1 returns text
    let callCount = 0
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.resolve({
          json: () => Promise.resolve({ ParsedResults: [{ ParsedText: '' }] })
        } as Response)
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'FallbackText' }] })
      } as Response)
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(result).toBe('fallbacktext')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fallback to Engine 1 when Engine 2 returns an error', async () => {
    // Engine 2 returns error, Engine 1 returns text
    let callCount = 0
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.resolve({
          json: () => Promise.resolve({ error: 'Rate limit exceeded' })
        } as Response)
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'Engine1Text' }] })
      } as Response)
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space error:', 'Rate limit exceeded')
    expect(result).toBe('engineltext')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle OCR.space processing errors (IsErroredOnProcessing)', async () => {
    let callCount = 0
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.resolve({
          json: () => Promise.resolve({ IsErroredOnProcessing: true, ErrorMessage: 'Processing failed' })
        } as Response)
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'Success' }] })
      } as Response)
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space processing error:', 'Processing failed')
    expect(result).toBe('success')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fallback to Engine 1 when Engine 2 fetch fails completely', async () => {
    let callCount = 0
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.reject(new Error('Network Error'))
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'Engine1Success' }] })
      } as Response)
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space engine 2 fetch failed:', expect.any(Error))
    expect(result).toBe('enginelsuccess')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should return empty string when both engines fail', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('Network Error')))

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space engine 2 fetch failed:', expect.any(Error))
    expect(console.error).toHaveBeenCalledWith('OCR.space engine 1 fetch failed:', expect.any(Error))
    expect(result).toBe('')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should return empty string and log error if an unexpected error occurs in the outer try-catch', async () => {
    // Mock Buffer.from to throw an error
    vi.spyOn(Buffer, 'from').mockImplementationOnce(() => {
      throw new Error('Fatal error')
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('Captcha OCR failed:', expect.any(Error))
    expect(result).toBe('')

    // Buffer.from is restored automatically by vi.restoreAllMocks
  })
})
