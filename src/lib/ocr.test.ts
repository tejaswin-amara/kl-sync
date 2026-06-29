import test, { describe, it, mock, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert'
import { solveCaptchaWithOCRSpace } from './ocr.js'

describe('OCR Error Handling', () => {
  const originalFetch = global.fetch
  const originalConsoleError = console.error
  let consoleErrorCalls: any[][] = []

  beforeEach(() => {
    consoleErrorCalls = []
    console.error = (...args: any[]) => {
      consoleErrorCalls.push(args)
    }
  })

  afterEach(() => {
    global.fetch = originalFetch
    console.error = originalConsoleError
  })

  // Dummy 1x1 transparent PNG base64
  const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
  const dummyDataUri = `data:image/png;base64,${dummyBase64}`

  it('returns empty string on rate limit (result.error)', async () => {
    global.fetch = async () => {
      return {
        json: async () => ({ error: 'Quota exceeded' })
      } as Response
    }

    const result = await solveCaptchaWithOCRSpace(dummyDataUri)
    assert.strictEqual(result, '')

    const hasRateLimitError = consoleErrorCalls.some(call =>
      call[0].includes('OCR.space error:') && call[1] === 'Quota exceeded'
    )
    assert.strictEqual(hasRateLimitError, true)
  })

  it('returns empty string on processing error (result.IsErroredOnProcessing)', async () => {
    global.fetch = async () => {
      return {
        json: async () => ({ IsErroredOnProcessing: true, ErrorMessage: ['File not supported'] })
      } as Response
    }

    const result = await solveCaptchaWithOCRSpace(dummyDataUri)
    assert.strictEqual(result, '')

    const hasProcessingError = consoleErrorCalls.some(call =>
      call[0].includes('OCR.space processing error:') && call[1]?.[0] === 'File not supported'
    )
    assert.strictEqual(hasProcessingError, true)
  })

  it('returns empty string on network fetch failure', async () => {
    const fetchError = new Error('Network error')
    global.fetch = async () => {
      throw fetchError
    }

    const result = await solveCaptchaWithOCRSpace(dummyDataUri)
    assert.strictEqual(result, '')

    const hasFetchError = consoleErrorCalls.some(call =>
      call[0].includes('OCR.space engine 2 fetch failed:') && call[1] === fetchError
    )
    assert.strictEqual(hasFetchError, true)
  })

  it('falls back to engine 1 if engine 2 returns empty string', async () => {
    let callCount = 0
    let requestedEngines: string[] = []

    global.fetch = async (input, init) => {
      callCount++
      const formData = init?.body as FormData
      requestedEngines.push(formData.get('OCREngine') as string)

      if (callCount === 1) {
        // Engine 2 returns no text
        return {
          json: async () => ({ ParsedResults: [{ ParsedText: '' }] })
        } as Response
      } else {
        // Engine 1 returns text
        return {
          json: async () => ({ ParsedResults: [{ ParsedText: 'success' }] })
        } as Response
      }
    }

    const result = await solveCaptchaWithOCRSpace(dummyDataUri)
    assert.strictEqual(result, 'success')
    assert.strictEqual(callCount, 2)
    assert.deepStrictEqual(requestedEngines, ['2', '1'])
  })

  it('returns extracted text on success', async () => {
    let callCount = 0

    global.fetch = async () => {
      callCount++
      return {
        json: async () => ({ ParsedResults: [{ ParsedText: 'success' }] })
      } as Response
    }

    const result = await solveCaptchaWithOCRSpace(dummyDataUri)
    assert.strictEqual(result, 'success')
    assert.strictEqual(callCount, 1) // only called once because engine 2 succeeds
  })
})
