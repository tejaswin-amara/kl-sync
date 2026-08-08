# Milestone 3 (M3): AI Copilot UI & Workflow Automation Analysis

## 1. Executive Summary
This analysis details the UI architecture, navigation integration, natural language querying flow, and workflow automation specifications for Milestone 3 (M3: Agentic AI Capabilities & Tooling). The design leverages existing UI primitives (`Sheet`, `Dialog`, `Badge`, `Button`, `AriaLiveRegion`) and integrates seamlessly into the responsive dashboard layout (`Navigation.tsx` & `layout.tsx`).

---

## 2. Navigation Shell & Dashboard Layout Inspection

### 2.1 Component Structure in `src/components/Navigation.tsx`
`Navigation.tsx` is the primary layout wrapper for all `/dashboard/*` routes. It provides a multi-device responsive layout shell:
1. **Desktop Sidebar (`aside.hidden.lg:flex`)**: Fixed left navigation bar, width `260px` (expanded) or `68px` (collapsed).
2. **Desktop Header (`header.hidden.lg:flex`)**: Top status bar containing page title, current semester badge, notification bell icon, and user profile avatar.
3. **Mobile Header (`header.lg:hidden.fixed.top-0`)**: Fixed top bar (`height: --header-height`) with hamburger menu trigger, logo, notification bell, and avatar.
4. **Mobile Slide-Over Drawer (`aside.fixed.top-0.left-0`)**: Slide-in navigation drawer for mobile screens.
5. **Mobile Bottom Tab Bar (`nav.lg:hidden.fixed.bottom-0`)**: Fixed bottom bar (`height: --bottom-bar-height`, ~60px + safe area padding) showing 4 primary links + "More" overflow menu.
6. **Main Content Container (`main`)**: Scrollable container (`id="main-content"`) with dynamic padding to account for top header and mobile bottom bar.

### 2.2 Integration Strategy for `<AICopilot />`
- **Location**: `src/components/Navigation.tsx` (rendered inside the main wrapper) or `src/app/dashboard/layout.tsx` (wrapping `<Navigation>`). Placing `<AICopilot />` directly inside `Navigation.tsx` ensures instant availability across all 12 dashboard sub-routes without manual imports per page.
- **Header Triggers**:
  - **Desktop Header (line 461)**: Add an AI Copilot action button (`<button aria-label="Open AI Copilot"><Sparkles className="w-4 h-4 text-primary" /></button>`) next to the Notification Bell icon.
  - **Mobile Header (line 190)**: Add an AI Copilot action button next to the Bell icon in the mobile top bar.
- **Floating Action Button (FAB) Positioning**:
  - Positioned at `fixed right-4 bottom-20 lg:right-6 lg:bottom-6 z-40`.
  - On mobile, `bottom-20` (~80px) elevates the button above the fixed bottom tab bar (`--bottom-bar-height`), preventing touch target overlap.
  - On desktop, `bottom-6` anchors it cleanly in the lower-right corner.
- **Global Keyboard Shortcut**:
  - Register `Ctrl+Shift+A` or `Cmd+K` listener at top-level `AICopilot` component to open/close the Copilot sheet or dialog.

---

## 3. AI Copilot UI Component Architecture (`src/components/ai/`)

The AI Copilot UI consists of three primary components in `src/components/ai/`:

```
src/components/ai/
├── AICopilot.tsx          # Root container, floating trigger button, keyboard shortcuts & state manager
├── AIChatSheet.tsx        # Slide-over drawer view (using Sheet primitive)
├── AIChatDialog.tsx       # Centered modal view (using Dialog primitive)
└── components/            # Internal subcomponents (or embedded in components)
    ├── AIChatMessageList.tsx       # Message history, markdown cards, tool result cards
    ├── AIChatSuggestionChips.tsx   # Instant prompt chips
    ├── AIToolExecutionIndicator.tsx # Tool execution status pill & spinner
    └── AIChatInput.tsx             # Query textarea, submit trigger, aria-live integration
```

