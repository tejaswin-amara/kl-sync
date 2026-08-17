'use client';

import { Sparkles, User, AlertTriangle, CheckCircle2, DollarSign, Target, Award, BookOpen } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result?: Record<string, unknown>;
  }>;
}

interface AIChatMessageListProps {
  messages: ChatMessage[];
  onSelectSuggestion?: (query: string) => void;
}

export function AIChatMessageList({ messages }: AIChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-muted-foreground">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">KL Sync AI Copilot</h3>
          <p className="text-xs text-muted-foreground max-w-[260px] mt-1">
            Ask natural language questions about your attendance, fees, marks, timetable, or target CGPA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isUser && (
              <div className="w-7 h-7 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                isUser
                  ? 'bg-primary text-primary-foreground rounded-br-xs'
                  : 'bg-card/80 border border-border backdrop-blur-md text-foreground rounded-bl-xs'
              }`}
            >
              {/* Message text content */}
              <div className="whitespace-pre-wrap leading-relaxed">
                {renderFormattedText(msg.content)}
              </div>

              {/* Tool Execution Result Cards */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-3 space-y-2 pt-2 border-t border-border/40">
                  {msg.toolCalls.map((tc, idx) => (
                    <ToolResultCard key={idx} toolCall={tc} />
                  ))}
                </div>
              )}
            </div>

            {isUser && (
              <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bold parsing
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const lineContent = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <span key={idx}>
        {lineContent}
        {idx < lines.length - 1 && <br />}
      </span>
    );
  });
}

function ToolResultCard({
  toolCall,
}: {
  toolCall: { tool: string; args: Record<string, unknown>; result?: Record<string, unknown> };
}) {
  const { tool, result } = toolCall;
  if (!result) return null;

  if (tool === 'getAttendance' && Array.isArray(result.attendance)) {
    const list = result.attendance as Array<{
      'Course Code': string;
      'Course Title': string;
      'Attendance Percentage': string;
      'Attended Hours': string;
      'Conducted Hours': string;
    }>;
    return (
      <div className="p-3 rounded-xl bg-background/60 border border-border/60 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>Attendance Breakdown</span>
        </div>
        <div className="space-y-1.5">
          {list.map((item, i) => {
            const pct = parseFloat(String(item['Attendance Percentage'] || '0').replace('%', ''));
            const isLow = pct < 75;
            return (
              <div key={i} className="p-2 rounded-lg bg-card/40 border border-border/30 space-y-1">
                <div className="flex items-center justify-between text-foreground font-medium">
                  <span className="truncate max-w-[180px]">{item['Course Title'] || item['Course Code']}</span>
                  <Badge variant={isLow ? 'danger' : pct >= 85 ? 'success' : 'warning'}>
                    {item['Attendance Percentage']}
                  </Badge>
                </div>
                <Progress value={Math.min(100, pct)} className="h-1.5" />
                <div className="text-[10px] text-muted-foreground">
                  Attended: {item['Attended Hours']} / {item['Conducted Hours']} hours
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (tool === 'getFeeDetails' && result.breakdown) {
    const b = result.breakdown as {
      totalAmount: number;
      totalPaid: number;
      totalPending: number;
      hasPendingDue: boolean;
    };
    return (
      <div className="p-3 rounded-xl bg-background/60 border border-border/60 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fee Overview</span>
          </div>
          <Badge variant={b.hasPendingDue ? 'danger' : 'success'}>
            {b.hasPendingDue ? `Pending: ₹${b.totalPending.toLocaleString('en-IN')}` : 'All Paid'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2 rounded-lg bg-card/40 border border-border/30">
            <span className="text-[10px] text-muted-foreground block">Paid Amount</span>
            <span className="font-semibold text-emerald-400">₹{b.totalPaid.toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2 rounded-lg bg-card/40 border border-border/30">
            <span className="text-[10px] text-muted-foreground block">Total Amount</span>
            <span className="font-semibold text-foreground">₹{b.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (tool === 'calculateAttendanceTarget' && typeof result.currentPercentage === 'number') {
    const r = result as {
      currentPercentage: number;
      targetPercent: number;
      classesNeeded: number;
      maxBunkable: number;
      status: string;
    };
    const isBelow = r.status === 'below_target';
    return (
      <div className="p-3 rounded-xl bg-background/60 border border-border/60 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Attendance Roadmap</span>
          </div>
          <Badge variant={isBelow ? 'danger' : 'success'}>
            {isBelow ? `Needed: +${r.classesNeeded} classes` : `Bunkable: ${r.maxBunkable} classes`}
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {isBelow ? (
            <div className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Attend next {r.classesNeeded} consecutive classes to reach {r.targetPercent}%.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>You have met the {r.targetPercent}% target. You can skip up to {r.maxBunkable} classes.</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tool === 'predictCGPA' && typeof result.predictedCGPA === 'number') {
    const r = result as {
      currentCGPA: number;
      predictedCGPA: number;
      gpaDelta: number;
      totalCredits: number;
    };
    return (
      <div className="p-3 rounded-xl bg-background/60 border border-border/60 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Award className="w-3.5 h-3.5 text-pink-400" />
            <span>CGPA Forecast Roadmap</span>
          </div>
          <Badge variant={r.gpaDelta >= 0 ? 'success' : 'danger'}>
            {r.gpaDelta >= 0 ? `+${r.gpaDelta} GPA` : `${r.gpaDelta} GPA`}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2 rounded-lg bg-card/40 border border-border/30">
            <span className="text-[10px] text-muted-foreground block">Current CGPA</span>
            <span className="font-semibold text-foreground">{r.currentCGPA}</span>
          </div>
          <div className="p-2 rounded-lg bg-card/40 border border-border/30">
            <span className="text-[10px] text-muted-foreground block">Predicted CGPA</span>
            <span className="font-semibold text-primary">{r.predictedCGPA}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
