'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { exportTableToCSV } from '@/lib/utils';
import { AlertCircle, Inbox, ChevronDown, TrendingUp, TrendingDown, AlertTriangle, CalendarOff, Armchair, Megaphone, Bed, Book, CheckCircle, Clock } from 'lucide-react';

export default function MarksPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const filteredData = data.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase())));

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
      
      if (!yStr || !sStr || JSON.parse(yStr).length === 0 || JSON.parse(sStr).length === 0) {
        setLoading(false);
        setError('Academic sessions not found. Please login again.');
      }
    } catch (e) {
      console.error('Failed to parse semesters', e);
    }
  }, []);

  const fetchData = useCallback(async (year: string, sem: string) => {
    if (!year || !sem) return;
    try {
      setLoading(true);
      setError(null);
      
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');
      
      const res = await fetch('/api/erp-proxy/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: year, semesterId: sem, csrfToken: csrf })
      });
      const json = await res.json();
      
      if (!json.success) {
        setError(json.error || 'Failed to fetch marks');
      } else {
        setData(json.data || []);
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedYear, selectedSem);
  }, [selectedYear, selectedSem, fetchData]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedYear(val);
    localStorage.setItem('kl_erp_year', val);
  };

  const handleSemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSem(val);
    localStorage.setItem('kl_erp_sem', val);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-indigo-400" />
            Marks & Grades
          </h2>
          <p className="text-base text-zinc-400 mt-1">Review your academic performance and historical grades.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="appearance-none w-full sm:w-40 bg-zinc-900/50 border border-white/10 text-zinc-100 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {years.map(y => <option key={y.value} value={y.value} className="bg-zinc-900">{y.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedSem}
              onChange={handleSemChange}
              className="appearance-none w-full sm:w-32 bg-zinc-900/50 border border-white/10 text-zinc-100 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {semesters.map(s => <option key={s.value} value={s.value} className="bg-zinc-900">{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-6">
            <div className="flex gap-4 mb-6">
               <div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div>
               <div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div>
               <div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div>
               <div className="h-6 w-32 bg-zinc-800/50 rounded animate-pulse"></div>
            </div>
            <div className="flex flex-col gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-zinc-800/30 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-red-400 font-medium mb-2">Failed to load marks</p>
            <p className="text-sm text-zinc-500 max-w-md">{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <div className="w-16 h-16 rounded bg-white/5 flex items-center justify-center text-zinc-500 mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-zinc-400 font-medium mb-2">No results found</p>
            <p className="text-sm text-zinc-500">There is no data available for this semester or your search.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-96">
                <input 
                  type="text" 
                  placeholder="Search marks..." 
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-4 pr-4 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => exportTableToCSV(filteredData, 'Marks_Export.csv')}
                className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors border border-white/5 rounded-xl text-sm font-medium text-zinc-100 whitespace-nowrap"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    {Object.keys(filteredData[0] || {}).map((key, i) => (
                      <th key={i} className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 border-b border-white/5 sticky top-0 z-10 bg-zinc-950/50 backdrop-blur-md">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} key={idx} className="group transition-all">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-4 py-4 text-sm text-zinc-100 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors first:rounded-l last:rounded-r border-y border-transparent">
                          {val}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
