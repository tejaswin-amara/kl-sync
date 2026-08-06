import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  colorByValue?: boolean;
}

function getProgressColor(value: number): string {
  if (value >= 85) return 'text-success';
  if (value >= 75) return 'text-warning';
  return 'text-destructive';
}

function getProgressBg(value: number): string {
  if (value >= 85) return 'bg-success';
  if (value >= 75) return 'bg-warning';
  return 'bg-destructive';
}

function Progress({
  value,
  max = 100,
  variant = 'linear',
  size = 'md',
  showLabel = false,
  colorByValue = false,
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  if (variant === 'circular') {
    const dimensions = { sm: 40, md: 56, lg: 72 };
    const strokes = { sm: 4, md: 5, lg: 6 };
    const fonts = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };

    const dim = dimensions[size];
    const stroke = strokes[size];
    const r = (dim - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)} {...props}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-surface-2"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-700 ease-out',
              colorByValue ? getProgressColor(pct) : 'text-primary'
            )}
          />
        </svg>
        {showLabel && (
          <span className={cn(
            'absolute font-bold',
            fonts[size],
            colorByValue ? getProgressColor(pct) : 'text-foreground'
          )}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
    );
  }

  // Linear
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' };

  return (
    <div className={cn('w-full flex items-center gap-2', className)} {...props}>
      <div className={cn('flex-1 rounded-full bg-surface-2 overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            colorByValue ? getProgressBg(pct) : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'text-xs font-semibold tabular-nums shrink-0',
          colorByValue ? getProgressColor(pct) : 'text-muted-foreground'
        )}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

export { Progress };
