import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-zinc-800/80 animate-pulse',
        shimmer && 'animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