### 3.1 `AICopilot.tsx` Specification
- **Responsibilities**:
  - Manages global Copilot state: `isOpen` (boolean), `mode` (`'sheet'` | `'dialog'`), `messages` (array of `ChatMessage`), `status` (`'idle'` | `'thinking'` | `'executing_tool'` | `'error'`), `activeTool` (tool name & args).
  - Listens for global hotkey (`Ctrl+Shift+A` / `Cmd+K`) to toggle drawer/dialog.
  - Renders Floating Action Button (FAB) with badge/status ring.
  - Renders top header trigger button in `Navigation.tsx`.
  - Sends query requests to `/api/ai/chat` via `fetch` API.
  - Dispatches announcements via `useAriaAnnounce()` when AI starts thinking, finishes response, or hits an error.
- **State Schema**:
  ```ts
  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    toolCalls?: {
      tool: string;
      args: Record<string, unknown>;
      result?: Record<string, unknown>;
      status: 'executing' | 'success' | 'error';
    }[];
    quickActions?: { label: string; query: string }[];
  }
  ```

### 3.2 `AIChatSheet.tsx` Specification
- **Wrapper**: Built using `@/components/ui/sheet` (`Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`).
- **Props**:
  ```ts
  interface AIChatSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messages: ChatMessage[];
    status: 'idle' | 'thinking' | 'executing_tool' | 'error';
    activeTool?: string;
    onSendMessage: (query: string) => void;
    onClearChat: () => void;
    onToggleDialogMode?: () => void;
  }
  ```
- **UI Elements**:
  - Header: Sparkles icon, title ("KL Sync AI Copilot"), status badge ("AI Active"), expand-to-modal button, close button.
  - Body: Scrollable message container (`AIChatMessageList`), tool execution indicator (`AIToolExecutionIndicator`), suggestion chips (`AIChatSuggestionChips`).
  - Footer: `AIChatInput` with send button and character limit indicator.

