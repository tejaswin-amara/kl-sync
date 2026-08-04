'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAcademicSession } from '@/hooks/useAcademicSession';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

export default function AttendanceDashboard() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { years, semesters, selectedYear, selectedSem, handleYearChange, handleSemChange } = useAcademicSession();

  const fetchData = useCallback(async () => {
    if (!selectedYear || !selectedSem) return;
    setLoading(true);
    setError(null);
    try {
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      const res = await fetch('/api/erp-proxy/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: selectedYear, semesterId: selectedSem, csrfToken: csrf }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Session expired or server error.');
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error || 'Failed to fetch data');
      setData(resData.attendanceData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSem]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern, setState is in async callback
  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute overall stats
  let overallAttended = 0, overallConducted = 0;
  data.forEach((row) => {
    const condKey = Object.keys(row).find((k) => { const kl = k.toLowerCase(); return kl.includes('conducted') || kl.includes('held') || (kl.includes('total') && !kl.includes('%')); });
    const attKey = Object.keys(row).find((k) => { const kl = k.toLowerCase(); return kl.includes('attended') || kl.includes('present'); });
    if (condKey && attKey) {
      overallConducted += parseFloat(String(row[condKey])) || 0;
      overallAttended += parseFloat(String(row[attKey])) || 0;
    }
  });
  const overallPct = overallConducted > 0 ? Math.round((overallAttended / overallConducted) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 w-full animate-up">
      <PageHeader
        title="Attendance"
        description="Real-time attendance synced from ERP"
        actions={
          <div className="flex items-center gap-2">
            <Select options={years} value={selectedYear} onChange={(e) => handleYearChange(e.target.value)} />
            <Select options={semesters} value={selectedSem} onChange={(e) => handleSemChange(e.target.value)} />
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

      {/* Data Table */}
      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: fetchData }} />
        ) : data.length === 0 ? (
          <EmptyState title="No attendance records" description="Records will appear once available in the ERP." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-1 sticky top-0 z-10">
                  {Object.keys(data[0] || {}).map((key, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap text-left">
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
        )}
      </div>
    </div>
  );
}
