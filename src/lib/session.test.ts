import { describe, it, expect } from 'vitest'
import { encodeSession, decodeSession } from './session'
import type { ScraperSession } from './scraper'

describe('session module', () => {
  const mockSession: ScraperSession = {
    cookies: [{ name: 'test', value: '123' }],
    csrfToken: 'abc-def',
    userAgent: 'test-agent'
  }

  it('encodes using base64 with b64. prefix', () => {
    const encoded = encodeSession(mockSession)
    expect(encoded.startsWith('b64.')).toBe(true)
    const b64Data = encoded.slice(4)
    const decoded = JSON.parse(decodeURIComponent(escape(atob(b64Data))))
    expect(decoded).toEqual(mockSession)
  })

  it('decodes base64 with b64. prefix', () => {
    const encoded = encodeSession(mockSession)
    const decoded = decodeSession(encoded)
    expect(decoded).toEqual(mockSession)
  })

  it('decodes legacy plain base64 (without prefix)', () => {
    const b64Data = btoa(unescape(encodeURIComponent(JSON.stringify(mockSession))))
    const decoded = decodeSession(b64Data)
    expect(decoded).toEqual(mockSession)
  })
})
