'use client';

import { AlertCircle, CheckCircle2, XCircle } from '@/components/ui/icons';

interface SimpleCalculatorProps {
  totalClasses: number;
  presents: number;
}

export function SimpleCalculator({
  totalClasses,
  presents,
}: SimpleCalculatorProps) {
  const calculatePercentage = () => {
    if (totalClasses === 0) return 0;
    return (presents / totalClasses) * 100;
  };

  const percentage = calculatePercentage();

  // Calculate how many classes can be missed while still maintaining 75%
  const calculateClassesCanMiss = (targetPercentage: number) => {
    if (percentage < targetPercentage) return 0;
    const numerator = 100 * presents - targetPercentage * totalClasses;
    const denominator = targetPercentage;
    if (denominator === 0) return 0;
    const classesCanMiss = Math.floor(numerator / denominator);
    return Math.max(0, classesCanMiss);
  };

  const classesCanMiss = calculateClassesCanMiss(75);

  // Calculate classes needed to reach 75% and 85%
  const calculateClassesNeeded = (targetPercentage: number) => {
    if (percentage >= targetPercentage) return 0;
    const numerator = targetPercentage * totalClasses - 100 * presents;
    const denominator = 100 - targetPercentage;
    if (denominator === 0) return 0;
    const classesNeeded = Math.ceil(numerator / denominator);
    return Math.max(0, classesNeeded);
  };

  const classesToAttend75 = calculateClassesNeeded(75);
  const classesToAttend85 = calculateClassesNeeded(85);

  // Determine the color based on attendance policy
  const getAttendanceColor = () => {
    if (percentage >= 85) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getAttendanceStatus = () => {
    if (percentage >= 85) return 'Eligible';
    if (percentage >= 75) return 'Conditional Eligibility';
    return 'Not Eligible';
  };

  const attendanceColor = getAttendanceColor();
  const attendanceStatus = getAttendanceStatus();

  return (
    <div className="space-y-6">
      <div className="apple-card rounded-[--radius-2xl] p-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col space-y-2 mb-6">
          <h3 className="section-title text-foreground">
            Attendance Analysis
          </h3>
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-bold tabular-numbers tracking-tight font-heading ${attendanceColor}`}>
              {percentage.toFixed(2)}%
            </span>
            <span className={`text-sm font-semibold tracking-tight ${attendanceColor}`}>
              ({attendanceStatus})
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-3 rounded-[--radius-lg] bg-white/4 border border-white/6">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-foreground tracking-tight">Classes you can miss</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {classesCanMiss > 0 ? (
                  <>
                    You can miss <strong className="text-foreground font-semibold tabular-numbers">{classesCanMiss}</strong> more
                    classes and still maintain 75% attendance.
                    <br />
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      Current: <span className="tabular-numbers text-foreground">{presents}/{totalClasses}</span> ({percentage.toFixed(2)}%) → After: <span className="tabular-numbers text-foreground">{presents}/{totalClasses + classesCanMiss}</span> ({((presents / (totalClasses + classesCanMiss)) * 100).toFixed(2)}%)
                    </span>
                  </>
                ) : (
                  'You cannot miss any more classes while maintaining 75% attendance.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-[--radius-lg] bg-white/4 border border-white/6">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-foreground tracking-tight">Classes needed for 75%</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {classesToAttend75 > 0 ? (
                  <>
                    You need to attend <strong className="text-foreground font-semibold tabular-numbers">{classesToAttend75}</strong> more classes to reach 75% attendance.
                    <br />
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      Current: <span className="tabular-numbers text-foreground">{presents}/{totalClasses}</span> ({percentage.toFixed(2)}%) → After: <span className="tabular-numbers text-foreground">{presents + classesToAttend75}/{totalClasses + classesToAttend75}</span> ({(((presents + classesToAttend75) / (totalClasses + classesToAttend75)) * 100).toFixed(2)}%)
                    </span>
                  </>
                ) : (
                  'You have already reached 75% attendance.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-[--radius-lg] bg-white/4 border border-white/6">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-foreground tracking-tight">Classes needed for 85%</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {classesToAttend85 > 0 ? (
                  <>
                    You need to attend <strong className="text-foreground font-semibold tabular-numbers">{classesToAttend85}</strong> more classes to reach 85% attendance.
                    <br />
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      Current: <span className="tabular-numbers text-foreground">{presents}/{totalClasses}</span> ({percentage.toFixed(2)}%) → After: <span className="tabular-numbers text-foreground">{presents + classesToAttend85}/{totalClasses + classesToAttend85}</span> ({(((presents + classesToAttend85) / (totalClasses + classesToAttend85)) * 100).toFixed(2)}%)
                    </span>
                  </>
                ) : (
                  'You have already reached 85% attendance.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {percentage >= 85 ? (
        <div
          role="alert"
          className="relative w-full rounded-[--radius-xl] border border-success/35 bg-success/10 p-4 text-sm flex items-start gap-3 shadow-lg"
        >
          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-foreground tracking-tight">Eligible</h5>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Your attendance is above the minimum required 85%. You are eligible to appear for the examination.
            </p>
          </div>
        </div>
      ) : percentage >= 75 ? (
        <div
          role="alert"
          className="relative w-full rounded-[--radius-xl] border border-warning/35 bg-warning/10 p-4 text-sm flex items-start gap-3 shadow-lg"
        >
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-foreground tracking-tight">Conditional Eligibility</h5>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Your attendance is between 75% and 85%. You need to pay a condonation fine to be eligible for the examination.
            </p>
          </div>
        </div>
      ) : (
        <div
          role="alert"
          className="relative w-full rounded-[--radius-xl] border border-destructive/35 bg-destructive/10 p-4 text-sm flex items-start gap-3 shadow-lg"
        >
          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-foreground tracking-tight">Not Eligible</h5>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Your attendance is below 75%. You may face detention and will not be eligible to appear for the examination.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
