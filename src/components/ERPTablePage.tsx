'use client';

import { useState } from 'react';
import { useNativeQuery } from '@/hooks/useNativeQuery';
import { type ReactNode } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ERPTablePageProps {
  module: string;
  title: string;
  description: string;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}

const fetcher = async (url: unknown) => {
  const res = await fetch(url as string);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error('Session expired.');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch data');
  return (json.data as Record<string, unknown>[]) || [];
};

function MobileCardItem({ row }: { row: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(row);
  if (entries.length === 0) return null;

  const [primaryKey, primaryVal] = entries[0];
  const secondaryEntries = entries.slice(1, 3);
  const remainingEntries = entries.slice(3);

  return (
    <div className="p-4 rounded-xl border border-border/80 bg-surface-1/90 glass-card space-y-3">
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

export default function ERPTablePage({
  module,
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: ERPTablePageProps) {
  const { data: rawData, isLoading: loading, error: fetchError, mutate } = useNativeQuery(`/api/erp-proxy/${module}`, fetcher);
  const data = rawData || [];
  const error = fetchError ? fetchError.message : null;

  return (
    <div className="flex flex-col gap-5 w-full animate-up">
      <PageHeader title={title} description={description} />
      <div className="rounded-[--radius-xl] bg-surface-1 border border-border overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : error ? (
          <EmptyState variant="error" description={error} action={{ label: 'Retry', onClick: () => mutate() }} />
        ) : data.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <>
            {/* Desktop View (>=640px) */}
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
                      {Object.values(row).map((val: unknown, j) => (
                        <td key={j} className="px-4 py-3.5 text-sm text-foreground">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (<640px) */}
            <div className="block sm:hidden p-4 space-y-3">
              {data.map((row, idx) => (
                <MobileCardItem key={idx} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
