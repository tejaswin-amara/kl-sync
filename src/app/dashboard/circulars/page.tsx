'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone } from 'lucide-react';

export default function CircularsPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/erp-proxy/circulars')
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Session expired.');
        return res.json();
      })
      .then((resData) => {
        if (!resData.success) throw new Error(resData.error || 'Failed to fetch data');
        setData(resData.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern, setState is in async callback
  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex flex-col gap-5 w-full animate-up">
      <PageHeader title="Circulars" description="Announcements from the ERP system" />

      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: fetchData }} />
        ) : data.length === 0 ? (
          <EmptyState icon={<Megaphone className="w-10 h-10 text-muted-foreground/30" />} title="No circulars" description="Circulars will appear here when published." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-1 sticky top-0 z-10">
                  {Object.keys(data[0] || {}).map((key, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-2/30 transition-colors">
                    {Object.values(row).map((val: unknown, j) => (
                      <td key={j} className="px-4 py-3.5 text-sm text-foreground">{String(val)}</td>
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
