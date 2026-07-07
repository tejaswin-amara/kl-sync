'use client';
import { useEffect, useState } from 'react';

export default function FeePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fetch-fee')
      .then(res => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Session expired or server error. Please login again.');
        }
        return res.json();
      })
      .then(resData => {
        if (!resData.success) {
          throw new Error(resData.error || 'Failed to fetch data');
        }
        setData(resData.data || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Fee Payments</h2>
        <p className="text-base text-zinc-400 text-gray-400 mt-1">Live data synced securely from the ERP.</p>
      </div>

      <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <span className="material-symbols-outlined text-4xl text-indigo-400 animate-spin mb-4">progress_activity</span>
            <span className="text-base text-zinc-400 text-gray-400">Connecting to ERP via secure proxy...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-[#CF6679]/10 flex items-center justify-center text-[#CF6679] mb-4">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <p className="md-h5 text-[#CF6679]">Failed to sync with ERP</p>
            <p className="text-sm text-zinc-500 text-gray-400 mt-2 max-w-md">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 rounded bg-[#2c2c2c] flex items-center justify-center text-gray-400 mb-4">
              <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
            </div>
            <p className="text-base text-zinc-400 text-gray-400">No fee data found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((key, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 text-gray-400 border-b border-[#333] sticky top-0 z-10 bg-[var(--color-surface)]">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  // Determine status for styling
                  let status = 'Unknown';
                  const statusKey = Object.keys(row).find(k => k.toLowerCase().includes('status'));
                  if (statusKey) status = String(row[statusKey]).toLowerCase();
                  
                  const isPaid = status.includes('paid') && !status.includes('not');
                  const isPending = status.includes('pending') || status.includes('not paid') || status.includes('waiting');

                  return (
                    <tr key={idx} className="group transition-all">
                      {Object.values(row).map((val: any, j) => {
                        const colName = Object.keys(row)[j].toLowerCase();
                        let displayVal = val;
                        
                        // Add â‚¹ symbol if it's amount
                        if (typeof val === 'string' && /^\d+$/.test(val.trim()) && (colName.includes('amount') || colName.includes('fee'))) {
                          displayVal = `â‚¹${val}`;
                        }

                        // Status styling
                        if (colName.includes('status')) {
                          if (isPaid) {
                            displayVal = <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><span className="material-symbols-outlined text-[14px]">check_circle</span>{val}</span>;
                          } else if (isPending) {
                            displayVal = <span className="inline-flex items-center gap-1 bg-[#CF6679]/10 text-[#CF6679] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><span className="material-symbols-outlined text-[14px]">schedule</span>{val}</span>;
                          }
                        }

                        return (
                          <td key={j} className={`px-4 py-4 text-sm text-zinc-500 text-zinc-100 bg-[#2c2c2c] group-hover:bg-[#333] transition-colors first:rounded-l last:rounded-r border-y border-transparent`}>
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

