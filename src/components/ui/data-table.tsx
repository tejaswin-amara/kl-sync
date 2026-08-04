import * as React from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  rowClassName?: string | ((row: T, index: number) => string);
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyMessage,
  className,
  stickyHeader = true,
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        description={error}
        action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
        className={className}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || 'No data available'}
        description="Data will appear here once loaded."
        className={className}
      />
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-[--radius-lg] border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className={cn(
            'border-b border-border bg-surface-1',
            stickyHeader && 'sticky top-0 z-10'
          )}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase whitespace-nowrap',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={cn(
                'hover:bg-surface-2/40 transition-colors',
                typeof rowClassName === 'function' ? rowClassName(row, idx) : rowClassName
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-sm text-foreground',
                    col.className
                  )}
                >
                  {col.render
                    ? col.render(row, idx)
                    : String(row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
export type { Column };
