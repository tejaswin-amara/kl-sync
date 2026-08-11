'use client';

import { useState } from 'react';
import { useAcademicSession } from '@/hooks/useAcademicSession';

import { exportTableToCSV } from '@/lib/utils';
import {
  isSameDay,
  normalizeSlotKey,
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
  RefreshCw,
  Filter,
} from 'lucide-react';

import { useTimetable } from '@/hooks/useTimetable';

function parseTimeSlotToMinutes(slot: string): number {
  if (!slot) return 9999;
  const key = normalizeSlotKey(slot);
  const num = Number(key);
  if (!isNaN(num)) {
    return num * 60;
  }

  const match = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  return 9999;
}

function getSlotsToRender(parsedTT: ParsedTimetable | null): string[] {
  if (!parsedTT || !parsedTT.timeSlotsPresent) {
    return Array.from({ length: 8 }, (_, i) => String(i + 1));
  }

  const sortedTimeSlots = [...parsedTT.timeSlotsPresent].sort((a, b) => {
    const keyA = normalizeSlotKey(a);
    const keyB = normalizeSlotKey(b);
    const numA = Number(keyA);
    const numB = Number(keyB);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    const minA = parseTimeSlotToMinutes(a);
    const minB = parseTimeSlotToMinutes(b);
    if (minA !== minB) {
      return minA - minB;
    }
    return a.localeCompare(b);
  });

  const numericSlots = sortedTimeSlots
    .map((s) => Number(normalizeSlotKey(s)))
    .filter((n) => !isNaN(n) && n > 0);

  if (numericSlots.length > 0) {
    const maxNum = Math.max(...numericSlots, 8);
    const minNum = Math.min(...numericSlots, 1);
    const fullRange: string[] = [];
    for (let i = minNum; i <= maxNum; i++) {
      fullRange.push(String(i));
    }
    const nonNumeric = sortedTimeSlots.filter((s) =>
      isNaN(Number(normalizeSlotKey(s)))
    );
    return [...fullRange, ...nonNumeric];
  } else if (sortedTimeSlots.length > 0) {
    return sortedTimeSlots;
  } else {
    return Array.from({ length: 8 }, (_, i) => String(i + 1));
  }
}

