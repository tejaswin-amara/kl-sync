'use client';

function Card({ className, children }: any) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-zinc-950/50 text-zinc-100 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
function CardHeader({ className, children }: any) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
}
function CardTitle({ className, children }: any) {
  return (
    <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
}
function CardDescription({ className, children }: any) {
  return <p className={`text-sm text-zinc-400 ${className}`}>{children}</p>;
}
function CardContent({ className, children }: any) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

function Alert({ variant = 'default', className, children }: any) {
  const vClass =
    variant === 'destructive'
      ? 'border-red-500/50 text-red-500 [&>svg]:text-red-500'
      : 'bg-background text-foreground';
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 ${vClass} ${className}`}
    >
      {children}
    </div>
  );
}
function AlertTitle({ className, children }: any) {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
}
function AlertDescription({ className, children }: any) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
      {children}
    </div>
  );
}
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface SimpleCalculatorProps {
  totalClasses: number;
  presents: number;
}

interface ComponentState {
  percentage: number | null;
}

interface ComponentsState {
  lecture: ComponentState;
  tutorial: ComponentState;
  practical: ComponentState;
  skilling: ComponentState;
}

interface LTPSCalculatorProps {
  components: ComponentsState;
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

  // Calculate how many classes are needed to maintain 75% attendance (for bunking)
  const minRequiredFor75 = Math.ceil(totalClasses * 0.75);

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

  // Calculate percentage if maximum classes are missed
  const percentageIfMaxMissed =
    ((presents - classesCanMiss) / totalClasses) * 100;

  // Check if attendance is at least 75%
  const hasMinimumAttendance = percentage >= 75;

  // Determine the color based on attendance policy
  const getAttendanceColor = () => {
    if (percentage >= 85) return 'text-green-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-red-500';
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
        <Card className="bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Attendance Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-bold ${attendanceColor}`}>
                {percentage.toFixed(2)}%
              </span>
              <span className={`text-sm font-medium ${attendanceColor}`}>
                ({attendanceStatus})
              </span>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {percentage >= 85 ? (
        <div className="always-glow-success">
          <Alert className="bg-background/90 backdrop-blur-sm">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Eligible</AlertTitle>
            <AlertDescription>
              Your attendance is above the minimum required 85%. You are
              eligible to appear for the examination.
            </AlertDescription>
          </Alert>
        </div>
      ) : percentage >= 75 ? (
        <div className="always-glow-warning">
          <Alert
            variant="default"
            className="bg-yellow-500/10 border-yellow-500/20 backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Conditional Eligibility</AlertTitle>
            <AlertDescription>
              Your attendance is between 75% and 85%. You need to pay a
              condonation fine to be eligible for the examination.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="always-glow-danger">
          <Alert variant="destructive" className="backdrop-blur-sm">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Not Eligible</AlertTitle>
            <AlertDescription>
              Your attendance is below 75%. You may face detention and will not
              be eligible to appear for the examination.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export function LTPSCalculator({ components }: LTPSCalculatorProps) {
  const calculateClassesFromPercentage = (
    percentage: number | null
  ): { total: number; present: number } => {
    if (percentage === null) return { total: 0, present: 0 };
    // Assuming a base of 100 for calculations
    const total = 100;
    const present = Math.round((percentage / 100) * total);
    return { total, present };
  };

  const calculateFinalAttendance = () => {
    const lecture = calculateClassesFromPercentage(
      components.lecture.percentage
    );
    const tutorial = calculateClassesFromPercentage(
      components.tutorial.percentage
    );
    const practical = calculateClassesFromPercentage(
      components.practical.percentage
    );
    const skilling = calculateClassesFromPercentage(
      components.skilling.percentage
    );

    // Track which components are provided by the user
    const hasLecture = components.lecture.percentage !== null;
    const hasTutorial = components.tutorial.percentage !== null;
    const hasPractical = components.practical.percentage !== null;
    const hasSkilling = components.skilling.percentage !== null;

    // Calculate total weight of provided components
    let totalWeight = 0;
    if (hasLecture) totalWeight += 1.0; // Lecture weight: 100%
    if (hasTutorial) totalWeight += 0.25; // Tutorial weight: 25%
    if (hasPractical) totalWeight += 0.5; // Practical weight: 50%
    if (hasSkilling) totalWeight += 0.25; // Skilling weight: 25%

    // If no components are provided, return 0
    if (totalWeight === 0) return 0;

    // Calculate weighted sum only for provided components
    let weightedSum = 0;
    if (hasLecture) weightedSum += (lecture.present / lecture.total) * 1.0;
    if (hasTutorial) weightedSum += (tutorial.present / tutorial.total) * 0.25;
    if (hasPractical)
      weightedSum += (practical.present / practical.total) * 0.5;
    if (hasSkilling) weightedSum += (skilling.present / skilling.total) * 0.25;

    // Calculate final percentage based on provided components only
    const finalPercentage = (weightedSum / totalWeight) * 100;
    return finalPercentage;
  };

  const finalPercentage = calculateFinalAttendance();

  // Determine the color based on attendance policy
  const getAttendanceColor = () => {
    if (finalPercentage >= 85) return 'text-green-500';
    if (finalPercentage >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAttendanceStatus = () => {
    if (finalPercentage >= 85) return 'Eligible';
    if (finalPercentage >= 75) return 'Conditional Eligibility';
    return 'Not Eligible';
  };

  const attendanceColor = getAttendanceColor();
  const attendanceStatus = getAttendanceStatus();

  return (
    <div className="space-y-6">
      <div
        className={
          finalPercentage >= 85
            ? 'always-glow-success'
            : finalPercentage >= 75
              ? 'always-glow-warning'
              : 'always-glow-danger'
        }
      >
        <Card className="bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Final Attendance</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-bold ${attendanceColor}`}>
                {finalPercentage.toFixed(2)}%
              </span>
              <span className={`text-sm font-medium ${attendanceColor}`}>
                ({attendanceStatus})
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-500/10 p-2 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
                <div>
                  <h3 className="font-medium">Attendance Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Your final attendance is calculated based on the following
                    weights:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2">
                    {components.lecture.percentage !== null && (
                      <li>Lecture: 100%</li>
                    )}
                    {components.tutorial.percentage !== null && (
                      <li>Tutorial: 25%</li>
                    )}
                    {components.practical.percentage !== null && (
                      <li>Practical: 50%</li>
                    )}
                    {components.skilling.percentage !== null && (
                      <li>Skilling: 25%</li>
                    )}
                  </ul>
                  {!components.lecture.percentage &&
                    !components.tutorial.percentage &&
                    !components.practical.percentage &&
                    !components.skilling.percentage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Please enter at least one component&apos;s attendance to
                        calculate the final percentage.
                      </p>
                    )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {finalPercentage >= 85 ? (
        <div className="always-glow-success">
          <Alert className="bg-background/90 backdrop-blur-sm">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Eligible</AlertTitle>
            <AlertDescription>
              Your attendance is above the minimum required 85%. You are
              eligible to appear for the examination.
            </AlertDescription>
          </Alert>
        </div>
      ) : finalPercentage >= 75 ? (
        <div className="always-glow-warning">
          <Alert
            variant="default"
            className="bg-yellow-500/10 border-yellow-500/20 backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Conditional Eligibility</AlertTitle>
            <AlertDescription>
              Your attendance is between 75% and 85%. You need to pay a
              condonation fine to be eligible for the examination.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="always-glow-danger">
          <Alert variant="destructive" className="backdrop-blur-sm">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Not Eligible</AlertTitle>
            <AlertDescription>
              Your attendance is below 75%. You may face detention and will not
              be eligible to appear for the examination.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
