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
  // Using the correct formula: (100 * present - percentage * total) / percentage
  const calculateClassesCanMiss = (targetPercentage: number) => {
    if (percentage < targetPercentage) return 0;

    const numerator = 100 * presents - targetPercentage * totalClasses;
    const denominator = targetPercentage;

    if (denominator === 0) return 0; // Avoid division by zero

    const classesCanMiss = Math.floor(numerator / denominator);
    return Math.max(0, classesCanMiss);
  };

  const classesCanMiss = calculateClassesCanMiss(75);

  // CORRECTED: Calculate classes needed to reach 75% and 85%
  // Using the correct formula: (percentage * total - 100 * present) / (100 - percentage)
  const calculateClassesNeeded = (targetPercentage: number) => {
    if (percentage >= targetPercentage) return 0;

    const numerator = targetPercentage * totalClasses - 100 * presents;
    const denominator = 100 - targetPercentage;

    if (denominator === 0) return 0; // Avoid division by zero

    const classesNeeded = Math.ceil(numerator / denominator);
    return Math.max(0, classesNeeded);
  };

  const classesToAttend75 = calculateClassesNeeded(75);
  const classesToAttend85 = calculateClassesNeeded(85);

  // Determine the color based on attendance policy
  const getAttendanceColor = () => {
    if (percentage >= 85) return 'text-emerald-400';
    if (percentage >= 75) return 'text-amber-300';
    return 'text-red-300';
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
      <div
        className={
          percentage >= 85
            ? 'always-glow-success'
            : percentage >= 75
              ? 'always-glow-warning'
              : 'always-glow-danger'
        }
      >
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 text-zinc-100 shadow-sm bg-card/90 backdrop-blur-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight text-2xl">
              Attendance Analysis
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-bold ${attendanceColor}`}>
                {percentage.toFixed(2)}%
              </span>
              <span className={`text-sm font-medium ${attendanceColor}`}>
                ({attendanceStatus})
              </span>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-500/10 p-2 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
                <div>
                  <h3 className="font-medium">Classes you can miss</h3>
                  <p className="text-sm text-muted-foreground">
                    {classesCanMiss > 0 ? (
                      <>
                        You can miss <strong>{classesCanMiss}</strong> more
                        classes and still maintain 75% attendance.
                        <br />
                        Current:{' '}
                        <strong>
                          {presents}/{totalClasses}
                        </strong>{' '}
                        → <strong>{percentage.toFixed(2)}%</strong>
                        <br />
                        After missing:{' '}
                        <strong>
                          {presents}/{totalClasses + classesCanMiss}
                        </strong>{' '}
                        →{' '}
                        <strong>
                          {(
                            (presents / (totalClasses + classesCanMiss)) *
                            100
                          ).toFixed(2)}
                          %
                        </strong>
                      </>
                    ) : (
                      'You cannot miss any more classes while maintaining 75% attendance.'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-red-500/10 p-2 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
                <div>
                  <h3 className="font-medium">Classes needed for 75%</h3>
                  <p className="text-sm text-muted-foreground">
                    {classesToAttend75 > 0 ? (
                      <>
                        You need to attend <strong>{classesToAttend75}</strong>{' '}
                        more classes to reach 75% attendance.
                        <br />
                        Current:{' '}
                        <strong>
                          {presents}/{totalClasses}
                        </strong>{' '}
                        → <strong>{percentage.toFixed(2)}%</strong>
                        <br />
                        After attending:{' '}
                        <strong>
                          {presents + classesToAttend75}/
                          {totalClasses + classesToAttend75}
                        </strong>{' '}
                        →{' '}
                        <strong>
                          {(
                            ((presents + classesToAttend75) /
                              (totalClasses + classesToAttend75)) *
                            100
                          ).toFixed(2)}
                          %
                        </strong>
                      </>
                    ) : (
                      'You have already reached 75% attendance.'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-red-500/10 p-2 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
                <div>
                  <h3 className="font-medium">Classes needed for 85%</h3>
                  <p className="text-sm text-muted-foreground">
                    {classesToAttend85 > 0 ? (
                      <>
                        You need to attend <strong>{classesToAttend85}</strong>{' '}
                        more classes to reach 85% attendance.
                        <br />
                        Current:{' '}
                        <strong>
                          {presents}/{totalClasses}
                        </strong>{' '}
                        → <strong>{percentage.toFixed(2)}%</strong>
                        <br />
                        After attending:{' '}
                        <strong>
                          {presents + classesToAttend85}/
                          {totalClasses + classesToAttend85}
                        </strong>{' '}
                        →{' '}
                        <strong>
                          {(
                            ((presents + classesToAttend85) /
                              (totalClasses + classesToAttend85)) *
                            100
                          ).toFixed(2)}
                          %
                        </strong>
                      </>
                    ) : (
                      'You have already reached 85% attendance.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {percentage >= 85 ? (
        <div className="always-glow-success">
          <div
            role="alert"
            className="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 bg-background text-foreground bg-background/90 backdrop-blur-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              Eligible
            </h5>
            <div className="text-sm [&_p]:leading-relaxed">
              Your attendance is above the minimum required 85%. You are
              eligible to appear for the examination.
            </div>
          </div>
        </div>
      ) : percentage >= 75 ? (
        <div className="always-glow-warning">
          <div
            role="alert"
            className="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 bg-background text-foreground bg-yellow-500/10 border-yellow-500/20 backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4 text-amber-300" />
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              Conditional Eligibility
            </h5>
            <div className="text-sm [&_p]:leading-relaxed">
              Your attendance is between 75% and 85%. You need to pay a
              condonation fine to be eligible for the examination.
            </div>
          </div>
        </div>
      ) : (
        <div className="always-glow-danger">
          <div
            role="alert"
            className="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 border-red-500/50 text-red-300 [&>svg]:text-red-300 backdrop-blur-sm"
          >
            <XCircle className="h-4 w-4" />
            <h5 className="mb-1 font-medium leading-none tracking-tight">
              Not Eligible
            </h5>
            <div className="text-sm [&_p]:leading-relaxed">
              Your attendance is below 75%. You may face detention and will not
              be eligible to appear for the examination.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

