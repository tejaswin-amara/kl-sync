import { NextRequest, NextResponse } from 'next/server'
import { loginAndFetchSemesters, ScraperSession } from '@/lib/scraper'
import { decodeSession, encodeSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, captcha, deviceId } = body

    // The ERP device id is the load-bearing value that avoids its post-login
    // UserAccessToken crash. Prefer the httpOnly cookie we set on a previous
    // login (survives refreshes, not readable by JS), falling back to whatever
    // the client sent in the body.
    const cookieDeviceId = request.cookies.get('kl_device')?.value
    const effectiveDeviceId = deviceId || cookieDeviceId || ''

    // Get session ID from header (preferred) or body (fallback)
    const sessionId = request.headers.get('x-session-id') || body.sessionId

    if (!username || !password || !captcha) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      // Fallback to mock login if no session ID provided (and user knows it's mock)
      // But for now, we enforce session ID because we need cookies
      return NextResponse.json(
        { success: false, message: 'Session expired. Please refresh captcha.' },
        { status: 400 }
      )
    }

    // Decode session
    let session: ScraperSession
    try {
      session = decodeSession(sessionId)
    } catch (e) {
      console.error('Session parsing failed:', e);
      return NextResponse.json(
        { success: false, message: 'Invalid session. Please refresh captcha.' },
        { status: 400 }
      )
    }

    // Attempt Login (passing any previously-registered device id)
    const result = await loginAndFetchSemesters(username, password, captcha, session, effectiveDeviceId)

    // Encode (and encrypt, when SESSION_SECRET is set) the updated session with new cookies
    const updatedSessionId = encodeSession(result.session)

    // Persist any device id the ERP issued as an httpOnly cookie so the very
    // next login carries it automatically (no JS/localStorage races).
    const persistDeviceCookie = (res: NextResponse) => {
      if (result.deviceId) {
        res.cookies.set('kl_device', result.deviceId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 180, // 180 days
        })
      }
      return res
    }

    // First-time device registration: ask the client to retry with a fresh
    // captcha. Return 200 so the client can handle it as a normal flow step,
    // and hand back the harvested deviceId for it to store + resend.
    if (result.needsCaptchaRetry) {
      return persistDeviceCookie(NextResponse.json({
        success: false,
        needsCaptchaRetry: true,
        deviceId: result.deviceId,
        sessionId: updatedSessionId,
        message: result.message,
      }))
    }

    return persistDeviceCookie(NextResponse.json({
      success: true,
      message: 'Login successful',
      sessionId: updatedSessionId, // Send back updated session with new cookies
      deviceId: result.deviceId, // Persist on the client for future logins
      csrfToken: result.csrfToken,
      academicYears: result.academicYears,
      semesters: result.semesters,
      studentName: 'Student' // Placeholder, could be scraped
    }))

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Login failed' 
      },
      { status: 401 }
    )
  }
}
