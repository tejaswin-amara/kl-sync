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
    queueMicrotask(() => {
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
    });

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
      } catch {}
    }
    if (!semId && sStr) {
      try {
        const semesters = JSON.parse(sStr);
        if (semesters.length > 0) semId = semesters[0].value;
      } catch {}
    }

    if (yearId && semId) {
      queueMicrotask(() => {
        setActiveYearId(yearId);
        setActiveSemId(semId);
      });

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
              const strictMatches = resData.attendanceData.filter((row: Record<string, unknown>) => {
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

            filteredAttendance.forEach((row: Record<string, unknown>) => {
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
                totalConducted += parseFloat(String(row[condKey])) || 0;
                totalAttended += parseFloat(String(row[attKey])) || 0;
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
                  (s: number, r: Record<string, unknown>) => s + (parseFloat(String(r[pctKey])) || 0),
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = days[new Date().getDay()];
  const defaultDay = todayDayName;

  const [allSessions, setAllSessions] = useState<NormalizedClassSession[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const loadSchedule = useCallback(async () => {
    if (!activeYearId || !activeSemId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const cacheKey = `kl_timetable_${activeYearId}_${activeSemId}`;
    let loadedFromCache = false;

    // Fetch course titles & faculty mapping from profile/marks
    const courseLookup: Record<string, { title?: string; faculty?: string }> = {};
    try {
      const profRes = await fetch('/api/erp-proxy/profile').catch(() => null);
      if (profRes && profRes.ok) {
        const profData = await profRes.json();
        const courses = profData.data?.courses || [];
        if (Array.isArray(courses)) {
          courses.forEach((c: Record<string, unknown>) => {
            const rawCode = String(c.Coursecode || c.courseCode || c.code || '').toUpperCase().trim();
            const desc = String(c.Coursedesc || c.courseDesc || c.title || c.name || '').trim();
            const fac = String(c.FacultyName || c.facultyName || c.faculty || '').trim();
            if (rawCode) {
              const strippedCode = rawCode.replace(/[-_][LTPSS]$/i, '').trim();
              const info = { title: desc || undefined, faculty: fac || undefined };
              courseLookup[rawCode] = info;
              if (strippedCode) courseLookup[strippedCode] = info;
            }
          });
        }
      }
    } catch {
      // ignore non-fatal lookup error
    }

    const applyEnrichment = (sessionsList: NormalizedClassSession[]) => {
      sessionsList.forEach((s) => {
        const rawCode = s.courseCode.toUpperCase().trim();
        const strippedCode = rawCode.replace(/[-_][LTPSS]$/i, '').trim();
        const info = courseLookup[rawCode] || courseLookup[strippedCode];
        if (info) {
          if (info.title && (s.courseTitle === s.courseCode || !s.courseTitle || s.courseTitle === rawCode)) {
            s.courseTitle = info.title;
          }
          if (info.faculty && !s.faculty) {
            s.faculty = info.faculty;
          }
        }
      });
      return sessionsList;
    };

    // 1. Try loading from sessionStorage first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const rawData = JSON.parse(cached);
        if (Array.isArray(rawData) && rawData.length > 0) {
          const parsed = parseTimetable(rawData);
          const enriched = applyEnrichment(parsed.sessions);
          setAllSessions(enriched);
          loadedFromCache = true;
          setLoading(false);
        }
      }
    } catch {
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
        const enriched = applyEnrichment(parsed.sessions);
        setAllSessions(enriched);
        setError(null);
      } else {
        if (!loadedFromCache) {
          setError(resData.error || 'Failed to sync timetable with ERP');
        }
      }
    } catch (err: unknown) {
      if (!loadedFromCache) {
        const msg = err instanceof Error ? err.message : 'Error connecting to timetable service';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [activeYearId, activeSemId]);

  useEffect(() => {
    queueMicrotask(() => {
      loadSchedule();
    });
  }, [loadSchedule]);

  const activeDaySessions = allSessions.filter((s) => isSameDay(s.day, selectedDay));

  return (
    <GlassCard className="flex flex-col h-full !p-0" glowIntensity="low">
      <div className="p-4 sm:p-5 border-b border-white/5 flex flex-col gap-3 bg-zinc-950/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Daily Schedule
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                Today is {todayDayName} • Viewing {selectedDay}
              </p>
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

        {/* Day Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {availableDays.map((d) => {
            const isSelected = isSameDay(d, selectedDay);
            const isToday = isSameDay(d, todayDayName);
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                }`}
              >
                {d.slice(0, 3)}
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto max-h-[420px] custom-scrollbar">
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
        ) : activeDaySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-44 gap-3 opacity-80">
            <CalendarIcon className="w-10 h-10 text-zinc-500" />
            <p className="text-sm font-medium text-zinc-300">
              No classes scheduled for {selectedDay}.
            </p>
            {['Saturday', 'Sunday'].includes(selectedDay) && (
              <button
                onClick={() => setSelectedDay('Monday')}
                className="text-xs text-indigo-400 hover:underline font-medium"
              >
                View Monday&apos;s Schedule →
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeDaySessions.map((s, idx) => (
              <div
                key={s.id || idx}
                className="flex flex-col gap-2 bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                      P{String(s.timeSlot || '').replace(/^Period\s*/i, '').trim()}
                    </span>
                    {s.component && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        s.component === 'Lecture' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        s.component === 'Practical' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        s.component === 'Skill' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {s.component}
                      </span>
                    )}
                    {s.section && (
                      <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">
                        {s.section}
                      </span>
                    )}
                  </div>

                  {s.room && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <MapPin className="w-3 h-3" />
                      {s.room}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                  {s.courseTitle || s.courseCode || 'Class Session'}
                </h4>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
                  <span className="text-[11px] font-mono text-zinc-400">
                    {s.courseCode}
                  </span>
                  {s.faculty && (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400 truncate max-w-[180px]">
                      <User className="w-3 h-3 text-purple-400 shrink-0" />
                      {s.faculty}
                    </span>
                  )}
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
  const [courses, setCourses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeYearId || !activeSemId) return;
    queueMicrotask(() => {
      setLoading(true);
    });
    let mounted = true;

    async function loadCourses() {
      try {
        const csrf = sessionStorage.getItem('kl_erp_csrf_token');

        // 1. Try profile courses
        const profRes = await fetch('/api/erp-proxy/profile').catch(() => null);
        if (profRes && profRes.ok) {
          const profData = await profRes.json();
          const profCourses = profData.data?.courses;
          if (Array.isArray(profCourses) && profCourses.length > 0) {
            const mapped = profCourses.slice(0, 6).map((c: Record<string, unknown>) => ({
              'Course Code': String(c.Coursecode || c.courseCode || c.code || 'N/A').toUpperCase().trim(),
              'Course Name': String(c.Coursedesc || c.courseDesc || c.title || c.name || 'Course').trim(),
              'Evaluation Components': String(c.FacultyName || c.facultyName || c.faculty || 'Active Course').trim(),
            }));
            if (mounted) {
              setCourses(mapped);
              setLoading(false);
              return;
            }
          }
        }

        // 2. Fallback to marks courses
        const marksRes = await fetch('/api/erp-proxy/marks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            academicYear: activeYearId,
            semesterId: activeSemId,
            csrfToken: csrf,
          }),
        }).catch(() => null);

        if (marksRes && marksRes.ok) {
          const marksData = await marksRes.json();
          if (marksData.success && Array.isArray(marksData.data) && marksData.data.length > 0) {
            if (mounted) setCourses(marksData.data.slice(0, 6));
          }
        }
      } catch (e) {
        console.error('Failed to load current courses:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCourses();
    return () => { mounted = false; };
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
                      {String(name)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                        {String(code)}
                      </span>
                      <span className="text-[11px] text-zinc-500 truncate">
                        {String(components)}
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
