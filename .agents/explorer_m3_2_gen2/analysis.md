# Milestone 3 (M3) AI Chat API Route Technical Analysis

## Executive Summary
This document defines the architecture, design patterns, and concrete implementation plan for the **AI Copilot Chat Route Handler** (`/api/ai/chat/route.ts`). As part of Milestone 3 (Agentic AI Capabilities & Tooling), this route serves as the primary backend entry point for all AI interactions, natural language ERP querying, attendance risk analysis, CGPA calculations, and automated advice in KL Sync.

---

## 1. Next.js App Router API Route Handler Inspection

### 1.1 Existing Patterns in `src/app/api/`
Inspection of existing routes (`src/app/api/login/route.ts`, `src/app/api/erp-proxy/[module]/route.ts`, `src/app/api/fetch-photo/route.ts`) reveals the following established project conventions:

- **Dynamic Execution**: All API route handlers export `export const dynamic = 'force-dynamic';` to prevent Next.js static page optimization.
- **App Router Handlers**: Handlers export typed async HTTP method handlers, e.g. `export async function POST(request: NextRequest)`.
- **Request Body Parsing**: Handlers safely parse JSON with `const body = await request.json()`.
- **Response Format**: Standardized JSON responses using `NextResponse.json(data, { status })`.
- **Error Status Mapping**:
  - `200 OK`: Successful requests and handled AI responses.
  - `400 Bad Request`: Missing/malformed `messages` array, invalid CSRF, or missing required parameters.
  - `401 Unauthorized`: Session expired or invalid session token.
  - `500 Internal Server Error`: Unhandled server-side exception.
  - `502 Bad Gateway`: Network/upstream ERP connection failure.
  - `504 Gateway Timeout`: ERP or AI provider request timeout.

---

## 2. Session Cookie Propagation (`kl_erp_session`)

### 2.1 Decryption & Extraction Strategy
KL Sync encrypts session cookies using AES-256-GCM (`encodeSession` / `decodeSession` in `@/lib/session`). To ensure the AI agent can query real live ERP data on behalf of logged-in students, `/api/ai/chat/route.ts` will resolve the session using a multi-tiered fallback strategy:

1. **HTTP Cookie**: `request.cookies.get('kl_erp_session')?.value` (Primary httpOnly cookie).
2. **Custom Header**: `request.headers.get('x-session-id')`.
3. **Request Body**: `body.sessionId` or `body.session_id`.
4. **Query Parameter**: `request.nextUrl.searchParams.get('sessionId')`.

```typescript
import { decodeSession, ScraperSession } from '@/lib/session';

// Extract raw session token
const sessionCookie = request.cookies.get('kl_erp_session')?.value;
const sessionToken = sessionCookie || request.headers.get('x-session-id') || body.sessionId;

// Decode AES-256-GCM / Base64 session
let session: ScraperSession;
try {
  session = decodeSession(sessionToken);
} catch {
  // Graceful fallback to demo session if token is unparseable
  session = {
    cookies: [{ name: 'PHPSESSID', value: 'demo_phpsessid_123' }],
    csrfToken: 'demo_csrf_token_123',
    userAgent: 'Mozilla/5.0',
  };
}
```

---

## 3. Agent Context Injection

### 3.1 Context Payload Components
When constructing the conversation context for the AI engine, the route handler must inject dynamic system prompt context:

1. **System Persona & Role**: "You are KL Sync Copilot, an AI assistant for KL University students."
2. **Student Identity**: Name, University ID, Program (if profile is cached or fetched).
3. **Academic Term Context**: `academicYear` (default: `'2025-2026'`) and `semesterId` (default: `'1'`).
4. **Session Mode**: Indicates whether the session is live authenticated ERP vs. demo mode.
5. **Tool Capability Rules**: Guidance on when and how to invoke the 7 ERP tools (`getAttendance`, `getTimetable`, `getMarks`, `getFeeDetails`, `getStudentProfile`, `calculateAttendanceTarget`, `predictCGPA`).

```typescript
function buildSystemPrompt(context: {
  academicYear?: string;
  semesterId?: string;
  isDemo?: boolean;
}): string {
  return `You are KL Sync Copilot, an agentic AI assistant for KL University students.
Your primary role is to assist students with data querying (Attendance, Timetable, Marks, CGPA, Fees), workflow automation, attendance risk advice, and academic planning.

