import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encodeSession, decodeSession } from './session'
import type { ScraperSession } from './scraper'

describe('session module', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const mockSession: ScraperSession = {
    cookies: [{ name: 'test', value: '123' }],
    csrfToken: 'abc-def',
    userAgent: 'test-agent'
  }

  describe('without SESSION_SECRET', () => {
    beforeEach(() => {
      delete process.env.SESSION_SECRET
    })

    it('encodes using base64 with b64. prefix', () => {
      const encoded = encodeSession(mockSession)
      expect(encoded.startsWith('b64.')).toBe(true)
      const b64Data = encoded.slice(4)
      const decoded = JSON.parse(Buffer.from(b64Data, 'base64').toString('utf-8'))
      expect(decoded).toEqual(mockSession)
    })

    it('decodes base64 with b64. prefix', () => {
      const encoded = encodeSession(mockSession)
      const decoded = decodeSession(encoded)
      expect(decoded).toEqual(mockSession)
    })

    it('decodes legacy plain base64 (without prefix)', () => {
      const b64Data = Buffer.from(JSON.stringify(mockSession)).toString('base64')
      const decoded = decodeSession(b64Data)
      expect(decoded).toEqual(mockSession)
    })

    it('throws when trying to decode encrypted token without secret', () => {
      process.env.SESSION_SECRET = 'temp-secret'
      const encrypted = encodeSession(mockSession)
      delete process.env.SESSION_SECRET

      expect(() => decodeSession(encrypted)).toThrow(
        'Encrypted session received but SESSION_SECRET is not configured'
      )
    })
  })

  describe('with SESSION_SECRET', () => {
    beforeEach(() => {
      process.env.SESSION_SECRET = 'my-super-secret-key-that-is-long-enough'
    })

    it('encodes using AES-256-GCM with enc. prefix', () => {
      const encoded = encodeSession(mockSession)
      expect(encoded.startsWith('enc.')).toBe(true)
    })

    it('decodes encrypted session correctly', () => {
      const encoded = encodeSession(mockSession)
      const decoded = decodeSession(encoded)
      expect(decoded).toEqual(mockSession)
    })

    it('produces different ciphertexts for the same data (IV is random)', () => {
      const encoded1 = encodeSession(mockSession)
      const encoded2 = encodeSession(mockSession)
      expect(encoded1).not.toEqual(encoded2)
    })

    it('throws when tampering with the ciphertext', () => {
      const encoded = encodeSession(mockSession)

      // Decode the base64, flip a bit in the ciphertext, and re-encode
      const raw = Buffer.from(encoded.slice(4), 'base64')
      raw[raw.length - 1] ^= 1 // flip a bit in the ciphertext
      const tampered = 'enc.' + raw.toString('base64')

      expect(() => decodeSession(tampered)).toThrow()
    })

    it('decodes fallback legacy tokens even if secret is configured', () => {
      // It should still decode b64. prefixed or plain base64
      const b64Prefixed = 'b64.' + Buffer.from(JSON.stringify(mockSession)).toString('base64')
      expect(decodeSession(b64Prefixed)).toEqual(mockSession)

      const plainB64 = Buffer.from(JSON.stringify(mockSession)).toString('base64')
      expect(decodeSession(plainB64)).toEqual(mockSession)
    })
  })
})
