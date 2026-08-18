'use client';

import { useState } from 'react';
import { useAcademicSession } from '@/hooks/useAcademicSession';
import { useAttendance } from '@/hooks/useAttendance';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceChart } from './AttendanceChart';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  LayoutGrid,
  List,
} from '@/components/ui/icons';
import { getSubjectTitle, getSubjectCode } from '@/lib/course-utils';
import { triggerHaptic } from '@/lib/fluid-motion';

interface ParsedComponent {
  name: string;
  weight: number;
  attended: number;
  conducted: number;
  percentage: number;
}

interface ParsedCourseAttendance {
  code: string;
  title: string;
  overallPercentage: number;
  totalAttended: number;
  totalConducted: number;
  components: ParsedComponent[];
  rawRow: Record<string, unknown>;
}

function parseCourseRow(row: Record<string, unknown>): ParsedCourseAttendance {
  const entries = Object.entries(row);
  let code = '';
  let title = '';
  let totalAttended = 0;
  let totalConducted = 0;
  let overallPercentage = 0;

  entries.forEach(([k, v]) => {
    const key = k.toLowerCase();
    if (key.includes('code') || key.includes('subject code')) code = String(v);
    if (key.includes('title') || key.includes('subject title') || key.includes('name') || key.includes('course name')) {
      title = String(v);
    }
    if (key.includes('conducted') || (key.includes('total') && !key.includes('%'))) {
      const num = parseFloat(String(v));
      if (!isNaN(num)) totalConducted = num;
    }
    if (key.includes('attended') || (key.includes('present') && !key.includes('%'))) {
      const num = parseFloat(String(v));
      if (!isNaN(num)) totalAttended = num;
    }
    if (typeof v === 'string' && v.includes('%')) {
      const num = parseFloat(v);
      if (!isNaN(num)) overallPercentage = num;
    }
  });

  if (!code && !title && entries.length > 0) {
    code = String(entries[0][1]);
  }

  if (overallPercentage === 0 && totalConducted > 0) {
    overallPercentage = Math.round((totalAttended / totalConducted) * 10000) / 100;
  }

  const subjectName = getSubjectTitle(code, title);
  const subjectCode = getSubjectCode(code);

  // Extract components if individual columns exist (Lecture, Practical, Tutorial, Skilling)
  const components: ParsedComponent[] = [];
  const compKeywords = [
    { name: 'Lecture', weight: 100 },
    { name: 'Practical', weight: 50 },
    { name: 'Tutorial', weight: 25 },
    { name: 'Skilling', weight: 25 },
  ];

  compKeywords.forEach(({ name, weight }) => {
    const matchAtt = entries.find(([k]) => k.toLowerCase().includes(name.toLowerCase()) && k.toLowerCase().includes('attend'));
    const matchCond = entries.find(([k]) => k.toLowerCase().includes(name.toLowerCase()) && k.toLowerCase().includes('conduct'));
    if (matchAtt && matchCond) {
      const att = parseFloat(String(matchAtt[1])) || 0;
      const cond = parseFloat(String(matchCond[1])) || 0;
      const pct = cond > 0 ? Math.round((att / cond) * 100) : 100;
      components.push({ name, weight, attended: att, conducted: cond, percentage: pct });
    }
  });

  // Fallback to standard lecture component if no sub-component headers are present
  if (components.length === 0 && totalConducted > 0) {
    components.push({
      name: 'Lecture',
      weight: 100,
      attended: totalAttended,
      conducted: totalConducted,
      percentage: overallPercentage,
    });
  }

  return {
    code: subjectCode,
    title: subjectName,
    overallPercentage,
    totalAttended,
    totalConducted,
    components,
    rawRow: row,
  };
}

