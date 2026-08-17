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

  return (
    <div className="p-4 rounded-xl border border-border/80 bg-surface-1/90 glass-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">
            {subjectName}
          </div>
          {subjectCode && (
            <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {subjectCode}
            </div>
          )}
          {pctVal !== null && (
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                  pctVal >= 85
                    ? 'bg-success/10 text-success'
                    : pctVal >= 75
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
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
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`Toggle details for ${subjectName}`}
          className="p-2.5 rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 -mt-1"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-3 border-t border-border/60 space-y-2 animate-up">
          {entries.map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-border/30 last:border-0">
              <span className="text-muted-foreground font-medium">{key}</span>
              <span className="text-foreground font-semibold text-right max-w-[60%] truncate">{String(val)}</span>
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
    <div className="flex flex-col gap-5 w-full animate-up">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-up animate-up-1">
          <div className="rounded-[--radius-lg] bg-surface-1 border border-border p-5 flex items-center gap-4">
            <Progress value={overallPct} max={100} variant="circular" size="lg" showLabel colorByValue />
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Overall</p>
              <p className="text-xl font-bold text-foreground">{overallPct}%</p>
            </div>
          </div>
          <div className="rounded-[--radius-lg] bg-surface-1 border border-border p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">Classes Attended</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{overallAttended}</p>
          </div>
          <div className="rounded-[--radius-lg] bg-surface-1 border border-border p-5">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">Classes Held</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{overallConducted}</p>
          </div>
        </div>
      )}

      {/* Attendance Chart */}
      {!loading && !error && data.length > 0 && <AttendanceChart data={data} />}

      {/* Data Table & Mobile Cards */}
      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: () => mutate() }} />
        ) : data.length === 0 ? (
          <EmptyState title="No attendance records" description="Records will appear once available in the ERP." />
        ) : (
          <>
            {/* Desktop Table (>=640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-1 sticky top-0 z-10">
                    {Object.keys(data[0] || {}).map((key, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-4 py-3 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap text-left"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-2/30 transition-colors">
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
                                if (needed > 0) projection = <span className="block mt-1 text-[10px] text-muted-foreground font-mono">Need {needed} classes</span>;
                              } else {
                                const skip = Math.floor((attended - 0.85 * total) / 0.85);
                                projection = <span className="block mt-1 text-[10px] text-muted-foreground font-mono">{skip > 0 ? `Can skip ${skip}` : 'On track'}</span>;
                              }
                            }

                            const Icon = num >= 85 ? TrendingUp : num >= 75 ? AlertTriangle : TrendingDown;
                            const colorClass = num >= 85 ? 'bg-success/10 text-success' : num >= 75 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive';

                            displayVal = (
                              <div>
                                <span className={`inline-flex items-center gap-1 ${colorClass} px-2 py-1 rounded text-xs font-bold`}>
                                  <Icon className="w-3 h-3" />{val}
                                </span>
                                {projection}
                              </div>
                            );
                          }
                        }

                        return (
                          <td key={j} className="px-4 py-3.5 text-sm text-foreground">
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
