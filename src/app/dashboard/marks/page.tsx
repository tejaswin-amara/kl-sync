'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAcademicSession } from '@/hooks/useAcademicSession';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { exportTableToCSV } from '@/lib/utils';
import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function MarksPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { years, semesters, selectedYear, selectedSem, handleYearChange, handleSemChange } = useAcademicSession();

  const filteredData = data.filter((row) =>
    Object.values(row).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fetchData = useCallback(async (year: string, sem: string) => {
    if (!year || !sem) return;
    setLoading(true);
    setError(null);
    try {
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      const res = await fetch('/api/erp-proxy/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: year, semesterId: sem, csrfToken: csrf }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error || 'Failed to fetch marks'); return; }
      setData(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch marks');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern, setState is in async callback
  useEffect(() => { fetchData(selectedYear, selectedSem); }, [selectedYear, selectedSem, fetchData]);

  return (
    <div className="flex flex-col gap-5 w-full animate-up">
      <PageHeader
        title="Marks & Grades"
        description="Academic performance synced from ERP"
        actions={
          <div className="flex items-center gap-2">
            <Select options={years} value={selectedYear} onChange={(e) => handleYearChange(e.target.value)} />
            <Select options={semesters} value={selectedSem} onChange={(e) => handleSemChange(e.target.value)} />
          </div>
        }
      />

      {/* Search + Export */}
      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={() => exportTableToCSV(data, 'marks')}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      )}

      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: () => fetchData(selectedYear, selectedSem) }} />
        ) : filteredData.length === 0 ? (
          <EmptyState title="No marks data" description={searchQuery ? 'Try a different search.' : 'Marks will appear once published.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-1 sticky top-0 z-10">
                  {Object.keys(filteredData[0] || {}).map((key, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-2/30 transition-colors">
                    {Object.values(row).map((val: unknown, j) => (
                      <td key={j} className="px-4 py-3.5 text-sm text-foreground whitespace-nowrap">{String(val)}</td>
                    ))}
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
