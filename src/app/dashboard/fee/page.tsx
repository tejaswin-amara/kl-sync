'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { CheckCircle, Clock } from 'lucide-react';
import {
  findStatusKey,
  isRowUnpaid,
  isSummaryRow,
  parseCurrency,
} from '@/lib/fee-utils';

export default function FeePage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFee = () => {
    setLoading(true);
    setError(null);
    fetch('/api/erp-proxy/fee')
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
  useEffect(() => { fetchFee(); }, []);

  // Compute totals
  let totalPending = 0;
  let totalPaid = 0;
  data.forEach((row) => {
    if (isSummaryRow(row)) return;
    const statusKey = findStatusKey(row);
    if (statusKey && isRowUnpaid(row)) {
      const amtKey = Object.keys(row).find((k) => k.toLowerCase().includes('amount') || k.toLowerCase().includes('fee'));
      if (amtKey) totalPending += parseCurrency(String(row[amtKey]));
    } else {
      const amtKey = Object.keys(row).find((k) => k.toLowerCase().includes('amount') || k.toLowerCase().includes('fee'));
      if (amtKey) totalPaid += parseCurrency(String(row[amtKey]));
    }
  });

  return (
    <div className="flex flex-col gap-5 w-full animate-up">
      <PageHeader title="Fee Details" description="Payment records synced from ERP" />

      {!loading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-up animate-up-1">
          <StatCard label="Total Pending" value={`₹${totalPending.toLocaleString()}`} icon={Clock} accent="danger" />
          <StatCard label="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CheckCircle} accent="success" />
        </div>
      )}

      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: fetchFee }} />
        ) : data.length === 0 ? (
          <EmptyState title="No fee records" description="Fee data will appear here once available." />
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
                {data.map((row, idx) => {
                  const unpaid = isRowUnpaid(row);
                  return (
                    <tr key={idx} className={`hover:bg-surface-2/30 transition-colors ${unpaid ? 'bg-destructive/3' : ''}`}>
                      {Object.entries(row).map(([key, val], j) => {
                        const statusKey = findStatusKey(row);
                        const isStatus = statusKey === key;
                        return (
                          <td key={j} className="px-4 py-3.5 text-sm text-foreground whitespace-nowrap">
                            {isStatus ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                                unpaid ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                              }`}>
                                {unpaid ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                {String(val)}
                              </span>
                            ) : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