function AttendanceCardLayout({ course }: { course: ParsedCourseAttendance }) {
  const pct = course.overallPercentage;
  const isEligible = pct >= 85;
  const isConditional = pct >= 75 && pct < 85;

  const accentBorder = isEligible
    ? 'border-l-emerald-500'
    : isConditional
    ? 'border-l-amber-500'
    : 'border-l-rose-500';

  const statusColor = isEligible
    ? 'text-emerald-400'
    : isConditional
    ? 'text-amber-400'
    : 'text-rose-400';

  const statusLabel = isEligible
    ? 'Eligible'
    : isConditional
    ? 'Conditional'
    : 'Not Eligible';

  // Math projections
  const presents = course.totalAttended;
  const total = course.totalConducted;

  // Safe skips for 75%
  const skip75 = total > 0 ? Math.max(0, Math.floor((100 * presents - 75 * total) / 75)) : 0;
  // Safe skips for 85%
  const skip85 = total > 0 ? Math.max(0, Math.floor((100 * presents - 85 * total) / 85)) : 0;
  // Needed for 75%
  const need75 = total > 0 && pct < 75 ? Math.max(0, Math.ceil((75 * total - 100 * presents) / 25)) : 0;
  // Needed for 85%
  const need85 = total > 0 && pct < 85 ? Math.max(0, Math.ceil((85 * total - 100 * presents) / 15)) : 0;

  return (
    <div
      className={`rounded-[--radius-2xl] apple-card p-5 sm:p-6 border border-white/10 ${accentBorder} border-l-[6px] shadow-xl space-y-5 transition-all duration-[--duration-normal] hover:border-white/20`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-foreground uppercase tracking-tight line-clamp-2">
            {course.title}
          </h3>
          {course.code && (
            <p className="text-xs font-mono text-muted-foreground/90 mt-1 tracking-wider uppercase font-semibold">
              {course.code}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-3xl sm:text-4xl font-extrabold tabular-numbers font-heading tracking-tight ${statusColor}`}>
            {Math.round(pct)}%
          </div>
          <div className={`text-xs font-semibold tracking-tight mt-0.5 ${statusColor}`}>
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Two-Column Body: Components & Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/8">
        {/* Left Column: Components */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Components
          </h4>
          <div className="space-y-2.5">
            {course.components.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-muted-foreground font-medium">
                  <strong className="text-foreground font-semibold">{comp.name}</strong>{' '}
                  <span className="text-[11px] text-muted-foreground/80">(Weightage: {comp.weight}%)</span>
                </span>
                <span className="text-foreground font-semibold tabular-numbers text-right">
                  {comp.attended}/{comp.conducted}{' '}
                  <span className="text-muted-foreground/90 font-normal">({comp.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Projections */}
        <div className="space-y-3 md:border-l md:border-white/8 md:pl-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projections
            </h4>
            {skip75 > 0 ? (
              <span className="text-[10px] font-bold text-emerald-400 tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 apple-pill">
                Safe to skip ({skip75})
              </span>
            ) : need75 > 0 ? (
              <span className="text-[10px] font-bold text-rose-400 tracking-wide uppercase px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 apple-pill">
                Need {need75} to pass
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 apple-pill">
                On Track
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {skip75 > 0 && (
              <div className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">
                  <strong className="text-emerald-400 font-semibold">{skip75} Classes</strong>{' '}
                  <span className="text-[11px]">(maintain 75% overall)</span>
                </span>
                <span className="text-muted-foreground/80 font-mono text-[11px] tabular-numbers">
                  ({presents}/{total + skip75})
                </span>
              </div>
            )}

            {skip85 > 0 && (
              <div className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">
                  <strong className="text-emerald-400 font-semibold">{skip85} Classes</strong>{' '}
                  <span className="text-[11px]">(maintain 85% overall)</span>
                </span>
                <span className="text-muted-foreground/80 font-mono text-[11px] tabular-numbers">
                  ({presents}/{total + skip85})
                </span>
              </div>
            )}

            {need75 > 0 && (
              <div className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">
                  <strong className="text-rose-400 font-semibold">Attend {need75}</strong>{' '}
                  <span className="text-[11px]">(to reach 75% overall)</span>
                </span>
                <span className="text-muted-foreground/80 font-mono text-[11px] tabular-numbers">
                  ({presents + need75}/{total + need75})
                </span>
              </div>
            )}

            {need85 > 0 && (
              <div className="flex items-center justify-between py-0.5">
                <span className="text-muted-foreground">
                  <strong className="text-amber-400 font-semibold">Attend {need85}</strong>{' '}
                  <span className="text-[11px]">(to reach 85% overall)</span>
                </span>
                <span className="text-muted-foreground/80 font-mono text-[11px] tabular-numbers">
                  ({presents + need85}/{total + need85})
                </span>
              </div>
            )}

            {skip75 === 0 && need75 === 0 && (
              <div className="text-[11px] text-muted-foreground/90 italic py-1">
                Perfect attendance balance maintained.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceDashboard() {
  const { years, semesters, selectedYear, selectedSem, handleYearChange, handleSemChange } = useAcademicSession();
  const {
    raw: dataRaw,
    overallPercentage: overallPct,
    totalAttended: overallAttended,
    totalConducted: overallConducted,
    isLoading: loading,
    error: fetchError,
    mutate,
  } = useAttendance(selectedYear, selectedSem);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const error = fetchError ? fetchError.message : null;
  const data = dataRaw || [];
  const parsedCourses = data.map(parseCourseRow);

  return (
    <div className="flex flex-col gap-6 w-full animate-spring-up">
      <PageHeader
        title="Attendance"
        description="Real-time attendance synced from ERP"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-surface-2/60 border border-white/10 rounded-[--radius-lg] p-0.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setViewMode('cards');
                }}
                className={`p-2 rounded-[--radius-md] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Cards view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setViewMode('table');
                }}
                className={`p-2 rounded-[--radius-md] text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Table view"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <Select
              options={years}
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              aria-label="Select Academic Year"
            />
            <Select
              options={semesters}
              value={selectedSem}
              onChange={(e) => handleSemChange(e.target.value)}
              aria-label="Select Semester"
            />
          </div>
        }
      />

      {/* Overall Stats */}
      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[--radius-2xl] apple-card p-5 flex items-center gap-4 shadow-xl border border-white/10">
            <Progress value={overallPct} max={100} variant="circular" size="lg" showLabel colorByValue />
            <div>
              <p className="caption-label text-muted-foreground/80">Overall</p>
              <p className="text-2xl font-bold text-foreground tabular-numbers tracking-tight font-heading">{overallPct}%</p>
            </div>
          </div>
          <div className="rounded-[--radius-2xl] apple-card p-5 shadow-xl border border-white/10">
            <p className="caption-label text-muted-foreground/80 mb-1">Classes Attended</p>
            <p className="text-3xl font-bold text-foreground tabular-numbers tracking-tight font-heading">{overallAttended}</p>
          </div>
          <div className="rounded-[--radius-2xl] apple-card p-5 shadow-xl border border-white/10">
            <p className="caption-label text-muted-foreground/80 mb-1">Classes Held</p>
            <p className="text-3xl font-bold text-foreground tabular-numbers tracking-tight font-heading">{overallConducted}</p>
          </div>
        </div>
      )}

      {/* Attendance Chart */}
      {!loading && !error && data.length > 0 && <AttendanceChart data={data} />}

      {/* Attendance Cards / Table */}
      <div>
        {loading ? (
          <div className="p-6 space-y-4 rounded-[--radius-2xl] apple-card border border-white/10 shadow-xl">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-[--radius-2xl]" />)}
          </div>
        ) : error ? (
          <div className="rounded-[--radius-2xl] apple-card overflow-hidden shadow-xl border border-white/10 p-4">
            <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: () => mutate() }} />
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-[--radius-2xl] apple-card overflow-hidden shadow-xl border border-white/10 p-4">
            <EmptyState title="No attendance records" description="Records will appear once available in the ERP." />
          </div>
        ) : viewMode === 'cards' ? (
          <div className="space-y-4">
            {parsedCourses.map((course, idx) => (
              <AttendanceCardLayout key={course.code || idx} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-[--radius-2xl] apple-card overflow-hidden shadow-xl border border-white/10">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-surface-2/40 sticky top-0 z-10 backdrop-blur-md">
                    {Object.keys(data[0] || {}).map((key, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-5 py-3.5 caption-label text-muted-foreground whitespace-nowrap text-left"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/4 transition-colors">
                      {Object.values(row).map((val: unknown, j: number) => {
                        let displayVal: React.ReactNode = String(val);

                        if (typeof val === 'string' && val.includes('%')) {
                          const num = parseFloat(val);
                          if (!isNaN(num)) {
                            const Icon = num >= 85 ? TrendingUp : num >= 75 ? AlertTriangle : TrendingDown;
                            const colorClass = num >= 85 ? 'bg-success/15 text-success border border-success/25' : num >= 75 ? 'bg-warning/15 text-warning border border-warning/25' : 'bg-destructive/15 text-destructive border border-destructive/25';

                            displayVal = (
                              <span className={`inline-flex items-center gap-1 ${colorClass} px-2.5 py-0.5 rounded-full text-xs font-bold tabular-numbers apple-pill`}>
                                <Icon className="w-3 h-3" />{val}
                              </span>
                            );
                          }
                        }

                        return (
                          <td key={j} className="px-5 py-3.5 text-sm text-foreground tabular-numbers font-medium">
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
