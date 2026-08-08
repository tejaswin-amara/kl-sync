import { NextRequest, NextResponse } from 'next/server';
import { decodeSession } from '@/lib/session';
import {
  fetchAttendanceData,
  fetchTimetableData,
  fetchMarksData,
  fetchEndExamResults,
  fetchProfileData,
  fetchCGPAData,
  fetchFeeData,
  fetchGenericModuleData,
  ERP_ENDPOINTS,
  ScraperSession,
} from '@/lib/scraper';
import {
  DEMO_SESSION,
  DEMO_ATTENDANCE,
  DEMO_TIMETABLE_RAW,
  DEMO_MARKS,
  DEMO_FEE_ITEMS,
  DEMO_PROFILE,
  DEMO_CGPA,
} from '@/lib/fixtures';

export const dynamic = 'force-dynamic';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const resolvedParams = await params;
    const moduleName = resolvedParams.module;

    // Extract parameter payload from POST body or query parameters
    let body: Record<string, string> = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {}
    }

    const searchParams = request.nextUrl.searchParams;

    let session: ScraperSession;
    const sessionCookie = request.cookies.get('kl_erp_session');
    const sessionValue =
      sessionCookie?.value ||
      request.headers.get('x-session-id') ||
      body.sessionId ||
      searchParams.get('sessionId') ||
      searchParams.get('session_id');

    if (sessionValue) {
      try {
        session = await decodeSession(sessionValue);
      } catch {
        session = DEMO_SESSION;
      }
    } else {
      session = DEMO_SESSION;
    }
    const academicYear =
      body.academicYear ||
      searchParams.get('academicYear') ||
      searchParams.get('academicyear') ||
      searchParams.get('academic_year') ||
      undefined;
    const semesterId =
      body.semesterId ||
      searchParams.get('semesterId') ||
      searchParams.get('semester') ||
      searchParams.get('semester_id') ||
      undefined;
    const csrfToken =
      body.csrfToken ||
      searchParams.get('csrfToken') ||
      searchParams.get('_csrf') ||
      undefined;

    const rawCsrf = csrfToken || (sessionValue ? session.csrfToken : undefined);

    // Validate CSRF token resolution for POST endpoints requiring form submission
    if (
      !rawCsrf &&
      ['attendance', 'timetable', 'marks', 'end-exam'].includes(moduleName)
    ) {
      return NextResponse.json(
        { success: false, error: 'CSRF token missing' },
        { status: 400 }
      );
    }

    const resolvedCsrf = rawCsrf || session.csrfToken;

    // Validate required parameters for academic term modules
    if (
      ['attendance', 'timetable', 'marks', 'end-exam'].includes(moduleName) &&
      (!academicYear || !semesterId)
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing academicYear or semesterId' },
        { status: 400 }
      );
    }

    // Validate module existence
    const knownModules = [
      'attendance',
      'timetable',
      'marks',
      'end-exam',
      'profile',
      'cgpa',
      'fee',
    ];
    if (!knownModules.includes(moduleName) && !ERP_ENDPOINTS[moduleName]) {
      return NextResponse.json(
        { success: false, error: `Unknown module: ${moduleName}` },
        { status: 404 }
      );
    }

    const isDemoSession =
      resolvedCsrf?.includes('demo_csrf') ||
      session.csrfToken?.includes('demo_csrf') ||
      session.cookies?.some((c) => c.value?.includes('demo')) ||
      !session.cookies ||
      session.cookies.length === 0;

    if (isDemoSession) {
      if (moduleName === 'attendance') {
        return NextResponse.json({
          success: true,
          attendanceData: DEMO_ATTENDANCE.map((item) => ({
            ...item,
            'Academic Year': academicYear || item['Academic Year'],
            Semester: semesterId || item.Semester,
          })),
        });
      }
      if (moduleName === 'timetable') {
        return NextResponse.json({
          success: true,
          data: DEMO_TIMETABLE_RAW,
        });
      }
      if (moduleName === 'marks') {
        return NextResponse.json({
          success: true,
          data: DEMO_MARKS,
        });
      }
      if (moduleName === 'profile') {
        return NextResponse.json({
          success: true,
          data: {
            ...DEMO_PROFILE,
            success: true,
            extendedProfile: JSON.stringify(DEMO_PROFILE.extendedProfile),
          },
        });
      }
      if (moduleName === 'cgpa') {
        return NextResponse.json({
          success: true,
          data: DEMO_CGPA,
        });
      }
      if (moduleName === 'fee') {
        return NextResponse.json({
          success: true,
          data: DEMO_FEE_ITEMS,
        });
      }
    }

    let result;

    switch (moduleName) {
      case 'attendance':
        if (!academicYear || !semesterId)
          return NextResponse.json(
            { success: false, error: 'Missing academicYear or semesterId' },
            { status: 400 }
          );
        result = await fetchAttendanceData(
          session,
          resolvedCsrf,
          academicYear,
          semesterId
        );
        break;
      case 'timetable':
        if (!academicYear || !semesterId)
          return NextResponse.json(
            { success: false, error: 'Missing academicYear or semesterId' },
            { status: 400 }
          );
        result = await fetchTimetableData(
          session,
          resolvedCsrf,
          academicYear,
          semesterId
        );
        break;
      case 'marks':
        if (!academicYear || !semesterId)
          return NextResponse.json(
            { success: false, error: 'Missing academicYear or semesterId' },
            { status: 400 }
          );
        result = await fetchMarksData(
          session,
          resolvedCsrf,
          academicYear,
          semesterId
        );
        break;
      case 'end-exam':
        if (!academicYear || !semesterId)
          return NextResponse.json(
            { success: false, error: 'Missing academicYear or semesterId' },
            { status: 400 }
          );
        result = await fetchEndExamResults(
          session,
          resolvedCsrf,
          academicYear,
          semesterId
        );
        break;
      case 'profile':
        result = await fetchProfileData(session);
        break;
      case 'cgpa':
        result = await fetchCGPAData(
          session,
          resolvedCsrf,
          academicYear,
          semesterId
        );
        break;
      case 'fee':
        result = await fetchFeeData(session);
        break;
      default:
        // Handle generic GET requests using the ERP_ENDPOINTS map
        if (ERP_ENDPOINTS[moduleName]) {
          result = await fetchGenericModuleData(
            session,
            ERP_ENDPOINTS[moduleName]
          );
        } else {
          return NextResponse.json(
            { success: false, error: `Unknown module: ${moduleName}` },
            { status: 404 }
          );
        }
        break;
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    let modName = 'unknown';
    try {
      const resolved = await params;
      modName = resolved?.module || 'unknown';
    } catch {}
    console.error(`[erp-proxy/${modName}] Error:`, error);
    const errMessage = error instanceof Error ? error.message : '';

    // 1. Session Expiration Check -> 401 Unauthorized
    const isSessionExpired =
      errMessage.includes('Session expired') ||
      errMessage.includes('invalid ERP route');
    if (isSessionExpired) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please re-login.' },
        { status: 401 }
      );
    }

    // 2. Timeout Check -> 504 Gateway Timeout
    const isTimeout =
      errMessage.includes('ETIMEDOUT') ||
      errMessage.includes('timeout') ||
      errMessage.includes('Timeout') ||
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        error.name === 'TimeoutError');

    if (isTimeout) {
      return NextResponse.json(
        {
          success: false,
          error: 'ERP Gateway Timeout',
          details: 'The ERP server took too long to respond. Please try again.',
        },
        { status: 504 }
      );
    }

    // 3. Network / Upstream Proxy Failure -> 502 Bad Gateway
    return NextResponse.json(
      {
        success: false,
        error: 'ERP Bad Gateway',
        details: errMessage || 'Failed to establish connection with ERP backend.',
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ module: string }> }
) {
  return handleProxy(request, props);
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ module: string }> }
) {
  return handleProxy(request, props);
}
