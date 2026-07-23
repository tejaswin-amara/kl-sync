import { NextRequest, NextResponse } from 'next/server';
import { decodeSession } from '@/lib/session';
import {
  fetchAttendanceData,
  fetchTimetableData,
  fetchMarksData,
  fetchEndExamResults,
  fetchProfileData,
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
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const module = resolvedParams.module;

    // Some modules require POST bodies (academicYear, semesterId)
    let body: any = {};
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch (e) {}
    }

    let result;
    const { academicYear, semesterId, csrfToken } = body;
    const resolvedCsrf = csrfToken || session.csrfToken;

    switch (module) {
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
      default:
        // Handle generic GET requests using the ERP_ENDPOINTS map
        if (ERP_ENDPOINTS[module]) {
          result = await fetchGenericModuleData(session, ERP_ENDPOINTS[module]);
        } else {
          return NextResponse.json(
            { success: false, error: `Unknown module: ${module}` },
            { status: 404 }
          );
        }
        break;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    let modName = 'unknown';
    try {
      const resolved = await params;
      modName = resolved?.module || 'unknown';
    } catch {}
    console.error(`[erp-proxy/${modName}] Error:`, error);
    const status = error.message?.includes('Session expired') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch data' },
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