### 3.3 `AIChatDialog.tsx` Specification
- **Wrapper**: Built using `@/components/ui/dialog` (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`).
- **Props**: Identical interface to `AIChatSheetProps`.
- **UI Elements**:
  - Modal container (`max-w-2xl w-full h-[600px] flex flex-col glass-panel`).
  - Header: Title, switch-to-drawer button (`Sheet` icon), close button.
  - Body: Expanded scrollable chat area with rich cards for attendance risk callouts and CGPA roadmap charts.
  - Footer: Command-bar style input box with keyboard hints (`Enter` to send, `Esc` to close).

### 3.4 Auxiliary Subcomponents
1. **`AIChatMessageList`**:
   - User messages: Right-aligned indigo bubbles.
   - Assistant messages: Left-aligned glassmorphic cards with avatar.
   - Tool Execution Cards: Interactive collapsible callouts for tool outputs (e.g. `getAttendance` result card showing percentage bar, `getFeeDetails` card showing paid vs balance).
2. **`AIChatSuggestionChips`**:
   - Horizontal scrolling/wrap pills:
     - 🎯 *"What is my attendance in OS?"*
     - 💳 *"Show fee balance"*
     - 📈 *"Calculate target for 75%"*
     - 🎓 *"Generate CGPA roadmap"*
     - 📅 *"Show today's timetable"*
3. **`AIToolExecutionIndicator`**:
   - Renders pulse loader: `⚡ Fetching attendance for OS via getAttendance...`
4. **`AIChatInput`**:
   - `textarea` with auto-growing height.
   - Submit button (`Send` icon) disabled when query is empty or `status !== 'idle'`.

---

## 4. Natural Language Querying Plan

Natural language queries interact with the backend route `POST /api/ai/chat`. The client formats user intent and handles returned tool execution results.

### 4.1 Query Processing Matrix
| Natural Language Query Example | System Intent | Tool Call | Formatted Response Schema |
|---|---|---|---|
| *"What is my attendance in OS?"* | Attendance Inquiry | `getAttendance({ subject: "OS" })` | "Your attendance in **Operating Systems (CS2001)** is **82.5%** (33/40 classes). You can miss **3** more classes while maintaining 75%." |
| *"Show fee balance"* / *"How much fee do I owe?"* | Fee Details | `getFeeDetails()` | "Your pending fee balance is **₹15,000** (Due: 15-Aug-2026). Total Fee: ₹1,20,000 | Paid: ₹1,05,000." |
| *"What classes do I have today?"* | Timetable Inquiry | `getTimetable({ day: "Today" })` | "You have **3 classes** today: 1. OS (09:00 AM, C301), 2. CN Lab (11:00 AM, L204), 3. DBMS (02:00 PM, C302)." |
| *"What is my SGPA / CGPA?"* | Academic Marks | `getMarks({})` / `getStudentProfile()` | "Your current CGPA is **8.42** across **72 completed credits** (Sem 1 SGPA: 8.50, Sem 2 SGPA: 8.35)." |

### 4.2 Error & Resilience Handling
- If ERP data fetching fails (e.g. network 502/504), response gracefully states: "Unable to retrieve live attendance right now. Please check back shortly or refresh your session."
- Screen reader announce: Trigger `useAriaAnnounce("AI response received", "polite")` when response resolves.

---

## 5. Workflow Automation & Smart Advice Engine

### 5.1 Attendance Risk Warning & Target Calculator
- **Automated Detection Rules**:
  - When `getAttendance` returns subject attendance:
    - `< 75%`: **Critical Risk (Detention Danger)**. Highlight red alert badge.
    - `75% - 85%`: **Conditional Risk (Condonation Warning)**. Highlight yellow warning badge.
    - `> 85%`: **Good Standing (Eligible)**. Highlight green success badge.
- **Mathematical Formula Integration**:
  - Formula for classes needed to reach target $T\%$ ($T = 75$ or $85$):
    $$\text{Classes Needed} = \left\lceil \frac{T \cdot \text{Total} - 100 \cdot \text{Present}}{100 - T} \right\rceil$$
  - Formula for classes student can miss while staying above $T\%$:
    $$\text{Classes Can Miss} = \left\lfloor \frac{100 \cdot \text{Present} - T \cdot \text{Total}}{T} \right\rfloor$$
- **Copilot Card Rendering**:
  - Automatically appends an **Attendance Recovery Roadmap** card inside the assistant bubble:
    - Current: 15/22 (68.18%) → Target: 75.0%
    - Recommendation: "Attend the next **6 consecutive classes** without missing to reach 75.0% (21/28)."

### 5.2 CGPA Improvement Roadmap & Target Calculator
- **Automated CGPA Roadmap Execution**:
  - Step 1: Query current CGPA $C_{\text{curr}}$ and earned credits $K_{\text{curr}}$ via `getMarks({})` or `getStudentProfile()`.
  - Step 2: Accept user target CGPA $C_{\text{target}}$ (e.g. 8.5) and upcoming semester credits $K_{\text{new}}$ (e.g. 20 credits).
  - Step 3: Calculate required SGPA for upcoming semester $S_{\text{req}}$:
    $$S_{\text{req}} = \frac{C_{\text{target}} \cdot (K_{\text{curr}} + K_{\text{new}}) - (C_{\text{curr}} \cdot K_{\text{curr}})}{K_{\text{new}}}$$
  - Step 4: Map $S_{\text{req}}$ to subject grade requirements:
    - If $S_{\text{req}} > 10.0$: Warn user that target is mathematically impossible in one semester, and suggest a 2-semester roadmap.
    - If $S_{\text{req}} \le 10.0$: Generate course grade allocation table (e.g. 3 courses with 'S' grade (10 pts), 2 courses with 'A+' grade (9 pts)).
- **Copilot Card Rendering**:
  - Interactive **CGPA Target Roadmap Card** with progress bar, target grade distribution, and action checklist.

---

## 6. Implementation Verification Strategy

1. **Static Code Analysis**:
   - `npx tsc --noEmit` must pass with 0 errors.
   - `npm run lint` must pass with 0 ESLint warnings.
   - `npm run build` must succeed cleanly.
2. **Component Tests**:
   - Create `src/components/ai/AICopilot.test.tsx` verifying FAB render, trigger click, sheet open, input query submit, and message list updates.
3. **Agent-as-Judge Integration**:
   - Verify `npx tsx scripts/agent-as-judge.ts` verifies natural language querying and tool execution without Node crashes.
