import { NextResponse } from 'next/server'
import { getCaptcha } from '@/lib/scraper'
import { encodeSession } from '@/lib/session'

export async function GET() {
  try {
    const { captchaImage, session } = await getCaptcha()

    // Encode (and encrypt, when SESSION_SECRET is set) the session to send as session_id
    const sessionId = encodeSession(session)

    const res = NextResponse.json(
      { captchaImage },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )

    // Set the session ID header
    res.headers.set('x-session-id', sessionId)

    return res
  } catch (error) {
    console.error('Error in captcha route:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
