import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('POST /api/login', () => {
  it('returns 400 if session parsing fails due to invalid JSON', async () => {
    // Generate a valid base64 but invalid JSON to trigger decodeSession error
    const invalidSessionId = 'b64.' + Buffer.from('invalid json').toString('base64')

    const req = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123',
        captcha: '1234',
        sessionId: invalidSessionId
      })
    })

    const response = await POST(req)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('Invalid session. Please refresh captcha.')
  })
})
