'use client';
import { useEffect, useState } from 'react';

import {
  Loader2,
  AlertCircle,
  Inbox,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  findStatusKey,
  isRowUnpaid,
  isSummaryRow,
  parseCurrency,
} from '@/lib/fee-utils';

export default function FeePage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/erp-proxy/fee')
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
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
          Fee Payments
        </h2>
        <p className="text-base text-zinc-400 text-gray-400 mt-1">
          Live data synced securely from the ERP.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <span className="text-base text-zinc-400 text-gray-400">
              Connecting to ERP via secure proxy...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <p className="md-h5 text-red-400">Failed to sync with ERP</p>
            <p className="text-sm text-zinc-500 text-gray-400 mt-2 max-w-md">
              {error}
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 rounded bg-[#2c2c2c] flex items-center justify-center text-gray-400 mb-4">
              <Inbox className="w-10 h-10" />
            </div>
            <p className="text-base text-zinc-400 text-gray-400">
              No fee data found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((key, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 text-gray-400 border-b border-white/5 sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-md"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  // Determine status for styling using fee-utils
                  const statusKey = findStatusKey(row);
                  const statusVal = statusKey && row[statusKey] ? String(row[statusKey]).toLowerCase() : '';
                  const isPending = isRowUnpaid(row);
                  const summaryRow = isSummaryRow(row);
                  const isPaid = !isPending && !summaryRow && (statusVal.includes('paid') || !statusKey);

                  return (
                    <tr
                      key={idx}
                      className={`group transition-all ${summaryRow ? 'font-bold bg-white/[0.04]' : ''}`}
                    >
                      {Object.values(row).map((val: unknown, j) => {
                        const colName = Object.keys(row)[j].toLowerCase();
                        let displayVal: React.ReactNode = String(val);

                        // Add ₹ symbol or format currency amounts safely
                        if (
                          (typeof val === 'string' || typeof val === 'number') &&
                          (colName.includes('amount') ||
                            colName.includes('fee') ||
                            colName.includes('scholarship') ||
                            colName.includes('concession') ||
                            colName.includes('balance') ||
                            colName.includes('due') ||
                            colName.includes('paid') ||
                            colName.includes('payable'))
                        ) {
                          const valStr = String(val).trim();
                          const numVal = parseCurrency(val);
                          if (numVal !== 0 || /^-?0(\.0+)?$/.test(valStr)) {
                            if (valStr.includes('₹') || valStr.includes('$') || valStr.includes('€')) {
                              displayVal = valStr;
                            } else {
                              displayVal = numVal < 0 ? `-₹${Math.abs(numVal)}` : `₹${valStr}`;
                            }
                          }
                        }

                        // Status styling
                        if (
                          colName.includes('status') ||
                          colName.includes('remarks') ||
                          colName === 'scholarship' ||
                          colName === 'concession'
                        ) {
                          const vLow = String(val).toLowerCase();
                          if (
                            isPaid ||
                            vLow.includes('scholarship') ||
                            vLow.includes('concession')
                          ) {
                            displayVal = (
                              <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {String(val)}
                              </span>
                            );
                          } else if (isPending) {
                            displayVal = (
                              <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" />
                                {String(val)}
                              </span>
                            );
                          }
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
