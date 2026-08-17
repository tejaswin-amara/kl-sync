'use client';

import { Loader2 } from '@/components/ui/icons';

interface AIToolExecutionIndicatorProps {
  toolName?: string;
  status: 'thinking' | 'executing_tool' | 'error';
}

export function AIToolExecutionIndicator({
  toolName,
  status,
}: AIToolExecutionIndicatorProps) {
  if (status === 'error') return null;

  const displayMessage =
    status === 'executing_tool' && toolName
      ? `Querying ERP via ${toolName}...`
      : 'Analyzing request & executing workflow...';

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium backdrop-blur-sm animate-pulse my-2 max-w-fit">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      <span>{displayMessage}</span>
    </div>
  );
}