export default function TimetablePage() {
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

  const { data: parsedTT, isLoading: loading, error: fetchError, mutate } = useTimetable(selectedYear, selectedSem);
  const displayError = (fetchError ? fetchError.message : null) || sessionError;

  const daysList = [
    'All',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

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
    exportTableToCSV(
      exportData,
      `Timetable_${selectedYear}_${selectedSem}.csv`
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Student Timetable
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive weekly schedule synced securely from the ERP.
          </p>
        </div>

        {/* Controls: Year, Semester, View Toggle, Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-300 hover:text-zinc-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-300 hover:text-zinc-100'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl shadow-lg">
            <div className="relative">
              <select
                aria-label="Filter by year"
                className="appearance-none bg-transparent border-none rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-h-[44px]"
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
              >
                {years.map((y) => (
                  <option
                    key={y.value}
                    value={y.value}
                    className="bg-zinc-900 text-zinc-100"
                  >
                    {y.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300 pointer-events-none" />
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="relative">
              <select
                aria-label="Filter by semester"
                className="appearance-none bg-transparent border-none rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-h-[44px]"
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
              >
                {semesters.map((s) => (
                  <option
                    key={s.value}
                    value={s.value}
                    className="bg-zinc-900 text-zinc-100"
                  >
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!parsedTT || parsedTT.sessions.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50 min-h-[44px]"
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
          <Filter className="w-4 h-4 text-zinc-300 ml-2 mr-1 shrink-0" />
          {daysList.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-h-[44px] ${
                selectedDayFilter === day
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/5'
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
                <div
                  key={i}
                  className="h-8 w-24 bg-zinc-800/40 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-full bg-zinc-800/30 rounded-xl animate-pulse"
                ></div>
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
              onClick={() => mutate()}
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
              There are no class sessions available for the selected academic
              term.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Horizontal Academic Matrix Grid View Mode */
          <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar flex-1 w-full">
            {parsedTT.daysPresent.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                No matching sessions for the selected day filter.
              </div>
            ) : (
              <div className="w-full min-w-max flex flex-col gap-6">
                <div className="bg-zinc-950/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/80 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                        <th
                          scope="col"
                          className="p-4 sticky left-0 z-20 bg-zinc-900/95 backdrop-blur-md min-w-[120px] border-r border-white/10 text-indigo-400 text-center"
                        >
                          Day / Period
                        </th>
                        {getSlotsToRender(parsedTT).map((periodNum) => (
                          <th
                            scope="col"
                            key={periodNum}
                            className="p-3.5 text-center min-w-[170px] border-r border-white/5 last:border-r-0 text-zinc-200"
                          >
                            {periodNum.length < 3 &&
                            !periodNum.toLowerCase().includes('p')
                              ? `Period ${periodNum}`
                              : periodNum}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const allDays = [
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                          'Sunday',
                        ];
                        const daysToRender = allDays.filter((day) => {
                          if (selectedDayFilter !== 'All') {
                            return day === selectedDayFilter;
                          }
                          if (day === 'Sunday') {
                            return parsedTT.daysPresent.some((d) =>
                              isSameDay(d, 'Sunday')
                            );
                          }
                          return true;
                        });

                        const slotsToRender = getSlotsToRender(parsedTT);

                        return daysToRender.map((day) => {
                          return (
                            <tr
                              key={day}
                              className="hover:bg-white/[0.02] transition-colors"
                            >
                              {/* Sticky Day Column */}
                              <th
                                scope="row"
                                className="p-4 sticky left-0 z-10 bg-zinc-950/90 backdrop-blur-md font-bold text-xs text-zinc-200 border-r border-white/10 text-center whitespace-nowrap"
                              >
                                {day}
                              </th>

                              {/* Period Columns for this Day */}
                              {slotsToRender.map((periodNum) => {
                                const matchingSessions =
                                  parsedTT.matrixGrid[day]?.[periodNum] || [];

                                return (
                                  <td
                                    key={periodNum}
                                    className="p-2 border-r border-white/5 last:border-r-0 align-top min-w-[170px]"
                                  >
                                    {matchingSessions.length > 0 ? (
                                      <div className="flex flex-col gap-2 h-full">
                                        {matchingSessions.map((session, sIdx) => {
                                          const hasDistinctTitle =
                                            session.courseTitle &&
                                            session.courseTitle.trim().toUpperCase() !==
                                              session.courseCode.trim().toUpperCase();

                                          return (
                                            <div
                                              key={session.id || `${session.courseCode}-${sIdx}`}
                                              className="bg-zinc-900/80 border border-white/10 hover:border-indigo-500/50 p-3 rounded-xl flex flex-col justify-between gap-2 shadow-md transition-all overflow-hidden min-h-[96px] group"
                                            >
                                              <div className="flex items-center justify-between gap-1">
                                                {session.component && (
                                                  <span
                                                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                                      session.component === 'Lecture'
                                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                                        : session.component === 'Practical'
                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                        : session.component === 'Skill'
                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    }`}
                                                  >
                                                    {session.component}
                                                  </span>
                                                )}
                                                {session.section && (
                                                  <span className="text-[9px] font-mono bg-white/10 text-zinc-300 px-1 py-0.5 rounded">
                                                    {session.section}
                                                  </span>
                                                )}
                                              </div>

                                              <h5 className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2 overflow-hidden">
                                                {hasDistinctTitle ? session.courseTitle : session.courseCode}
                                              </h5>

                                              <div className="flex items-center justify-between gap-1 text-[10px] text-zinc-400 pt-1.5 border-t border-white/5 mt-auto">
                                                <span className="font-mono text-zinc-400 truncate">
                                                  {hasDistinctTitle ? session.courseCode : ''}
                                                </span>
                                                {session.room && (
                                                  <span className="text-emerald-400 font-medium flex items-center gap-0.5 shrink-0 ml-auto">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {session.room}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="h-24 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-zinc-700 text-xs">
                                        -
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
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
                      Period / Slot
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Course Code
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Course Title
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5">
                      Component & Section
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
                    <tr
                      key={session.id || idx}
                      className="group bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-semibold text-indigo-400 first:rounded-l-xl border-y border-transparent">
                        {session.day}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-300 border-y border-transparent">
                        <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                          Period{' '}
                          {String(session.timeSlot || '')
                            .replace(/^Period\s*/i, '')
                            .trim()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-zinc-300 border-y border-transparent">
                        {session.courseCode || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-zinc-100 border-y border-transparent max-w-xs truncate">
                        {session.courseTitle ||
                          session.courseCode ||
                          'Class Session'}
                      </td>
                      <td className="px-4 py-3.5 text-xs border-y border-transparent">
                        <div className="flex items-center gap-1.5">
                          {session.component && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                              {session.component}
                            </span>
                          )}
                          {session.section && (
                            <span className="text-[10px] font-mono bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                              {session.section}
                            </span>
                          )}
                        </div>
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
                    </tr>
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
