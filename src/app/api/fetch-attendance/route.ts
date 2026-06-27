import { NextRequest, NextResponse } from 'next/server'
import { fetchAttendanceData, ScraperSession } from '@/lib/scraper'
import { decodeSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csrfToken, academicYear, semesterId } = body
    
    // Get session ID from header (preferred) or body
    const sessionId = request.headers.get('x-session-id') || body.sessionId

    if (!sessionId || !csrfToken || !academicYear || !semesterId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Decode session
    let session: ScraperSession
    try {
      session = decodeSession(sessionId)
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 400 }
      )
    }

    // Fetch Attendance
    const result = await fetchAttendanceData(session, csrfToken, academicYear, semesterId)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Fetch Attendance error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error && error.message ? error.message : 'Failed to fetch attendance'
      },
      { status: 500 }
    )
  }
}
