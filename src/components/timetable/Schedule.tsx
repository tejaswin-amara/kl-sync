import React from 'react';
import { MapPin } from '@/components/ui/icons';
import { ParsedTimetable, isSameDay } from '@/lib/timetable-parser';
import { getSubjectTitle, getSubjectCode } from '@/lib/course-utils';

interface ScheduleProps {
  parsedTT: ParsedTimetable;
  selectedDayFilter: string;
  searchQuery: string;
}

function getComponentColor(component?: string) {
  const comp = component?.toLowerCase() || '';
  if (comp.includes('lecture')) {
    return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
  } else if (comp.includes('skill')) {
    return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  } else if (comp.includes('practical')) {
    return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
  } else if (comp.includes('vac') || comp.includes('sports')) {
    return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
  } else if (comp.includes('audit')) {
    return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
  }
  return 'bg-primary/10 text-primary border border-primary/20';
}

export function Schedule({ parsedTT, selectedDayFilter, searchQuery }: ScheduleProps) {
  // 13 Period Grid for T05
  const slotsToRender = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daysToRender = allDays.filter((day) => {
    if (selectedDayFilter !== 'All') {
      return day === selectedDayFilter;
    }
    if (day === 'Sunday') {
      return parsedTT.daysPresent.some((d) => isSameDay(d, 'Sunday'));
    }
    return true;
  });

  if (parsedTT.daysPresent.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No matching sessions for the selected day filter.
      </div>
    );
  }

  return (
    <div className="w-full min-w-max flex flex-col gap-6">
      <div className="bg-surface-2/30 border border-border rounded-[--radius-2xl] overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-2/60 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="p-4 sticky left-0 z-20 bg-surface-1/95 backdrop-blur-md min-w-[120px] border-r border-border text-primary text-center">
                Day / Period
              </th>
              {slotsToRender.map((periodNum) => (
                <th key={periodNum} scope="col" className="p-3.5 text-center min-w-[170px] border-r border-border last:border-r-0 text-foreground font-semibold">
                  {periodNum === '6' ? (
                    <div className="flex flex-col">
                      <span>Period 6</span>
                      <span className="text-[9px] font-normal text-muted-foreground">12:40 PM - 01:20 PM</span>
                    </div>
                  ) : (
                    `Period ${periodNum}`
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {daysToRender.map((day) => (
              <tr key={day} className="hover:bg-surface-2/70 transition-colors">
                <th scope="row" className="p-4 sticky left-0 z-10 bg-surface-1/95 backdrop-blur-md font-bold text-xs text-foreground border-r border-border text-center whitespace-nowrap">
                  {day}
                </th>
                {slotsToRender.map((periodNum) => {
                  if (periodNum === '6') {
                    return (
                      <td key={periodNum} className="p-2 border-r border-border align-middle text-center bg-surface-2/20">
                        <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                          Lunch Break
                        </span>
                      </td>
                    );
                  }

                  const matchingSessions = (parsedTT.matrixGrid[day]?.[periodNum] || []).filter((session) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return (
                      session.courseCode.toLowerCase().includes(q) ||
                      session.courseTitle.toLowerCase().includes(q) ||
                      session.room.toLowerCase().includes(q) ||
                      session.faculty.toLowerCase().includes(q)
                    );
                  });

                  return (
                    <td key={periodNum} className="p-2 border-r border-border last:border-r-0 align-top min-w-[170px]">
                      {matchingSessions.length > 0 ? (
                        <div className="flex flex-col gap-2 h-full">
                          {matchingSessions.map((session, sIdx) => {
                            const subjectTitle = getSubjectTitle(session.courseCode, session.courseTitle);
                            const subjectCode = getSubjectCode(session.courseCode, session.rawText);

                            return (
                              <div key={session.id || `${session.courseCode}-${sIdx}`} className="bg-surface-2/60 border border-border hover:border-primary/40 p-3 rounded-[--radius-lg] flex flex-col justify-between gap-2 shadow-md transition-all overflow-hidden min-h-[96px] group touch-manipulation active:scale-[0.98]">
                                <div className="flex items-center justify-between gap-1">
                                  {session.component && (
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getComponentColor(session.component)}`}>
                                      {session.component}
                                    </span>
                                  )}
                                  {session.section && (
                                    <span className="text-[9px] font-mono bg-surface-3 text-muted-foreground px-1.5 py-0.5 rounded-full">
                                      {session.section}
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 overflow-hidden tracking-tight">
                                  {subjectTitle}
                                </h5>
                                <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground pt-1.5 border-t border-border mt-auto">
                                  <span className="font-mono text-muted-foreground font-medium truncate">
                                    {subjectCode}
                                  </span>
                                  {session.room && (
                                    <span className="text-success font-semibold flex items-center gap-0.5 shrink-0 ml-auto">
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
                        <div className="h-24 rounded-[--radius-lg] border border-dashed border-border flex items-center justify-center text-muted-foreground/30 text-xs">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
