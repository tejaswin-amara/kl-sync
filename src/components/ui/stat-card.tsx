import * as React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  href?: string;
}

const accentMap = {
  primary: {
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    hoverBorder: 'hover:border-primary/30',
  },
  success: {
    iconBg: 'bg-success/10',
    iconText: 'text-success',
    hoverBorder: 'hover:border-success/30',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconText: 'text-warning',
    hoverBorder: 'hover:border-warning/30',
  },
  danger: {
    iconBg: 'bg-destructive/10',
    iconText: 'text-destructive',
    hoverBorder: 'hover:border-destructive/30',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconText: 'text-purple-400',
    hoverBorder: 'hover:border-purple-500/30',
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'primary',
  href,
  className,
  ...props
}: StatCardProps) {
  const colors = accentMap[accent];

  const content = (
    <div
      className={cn(
        'flex items-center gap-4 p-5 rounded-[--radius-lg]',
        'bg-surface-1 border border-border shadow-sm',
        'transition-all duration-[--duration-normal]',
        href && 'hover-lift cursor-pointer',
        href && colors.hoverBorder,
        'hover:bg-surface-2/50',
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
            trend.positive ? 'text-success' : 'text-destructive'
          )}>
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    // Use next/link externally; this component just renders the card
    return content;
  }

  return content;
}

export { StatCard };
