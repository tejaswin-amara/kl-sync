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
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle } from '@/components/ui/icons';
import { getSubjectTitle, getSubjectCode } from '@/lib/course-utils';
import { triggerHaptic } from '@/lib/fluid-motion';

function AttendanceMobileCard({ row }: { row: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(row);
  if (entries.length === 0) return null;

  let code = '';
  let title = '';
  let pctVal: number | null = null;
  let pctStr = '';

  entries.forEach(([k, v]) => {
    const key = k.toLowerCase();
    if (key.includes('code') || key.includes('subject code')) code = String(v);
    if (key.includes('title') || key.includes('subject title') || key.includes('name')) title = String(v);
    if (typeof v === 'string' && v.includes('%')) {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        pctVal = num;
        pctStr = v;
      }
    }
  });

  if (!code && !title) {
    code = String(entries[0][1]);
  }

  const subjectName = getSubjectTitle(code, title);
  const subjectCode = getSubjectCode(code);

  const toggleExpand = () => {
    triggerHaptic('selection');
    setExpanded(!expanded);
  };

  return (
    <div className="p-4 rounded-[--radius-xl] border border-white/8 apple-card space-y-3 transition-all duration-[--duration-normal] ease-[--ease-spring-default]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate tracking-tight">
            {subjectName}
          </div>
          {subjectCode && (
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {subjectCode}
            </div>
          )}
          {pctVal !== null && (
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-numbers apple-pill ${
                  pctVal >= 85
                    ? 'bg-success/15 text-success border border-success/25'
                    : pctVal >= 75
                    ? 'bg-warning/15 text-warning border border-warning/25'
                    : 'bg-destructive/15 text-destructive border border-destructive/25'
                }`}
              >
                {pctVal >= 85 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : pctVal >= 75 ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {pctStr}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleExpand}
          aria-expanded={expanded}
          aria-label={`Toggle details for ${subjectName}`}
          className="p-2 rounded-full hover:bg-white/8 text-muted-foreground hover:text-foreground transition-all min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 -mt-1 touch-manipulation active:scale-90 cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-3 border-t border-white/8 space-y-2 animate-spring-scale">
          {entries.map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-white/4 last:border-0">
              <span className="text-muted-foreground font-medium">{key}</span>
              <span className="text-foreground font-semibold text-right max-w-[60%] truncate tabular-numbers">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
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

  const error = fetchError ? fetchError.message : null;
  const data = dataRaw || [];

  return (
    <div className="flex flex-col gap-6 w-full animate-spring-up">
      <PageHeader
        title="Attendance"
        description="Real-time attendance synced from ERP"
        actions={
          <div className="flex items-center gap-2">
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

      {/* Data Table & Mobile Cards */}
      <div className="rounded-[--radius-2xl] apple-card overflow-hidden shadow-xl border border-white/10">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-[--radius-lg]" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: () => mutate() }} />
        ) : data.length === 0 ? (
          <EmptyState title="No attendance records" description="Records will appear once available in the ERP." />
        ) : (
          <>
            {/* Desktop Table (>=640px) */}
            <div className="hidden sm:block overflow-x-auto custom-scrollbar">
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
                            let total = 0, attended = 0;
                            for (const k in row) {
                              const kl = k.toLowerCase();
                              if (kl.includes('total') && !kl.includes('%')) total = parseInt(String(row[k])) || 0;
                              if (kl.includes('attend') && !kl.includes('total') && !kl.includes('%')) attended = parseInt(String(row[k])) || 0;
                            }

                            let projection = null;
                            if (total > 0) {
                              if (num < 85) {
                                const needed = Math.ceil((0.85 * total - attended) / 0.15);
                                if (needed > 0) projection = <span className="block mt-1 text-[10px] text-muted-foreground font-mono tabular-numbers">Need {needed} classes</span>;
                              } else {
                                const skip = Math.floor((attended - 0.85 * total) / 0.85);
                                projection = <span className="block mt-1 text-[10px] text-muted-foreground font-mono tabular-numbers">{skip > 0 ? `Can skip ${skip}` : 'On track'}</span>;
                              }
                            }

                            const Icon = num >= 85 ? TrendingUp : num >= 75 ? AlertTriangle : TrendingDown;
                            const colorClass = num >= 85 ? 'bg-success/15 text-success border border-success/25' : num >= 75 ? 'bg-warning/15 text-warning border border-warning/25' : 'bg-destructive/15 text-destructive border border-destructive/25';

                            displayVal = (
                              <div>
                                <span className={`inline-flex items-center gap-1 ${colorClass} px-2.5 py-0.5 rounded-full text-xs font-bold tabular-numbers apple-pill`}>
                                  <Icon className="w-3 h-3" />{val}
                                </span>
                                {projection}
                              </div>
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

            {/* Mobile Cards (<640px) */}
            <div className="block sm:hidden p-4 space-y-3">
              {data.map((row, idx) => (
                <AttendanceMobileCard key={idx} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
