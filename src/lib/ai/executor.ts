import { z } from 'zod';
import { tool, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { MockLanguageModelV4 } from 'ai/test';
import type { ScraperSession } from '@/lib/session';
import {
  fetchAttendanceData,
  fetchTimetableData,
  fetchMarksData,
  fetchFeeData,
  fetchProfileData,
} from '@/lib/scraper';
import { parseTimetable, isSameDay } from '@/lib/timetable-parser';
import { parseCurrency, calculatePendingFee } from '@/lib/fee-utils';
import { mapGradeToPoints } from '@/lib/cgpa';

import {
  getAttendanceArgsSchema,
  getTimetableArgsSchema,
  getMarksArgsSchema,
  getFeeDetailsArgsSchema,
  getStudentProfileArgsSchema,
  calculateAttendanceTargetArgsSchema,
  predictCGPAArgsSchema,
  GetAttendanceResult,
  GetTimetableResult,
  GetMarksResult,
  GetFeeDetailsResult,
  GetStudentProfileResult,
  CalculateAttendanceTargetResult,
  PredictCGPAResult,
  AttendanceSubject,
  FeeItem,
} from './tools';

import {
  DEMO_ATTENDANCE,
  DEMO_TIMETABLE_RAW,
  DEMO_MARKS,
  DEMO_FEE_ITEMS,
  DEMO_PROFILE,
} from '@/lib/fixtures';

// ============================================================================
// Execution Context & Result Interfaces
// ============================================================================

export interface ToolExecutionContext {
  session?: ScraperSession;
  academicYear?: string;
  semesterId?: string;
  isDemo?: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

// ============================================================================
// Tool Executors
// ============================================================================

export async function executeGetAttendance(
  args: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<GetAttendanceResult> {
  const parsedArgs = getAttendanceArgsSchema.parse(args);
  const isDemo =
    context?.isDemo ||
    !context?.session ||
    context.session.csrfToken?.includes('demo') ||
    !context.session.cookies ||
    context.session.cookies.length === 0;

  let attendanceList: AttendanceSubject[] = [];

  if (isDemo) {
    attendanceList = DEMO_ATTENDANCE;
  } else {
    try {
      const year = context.academicYear || '2025-2026';
      const sem = context.semesterId || '1';
      const res = await fetchAttendanceData(
        context.session!,
        context.session!.csrfToken,
        year,
        sem
      );

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        attendanceList = res.data as unknown as AttendanceSubject[];
      } else {
        attendanceList = DEMO_ATTENDANCE;
      }
    } catch {
      attendanceList = DEMO_ATTENDANCE;
    }
  }

  // Filter by subject if specified
  if (parsedArgs.subject && parsedArgs.subject.trim()) {
    const q = parsedArgs.subject.trim().toLowerCase();
    const aliases: Record<string, string[]> = {
      os: ['operating systems', '23cs2104r', 'os'],
      dsa: ['data structures', '23cs2101r', 'dsa'],
      dbms: ['database', '23cs2103r', 'dbms'],
      coa: ['computer organization', '23cs2102r', 'coa'],
    };
    const searchTerms = aliases[q] || [q];

    attendanceList = attendanceList.filter((item) => {
      const code = String(item['Course Code'] || '').toLowerCase();
      const title = String(item['Course Title'] || '').toLowerCase();
      return searchTerms.some((term) => code.includes(term) || title.includes(term));
    });
  }

  // Compute summary stats
  let totalConducted = 0;
  let totalAttended = 0;
  let atRiskCount = 0;

  attendanceList.forEach((item) => {
    const cond = parseFloat(String(item['Conducted Hours'] || '0'));
    const att = parseFloat(String(item['Attended Hours'] || '0'));
    const pct = parseFloat(String(item['Attendance Percentage'] || '0').replace('%', ''));

    if (!isNaN(cond)) totalConducted += cond;
    if (!isNaN(att)) totalAttended += att;
    if (!isNaN(pct) && pct < 75) atRiskCount++;
  });

  const overallPercentage =
    totalConducted > 0
      ? Number(((totalAttended / totalConducted) * 100).toFixed(2))
      : 0;

  return {
    success: true,
    attendance: attendanceList,
    summary: {
      totalSubjects: attendanceList.length,
      overallPercentage,
      atRiskCount,
    },
  };
}

export async function executeGetTimetable(
  args: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<GetTimetableResult> {
  const parsedArgs = getTimetableArgsSchema.parse(args);
  const isDemo =
    context?.isDemo ||
    !context?.session ||
    context.session.csrfToken?.includes('demo') ||
    !context.session.cookies ||
    context.session.cookies.length === 0;

  let rawRows: Record<string, unknown>[] = [];

  if (isDemo) {
    rawRows = DEMO_TIMETABLE_RAW;
  } else {
    try {
      const year = context.academicYear || '2025-2026';
      const sem = context.semesterId || '1';
      const res = await fetchTimetableData(
        context.session!,
        context.session!.csrfToken,
        year,
        sem
      );

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        rawRows = res.data as Record<string, unknown>[];
      } else {
        rawRows = DEMO_TIMETABLE_RAW;
      }
    } catch {
      rawRows = DEMO_TIMETABLE_RAW;
    }
  }

  const parsed = parseTimetable(rawRows);
  let schedule = parsed.sessions;

  if (parsedArgs.day && parsedArgs.day.trim()) {
    let targetDay = parsedArgs.day.trim();
    const lower = targetDay.toLowerCase();

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();

    if (lower === 'today') {
      targetDay = daysOfWeek[now.getDay()];
    } else if (lower === 'tomorrow') {
      targetDay = daysOfWeek[(now.getDay() + 1) % 7];
    }

    schedule = schedule.filter((session) => isSameDay(session.day, targetDay));
  }

  return {
    success: true,
    schedule,
    daysPresent: parsed.daysPresent,
  };
}

export async function executeGetMarks(
  args: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<GetMarksResult> {
  const parsedArgs = getMarksArgsSchema.parse(args);
  const isDemo =
    context?.isDemo ||
    !context?.session ||
    context.session.csrfToken?.includes('demo') ||
    !context.session.cookies ||
    context.session.cookies.length === 0;

  let marksList: Record<string, unknown>[] = [];

  if (isDemo) {
    marksList = DEMO_MARKS;
  } else {
    try {
      const year = context.academicYear || '2025-2026';
      const sem = context.semesterId || parsedArgs.semester || '1';
      const res = await fetchMarksData(
        context.session!,
        context.session!.csrfToken,
        year,
        sem
      );

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        marksList = res.data as Record<string, unknown>[];
      } else {
        marksList = DEMO_MARKS;
      }
    } catch {
      marksList = DEMO_MARKS;
    }
  }

  return {
    success: true,
    marks: marksList as unknown as GetMarksResult['marks'],
  };
}

export async function executeGetFeeDetails(
  args: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<GetFeeDetailsResult> {
  getFeeDetailsArgsSchema.parse(args);
  const isDemo =
    context?.isDemo ||
    !context?.session ||
    context.session.csrfToken?.includes('demo') ||
    !context.session.cookies ||
    context.session.cookies.length === 0;

  let feeRows: Record<string, unknown>[] = [];

  if (isDemo) {
    feeRows = DEMO_FEE_ITEMS as unknown as Record<string, unknown>[];
  } else {
    try {
      const res = await fetchFeeData(context.session!);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        feeRows = res.data as Record<string, unknown>[];
      } else {
        feeRows = DEMO_FEE_ITEMS as unknown as Record<string, unknown>[];
      }
    } catch {
      feeRows = DEMO_FEE_ITEMS as unknown as Record<string, unknown>[];
    }
  }

  let totalAmount = 0;
  let totalPaid = 0;

  const items: FeeItem[] = feeRows.map((row) => {
    const feeType = String(row['Fee Type'] || row['FeeHead'] || 'Fee Item');
    const amountStr = String(row['Amount'] || row['Total'] || '0');
    const paidStr = String(row['Paid Amount'] || row['Paid'] || '0');
    const balStr = String(row['Balance Amount'] || row['Balance'] || '0');
    const status = String(row['Status'] || (parseCurrency(balStr) > 0 ? 'PENDING' : 'PAID'));

    totalAmount += parseCurrency(amountStr);
    totalPaid += parseCurrency(paidStr);

    return {
      'Fee Type': feeType,
      Amount: amountStr,
      'Paid Amount': paidStr,
      'Balance Amount': balStr,
      Status: status,
    };
  });

  const totalPending = calculatePendingFee(feeRows);

  return {
    success: true,
    breakdown: {
      items,
      totalAmount,
      totalPaid,
      totalPending,
      hasPendingDue: totalPending > 0,
    },
  };
}

export async function executeGetStudentProfile(
  args: Record<string, unknown>,
  context?: ToolExecutionContext
): Promise<GetStudentProfileResult> {
  getStudentProfileArgsSchema.parse(args);
  const isDemo =
    context?.isDemo ||
    !context?.session ||
    context.session.csrfToken?.includes('demo') ||
    !context.session.cookies ||
    context.session.cookies.length === 0;

  if (isDemo) {
    return {
      success: true,
      profile: DEMO_PROFILE,
    };
  }

  try {
    const rawRes = (await fetchProfileData(context.session!)) as unknown as {
      name?: string;
      universityId?: string;
      photoUrl?: string;
      extendedProfile?: string | Record<string, unknown>;
      success?: boolean;
    };

    if (rawRes && (rawRes.success !== false) && rawRes.name && rawRes.universityId) {
      let ext: Record<string, unknown> | undefined = undefined;
      if (rawRes.extendedProfile) {
        try {
          ext = typeof rawRes.extendedProfile === 'string'
            ? JSON.parse(rawRes.extendedProfile)
            : (rawRes.extendedProfile as Record<string, unknown>);
        } catch {}
      }

      return {
        success: true,
        profile: {
          name: rawRes.name,
          universityId: rawRes.universityId,
          photoUrl: rawRes.photoUrl || '/logo.png',
          program: DEMO_PROFILE.program,
          department: DEMO_PROFILE.department,
          academicYear: context?.academicYear || '2025-2026',
          semester: context?.semesterId || '1',
          extendedProfile: ext,
        },
      };
    }
  } catch {}

  return {
    success: true,
    profile: DEMO_PROFILE,
  };
}

export function executeCalculateAttendanceTarget(
  args: Record<string, unknown>
): CalculateAttendanceTargetResult {
  const parsed = calculateAttendanceTargetArgsSchema.parse(args);
  const { currentAttended, currentTotal, targetPercent } = parsed;

  const currentPercentage = Number(
    ((currentAttended / currentTotal) * 100).toFixed(2)
  );

  if (currentPercentage < targetPercent) {
    // Needs x classes: (target * T - 100 * A) / (100 - target)
    const denominator = 100 - targetPercent;
    if (denominator <= 0) {
      return {
        success: true,
        currentAttended,
        currentTotal,
        currentPercentage,
        targetPercent,
        classesNeeded: 0,
        maxBunkable: 0,
        status: 'below_target',
        message: `Your current attendance is ${currentPercentage}%. Reaching 100% target is impossible as classes have already been missed.`,
      };
    }
    const numerator = targetPercent * currentTotal - 100 * currentAttended;
    const classesNeeded = Math.max(0, Math.ceil(numerator / denominator));

    return {
      success: true,
      currentAttended,
      currentTotal,
      currentPercentage,
      targetPercent,
      classesNeeded,
      maxBunkable: 0,
      status: 'below_target',
      message: `Your current attendance is ${currentPercentage}%. You need to attend the next ${classesNeeded} consecutive class(es) to reach your target of ${targetPercent}%.`,
    };
  }

  // Target met. Calculate max bunkable b: (100 * A - target * T) / target
  const numerator = 100 * currentAttended - targetPercent * currentTotal;
  const denominator = targetPercent;
  const maxBunkable = denominator > 0 ? Math.max(0, Math.floor(numerator / denominator)) : 0;

  return {
    success: true,
    currentAttended,
    currentTotal,
    currentPercentage,
    targetPercent,
    classesNeeded: 0,
    maxBunkable,
    status: 'target_met',
    message: `Your current attendance is ${currentPercentage}%, which meets your target of ${targetPercent}%. You can safely skip up to ${maxBunkable} class(es).`,
  };
}

export function executePredictCGPA(
  args: Record<string, unknown>
): PredictCGPAResult {
  const parsed = predictCGPAArgsSchema.parse(args);
  const { currentCGPA, completedCredits, newCourses } = parsed;

  const currentPoints = currentCGPA * completedCredits;

  let newPoints = 0;
  let newCredits = 0;

  for (const course of newCourses) {
    const pts = mapGradeToPoints(course.expectedGrade);
    const gradePts = pts !== null ? pts : 8; // Fallback to A (8.0) if unmapped
    newPoints += gradePts * course.credits;
    newCredits += course.credits;
  }

  const totalCredits = completedCredits + newCredits;
  const totalPoints = currentPoints + newPoints;

  const predictedCGPA =
    totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : currentCGPA;

  const gpaDelta = Number((predictedCGPA - currentCGPA).toFixed(2));

  return {
    success: true,
    currentCGPA,
    completedCredits,
    newCredits,
    totalCredits,
    predictedCGPA,
    gpaDelta,
  };
}

// ============================================================================
// Main Dispatcher: executeTool
// ============================================================================

export async function executeTool(
  toolName: string,
  args: unknown,
  context?: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const safeArgs = (typeof args === 'object' && args !== null ? args : {}) as Record<
    string,
    unknown
  >;

  try {
    switch (toolName) {
      case 'getAttendance': {
        const res = await executeGetAttendance(safeArgs, context);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      case 'getTimetable': {
        const res = await executeGetTimetable(safeArgs, context);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      case 'getMarks': {
        const res = await executeGetMarks(safeArgs, context);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      case 'getFeeDetails': {
        const res = await executeGetFeeDetails(safeArgs, context);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      case 'getStudentProfile': {
        const res = await executeGetStudentProfile(safeArgs, context);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      case 'calculateAttendanceTarget': {
        const res = executeCalculateAttendanceTarget(safeArgs);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      case 'predictCGPA': {
        const res = executePredictCGPA(safeArgs);
        return { success: true, tool: toolName, args: safeArgs, result: res };
      }
      default:
        return {
          success: false,
          tool: toolName,
          args: safeArgs,
          error: `Unknown tool name: ${toolName}`,
        };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      tool: toolName,
      args: safeArgs,
      error: `Execution error in ${toolName}: ${errorMsg}`,
    };
  }
}

// ============================================================================
// Vercel AI SDK Tool Definitions & Execution Engine
// ============================================================================

export function createErpTools(context?: ToolExecutionContext) {
  return {
    getAttendance: tool({
      description:
        'Fetch attendance records for the student. Optionally filter by course code or subject title.',
      parameters: getAttendanceArgsSchema,
      execute: async (args: z.infer<typeof getAttendanceArgsSchema>) => executeGetAttendance(args, context),
    } as unknown as Parameters<typeof tool>[0]),
    getTimetable: tool({
      description:
        'Fetch class timetable and schedule. Optionally filter by day of the week.',
      parameters: getTimetableArgsSchema,
      execute: async (args: z.infer<typeof getTimetableArgsSchema>) => executeGetTimetable(args, context),
    } as unknown as Parameters<typeof tool>[0]),
    getMarks: tool({
      description:
        'Fetch internal examination and assignment marks for student courses.',
      parameters: getMarksArgsSchema,
      execute: async (args: z.infer<typeof getMarksArgsSchema>) => executeGetMarks(args, context),
    } as unknown as Parameters<typeof tool>[0]),
    getFeeDetails: tool({
      description:
        'Fetch fee payment details, fee heads, total fee, paid amount, and pending balance.',
      parameters: getFeeDetailsArgsSchema,
      execute: async (args: z.infer<typeof getFeeDetailsArgsSchema>) => executeGetFeeDetails(args, context),
    } as unknown as Parameters<typeof tool>[0]),
    getStudentProfile: tool({
      description:
        'Fetch student profile details including name, university ID, program, and department.',
      parameters: getStudentProfileArgsSchema,
      execute: async (args: z.infer<typeof getStudentProfileArgsSchema>) => executeGetStudentProfile(args, context),
    } as unknown as Parameters<typeof tool>[0]),
    calculateAttendanceTarget: tool({
      description:
        'Calculate number of additional classes needed to reach target attendance percentage or bunkable classes.',
      parameters: calculateAttendanceTargetArgsSchema,
      execute: async (args: z.infer<typeof calculateAttendanceTargetArgsSchema>) => executeCalculateAttendanceTarget(args),
    } as unknown as Parameters<typeof tool>[0]),
    predictCGPA: tool({
      description:
        'Predict future cumulative GPA (CGPA) based on current CGPA, credits, and expected grades.',
      parameters: predictCGPAArgsSchema,
      execute: async (args: z.infer<typeof predictCGPAArgsSchema>) => executePredictCGPA(args),
    } as unknown as Parameters<typeof tool>[0]),
  };
}

export function getMockLanguageModel(userQuery: string) {
  const q = userQuery.toLowerCase().trim();
  let toolCall: { toolName: string; args: Record<string, unknown> } | null = null;

  if (
    q.includes('target') ||
    q.includes('how many classes') ||
    q.includes('bunk') ||
    q.includes('need for') ||
    q.includes('need to attend') ||
    q.includes('classes needed') ||
    q.includes('need to reach') ||
    q.includes('miss')
  ) {
    toolCall = {
      toolName: 'calculateAttendanceTarget',
      args: { currentAttended: 33, currentTotal: 40, targetPercent: 75 },
    };
  } else if (
    q.includes('cgpa') ||
    q.includes('sgpa') ||
    q.includes('gpa') ||
    q.includes('predict') ||
    q.includes('grade roadmap')
  ) {
    toolCall = {
      toolName: 'predictCGPA',
      args: {
        currentCGPA: 8.42,
        completedCredits: 72,
        newCourses: [
          { credits: 4, expectedGrade: 'O' },
          { credits: 3, expectedGrade: 'A+' },
        ],
      },
    };
  } else if (
    q.includes('attendance') ||
    q.includes('present') ||
    q.includes('absent') ||
    q.includes('conducted')
  ) {
    let subject: string | undefined = undefined;
    if (q.includes('os') || q.includes('operating system')) subject = 'OS';
    else if (q.includes('dsa') || q.includes('data structure')) subject = '23CS2101R';
    else if (q.includes('dbms') || q.includes('database')) subject = '23CS2103R';
    else if (q.includes('coa') || q.includes('architecture')) subject = '23CS2102R';

    toolCall = {
      toolName: 'getAttendance',
      args: subject ? { subject } : {},
    };
  } else if (
    q.includes('timetable') ||
    q.includes('schedule') ||
    q.includes('class') ||
    q.includes('classes today') ||
    q.includes('tomorrow') ||
    q.includes('period') ||
    q.includes('room')
  ) {
    let day = 'Today';
    if (q.includes('tomorrow')) day = 'Tomorrow';
    else if (q.includes('monday') || q.includes('mon')) day = 'Monday';
    else if (q.includes('tuesday') || q.includes('tue')) day = 'Tuesday';
    else if (q.includes('wednesday') || q.includes('wed')) day = 'Wednesday';
    else if (q.includes('thursday') || q.includes('thu')) day = 'Thursday';
    else if (q.includes('friday') || q.includes('fri')) day = 'Friday';

    toolCall = {
      toolName: 'getTimetable',
      args: { day },
    };
  } else if (
    q.includes('fee') ||
    q.includes('dues') ||
    q.includes('payment') ||
    q.includes('balance') ||
    q.includes('tuition') ||
    q.includes('pending')
  ) {
    toolCall = {
      toolName: 'getFeeDetails',
      args: {},
    };
  } else if (
    q.includes('mark') ||
    q.includes('score') ||
    q.includes('internal') ||
    q.includes('exam') ||
    q.includes('assignment')
  ) {
    toolCall = {
      toolName: 'getMarks',
      args: {},
    };
  } else if (
    q.includes('profile') ||
    q.includes('student info') ||
    q.includes('roll number') ||
    q.includes('university id') ||
    q.includes('who am i') ||
    q.includes('my details')
  ) {
    toolCall = {
      toolName: 'getStudentProfile',
      args: {},
    };
  }

  return new MockLanguageModelV4({
    doGenerate: (async () => {
      if (toolCall) {
        return {
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: 'tool-calls' as const,
          usage: {
            inputTokens: { total: 10 },
            outputTokens: { total: 10 },
          },
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'call_' + Date.now(),
              toolName: toolCall.toolName,
              input: JSON.stringify(toolCall.args),
            },
          ],
          warnings: [],
        };
      }
      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: 'stop' as const,
        usage: {
          inputTokens: { total: 10 },
          outputTokens: { total: 10 },
        },
        content: [
          {
            type: 'text' as const,
            text:
              'I am KL Sync Copilot, your AI assistant for KL University. You can ask me about:\n\n' +
              '- 🎯 **Attendance**: *"What is my attendance in OS?"* or *"How many classes can I miss?"*\n' +
              '- 📅 **Timetable**: *"Show my classes today"* or *"What is my schedule for tomorrow?"*\n' +
              '- 📝 **Marks**: *"Show internal exam marks"* or *"What are my scores?"*\n' +
              '- 💳 **Fee Details**: *"Show fee balance"* or *"How much fee do I owe?"*\n' +
              '- 🎓 **CGPA**: *"Predict CGPA"* or *"Generate grade roadmap"*',
          },
        ],
        warnings: [],
      };
    }) as unknown as MockLanguageModelV4['doGenerate'],
  });
}

export async function processAIChat(
  messages: Array<{ role: string; content: string }>,
  context?: ToolExecutionContext
) {
  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage?.content || '';

  const tools = createErpTools(context);
  const model =
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ''
      ? openai('gpt-4o')
      : getMockLanguageModel(userQuery);

  const sdkResult = await generateText({
    model,
    tools,
    prompt: userQuery,
  });

  const toolCalls: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
  }> = [];

  if (sdkResult.toolResults && sdkResult.toolResults.length > 0) {
    for (const tr of sdkResult.toolResults) {
      const trObj = tr as unknown as { args?: Record<string, unknown>; input?: Record<string, unknown>; output?: Record<string, unknown>; result?: Record<string, unknown> };
      const args = (trObj.args || trObj.input || {}) as Record<string, unknown>;
      const result = (trObj.output ?? trObj.result ?? {}) as Record<string, unknown>;
      toolCalls.push({
        tool: tr.toolName,
        args,
        result: result || { success: true },
      });
    }
  }

  let assistantResponseText = sdkResult.text || '';

  if (!assistantResponseText && toolCalls.length > 0) {
    const firstCall = toolCalls[0];
    switch (firstCall.tool) {
      case 'getAttendance': {
        const res = firstCall.result as {
          attendance?: Array<Record<string, string>>;
          summary?: { totalSubjects: number; overallPercentage: number; atRiskCount: number };
        };
        if (res && res.attendance && res.attendance.length > 0) {
          const items = res.attendance
            .map(
              (item) =>
                `- **${item['Course Title'] || item['Course Code']}**: **${item['Attendance Percentage']}** (${item['Attended Hours']}/${item['Conducted Hours']} hrs)`
            )
            .join('\n');
          const summaryText = res.summary
            ? `\n\nOverall Attendance: **${res.summary.overallPercentage}%** across ${res.summary.totalSubjects} subjects.${res.summary.atRiskCount > 0 ? ` ⚠️ **${res.summary.atRiskCount} subject(s)** are below 75% target!` : ' ✅ All subjects are in good standing.'}`
            : '';
          assistantResponseText = `Here is your attendance record:\n\n${items}${summaryText}`;
        } else {
          assistantResponseText = `No attendance records found matching your query.`;
        }
        break;
      }

      case 'getTimetable': {
        const res = firstCall.result as {
          schedule?: Array<{
            day: string;
            timeSlot: string;
            courseCode: string;
            courseTitle: string;
            room: string;
            faculty: string;
          }>;
        };
        if (res && res.schedule && res.schedule.length > 0) {
          const list = res.schedule
            .slice(0, 8)
            .map(
              (s) =>
                `- **${s.day} (${s.timeSlot})**: ${s.courseTitle || s.courseCode} @ ${s.room}${s.faculty ? ` (${s.faculty})` : ''}`
            )
            .join('\n');
          assistantResponseText = `Here is your schedule:\n\n${list}`;
        } else {
          assistantResponseText = `No classes scheduled for the selected day.`;
        }
        break;
      }

      case 'getMarks': {
        const res = firstCall.result as {
          marks?: Array<Record<string, string>>;
        };
        if (res && res.marks && res.marks.length > 0) {
          const list = res.marks
            .map(
              (m) =>
                `- **${m['Course Name'] || m['Course Code']}**: Internal 1: ${m['Internal 1'] || 'N/A'}, Internal 2: ${m['Internal 2'] || 'N/A'}, Assignment: ${m['Assignment'] || 'N/A'} (Total: **${m['Total Marks'] || 'N/A'}**)`
            )
            .join('\n');
          assistantResponseText = `Here are your internal marks:\n\n${list}`;
        } else {
          assistantResponseText = `No internal evaluation marks records found.`;
        }
        break;
      }

      case 'getFeeDetails': {
        const res = firstCall.result as {
          breakdown?: {
            items: Array<{
              'Fee Type': string;
              Amount: string;
              'Paid Amount': string;
              'Balance Amount': string;
              Status: string;
            }>;
            totalAmount: number;
            totalPaid: number;
            totalPending: number;
            hasPendingDue: boolean;
          };
        };
        if (res && res.breakdown) {
          const b = res.breakdown;
          const items = b.items
            .map(
              (i) =>
                `- **${i['Fee Type']}**: Total ₹${i.Amount} | Paid ₹${i['Paid Amount']} | Pending **₹${i['Balance Amount']}** (${i.Status})`
            )
            .join('\n');
          const alert = b.hasPendingDue
            ? `\n\n⚠️ You have an outstanding fee balance of **₹${b.totalPending.toLocaleString('en-IN')}**.`
            : `\n\n✅ All fees are fully paid!`;
          assistantResponseText = `Here is your fee breakdown:\n\n${items}${alert}`;
        } else {
          assistantResponseText = `Unable to fetch fee breakdown.`;
        }
        break;
      }

      case 'getStudentProfile': {
        const res = firstCall.result as {
          profile?: { name: string; universityId: string; program?: string; department?: string };
        };
        if (res && res.profile) {
          const p = res.profile;
          assistantResponseText = `**Student Profile**:\n- **Name**: ${p.name}\n- **ID**: ${p.universityId}\n- **Program**: ${p.program || 'N/A'}\n- **Department**: ${p.department || 'N/A'}`;
        } else {
          assistantResponseText = `Student profile details retrieved.`;
        }
        break;
      }

      case 'calculateAttendanceTarget': {
        const res = firstCall.result as {
          message?: string;
        };
        if (res && res.message) {
          assistantResponseText = res.message;
        }
        break;
      }

      case 'predictCGPA': {
        const res = firstCall.result as {
          currentCGPA?: number;
          predictedCGPA?: number;
          gpaDelta?: number;
          totalCredits?: number;
        };
        if (res && typeof res.predictedCGPA === 'number') {
          const sign = (res.gpaDelta || 0) >= 0 ? '+' : '';
          assistantResponseText = `🎯 **CGPA Forecast**:\n- Current CGPA: **${res.currentCGPA}**\n- Predicted CGPA: **${res.predictedCGPA}** (${sign}${res.gpaDelta})\n- Total Credits: **${res.totalCredits}**`;
        }
        break;
      }

      default:
        assistantResponseText = `Executed tool ${firstCall.tool} successfully.`;
    }
  }

  if (!assistantResponseText) {
    assistantResponseText =
      `I am KL Sync Copilot, your AI assistant for KL University. You can ask me about:\n\n` +
      `- 🎯 **Attendance**: *"What is my attendance in OS?"* or *"How many classes can I miss?"*\n` +
      `- 📅 **Timetable**: *"Show my classes today"* or *"What is my schedule for tomorrow?"*\n` +
      `- 📝 **Marks**: *"Show internal exam marks"* or *"What are my scores?"*\n` +
      `- 💳 **Fee Details**: *"Show fee balance"* or *"How much fee do I owe?"*\n` +
      `- 🎓 **CGPA**: *"Predict CGPA"* or *"Generate grade roadmap"*`;
  }

  return {
    assistantResponseText,
    toolCalls,
  };
}

