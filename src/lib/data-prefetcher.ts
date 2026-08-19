import { setCachedValue } from '@/hooks/useNativeQuery';
import { parseTimetable } from '@/lib/timetable-parser';
import { registerCourseTitles } from '@/lib/course-utils';

export interface PrefetchOptions {
  academicYear?: string;
  semesterId?: string;
}

let isPrefetching = false;

/**
 * Prefetches all student ERP data concurrently in the background and populates
 * the SWR query cache so dashboard navigation occurs with zero loading screens.
 */
export async function prefetchAllUserData(options: PrefetchOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || isPrefetching) return;
  isPrefetching = true;

  const academicYear =
    options.academicYear ||
    localStorage.getItem('kl_erp_year') ||
    '';

  const semesterId =
    options.semesterId ||
    localStorage.getItem('kl_erp_sem') ||
    '';

  const postHeaders = { 'Content-Type': 'application/json' };

  const fetchTasks: Promise<void>[] = [];

  // 1. Profile Prefetch
  fetchTasks.push(
    fetch('/api/erp-proxy/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && json?.data) {
          setCachedValue('/api/erp-proxy/profile', json.data);
          if (json.data.studentId) {
            try { localStorage.setItem('studentId', json.data.studentId); } catch {}
          }
        }
      })
      .catch(() => {})
  );

  // 2. Fee Prefetch
  fetchTasks.push(
    fetch('/api/erp-proxy/fee')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && json?.data) {
          setCachedValue('/api/erp-proxy/fee', json.data);
        }
      })
      .catch(() => {})
  );

  // 3. Circulars Prefetch
  fetchTasks.push(
    fetch('/api/erp-proxy/circulars')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && json?.data) {
          setCachedValue('/api/erp-proxy/circulars', json.data);
        }
      })
      .catch(() => {})
  );

  // 4. Hostels Prefetch
  fetchTasks.push(
    fetch('/api/erp-proxy/hostels')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && json?.data) {
          setCachedValue('/api/erp-proxy/hostels', json.data);
        }
      })
      .catch(() => {})
  );

  // 5. Library Prefetch
  fetchTasks.push(
    fetch('/api/erp-proxy/library')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && json?.data) {
          setCachedValue('/api/erp-proxy/library', json.data);
        }
      })
      .catch(() => {})
  );

  // 6. Exam Seating Prefetch
  fetchTasks.push(
    fetch('/api/erp-proxy/exam-seating')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && json?.data) {
          setCachedValue('/api/erp-proxy/exam-seating', json.data);
        }
      })
      .catch(() => {})
  );

  // Academic Modules (Attendance, Timetable, Marks)
  if (academicYear && semesterId) {
    const payload = JSON.stringify({ academicYear, semesterId });

    // 7. Attendance
    const attKey = ['/api/erp-proxy/attendance', academicYear, semesterId] as const;
    fetchTasks.push(
      fetch('/api/erp-proxy/attendance', { method: 'POST', headers: postHeaders, body: payload })
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.success && (json?.attendanceData || json?.data)) {
            const data = json.attendanceData || json.data;
            registerCourseTitles(data);
            setCachedValue(attKey, data);
          }
        })
        .catch(() => {})
    );

    // 8. Timetable
    const ttKey = ['/api/erp-proxy/timetable', academicYear, semesterId] as const;
    fetchTasks.push(
      fetch('/api/erp-proxy/timetable', { method: 'POST', headers: postHeaders, body: payload })
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.success && json?.data) {
            const parsed = parseTimetable(json.data);
            setCachedValue(ttKey, parsed);
          }
        })
        .catch(() => {})
    );

    // 9. Marks
    const marksKey = ['/api/erp-proxy/marks', academicYear, semesterId] as const;
    fetchTasks.push(
      fetch('/api/erp-proxy/marks', { method: 'POST', headers: postHeaders, body: payload })
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          if (json?.success && json?.data) {
            registerCourseTitles(json.data);
            setCachedValue(marksKey, json.data);
          }
        })
        .catch(() => {})
    );
  }

  try {
    await Promise.allSettled(fetchTasks);
  } finally {
    isPrefetching = false;
  }
}
