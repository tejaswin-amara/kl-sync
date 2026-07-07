import { NextResponse } from 'next/server'
import { getCaptcha } from '@/lib/scraper'
import { encodeSession } from '@/lib/session'

export async function GET() {
  try {
    const { captchaImage, session } = await getCaptcha()

    // Encode (and encrypt, when SESSION_SECRET is set) the session to send as session_id
    const sessionId = encodeSession(session)

    // The captchaImage is already a data URL (base64)
    // But the frontend expects an image blob/buffer usually?
    // Let's check the frontend code.
    // app/login/page.tsx:
    // const response = await fetch('/api/captcha')
    // const blob = await response.blob()
    // const url = URL.createObjectURL(blob)
    
    // So the frontend expects a binary image response.
    // We need to convert the base64 data URL back to a buffer.
    
    const base64Data = captchaImage.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    const res = new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0',
      },
    })

    // Set the session ID header
    res.headers.set('x-session-id', sessionId)

    return res
  } catch (error) {
    console.error('Error in captcha route:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