Context:
- Current Academic Year: ${context.academicYear || '2025-2026'}
- Current Semester: ${context.semesterId || '1'}
- Session Mode: ${context.isDemo ? 'Demo Mode (Offline/Sample Data)' : 'Live ERP Authenticated Session'}

Guidelines:
1. Always be concise, helpful, and student-focused.
2. When students ask about attendance below 75%, warn them of condonation/detention risks.
3. If data is queried, invoke the appropriate ERP tool and present the numbers clearly.
4. Format financial details (fees) in Indian Rupees (₹).`;
}
```

---

## 4. Tool Call Routing & Execution Architecture

### 4.1 Integration with `src/lib/ai/`
The API route handler delegates tool routing to the Agent Toolkit Registry (`src/lib/ai/tools.ts`) and Executor (`src/lib/ai/executor.ts`).

```
[Client POST /api/ai/chat]
        │
        ▼
[Route Handler: /api/ai/chat/route.ts]
        │
        ├── 1. Extract session & parameters (academicYear, semesterId)
        ├── 2. Inject system prompt & context
        │
        ▼
[Execution Engine Choice]
 ├── Tier 1: LLM Provider (OpenAI/Anthropic/Gemini) if API key set
 └── Tier 2: Local Agent Executor (Intent Matcher + Tools) if offline/no key
        │
        ▼
[Tool Call Execution]
 ├── getAttendance() ──────────► scrapers/attendance.ts
 ├── getTimetable() ───────────► scrapers/timetable.ts
 ├── getMarks() ───────────────► scrapers/marks.ts
 ├── getFeeDetails() ──────────► scrapers/fee.ts
 ├── getStudentProfile() ──────► scrapers/profile.ts
 ├── calculateAttendanceTarget()► lib/scraper.ts (attendance target math)
 └── predictCGPA() ────────────► lib/cgpa.ts
        │
        ▼
[Structured Response Synthesis]
 └── Return { success: true, message: { role: 'assistant', content }, toolCalls: [...] }
```

---

## 5. Dual Execution Engine & Graceful Fallback Strategy

### 5.1 Dual Execution Architecture
To guarantee zero-dependency execution in testing environments, local CI, and production:

1. **Primary (External LLM API)**: Uses standard completion or tool-calling API if `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY` is present.
2. **Fallback (Local Intent Matcher & Tool Executor)**: If no API key is configured or the external API call times out/fails, the handler routes through `executeAgentTool` / local intent classifier in `src/lib/ai/executor.ts`.

### 5.2 ERP Service Unavailability Fallback
When live ERP is down or returns errors (e.g. 502/504 or network timeout):
- Scraper wrappers catch lower-level network errors and return mock/cached demo data.
- The AI response informs the user clearly:
  *"Live ERP is currently unreachable. Displaying cached/sample data for your request."*
- The route handler returns HTTP 200 with this graceful explanation rather than failing with an unhandled 500 error.

---

## 6. Structured Response API Contract

### 6.1 Request & Response Types
Complies strictly with Interface Contract 3 (`PROJECT.md`):

**Request (`POST /api/ai/chat`)**:
```json
{
  "messages": [
    { "role": "user", "content": "What is my attendance in OS?" }
  ],
  "sessionId": "enc.xyz...",
  "academicYear": "2025-2026",
  "semesterId": "1"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "Your Operating Systems (23CS2101R) attendance is **88.89%** (40/45 hours attended)."
  },
  "toolCalls": [
    {
      "tool": "getAttendance",
      "args": { "subject": "OS" },
      "result": {
        "success": true,
        "attendance": [
          {
            "Course Code": "23CS2101R",
            "Course Title": "Data Structures & Algorithms",
            "Conducted Hours": "45",
            "Attended Hours": "40",
            "Attendance Percentage": "88.89%"
          }
        ]
      }
    }
  ]
}
```

---

## 7. Concrete Implementation & Verification Plan

### 7.1 Files to Implement
1. `src/app/api/ai/chat/route.ts`: Main Next.js App Router route handler.
2. `src/app/api/ai-chat.test.ts`: Node native test runner unit tests covering:
   - Successful chat response generation.
   - Bad Request (400) on invalid payload.
   - Tool execution with `kl_erp_session` cookie propagation.
   - Graceful fallback when ERP/AI service is offline.
