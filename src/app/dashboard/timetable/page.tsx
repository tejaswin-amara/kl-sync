'use client';
import { useEffect, useState, useCallback } from 'react';

export default function TimetablePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [years, setYears] = useState<{value: string, label: string}[]>([]);
  const [semesters, setSemesters] = useState<{value: string, label: string}[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');

  useEffect(() => {
    try {
      const yStr = localStorage.getItem('kl_academic_years');
      const sStr = localStorage.getItem('kl_semesters');
      if (yStr) {
        const y = JSON.parse(yStr);
        setYears(y);
        if (y.length > 0) setSelectedYear(y[0].value);
      }
      if (sStr) {
        const s = JSON.parse(sStr);
        setSemesters(s);
        if (s.length > 0) setSelectedSem(s[0].value);
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
      const csrf = localStorage.getItem('kl_csrf');
      const res = await fetch('/api/fetch-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear: selectedYear, semesterId: selectedSem, csrfToken: csrf })
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Session expired or server error.');
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.error || 'Failed to fetch data');
      setData(resData.data || []);
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Student Timetable</h2>
          <p className="text-base text-zinc-400 text-gray-400 mt-1">Live schedule synced securely from the ERP.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-[var(--color-surface)] p-2 rounded shadow-sm border border-[#333]">
          <div className="relative">
            <select 
              className="appearance-none bg-[#2c2c2c] border border-[#333] rounded pl-4 pr-10 py-2.5 text-sm text-zinc-500 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all cursor-pointer"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
          </div>
          <div className="relative">
            <select 
              className="appearance-none bg-[#2c2c2c] border border-[#333] rounded pl-4 pr-10 py-2.5 text-sm text-zinc-500 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all cursor-pointer"
              value={selectedSem}
              onChange={e => setSelectedSem(e.target.value)}
            >
              {semesters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
          </div>
        </div>
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
              <span className="material-symbols-outlined text-4xl">event_busy</span>
            </div>
            <p className="text-base text-zinc-400 text-gray-400">No timetable data found for this selection.</p>
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
                {data.map((row, idx) => (
                  <tr key={idx} className="group transition-all">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-4 py-4 text-sm text-zinc-500 text-zinc-100 bg-[#2c2c2c] group-hover:bg-[#333] transition-colors first:rounded-l last:rounded-r border-y border-transparent">
                        {/* Format cell if it looks like a class (contains room number etc) */}
                        {typeof val === 'string' && val.includes('-') && j > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-100">{val.split('-')[0]}</span>
                            <span className="text-xs text-zinc-500 font-mono tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded w-max">
                              {val.substring(val.indexOf('-') + 1)}
                            </span>
                          </div>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

