import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, isDemoSession, ScraperSession } from '@/lib/session';
import { resolveSessionToken, checkRateLimit, getClientIP } from '@/lib/request-utils';
import { processAIChat, ToolExecutionContext } from '@/lib/ai/executor';
import { DEMO_SESSION } from '@/lib/fixtures';

export const dynamic = 'force-dynamic';

interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rl = checkRateLimit(`ai-chat:${clientIP}`, 500, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment before sending more messages.' },
        { status: 429 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    const messages = body.messages as ChatMessageInput[] | undefined;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request body must contain a non-empty messages array' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content || typeof lastMessage.content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Last message in conversation must contain valid string content' },
        { status: 400 }
      );
    }

    // Session resolution
    const sessionToken = resolveSessionToken(request);

    let session: ScraperSession;
    if (sessionToken) {
      try {
        session = await decodeSession(sessionToken);
      } catch {
        session = DEMO_SESSION;
      }
    } else {
      session = DEMO_SESSION;
    }

    const academicYear =
      (typeof body.academicYear === 'string' ? body.academicYear : undefined) ||
      request.nextUrl.searchParams.get('academicYear') ||
      '2025-2026';
    const semesterId =
      (typeof body.semesterId === 'string' ? body.semesterId : undefined) ||
      request.nextUrl.searchParams.get('semesterId') ||
      '1';

    const isDemo = isDemoSession(session);

    const executionContext: ToolExecutionContext = {
      session,
      academicYear,
      semesterId,
      isDemo,
    };

    const { assistantResponseText, toolCalls } = await processAIChat(
      messages,
      executionContext
    );

    return NextResponse.json({
      success: true,
      message: {
        role: 'assistant',
        content: assistantResponseText,
      },
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });
  } catch (err: unknown) {
    console.error('[AI CHAT API] Unexpected handler error:', err);
    return NextResponse.json({
      success: true,
      message: {
        role: 'assistant',
        content: 'I encountered an issue processing your request. Please try asking again or refresh your session.',
      },
    });
  }
}
