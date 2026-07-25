'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  CalendarDays,
  TrendingUp,
  BookOpen,
  Calendar as CalendarIcon,
  Wallet,
  Activity,
  Award,
  ChevronRight,
  Clock,
  MapPin,
  User,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { GlassCard } from '@/components/ui/glass-card';
import { calculatePendingFee } from '@/lib/fee-utils';
import { processERPDataForCGPA } from '@/lib/cgpa';
import { parseTimetable, isSameDay, NormalizedClassSession } from '@/lib/timetable-parser';

export default function DashboardOverview() {
  const [studentName, setStudentName] = useState('Student');
  const [cgpa, setCgpa] = useState<number>(0);
  const [attendance, setAttendance] = useState<number>(0);
  const [pendingFee, setPendingFee] = useState<number>(0);
  const [completedCredits, setCompletedCredits] = useState<number>(0);
  const [activeYearId, setActiveYearId] = useState<string>('');
  const [activeSemId, setActiveSemId] = useState<string>('');

  useEffect(() => {
    const name = localStorage.getItem('kl_student_name');
    if (name) setStudentName(name);

    // Instant load from cache
    const cachedCgpa = localStorage.getItem('kl_dashboard_cgpa');
    const cachedCredits = localStorage.getItem('kl_dashboard_credits');
    const cachedAttendance = localStorage.getItem('kl_dashboard_attendance');
    const cachedFee = localStorage.getItem('kl_dashboard_fee');

    if (cachedCgpa) setCgpa(Number(cachedCgpa));
    if (cachedCredits) setCompletedCredits(Number(cachedCredits));
    if (cachedAttendance) setAttendance(Number(cachedAttendance));
    if (cachedFee) setPendingFee(Number(cachedFee));

    // Fetch CGPA & Credits in background
    fetch('/api/erp-proxy/cgpa')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data && resData.data.length > 0) {
          const result = processERPDataForCGPA(resData.data);
          setCompletedCredits(result.credits);
          if (result.credits > 0) {
            localStorage.setItem('kl_dashboard_credits', result.credits.toString());
          }
          if (result.cgpa > 0) {
            setCgpa(result.cgpa);
            localStorage.setItem('kl_dashboard_cgpa', result.cgpa.toString());
          }
        }
      })
      .catch(console.error);

    // Fetch Academic Session & Attendance independently
    let yearId = localStorage.getItem('kl_erp_year') || '';
    let semId = localStorage.getItem('kl_erp_sem') || '';
    const yStr = sessionStorage.getItem('kl_erp_academic_years');
    const sStr = sessionStorage.getItem('kl_erp_semesters');
    if (!yearId && yStr) {
      try {
        const years = JSON.parse(yStr);
        if (years.length > 0) yearId = years[0].value;
      } catch (e) {}
    }
    if (!semId && sStr) {
      try {
        const semesters = JSON.parse(sStr);
        if (semesters.length > 0) semId = semesters[0].value;
      } catch (e) {}
    }

    if (yearId && semId) {
      setActiveYearId(yearId);
      setActiveSemId(semId);

      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      fetch('/api/erp-proxy/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: yearId,
          semesterId: semId,
          csrfToken: csrf,
        }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (
            resData.success &&
            resData.attendanceData &&
            resData.attendanceData.length > 0
          ) {
            let totalAttended = 0;
            let totalConducted = 0;
            let filteredAttendance = resData.attendanceData;
            if (yearId && semId) {
              const strictMatches = resData.attendanceData.filter((row: any) => {
                const yrKey = Object.keys(row).find((k) =>
                  k.toLowerCase().includes('year')
                );
                const semKey = Object.keys(row).find((k) =>
                  k.toLowerCase().includes('sem')
                );

                let matchYear = true;
                let matchSem = true;

                if (yrKey && row[yrKey]) {
                  matchYear =
                    String(row[yrKey]).trim().includes(String(yearId).trim()) ||
                    String(yearId).trim().includes(String(row[yrKey]).trim());
                }

                if (semKey && row[semKey]) {
                  matchSem =
                    String(row[semKey]).trim().includes(String(semId).trim()) ||
                    String(semId).trim().includes(String(row[semKey]).trim());
                }

                return matchYear && matchSem;
              });

              if (strictMatches.length > 0) {
                filteredAttendance = strictMatches;
              }
            }

            filteredAttendance.forEach((row: any) => {
              const condKey = Object.keys(row).find((k) => {
                const kl = k.toLowerCase();
                return (
                  kl.includes('conducted') ||
                  kl.includes('held') ||
                  (kl.includes('total') && !kl.includes('%'))
                );
              });
              const attKey = Object.keys(row).find((k) => {
                const kl = k.toLowerCase();
                return (
                  kl.includes('attended') ||
                  kl.includes('present')
                );
              });
              if (condKey && attKey) {
                totalConducted += parseFloat(row[condKey]) || 0;
                totalAttended += parseFloat(row[attKey]) || 0;
              }
            });
            if (totalConducted > 0) {
              const calculatedAttendance = Math.round(
                (totalAttended / totalConducted) * 100
              );
              setAttendance(calculatedAttendance);
              localStorage.setItem(
                'kl_dashboard_attendance',
                calculatedAttendance.toString()
              );
            } else if (filteredAttendance.length > 0) {
              const pctKey = Object.keys(filteredAttendance[0]).find(
                (k) =>
                  k.toLowerCase().includes('%') ||
                  k.toLowerCase().includes('percent') ||
                  k.toLowerCase().includes('attendance')
              );
              if (pctKey) {
                const sum = filteredAttendance.reduce(
                  (s: number, r: any) => s + (parseFloat(r[pctKey]) || 0),
                  0
                );
                const calculatedAttendance = Math.round(
                  sum / filteredAttendance.length
                );
                setAttendance(calculatedAttendance);
                localStorage.setItem(
                  'kl_dashboard_attendance',
                  calculatedAttendance.toString()
                );
              }
            }
          }
        })
        .catch(console.error);
    }

    // Fetch Fee Data independently with flexible column key matching
    fetch('/api/erp-proxy/fee')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data && resData.data.length > 0) {
          const pending = calculatePendingFee(resData.data);
          setPendingFee(pending);
          localStorage.setItem('kl_dashboard_fee', pending.toString());
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Welcome Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard
          className="lg:col-span-2 p-8 flex flex-col justify-center relative overflow-hidden group"
          glowIntensity="medium"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
            <GraduationCap className="w-48 h-48 text-indigo-500" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Live Sync Active
              </span>
            </div>
            <h2 className="text-4xl font-light text-zinc-100 tracking-tight">
              Welcome back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold">
                {studentName}
              </span>
            </h2>
            <p className="text-zinc-400 mt-4 max-w-lg text-sm leading-relaxed">
              You are connected to the live ERP system. Your academic overview
              has been synchronized successfully.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <Award className="w-12 h-12 text-indigo-400 mb-4 opacity-80" />
          <div className="z-10">
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-2">
              Cumulative GPA
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-black tracking-tighter text-zinc-100">
                {cgpa > 0 ? (
                  <NumberTicker value={cgpa} decimalPlaces={2} />
                ) : (
                  '0.00'
                )}
              </span>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/attendance"
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl p-6 flex items-center gap-5 group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
              Attendance
            </p>
            <p className="text-3xl font-bold text-zinc-100 flex items-baseline gap-1">
              {attendance > 0 ? <NumberTicker value={attendance} /> : '0'}%
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/fee"
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl p-6 flex items-center gap-5 group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
              Pending Fees
            </p>
            <p className="text-3xl font-bold text-zinc-100">
              ₹{pendingFee > 0 ? <NumberTicker value={pendingFee} /> : '0'}
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/marks"
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl p-6 flex items-center gap-5 group hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-1">
              Completed Credits
            </p>
            <p className="text-3xl font-bold text-zinc-100">
              {completedCredits > 0 ? (
                <NumberTicker value={completedCredits} />
              ) : (
                '0'
              )}
            </p>
          </div>
        </Link>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TodayScheduleWidget
          activeYearId={activeYearId}
          activeSemId={activeSemId}
        />
        <CurrentCoursesWidget
          activeYearId={activeYearId}
          activeSemId={activeSemId}
        />
      </section>
    </div>
  );
}

