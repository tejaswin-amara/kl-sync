"use client";

import { useEffect, useState } from 'react';
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
  Clock
} from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { GlassCard } from '@/components/ui/glass-card';

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

    // Fetch CGPA & Credits
    fetch('/api/fetch-cgpa')
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data && resData.data.length > 0) {
           const rows = resData.data;
           let totalCredits = 0;
           let totalPoints = 0;
           rows.forEach((row: any) => {
             const grade = row['Grade']?.trim().toUpperCase();
             const credits = parseFloat(row['Credits']) || 0;
             const gradePoint = parseFloat(row['Grade Point']) || 0;
             if (grade && grade !== 'F') {
               totalCredits += credits;
               totalPoints += gradePoint * credits;
             }
           });
           setCompletedCredits(totalCredits);
           if (totalCredits > 0) {
             setCgpa(Number((totalPoints / totalCredits).toFixed(2)));
           }

           let yearId = '';
           let semId = '';
           const yStr = localStorage.getItem('kl_academic_years');
           const sStr = localStorage.getItem('kl_semesters');
           if (yStr && sStr) {
             const years = JSON.parse(yStr);
             const semesters = JSON.parse(sStr);
             if (years.length > 0) yearId = years[0].value;
             if (semesters.length > 0) semId = semesters[0].value;
           }

           if (yearId && semId) {
             setActiveYearId(yearId);
             setActiveSemId(semId);
             
             const csrf = localStorage.getItem('kl_csrf');
             fetch('/api/fetch-attendance', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ academicYear: yearId, semesterId: semId, csrfToken: csrf })
             })
               .then(res => res.json())
               .then(resData => {
                 if (resData.success && resData.attendanceData && resData.attendanceData.length > 0) {
                   let totalAttended = 0;
                   let totalConducted = 0;
                   resData.attendanceData.forEach((row: any) => {
                     const condKey = Object.keys(row).find(k => k.toLowerCase().includes('conducted'));
                     const attKey = Object.keys(row).find(k => k.toLowerCase().includes('attended'));
                     if (condKey && attKey) {
                       totalConducted += parseFloat(row[condKey]) || 0;
                       totalAttended += parseFloat(row[attKey]) || 0;
                     }
                   });
                   if (totalConducted > 0) {
                     setAttendance(Math.round((totalAttended / totalConducted) * 100));
                   } else {
                     const pctKey = Object.keys(resData.attendanceData[0]).find(k => k.toLowerCase().includes('%') || k.toLowerCase().includes('percent') || k.toLowerCase().includes('attendance'));
                     if (pctKey) {
                       const sum = resData.attendanceData.reduce((s: number, r: any) => s + (parseFloat(r[pctKey]) || 0), 0);
                       setAttendance(Math.round(sum / resData.attendanceData.length));
                     }
                   }
                 }
               })
               .catch(console.error);
           }
        }
      })
      .catch(console.error);

    fetch('/api/fetch-fee')
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data && resData.data.length > 0) {
          const pending = resData.data
            .filter((row: any) => {
              const status = row['Pay Status']?.toLowerCase() || '';
              return status.includes('not paid') || status.includes('waiting') || status.includes('pending');
            })
            .reduce((sum: number, row: any) => sum + (parseFloat(row['Amount']) || 0), 0);
          setPendingFee(pending);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      
      {/* Welcome Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-zinc-900/40 p-8 flex flex-col justify-center relative overflow-hidden backdrop-blur-xl border border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <GraduationCap className="w-48 h-48 text-indigo-500" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Live Sync Active</span>
            </div>
            <h2 className="text-4xl font-light text-zinc-100 tracking-tight">
              Welcome back, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold">{studentName}</span>
            </h2>
            <p className="text-zinc-400 mt-4 max-w-lg text-sm leading-relaxed">
              You are connected to the live ERP system. Your academic overview has been synchronized successfully.
            </p>
          </div>
        </div>

        <GlassCard className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Award className="w-12 h-12 text-indigo-400 mb-4 opacity-80" />
          <div className="z-10">
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-2">Cumulative GPA</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl font-black tracking-tighter text-zinc-100">
                {cgpa > 0 ? <NumberTicker value={cgpa} /> : '0.00'}
              </span>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/attendance" className="card p-6 flex items-center gap-5 group bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-emerald-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Attendance</p>
            <p className="text-3xl font-bold text-zinc-100 flex items-baseline gap-1">
              {attendance > 0 ? <NumberTicker value={attendance} /> : '0'}%
            </p>
          </div>
        </Link>
        
        <Link href="/dashboard/fee" className="card p-6 flex items-center gap-5 group bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-red-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Pending Fees</p>
            <p className="text-3xl font-bold text-zinc-100">
              ₹{pendingFee > 0 ? <NumberTicker value={pendingFee} /> : '0'}
            </p>
          </div>
        </Link>

        <Link href="/dashboard/marks" className="card p-6 flex items-center gap-5 group bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-purple-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Completed Credits</p>
            <p className="text-3xl font-bold text-zinc-100">
              {completedCredits > 0 ? <NumberTicker value={completedCredits} /> : '0'}
            </p>
          </div>
        </Link>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TodayScheduleWidget activeYearId={activeYearId} activeSemId={activeSemId} />
        <CurrentCoursesWidget activeYearId={activeYearId} activeSemId={activeSemId} />
      </section>
    </div>
  );
}

function TodayScheduleWidget({ activeYearId, activeSemId }: { activeYearId: string; activeSemId: string }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeYearId || !activeSemId) return;
    setLoading(true);
    try {
      const csrf = localStorage.getItem('kl_csrf');
      fetch('/api/fetch-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: activeYearId, semesterId: activeSemId, csrfToken: csrf })
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.data && resData.data.length > 0) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = days[new Date().getDay()].toLowerCase();
            
            const todayClasses = resData.data.filter((row: any) => {
              return Object.values(row).some(val => 
                typeof val === 'string' && val.toLowerCase().includes(todayName)
              );
            });
            setClasses(todayClasses);
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
    <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/30">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Today's Schedule</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Live</span>
      </div>
      
      <div className="flex-1 p-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-40 gap-3 opacity-50">
            <CalendarIcon className="w-10 h-10 text-zinc-500" />
            <p className="text-sm text-zinc-400">No classes scheduled for today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {classes.map((c, idx) => {
              const values = Object.values(c);
              const title = String(values[1] || 'Class');
              const room = String(values[values.length - 1] || 'N/A');
              return (
                <div key={idx} className="flex gap-4 group cursor-default">
                  <div className="w-12 pt-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wider">P{idx + 1}</span>
                    <div className="w-px h-full bg-white/5 group-last:hidden"></div>
                  </div>
                  <div className="flex-1 bg-zinc-950/40 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-100 leading-snug">{title}</h4>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                           <Clock className="w-3.5 h-3.5" />
                           <span>Scheduled</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-md shrink-0">
                        {room}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Link href="/dashboard/timetable" className="flex items-center justify-center gap-2 w-full p-4 text-[11px] font-bold tracking-widest text-indigo-400 border-t border-white/5 hover:bg-white/5 transition-colors uppercase">
        View Full Timetable
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function CurrentCoursesWidget({ activeYearId, activeSemId }: { activeYearId: string; activeSemId: string }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeYearId || !activeSemId) return;
    setLoading(true);
    try {
      const csrf = localStorage.getItem('kl_csrf');
      fetch('/api/fetch-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: activeYearId, semesterId: activeSemId, csrfToken: csrf })
      })
        .then(res => res.json())
        .then(resData => {
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
    <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/30">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Current Courses</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Live</span>
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
              const code = course['Course Code'] || 'N/A';
              const name = course['Course Name'] || 'N/A';
              const components = course['Evaluation Components'] || 'No components';
              return (
                <div key={idx} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <span className="text-xs font-bold font-mono">{idx + 1}</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100 truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">{code}</span>
                      <span className="text-[11px] text-zinc-500 truncate">{components}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Link href="/dashboard/marks" className="flex items-center justify-center gap-2 w-full p-4 text-[11px] font-bold tracking-widest text-purple-400 border-t border-white/5 hover:bg-white/5 transition-colors uppercase mt-auto">
        View All Courses
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
