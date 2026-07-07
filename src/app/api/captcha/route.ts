import { NextResponse } from 'next/server'
import { getCaptcha } from '@/lib/scraper'
import { encodeSession } from '@/lib/session'

export async function GET() {
  try {
    const { captchaImage, session } = await getCaptcha()

    // Encode (and encrypt, when SESSION_SECRET is set) the session to send as session_id
    const sessionId = encodeSession(session)

    return NextResponse.json({
      captchaImage
    }, {
      headers: {
        'x-session-id': sessionId,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error in captcha route:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
