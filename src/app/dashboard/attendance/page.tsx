'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader2, AlertCircle, Inbox, ChevronDown, TrendingUp, TrendingDown, AlertTriangle, CalendarOff, Armchair, Megaphone, Bed, Book, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AttendanceDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [years, setYears] = useState<{value: string, label: string}[]>([]);
  const [semesters, setSemesters] = useState<{value: string, label: string}[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');

  useEffect(() => {
    try {
      const yStr = sessionStorage.getItem('kl_erp_academic_years');
      const sStr = sessionStorage.getItem('kl_erp_semesters');
      if (yStr) {
        const y = JSON.parse(yStr);
        setYears(y);
        if (localStorage.getItem('kl_erp_year')) setSelectedYear(localStorage.getItem('kl_erp_year') || ''); else if (y.length > 0) setSelectedYear(y[0].value);
      }
      if (sStr) {
        const s = JSON.parse(sStr);
        setSemesters(s);
        if (localStorage.getItem('kl_erp_sem')) setSelectedSem(localStorage.getItem('kl_erp_sem') || ''); else if (s.length > 0) setSelectedSem(s[0].value);
      }
    } catch (e) {
      console.error('Failed to parse semesters', e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedYear || !selectedSem) return;
    setLoading(true);
    setError(null);
    try {
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      const res = await fetch('/api/fetch-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: selectedYear, semesterId: selectedSem, csrfToken: csrf })
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Session expired or server error.');
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error || 'Failed to fetch data');
      setData(resData.attendanceData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSem]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Live Attendance</h2>
          <p className="text-base text-zinc-400 text-gray-400 mt-1">Real-time attendance fetched directly from the ERP.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-2xl">
          <div className="relative">
            <select 
              className="appearance-none bg-zinc-900/50 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              className="appearance-none bg-zinc-900/50 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
              value={selectedSem}
              onChange={e => setSelectedSem(e.target.value)}
            >
              {semesters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="p-6"><div className="flex gap-4 mb-6"><div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div><div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div><div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div><div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div></div><div className="flex flex-col gap-4">{[...Array(6)].map((_, i) => (<div key={i} className="h-12 w-full bg-zinc-800/30 rounded-lg animate-pulse"></div>))}</div></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>
            <p className="md-h5 text-red-400">Failed to sync with ERP</p>
            <p className="text-sm text-zinc-500 text-gray-400 mt-2 max-w-md">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <div className="w-16 h-16 rounded bg-[#2c2c2c] flex items-center justify-center text-gray-400 mb-4">
              <CalendarOff className="w-10 h-10" />
            </div>
            <p className="text-base text-zinc-400 text-gray-400">No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((key, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 text-gray-400 border-b border-white/5 sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-md">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} key={idx} className="group transition-all">
                    {Object.values(row).map((val: any, j) => {
                      const colName = Object.keys(row)[j].toLowerCase();
                      let displayVal = val;
                      
                      // Highlight percentage and project attendance
                      if (typeof val === 'string' && val.includes('%')) {
                         const num = parseFloat(val);
                         if (!isNaN(num)) {
                           let projection = null;
                           // Try to find total and attended from the row keys
                           let total = 0; let attended = 0;
                           for (const k in row) {
                             const kl = k.toLowerCase();
                             if (kl.includes('total') && !kl.includes('%')) total = parseInt(row[k]) || 0;
                             if (kl.includes('attend') && !kl.includes('total') && !kl.includes('%')) attended = parseInt(row[k]) || 0;
                           }
                           
                           if (total > 0) {
                             if (num < 85) {
                               const needed = Math.ceil((0.85 * total - attended) / 0.15);
                               if (needed > 0) projection = <span className="block mt-1 text-[10px] text-zinc-400 font-mono tracking-wider">Need {needed} classes</span>;
                             } else if (num >= 85) {
                               const skip = Math.floor((attended - 0.85 * total) / 0.85);
                               if (skip > 0) projection = <span className="block mt-1 text-[10px] text-zinc-400 font-mono tracking-wider">Safe to skip {skip}</span>;
                               else projection = <span className="block mt-1 text-[10px] text-zinc-400 font-mono tracking-wider">On track</span>;
                             }
                           }

                           if (num >= 85) {
                              displayVal = <div><span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold"><TrendingUp className="w-3.5 h-3.5" />{val}</span>{projection}</div>;
                           } else if (num >= 75) {
                              displayVal = <div><span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded text-xs font-bold"><AlertTriangle className="w-3.5 h-3.5" />{val}</span>{projection}</div>;
                           } else {
                              displayVal = <div><span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold"><TrendingDown className="w-3.5 h-3.5" />{val}</span>{projection}</div>;
                           }
                         }
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


