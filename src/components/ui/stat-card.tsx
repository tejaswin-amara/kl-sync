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
    iconBg: 'bg-primary/15 border-primary/25 text-indigo-300',
    iconText: 'text-indigo-300',
    hoverBorder: 'hover:border-primary/35',
    glowColor: 'hover:shadow-[0_0_24px_rgba(99,102,241,0.14)]',
  },
  success: {
    iconBg: 'bg-success/15 border-success/25 text-success',
    iconText: 'text-success',
    hoverBorder: 'hover:border-success/35',
    glowColor: 'hover:shadow-[0_0_24px_rgba(48,209,88,0.14)]',
  },
  warning: {
    iconBg: 'bg-warning/15 border-warning/25 text-warning',
    iconText: 'text-warning',
    hoverBorder: 'hover:border-warning/35',
    glowColor: 'hover:shadow-[0_0_24px_rgba(255,214,10,0.14)]',
  },
  danger: {
    iconBg: 'bg-destructive/15 border-destructive/25 text-red-300',
    iconText: 'text-red-300',
    hoverBorder: 'hover:border-destructive/35',
    glowColor: 'hover:shadow-[0_0_24px_rgba(255,69,58,0.14)]',
  },
  purple: {
    iconBg: 'bg-purple-500/15 border-purple-500/25 text-purple-300',
    iconText: 'text-purple-300',
    hoverBorder: 'hover:border-purple-500/35',
    glowColor: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.14)]',
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
        'apple-card flex items-center gap-4 p-5 rounded-[--radius-xl]',
        'touch-manipulation cursor-pointer select-none',
        'active:scale-[0.98] transition-all duration-[--duration-normal] ease-[--ease-spring-default]',
        colors.hoverBorder,
        colors.glowColor,
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={cn(
            'w-12 h-12 rounded-[--radius-lg] flex items-center justify-center shrink-0 border',
            'transition-transform duration-[--duration-normal] ease-[--ease-spring-bounce] group-hover:scale-105',
            colors.iconBg
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="caption-label text-muted-foreground/90 mb-1 truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground tabular-numbers tracking-tight font-heading leading-tight">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              'text-[11px] font-medium mt-1 tracking-tight flex items-center gap-1',
              trend.positive ? 'text-success' : 'text-red-300'
            )}
          >
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}

export { StatCard };
