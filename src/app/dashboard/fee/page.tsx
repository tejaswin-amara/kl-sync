'use client';

import { useState } from 'react';
import { useFee } from '@/hooks/useFee';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
  findStatusKey,
  isRowUnpaid,
} from '@/lib/fee-utils';
import { FeeBreakdownChart } from './FeeBreakdownChart';

function FeeMobileCard({ row }: { row: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(row);
  if (entries.length === 0) return null;

  const unpaid = isRowUnpaid(row);
  const [primaryKey, primaryVal] = entries[0];
  const secondaryEntries = entries.slice(1, 3);
  const remainingEntries = entries.slice(3);

  return (
    <div className={`p-4 rounded-xl border ${unpaid ? 'border-destructive/30 bg-destructive/5' : 'border-border/80 bg-surface-1/90'} glass-card space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {primaryKey}
          </div>
          <div className="text-sm font-semibold text-foreground truncate mt-0.5">
            {String(primaryVal)}
          </div>
        </div>

        {remainingEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`Toggle details for ${String(primaryVal)}`}
            className="p-2.5 rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 -mt-1"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>

      {secondaryEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
          {secondaryEntries.map(([key, val]) => (
            <div key={key} className="min-w-0">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">{key}</div>
              <div className="text-xs font-medium text-foreground truncate">{String(val)}</div>
            </div>
          ))}
        </div>
      )}

      {expanded && remainingEntries.length > 0 && (
        <div className="pt-3 border-t border-border/60 space-y-2 animate-up">
          {remainingEntries.map(([key, val]) => (
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

export default function FeePage() {
  const { data: rawData, totalPending, totalPaid, isLoading: loading, error: swrError, mutate } = useFee();
  const data = (rawData as Record<string, unknown>[]) || [];
  const error = swrError ? swrError.message : null;

  return (
    <div className="flex flex-col gap-5 w-full animate-up">
      <PageHeader title="Fee Details" description="Payment records synced from ERP" />

      {!loading && !error && data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-up animate-up-1">
            <StatCard label="Total Pending" value={`₹${totalPending.toLocaleString()}`} icon={Clock} accent="danger" />
            <StatCard label="Total Paid" value={`₹${totalPaid.toLocaleString()}`} icon={CheckCircle} accent="success" />
          </div>
          <FeeBreakdownChart data={data} totalFee={totalPaid + totalPending} pendingFee={totalPending} />
        </>
      )}

      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: () => mutate() }} />
        ) : data.length === 0 ? (
          <EmptyState title="No fee records" description="Fee data will appear here once available." />
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

            {/* Mobile Cards (<640px) */}
            <div className="block sm:hidden p-4 space-y-3">
              {data.map((row, idx) => (
                <FeeMobileCard key={idx} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
