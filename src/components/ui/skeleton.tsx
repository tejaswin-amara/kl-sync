import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'text';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-2 shimmer rounded-[--radius-md]',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded-[--radius-sm]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
