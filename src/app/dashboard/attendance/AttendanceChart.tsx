'use client';

import * as React from 'react';

export interface AttendanceChartProps {
  data: Record<string, unknown>[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  if (!data || data.length === 0) return null;

  // Extract course code/name and percentage from row
  const items = data
    .map((row) => {
      let label = '';
      let pct = 0;

      for (const [key, val] of Object.entries(row)) {
        const k = key.toLowerCase();
        if (k.includes('code') || k.includes('subject') || k.includes('title') || k.includes('course')) {
          if (!label) label = String(val);
        }
        if (typeof val === 'string' && val.includes('%')) {
          const num = parseFloat(val);
          if (!isNaN(num)) pct = num;
        } else if (k.includes('percentage') || k.includes('pct') || k.includes('att %')) {
          const num = parseFloat(String(val));
          if (!isNaN(num)) pct = num;
        }
      }

      if (!label) label = String(Object.values(row)[0] || 'Subject');
      return { label: label.length > 12 ? label.substring(0, 10) + '…' : label, fullLabel: label, pct };
    })
    .filter((item) => item.pct >= 0);

  if (items.length === 0) return null;

  const chartHeight = 220;
  const paddingLeft = 40;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;
  const svgWidth = 600;
  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.min(36, Math.max(16, (innerWidth / items.length) * 0.6));
  const step = innerWidth / items.length;

  return (
    <div className="rounded-xl border border-border/80 bg-surface-1 p-5 space-y-4 glass-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Subject Attendance Breakdown</h3>
          <p className="text-xs text-muted-foreground">Percentage overview per subject</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> ≥85%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> 75-84%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> &lt;75%</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px]"
          role="img"
          aria-label="Attendance Bar Chart"
        >
          {/* Grid lines (0%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = paddingTop + innerHeight - (val / 100) * innerHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={val === 75 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeDasharray={val === 75 ? '4 4' : undefined}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {items.map((item, idx) => {
            const x = paddingLeft + idx * step + (step - barWidth) / 2;
            const barH = (item.pct / 100) * innerHeight;
            const y = paddingTop + innerHeight - barH;

            const color =
              item.pct >= 85
                ? 'var(--color-success, #10b981)'
                : item.pct >= 75
                ? 'var(--color-warning, #f59e0b)'
                : 'var(--color-error, #ef4444)';

            return (
              <g key={idx} className="group">
                <title>{`${item.fullLabel}: ${item.pct}%`}</title>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill={color}
                  opacity={0.85}
                  className="transition-opacity group-hover:opacity-100"
                />
                {/* Value text above bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-bold font-mono"
                >
                  {Math.round(item.pct)}%
                </text>
                {/* Label text under bar */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px] font-medium"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