function TodayScheduleWidget({
  activeYearId,
  activeSemId,
}: {
  activeYearId: string;
  activeSemId: string;
}) {
  const [sessions, setSessions] = useState<NormalizedClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = days[new Date().getDay()];

  const loadSchedule = useCallback(async () => {
    if (!activeYearId || !activeSemId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const cacheKey = `kl_timetable_${activeYearId}_${activeSemId}`;
    let loadedFromCache = false;

    // 1. Try loading from sessionStorage first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const rawData = JSON.parse(cached);
        if (Array.isArray(rawData) && rawData.length > 0) {
          const parsed = parseTimetable(rawData);
          const today = parsed.sessions.filter((s) => isSameDay(s.day, currentDayName));
          setSessions(today);
          loadedFromCache = true;
          setLoading(false);
        }
      }
    } catch (e) {
      // cache parse error ignored
    }

    // 2. Fetch fresh timetable data from ERP proxy
    try {
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      const res = await fetch('/api/erp-proxy/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: activeYearId,
          semesterId: activeSemId,
          csrfToken: csrf,
        }),
      });

      const resData = await res.json();
      if (resData.success && Array.isArray(resData.data)) {
        sessionStorage.setItem(cacheKey, JSON.stringify(resData.data));
        const parsed = parseTimetable(resData.data);
        const today = parsed.sessions.filter((s) => isSameDay(s.day, currentDayName));
        setSessions(today);
        setError(null);
      } else {
        if (!loadedFromCache) {
          setError(resData.error || 'Failed to sync timetable with ERP');
        }
      }
    } catch (err: any) {
      if (!loadedFromCache) {
        setError(err.message || 'Error connecting to timetable service');
      }
    } finally {
      setLoading(false);
    }
  }, [activeYearId, activeSemId, currentDayName]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  return (
    <GlassCard className="flex flex-col h-full !p-0" glowIntensity="low">
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/30">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Today's Schedule
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">{currentDayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={() => loadSchedule()}
              className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
            Live
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 w-full bg-zinc-800/30 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center h-40 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400 opacity-80" />
            <p className="text-xs text-red-400 font-medium max-w-xs">{error}</p>
            <button
              onClick={() => loadSchedule()}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 rounded-lg border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-40 gap-3 opacity-60">
            <CalendarIcon className="w-10 h-10 text-zinc-500" />
            <p className="text-sm font-medium text-zinc-300">
              No classes scheduled for today ({currentDayName}).
            </p>
            <p className="text-xs text-zinc-500">Enjoy your day!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s, idx) => (
              <div
                key={s.id || idx}
                className="flex gap-4 group cursor-default bg-zinc-950/40 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col justify-center shrink-0">
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md">
                    {s.timeSlot}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-zinc-100 leading-snug truncate">
                    {s.courseTitle || s.courseCode || 'Class Session'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                    {s.courseCode && s.courseCode !== s.courseTitle && (
                      <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">
                        {s.courseCode}
                      </span>
                    )}
                    {s.room && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <MapPin className="w-3 h-3" />
                        {s.room}
                      </span>
                    )}
                    {s.faculty && (
                      <span className="flex items-center gap-1 text-zinc-400 truncate">
                        <User className="w-3 h-3 text-purple-400" />
                        {s.faculty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/dashboard/timetable"
        className="flex items-center justify-center gap-2 w-full p-4 text-[11px] font-bold tracking-widest text-indigo-400 border-t border-white/5 hover:bg-white/5 transition-colors uppercase mt-auto"
      >
        View Full Timetable
        <ChevronRight className="w-4 h-4" />
      </Link>
    </GlassCard>
  );
}

function CurrentCoursesWidget({
  activeYearId,
  activeSemId,
}: {
  activeYearId: string;
  activeSemId: string;
}) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeYearId || !activeSemId) return;
    setLoading(true);
    try {
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      fetch('/api/erp-proxy/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: activeYearId,
          semesterId: activeSemId,
          csrfToken: csrf,
        }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data && resData.data.length > 0) {
            setCourses(resData.data.slice(0, 4));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [activeYearId, activeSemId]);

  return (
    <GlassCard className="flex flex-col h-full !p-0" glowIntensity="low">
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/30">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Current Courses
          </h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
          Live
        </span>
      </div>

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-40 gap-3 opacity-50">
            <BookOpen className="w-10 h-10 text-zinc-500" />
            <p className="text-sm text-zinc-400">No active courses found.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {courses.map((course, idx) => {
              const keys = Object.keys(course);
              const codeKey =
                keys.find((k) => k.toLowerCase().includes('code')) ||
                'Course Code';
              const nameKey =
                keys.find(
                  (k) =>
                    k.toLowerCase().includes('name') ||
                    k.toLowerCase().includes('title')
                ) || 'Course Name';
              const compKey =
                keys.find(
                  (k) =>
                    k.toLowerCase().includes('eval') ||
                    k.toLowerCase().includes('component')
                ) || 'Evaluation Components';
              const code = course[codeKey] || 'N/A';
              const name = course[nameKey] || 'N/A';
              const components = course[compKey] || 'No components';
              return (
                <div
                  key={idx}
                  className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <span className="text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                        {code}
                      </span>
                      <span className="text-[11px] text-zinc-500 truncate">
                        {components}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/dashboard/marks"
        className="flex items-center justify-center gap-2 w-full p-4 text-[11px] font-bold tracking-widest text-purple-400 border-t border-white/5 hover:bg-white/5 transition-colors uppercase mt-auto"
      >
        View All Courses
        <ChevronRight className="w-4 h-4" />
      </Link>
    </GlassCard>
  );
}
