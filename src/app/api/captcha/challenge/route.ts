import { generateChallenge } from 'capjs-core';
import { NextRequest, NextResponse } from 'next/server';
import { getCapSecret } from '@/lib/captcha';
import { checkRateLimitDistributed, getClientIP } from '@/lib/request-utils';

export const dynamic = 'force-dynamic';

const CAPTCHA_CHALLENGE_TTL_MS = 5 * 60_000;
const NO_STORE = 'no-store, max-age=0, must-revalidate';

async function handleChallenge(request: NextRequest) {
  const limit = await checkRateLimitDistributed(
    `captcha:challenge:ip:${getClientIP(request)}`,
    60,
    60_000
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many browser-verification requests.' },
      {
        status: 429,
        headers: {
          'Cache-Control': NO_STORE,
          'Retry-After': String(Math.ceil(limit.resetMs / 1000)),
        },
      }
    );
  }

  try {
    const challenge = await generateChallenge(getCapSecret(), {
      scope: 'login',
      expiresMs: CAPTCHA_CHALLENGE_TTL_MS,
      instrumentation: true,
    });

    return NextResponse.json(challenge, {
      headers: { 'Cache-Control': NO_STORE },
    });
  } catch (error) {
    console.error('[CAPTCHA] Challenge generation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate browser verification.' },
      { status: 503, headers: { 'Cache-Control': NO_STORE } }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleChallenge(request);
}

export async function POST(request: NextRequest) {
  return handleChallenge(request);
}
