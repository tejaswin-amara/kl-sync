'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAcademicSession } from '@/hooks/useAcademicSession';
import { motion } from 'framer-motion';
import { exportTableToCSV } from '@/lib/utils';
import {
  parseTimetable,
  isSameDay,
  ParsedTimetable,
} from '@/lib/timetable-parser';
import {
  LayoutGrid,
  List,
  Search,
  CalendarOff,
  AlertCircle,
  ChevronDown,
  Download,
  MapPin,
  User,
  RefreshCw,
  BookOpen,
  Filter,
} from 'lucide-react';

export default function TimetablePage() {
  const [parsedTT, setParsedTT] = useState<ParsedTimetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    years,
    semesters,
    selectedYear,
    selectedSem,
    handleYearChange,
    handleSemChange,
    sessionError,
  } = useAcademicSession();

  const displayError = error || sessionError;

  const fetchData = useCallback(async () => {
    if (!selectedYear || !selectedSem) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const cacheKey = `kl_timetable_${selectedYear}_${selectedSem}`;
    let loadedFromCache = false;

    // Load from cache first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const rawData = JSON.parse(cached);
        if (Array.isArray(rawData) && rawData.length > 0) {
          setParsedTT(parseTimetable(rawData));
          loadedFromCache = true;
          setLoading(false);
        }
      }
    } catch (e) {
      // Ignore cache parse error
    }

    try {
      const csrf = sessionStorage.getItem('kl_erp_csrf_token');

      // Fetch profile & marks in parallel to build course title & faculty lookup
      const courseLookup: Record<string, { title: string; faculty: string }> = {};
      try {
        const [profRes, marksRes] = await Promise.allSettled([
          fetch('/api/erp-proxy/profile'),
          fetch('/api/erp-proxy/marks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              academicYear: selectedYear,
              semesterId: selectedSem,
              csrfToken: csrf,
            }),
          }),
        ]);

        if (profRes.status === 'fulfilled') {
          const pData = await profRes.value.json();
          if (pData.success && Array.isArray(pData.data)) {
            pData.data.forEach((row: any) => {
              const keys = Object.keys(row);
              const codeK = keys.find((k) => k.toLowerCase().includes('code')) || '';
              const descK =
                keys.find(
                  (k) =>
                    k.toLowerCase().includes('desc') ||
                    k.toLowerCase().includes('name') ||
                    k.toLowerCase().includes('title')
                ) || '';
              const facK =
                keys.find(
                  (k) =>
                    k.toLowerCase().includes('faculty') ||
                    k.toLowerCase().includes('instructor')
                ) || '';
              const code = codeK ? String(row[codeK]).trim().toUpperCase() : '';
              const desc = descK ? String(row[descK]).trim() : '';
              const fac = facK ? String(row[facK]).trim() : '';
              if (code && desc) {
                courseLookup[code] = { title: desc, faculty: fac };
              }
            });
          }
        }

        if (marksRes.status === 'fulfilled') {
          const mData = await marksRes.value.json();
          if (mData.success && Array.isArray(mData.data)) {
            mData.data.forEach((row: any) => {
              const keys = Object.keys(row);
              const codeK = keys.find((k) => k.toLowerCase().includes('code')) || '';
              const nameK =
                keys.find(
                  (k) =>
                    k.toLowerCase().includes('name') ||
                    k.toLowerCase().includes('title') ||
                    k.toLowerCase().includes('desc')
                ) || '';
              const facK =
                keys.find(
                  (k) =>
                    k.toLowerCase().includes('faculty') ||
                    k.toLowerCase().includes('instructor')
                ) || '';
              const code = codeK ? String(row[codeK]).trim().toUpperCase() : '';
              const name = nameK ? String(row[nameK]).trim() : '';
              const fac = facK ? String(row[facK]).trim() : '';
              if (code && name) {
                if (!courseLookup[code]) {
                  courseLookup[code] = { title: name, faculty: fac };
                } else if (fac && !courseLookup[code].faculty) {
                  courseLookup[code].faculty = fac;
                }
              }
            });
          }
        }
      } catch (e) {
        // Non-fatal lookup failure
      }

      const res = await fetch('/api/erp-proxy/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: selectedYear,
          semesterId: selectedSem,
          csrfToken: csrf,
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Session expired or server error.');
      }

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Failed to fetch timetable');
      }

      const rawRows = resData.data || [];
      sessionStorage.setItem(cacheKey, JSON.stringify(rawRows));
      const parsed = parseTimetable(rawRows);
      parsed.sessions.forEach((s) => {
        const info = courseLookup[s.courseCode.toUpperCase()];
        if (info) {
          if (info.title && (s.courseTitle === s.courseCode || !s.courseTitle)) {
            s.courseTitle = info.title;
          }
          if (info.faculty && !s.faculty) {
            s.faculty = info.faculty;
          }
        }
      });
      setParsedTT(parsed);
      setError(null);
    } catch (err: any) {
      if (!loadedFromCache) {
        setError(err.message || 'Failed to sync timetable with ERP');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSem]);

  useEffect(() => {
    if (sessionError) {
      setLoading(false);
      return;
    }
    if (selectedYear && selectedSem) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, selectedYear, selectedSem, sessionError]);

  const daysList = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredSessions = (parsedTT?.sessions || []).filter((session) => {
    const matchesDay =
      selectedDayFilter === 'All' || isSameDay(session.day, selectedDayFilter);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      session.courseCode.toLowerCase().includes(q) ||
      session.courseTitle.toLowerCase().includes(q) ||
      session.room.toLowerCase().includes(q) ||
      session.faculty.toLowerCase().includes(q) ||
      session.timeSlot.toLowerCase().includes(q) ||
      session.day.toLowerCase().includes(q);

    return matchesDay && matchesSearch;
  });

  const handleExportCSV = () => {
    if (!parsedTT || parsedTT.sessions.length === 0) return;
    const exportData = filteredSessions.map((s) => ({
      Day: s.day,
      'Time Slot': s.timeSlot,
      'Course Code': s.courseCode,
      'Course Title': s.courseTitle,
      Room: s.room,
      Faculty: s.faculty,
    }));
    exportTableToCSV(exportData, `Timetable_${selectedYear}_${selectedSem}.csv`);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            Student Timetable
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Interactive weekly schedule synced securely from the ERP.
          </p>
        </div>

        {/* Controls: Year, Semester, View Toggle, Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl shadow-lg">
            <div className="relative">
              <select
                className="appearance-none bg-transparent border-none rounded-lg pl-3 pr-8 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                {years.map((y) => (
                  <option key={y.value} value={y.value} className="bg-zinc-900 text-zinc-100">
                    {y.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="relative">
              <select
                className="appearance-none bg-transparent border-none rounded-lg pl-3 pr-8 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
              >
                {semesters.map((s) => (
                  <option key={s.value} value={s.value} className="bg-zinc-900 text-zinc-100">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!parsedTT || parsedTT.sessions.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-950/40 border border-white/5 p-3 rounded-2xl backdrop-blur-md">
        {/* Day Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-zinc-500 ml-2 mr-1 shrink-0" />
          {daysList.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedDayFilter === day
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search course, room, faculty..."
            className="w-full bg-zinc-900/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden min-h-[450px] flex flex-col">
        {loading ? (
          <div className="p-8 flex flex-col gap-6">
            <div className="flex gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-zinc-800/40 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-zinc-800/30 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : displayError ? (
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">
              Failed to Sync Timetable
            </h3>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed mb-6">
              {displayError}
            </p>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Sync
            </button>
          </div>
        ) : !parsedTT || parsedTT.sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
              <CalendarOff className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              No Timetable Data Found
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              There are no class sessions available for the selected academic term.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          <div className="p-6 overflow-x-auto custom-scrollbar flex-1">
            {parsedTT.daysPresent.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                No matching sessions for the selected day filter.
              </div>
            ) : (
              <div className="min-w-[800px] flex flex-col gap-6">
                {parsedTT.daysPresent
                  .filter(
                    (day) =>
                      selectedDayFilter === 'All' || isSameDay(day, selectedDayFilter)
                  )
                  .map((day) => {
                    const daySessions = parsedTT.sessions.filter((s) =>
                      isSameDay(s.day, day)
                    );

                    if (daySessions.length === 0) return null;

                    return (
                      <div
                        key={day}
                        className="bg-zinc-950/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                            <h3 className="text-base font-semibold text-zinc-100">
                              {day}
                            </h3>
                            <span className="text-xs text-zinc-500 font-mono">
                              ({daySessions.length} session{daySessions.length > 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {daySessions.map((session, idx) => (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              key={session.id || idx}
                              className="bg-zinc-900/60 border border-white/10 hover:border-indigo-500/40 p-4 rounded-xl flex flex-col gap-2 group transition-all"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                                  {session.timeSlot}
                                </span>
                                {session.room && (
                                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {session.room}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2 mt-1">
                                {session.courseTitle || session.courseCode || 'Class Session'}
                              </h4>

                              <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-white/5 text-xs text-zinc-400">
                                {session.courseCode && session.courseCode !== session.courseTitle && (
                                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                                    <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="truncate">{session.courseCode}</span>
                                  </div>
                                )}
                                {session.faculty && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                                    <User className="w-3 h-3 text-purple-400 shrink-0" />
                                    <span className="truncate">{session.faculty}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          /* List View Mode */
          <div className="p-6 overflow-x-auto custom-scrollbar flex-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                No matching sessions found for your filter/search criteria.
              </div>
            ) : (
              <table className="w-full text-left whitespace-nowrap border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Day
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Time Slot
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Course Code
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Course Title
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Venue / Room
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Faculty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      key={session.id || idx}
                      className="group bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-semibold text-indigo-400 first:rounded-l-xl border-y border-transparent">
                        {session.day}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-300 border-y border-transparent">
                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                          {session.timeSlot}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-300 border-y border-transparent">
                        {session.courseCode || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-zinc-100 border-y border-transparent max-w-xs truncate">
                        {session.courseTitle || session.courseCode || 'Class Session'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-emerald-400 border-y border-transparent">
                        {session.room ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {session.room}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-400 border-y border-transparent last:rounded-r-xl">
                        {session.faculty || 'N/A'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
