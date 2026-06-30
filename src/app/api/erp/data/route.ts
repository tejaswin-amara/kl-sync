import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { decodeSession } from '@/lib/session'
import { fetchTimetableData, fetchProfileData, fetchAttendanceData } from '@/lib/scraper'

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
        const getCachedProfile = unstable_cache(
          async () => fetchProfileData(session, csrfToken),
          ['profile', sessionId],
          { revalidate: 3600 } // Cache for 1 hour
        )
        const profileData = await getCachedProfile()
        return NextResponse.json({ success: true, profileData })
      }
      case 'timetable': {
        if (!csrfToken || !academicYear || !semesterId) {
          return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 })
        }
        const getCachedTimetable = unstable_cache(
          async () => fetchTimetableData(session, csrfToken, academicYear, semesterId),
          ['timetable', sessionId, academicYear, semesterId],
          { revalidate: 3600 }
        )
        const timetableData = await getCachedTimetable()
        return NextResponse.json({ success: true, timetableData })
      }
      case 'attendance': {
        if (!csrfToken || !academicYear || !semesterId) {
          return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 })
        }
        const getCachedAttendance = unstable_cache(
          async () => fetchAttendanceData(session, csrfToken, academicYear, semesterId),
          ['attendance', sessionId, academicYear, semesterId],
          { revalidate: 3600 }
        )
        const data = await getCachedAttendance()
        return NextResponse.json({ success: true, attendanceData: data.attendanceData })
      }
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('ERP Data fetch error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Operation failed' }, { status: 500 })
  }
}
