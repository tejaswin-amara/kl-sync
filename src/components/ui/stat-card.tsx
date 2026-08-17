import * as React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from '@/components/ui/icons';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
}

const accentMap = {
  primary: {
    iconBg: 'bg-primary/10',
    iconText: 'text-indigo-300',
    hoverBorder: 'hover:border-primary/30',
    glowColor: 'hover:shadow-[0_0_24px_rgba(99,102,241,0.12)]',
  },
  success: {
    iconBg: 'bg-success/10',
    iconText: 'text-success',
    hoverBorder: 'hover:border-success/30',
    glowColor: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconText: 'text-warning',
    hoverBorder: 'hover:border-warning/30',
    glowColor: 'hover:shadow-[0_0_24px_rgba(252,211,77,0.12)]',
  },
  danger: {
    iconBg: 'bg-destructive/10',
    iconText: 'text-red-300',
    hoverBorder: 'hover:border-destructive/30',
    glowColor: 'hover:shadow-[0_0_24px_rgba(239,68,68,0.12)]',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-400',
    hoverBorder: 'hover:border-purple-500/30',
    glowColor: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]',
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'primary',
  className,
  ...props
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-5 rounded-[--radius-lg]',
        'bg-surface-1 border border-border shadow-sm',
        'hover:bg-surface-2/50 active-press',
        'transition-all duration-200',
        colors.hoverBorder,
        colors.glowColor,
        className
      )}
      {...props}
    >
      {Icon && (
        <div className={cn(
          'w-12 h-12 rounded-[--radius-md] flex items-center justify-center shrink-0',
          'transition-transform duration-[--duration-normal] group-hover:scale-110',
          colors.iconBg, colors.iconText
        )}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1 truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </p>
        {trend && (
          <p className={cn(
            'text-[11px] font-medium mt-0.5',
            trend.positive ? 'text-success' : 'text-red-300'
          )}>
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}

export { StatCard };
