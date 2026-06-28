import { solveCaptchaWithOCRSpace } from './ocr'
import sharp from 'sharp'

// Mock sharp module
jest.mock('sharp', () => {
  const mockChain = {
    ensureAlpha: jest.fn().mockReturnThis(),
    extractChannel: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    blur: jest.fn().mockReturnThis(),
    threshold: jest.fn().mockReturnThis(),
    negate: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-core')),
    extend: jest.fn().mockReturnThis(),
  }

  const sharpMock: any = jest.fn().mockImplementation(() => mockChain)
  return sharpMock
})

describe('solveCaptchaWithOCRSpace', () => {
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {}) // Suppress console.errors in tests

    // Default fetch mock
    jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({
      json: () => Promise.resolve({
        ParsedResults: [{ ParsedText: 'AbC123XyZ' }]
      })
    } as any))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should successfully parse captcha on happy path', async () => {
    const result = await solveCaptchaWithOCRSpace(sampleBase64)
    expect(result).toBe('abclzexyz') // 'AbC123XyZ' cleaned
    expect(global.fetch).toHaveBeenCalledTimes(1) // Engine 2 only
    expect(sharp).toHaveBeenCalledTimes(2) // Core and extended
  })

  it('should fallback to raw buffer when sharp preprocessing fails', async () => {
    // Make sharp throw an error
    ;(sharp as unknown as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Sharp processing failed')
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('Captcha preprocessing failed, using raw image:', expect.any(Error))
    expect(result).toBe('abclzexyz')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should fallback to Engine 1 when Engine 2 returns no text', async () => {
    // Engine 2 returns no text, Engine 1 returns text
    let callCount = 0
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.resolve({
          json: () => Promise.resolve({ ParsedResults: [{ ParsedText: '' }] })
        })
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'FallbackText' }] })
      })
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(result).toBe('fallbacktext')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fallback to Engine 1 when Engine 2 returns an error', async () => {
    // Engine 2 returns error, Engine 1 returns text
    let callCount = 0
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.resolve({
          json: () => Promise.resolve({ error: 'Rate limit exceeded' })
        })
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'Engine1Text' }] })
      })
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space error:', 'Rate limit exceeded')
    expect(result).toBe('engineltext')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should handle OCR.space processing errors (IsErroredOnProcessing)', async () => {
    let callCount = 0
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.resolve({
          json: () => Promise.resolve({ IsErroredOnProcessing: true, ErrorMessage: 'Processing failed' })
        })
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'Success' }] })
      })
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space processing error:', 'Processing failed')
    expect(result).toBe('success')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fallback to Engine 1 when Engine 2 fetch fails completely', async () => {
    let callCount = 0
    ;(global.fetch as jest.Mock).mockImplementation(() => {
      callCount++
      if (callCount === 1) { // Engine 2
        return Promise.reject(new Error('Network Error'))
      }
      return Promise.resolve({ // Engine 1
        json: () => Promise.resolve({ ParsedResults: [{ ParsedText: 'Engine1Success' }] })
      })
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space engine 2 fetch failed:', expect.any(Error))
    expect(result).toBe('enginelsuccess')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should return empty string when both engines fail', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error('Network Error')))

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('OCR.space engine 2 fetch failed:', expect.any(Error))
    expect(console.error).toHaveBeenCalledWith('OCR.space engine 1 fetch failed:', expect.any(Error))
    expect(result).toBe('')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should return empty string and log error if an unexpected error occurs in the outer try-catch', async () => {
    // Mock Buffer.from to throw an error
    const originalBufferFrom = Buffer.from
    jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
      throw new Error('Fatal error')
    })

    const result = await solveCaptchaWithOCRSpace(sampleBase64)

    expect(console.error).toHaveBeenCalledWith('Captcha OCR failed:', expect.any(Error))
    expect(result).toBe('')

    // Buffer.from is restored automatically by jest.restoreAllMocks
  })
})
