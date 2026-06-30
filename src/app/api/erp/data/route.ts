import { NextRequest, NextResponse } from 'next/server'
import { decodeSession } from '@/lib/session'
import { fetchTimetable, fetchProfile, fetchAttendance } from '@/lib/scraper'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    if (!sessionId) return NextResponse.json({ success: false, message: 'Missing session' }, { status: 401 })

    const body = await request.json()
    const { action, csrfToken, academicYear, semesterId } = body || {}

    const session = decodeSession(sessionId)

    switch (action) {
      case 'profile': {
        if (!csrfToken) return NextResponse.json({ success: false, message: 'Missing CSRF token' }, { status: 400 })
        const profileData = await fetchProfile(session, csrfToken)
        return NextResponse.json({ success: true, profileData })
      }
      case 'timetable': {
        if (!csrfToken || !academicYear || !semesterId) {
          return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 })
        }
        const timetableData = await fetchTimetable(session, csrfToken, academicYear, semesterId)
        return NextResponse.json({ success: true, timetableData })
      }
      case 'attendance': {
        const data = await fetchAttendance(session)
        return NextResponse.json({ success: true, attendanceData: data.attendanceData, studentId: data.studentId })
      }
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('ERP Data fetch error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Operation failed' }, { status: 500 })
  }
}
