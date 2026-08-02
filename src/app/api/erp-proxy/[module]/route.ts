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

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const sessionCookie = request.cookies.get('kl_erp_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    let session: ScraperSession;
    try {
      session = decodeSession(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 400 }
      );
    }

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
    const resolvedCsrf = csrfToken || session.csrfToken;

    // Validate CSRF token resolution for POST endpoints requiring form submission
    if (
      !resolvedCsrf &&
      ['attendance', 'timetable', 'marks', 'end-exam'].includes(moduleName)
    ) {
      return NextResponse.json(
        { success: false, error: 'CSRF token missing' },
        { status: 400 }
      );
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
    const status = errMessage.includes('Session expired') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: errMessage || 'Failed to fetch data' },
      { status }
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
