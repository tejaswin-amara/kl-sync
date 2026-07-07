'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader2, AlertCircle, Inbox, ChevronDown, TrendingUp, TrendingDown, AlertTriangle, CalendarOff, Armchair, Megaphone, Bed, Book, CheckCircle, Clock } from 'lucide-react';

export default function ExamSeatingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fetch-exam-seating')
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
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Exam Seating</h2>
        <p className="text-base text-zinc-400 mt-1">Live data synced securely from the ERP.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <span className="text-base text-zinc-400">Connecting to ERP via secure proxy...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <p className="md-h5 text-red-400">Failed to sync with ERP</p>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 rounded bg-[#2c2c2c] flex items-center justify-center text-gray-400 mb-4">
              <Armchair className="w-10 h-10" />
            </div>
            <p className="text-base text-zinc-400">No exam seating data found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((key, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 border-b border-white/5 sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-md">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} key={idx} className="group transition-all">
                    {Object.values(row).map((val: any, j) => {
                      const colName = Object.keys(row)[j].toLowerCase();
                      let displayVal = val;
                      
                      if (colName.includes('seat')) {
                         displayVal = <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded text-sm font-bold uppercase tracking-wider border border-indigo-500/20"><Armchair className="w-4 h-4" />{val}</span>;
                      }

                      return (
                        <td key={j} className="px-4 py-4 text-sm text-zinc-100 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors first:rounded-l last:rounded-r border-y border-transparent">
                          {displayVal}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


