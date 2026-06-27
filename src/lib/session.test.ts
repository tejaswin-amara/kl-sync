import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { encodeSession, decodeSession } from './session'
import type { ScraperSession } from './scraper'
import crypto from 'crypto'

describe('session module', () => {
  const dummySession: ScraperSession = {
    cookies: [{ name: 'test', value: '123' }],
    csrfToken: 'test-csrf-token',
    userAgent: 'test-user-agent'
  }

  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  describe('decodeSession', () => {
    it('decodes legacy plain base64 without prefix', () => {
      const json = JSON.stringify(dummySession)
      const token = Buffer.from(json, 'utf-8').toString('base64')

      const decoded = decodeSession(token)
      expect(decoded).toEqual(dummySession)
    })

    it('decodes base64 with b64. prefix', () => {
      const json = JSON.stringify(dummySession)
      const token = 'b64.' + Buffer.from(json, 'utf-8').toString('base64')

      const decoded = decodeSession(token)
      expect(decoded).toEqual(dummySession)
    })

    it('decodes encrypted session with enc. prefix when SESSION_SECRET is set', () => {
      process.env.SESSION_SECRET = 'my-super-secret-key-that-is-long-enough'

      // we can use encodeSession to create a valid encrypted token
      const token = encodeSession(dummySession)
      expect(token.startsWith('enc.')).toBe(true)

      const decoded = decodeSession(token)
      expect(decoded).toEqual(dummySession)
    })

    it('throws error when decoding encrypted session but SESSION_SECRET is not set', () => {
      // First create a valid encrypted token
      process.env.SESSION_SECRET = 'my-super-secret-key-that-is-long-enough'
      const token = encodeSession(dummySession)

      // Then unset the secret
      delete process.env.SESSION_SECRET

      expect(() => decodeSession(token)).toThrow(
        'Encrypted session received but SESSION_SECRET is not configured'
      )
    })

    it('throws error when encrypted session is tampered with', () => {
      process.env.SESSION_SECRET = 'my-super-secret-key-that-is-long-enough'
      const token = encodeSession(dummySession)

      const raw = Buffer.from(token.slice(4), 'base64')
      // Tamper with ciphertext by flipping a bit
      raw[raw.length - 1] ^= 1

      const tamperedToken = 'enc.' + raw.toString('base64')

      expect(() => decodeSession(tamperedToken)).toThrow()
    })
  })
})
