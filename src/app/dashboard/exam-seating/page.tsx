'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Armchair, ChevronDown, ChevronUp } from '@/components/ui/icons';

function ExamSeatingMobileCard({ row }: { row: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(row);
  if (entries.length === 0) return null;

  let seatNo = '';
  let course = '';

  entries.forEach(([k, v]) => {
    const key = k.toLowerCase();
    if (key.includes('seat')) seatNo = String(v);
    if (key.includes('course') || key.includes('subject') || key.includes('code')) {
      if (!course) course = String(v);
    }
  });

  const [, primaryVal] = entries[0];
  const secondaryEntries = entries.slice(1, 3);
  const remainingEntries = entries.slice(3);

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-surface-1/90 glass-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {seatNo && (
            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
              <Armchair className="w-4 h-4" /> Seat {seatNo}
            </span>
          )}
          <div className="text-sm font-semibold text-zinc-100 truncate pt-1">
            {course || String(primaryVal)}
          </div>
        </div>

        {remainingEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={`Toggle details for ${course || String(primaryVal)}`}
            className="p-2.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-zinc-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 -mt-1"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>

      {secondaryEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
          {secondaryEntries.map(([key, val]) => (
            <div key={key} className="min-w-0">
              <div className="text-[10px] font-medium text-zinc-300 uppercase">{key}</div>
              <div className="text-xs font-medium text-zinc-200 truncate">{String(val)}</div>
            </div>
          ))}
        </div>
      )}

      {expanded && remainingEntries.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-2 animate-up">
          {remainingEntries.map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
              <span className="text-zinc-300 font-medium">{key}</span>
              <span className="text-zinc-100 font-semibold text-right max-w-[60%] truncate">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExamSeatingPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/erp-proxy/exam-seating')
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error(
            'Session expired or server error. Please login again.'
          );
        }
        return res.json();
      })
      .then((resData) => {
        if (!resData.success) {
          throw new Error(resData.error || 'Failed to fetch data');
        }
        setData(resData.data || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full animate-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
          Exam Seating
        </h2>
        <p className="text-base text-zinc-300 mt-1">
          Live data synced securely from the ERP.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <span className="text-base text-zinc-300">
              Connecting to ERP via secure proxy...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <p className="text-xl font-semibold text-red-400">Failed to sync with ERP</p>
            <p className="text-sm text-zinc-300 mt-2 max-w-md">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 rounded bg-[#2c2c2c] flex items-center justify-center text-gray-400 mb-4">
              <Armchair className="w-10 h-10" />
            </div>
            <p className="text-base text-zinc-300">
              No exam seating data found.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (>=640px) */}
            <div className="hidden sm:block overflow-x-auto p-4 sm:p-6">
              <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    {Object.keys(data[0] || {}).map((key, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-300 border-b border-white/5 sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-md"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx} className="group transition-all">
                      {Object.values(row).map((val: unknown, j) => {
                        const colName = Object.keys(row)[j].toLowerCase();
                        let displayVal: React.ReactNode = String(val);

                        if (colName.includes('seat')) {
                          displayVal = (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider border border-indigo-500/20">
                              <Armchair className="w-4 h-4" />
                              {String(val)}
                            </span>
                          );
                        }

                        return (
                          <td
                            key={j}
                            className="px-4 py-4 text-sm text-zinc-100 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors first:rounded-l last:rounded-r border-y border-transparent"
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (<640px) */}
            <div className="block sm:hidden p-4 space-y-3">
              {data.map((row, idx) => (
                <ExamSeatingMobileCard key={idx} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
