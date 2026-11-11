import { validateChallenge } from 'capjs-core';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'node:crypto';
import { consumeNonce, getCapSecret } from '@/lib/captcha';
import { checkRateLimitDistributed, getClientIP } from '@/lib/request-utils';

export const dynamic = 'force-dynamic';

const CAPTCHA_CHALLENGE_TTL_MS = 5 * 60_000;
const MAX_REDEEM_BODY_BYTES = 64 * 1024;
const NO_STORE = 'no-store, max-age=0, must-revalidate';

type InstrumentationPayload = Record<string, unknown>;

/**
 * Keep only the transport-level shape check here. capjs-core owns the
 * cryptographic binding, exact state keys, integer checks, canonical data,
 * expiry and automation verification. Duplicating its evolving payload
 * schema caused valid widget instrumentation to be rejected before the
 * verifier could inspect it.
 */
function isInstrumentationPayload(
  value: unknown
): value is InstrumentationPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.i === 'string' &&
    payload.i.length > 0 &&
    payload.i.length <= 128 &&
    typeof payload.d === 'string' &&
    payload.d.length <= 65_536 &&
    Boolean(
      payload.state &&
        typeof payload.state === 'object' &&
        !Array.isArray(payload.state)
    )
  );
}

function privateJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': NO_STORE },
  });
}

export async function POST(request: NextRequest) {
  const limit = await checkRateLimitDistributed(
    `captcha:redeem:ip:${getClientIP(request)}`,
    30,
    60_000
  );

  if (!limit.allowed) {
    return privateJson(
      { success: false, error: 'Too many verification attempts.' },
      429
    );
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REDEEM_BODY_BYTES) {
      return privateJson(
        { success: false, error: 'Verification request is too large.' },
        413
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return privateJson(
        { success: false, error: 'Invalid verification request.' },
        400
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return privateJson(
        { success: false, error: 'Invalid verification request.' },
        400
      );
    }

    const payload = body as {
      token?: unknown;
      solutions?: unknown;
      instr?: unknown;
      instr_blocked?: unknown;
      instr_timeout?: unknown;
    };

    if (
      typeof payload.token !== 'string' ||
      payload.token.length === 0 ||
      payload.token.length > 4096 ||
      !Array.isArray(payload.solutions) ||
      payload.solutions.length === 0 ||
      payload.solutions.length > 100 ||
      !payload.solutions.every(
        (solution) =>
          typeof solution === 'number' && Number.isSafeInteger(solution)
      )
    ) {
      return privateJson(
        { success: false, error: 'Invalid verification payload.' },
        400
      );
    }

    const instr = isInstrumentationPayload(payload.instr)
      ? payload.instr
      : undefined;
    if (payload.instr !== undefined && !instr) {
      return privateJson(
        { success: false, error: 'Invalid browser-verification instrumentation.' },
        400
      );
    }
    if (
      (payload.instr_blocked !== undefined &&
        typeof payload.instr_blocked !== 'boolean') ||
      (payload.instr_timeout !== undefined &&
        typeof payload.instr_timeout !== 'boolean')
    ) {
      return privateJson(
        { success: false, error: 'Invalid browser-verification flags.' },
        400
      );
    }

    const secret = getCapSecret();
    const result = await validateChallenge(
      secret,
      {
        token: payload.token,
        solutions: payload.solutions as number[],
        ...(instr ? { instr } : {}),
        ...(typeof payload.instr_blocked === 'boolean'
          ? { instr_blocked: payload.instr_blocked }
          : {}),
        ...(typeof payload.instr_timeout === 'boolean'
          ? { instr_timeout: payload.instr_timeout }
          : {}),
      },
      {
        scope: 'login',
        tokenTtlMs: CAPTCHA_CHALLENGE_TTL_MS,
        consumeNonce,
        signToken: ({ scope, expires }) => {
          if (scope !== 'login' || !Number.isSafeInteger(expires)) {
            throw new Error('Invalid CAPTCHA token claims.');
          }

          const encodedPayload = Buffer.from(
            JSON.stringify({
              scope,
              exp: expires,
              iat: Date.now(),
              rnd: randomBytes(16).toString('hex'),
            }),
            'utf8'
          ).toString('base64url');
          const signature = createHmac('sha256', secret)
            .update(encodedPayload)
            .digest('base64url');

          return `signed:${encodedPayload}.${signature}`;
        },
      }
    );

    if (!result.success) {
      return privateJson(result, 400);
    }

    return privateJson(result);
  } catch (error) {
    console.error('[CAPTCHA] Redemption failed:', error);
    return privateJson(
      { success: false, error: 'Browser verification could not be completed.' },
      503
    );
  }
}
