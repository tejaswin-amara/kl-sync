import { NextRequest, NextResponse } from 'next/server'
import { getCaptcha } from '@/lib/scraper'
import { encodeSession } from '@/lib/session'
import { solveCaptchaWithOCRSpace } from '@/lib/ocr'


export async function GET() {
  try {
    const { captchaImage, session } = await getCaptcha()
    const sessionId = encodeSession(session)
    const res = NextResponse.json({ captchaImage }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
    res.headers.set('x-session-id', sessionId)
    return res
  } catch (error) {
    console.error('Error in captcha route:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body?.image) return NextResponse.json({ success: false, message: 'Missing image data' }, { status: 400 })
    
    const text = await solveCaptchaWithOCRSpace(body.image)
    return NextResponse.json({ success: true, text })
  } catch (error: unknown) {
    console.error('Solve captcha error:', error)
    return NextResponse.json({ success: false, message: 'Failed to solve captcha' }, { status: 500 })
  }
}
