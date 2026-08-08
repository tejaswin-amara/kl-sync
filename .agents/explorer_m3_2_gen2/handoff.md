# Handoff Report — M3 AI Chat API Route Explorer (`explorer_m3_2_gen2`)

## 1. Observation

Direct observations from codebase inspection:
- **Framework & Directory Structure**: Next.js 16.2.9 App Router with route handlers under `src/app/api/`. Existing routes include `src/app/api/login/route.ts`, `src/app/api/erp-proxy/[module]/route.ts`, `src/app/api/fetch-photo/route.ts`, `src/app/api/captcha/route.ts`.
- **Dynamic Route Declaration**: Existing routes export `export const dynamic = 'force-dynamic';` (`src/app/api/login/route.ts:6`, `src/app/api/erp-proxy/[module]/route.ts:16`).
- **Session Decoding**: `decodeSession` imported from `@/lib/session` accepts `token: string | null | undefined` and handles AES-256-GCM (`enc.`) and Base64 (`b64.`) prefixed tokens with fallback to demo session (`src/lib/session.ts:44-75`).
- **Cookie Extraction**: Existing routes inspect `request.cookies.get('kl_erp_session')?.value` (`src/app/api/erp-proxy/[module]/route.ts:37`) and header `x-session-id`.
- **Interface Contract**: `PROJECT.md` specifies `POST /api/ai/chat` request payload `{ messages: { role: string, content: string }[], sessionId?: string, academicYear?: string, semesterId?: string }` and response payload `{ success: boolean, message: { role: 'assistant', content: string }, toolCalls?: Array<{ tool: string, args: object, result: object }> }` (`PROJECT.md:63-66`).
- **Unit Testing Suite**: Tests in `src/app/api/erp-proxy.test.ts` use Node native test runner (`node:test` & `node:assert/strict`) with Next.js `NextRequest`.

---

## 2. Logic Chain

1. **Route Handler Setup**:
   - *Observation*: `src/app/api/erp-proxy/[module]/route.ts` exports `export const dynamic = 'force-dynamic';` and `export async function POST(request: NextRequest)`.
   - *Deduction*: `/api/ai/chat/route.ts` must mirror this exact structure to prevent static caching and accept incoming POST requests from the Copilot UI (`AIChatSheet` / `AIChatDialog`).

2. **Session Cookie Propagation**:
   - *Observation*: `decodeSession` in `src/lib/session.ts` decodes `kl_erp_session` cookie into `ScraperSession`.
   - *Deduction*: `/api/ai/chat/route.ts` must read `request.cookies.get('kl_erp_session')?.value`, `x-session-id`, or `body.sessionId`, decode it via `decodeSession()`, and pass the resulting session object to all tool executions (`getAttendance`, `getMarks`, etc.) so live ERP queries authenticate correctly.

3. **Context Injection & System Prompt**:
   - *Observation*: System prompt rules require student persona, academic term context, session status (live vs demo), and guidance on tool invocation.
   - *Deduction*: Route handler will dynamically assemble a system prompt with `academicYear`, `semesterId`, and student profile data before invoking the execution engine.

4. **Dual Execution Engine & Fallback Strategy**:
   - *Observation*: Tests and `agent-as-judge` scripts require robust execution both with and without external LLM API keys.
   - *Deduction*: Route handler will implement a dual execution strategy: (1) External LLM completion API if API key is present, (2) Local Agent Executor (`src/lib/ai/executor.ts`) as a deterministic fallback. If live ERP fails or times out, tool execution will return mock/cached data and explain the state gracefully to the student without throwing 500 error.

5. **Structured Response Generation**:
   - *Observation*: Contract 3 in `PROJECT.md` dictates `{ success: true, message: { role: 'assistant', content }, toolCalls: [...] }`.
   - *Deduction*: Route handler will format outputs into this exact JSON structure to ensure seamless client compatibility.

---

## 3. Caveats

- `src/lib/ai/tools.ts` and `src/lib/ai/executor.ts` are being designed concurrently by peer subagent `explorer_m3_1_gen2`. The route handler imports from `@/lib/ai/executor` and `@/lib/ai/tools` according to the agreed interface contract.
- External LLM provider API keys (`OPENAI_API_KEY`, etc.) may not be present in environment during local testing; the local intent matcher fallback guarantees tests pass offline.

---

## 4. Conclusion

The architecture for `/api/ai/chat/route.ts` is fully defined, fully compatible with Next.js 16 App Router standards, and cleanly integrated with KL Sync's encrypted session cookies (`kl_erp_session`), agent tool executor (`src/lib/ai/executor.ts`), and client UI contracts.

Recommended Implementation Steps for Implementer:
1. Create `src/app/api/ai/chat/route.ts` using the POST handler pattern, `decodeSession` session extraction, dynamic system prompt injection, and dual execution strategy.
2. Create `src/app/api/ai-chat.test.ts` using Node native test runner to verify API route endpoints, error handling, session propagation, and tool execution.

---

## 5. Verification Method

To verify the implementation once created:
1. Run static analysis: `npx tsc --noEmit`
2. Run ESLint: `npm run lint`
3. Run unit test suite: `npx tsx --test src/app/api/ai-chat.test.ts`
4. Run full project test suite: `npm run test`
