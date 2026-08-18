import { NextResponse } from 'next/server';
import { getCaptcha } from '@/lib/scraper';
import { encodeSession } from '@/lib/session';
import { DEMO_SESSION, DEMO_CAPTCHA_SVG } from '@/lib/fixtures';

export const dynamic = 'force-dynamic';

const OCR_TIMEOUT_MS = 6000;
const KLU_CAPTCHA_MIN = 4;
const KLU_CAPTCHA_MAX = 6;

/** Returns cleaned lowercase a-z string if it looks like a valid KLU captcha, else '' */
function validateCaptchaResult(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  return cleaned.length >= KLU_CAPTCHA_MIN && cleaned.length <= KLU_CAPTCHA_MAX
    ? cleaned
    : '';
}

async function runOcrEngine(
  base64: string,
  engine: string,
  apiKey: string,
  signal: AbortSignal
): Promise<string> {
  const formData = new URLSearchParams();
  formData.append('base64Image', `data:image/png;base64,${base64}`);
  formData.append('OCREngine', engine);

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
    signal,
  });

  if (!res.ok) return '';
  const ocrData = await res.json();
  const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText || '';
  return validateCaptchaResult(parsedText);
}

async function solveCaptchaImage(base64: string, apiKey: string): Promise<string> {
  // Run both engines in parallel with independent abort controllers
  const controller2 = new AbortController();
  const timer2 = setTimeout(() => controller2.abort(), OCR_TIMEOUT_MS);
  const controller1 = new AbortController();
  const timer1 = setTimeout(() => controller1.abort(), OCR_TIMEOUT_MS);

  try {
    const results = await Promise.allSettled([
      runOcrEngine(base64, '2', apiKey, controller2.signal),
      runOcrEngine(base64, '1', apiKey, controller1.signal),
    ]);

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value) return res.value;
    }
  } catch {
    // Both engines failed
  } finally {
    clearTimeout(timer2);
    clearTimeout(timer1);
  }
  return '';
}

export async function GET() {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
    const MAX_ATTEMPTS = 2;

    let captchaImage = '';
    let session;
    let solvedCaptcha = '';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Fetch a fresh captcha from ERP each attempt
      try {
        const captchaRes = await getCaptcha({ signal: AbortSignal.timeout(8000) });
        captchaImage = captchaRes.captchaImage;
        session = captchaRes.session;
      } catch (e) {
        console.warn('[CAPTCHA] ERP unreachable or timed out, using fallback:', e);
        captchaImage = DEMO_CAPTCHA_SVG;
        session = DEMO_SESSION;
        solvedCaptcha = 'abcd';
        break;
      }

      // Demo session shortcut
      if (session.csrfToken.includes('demo_csrf_token_123')) {
        solvedCaptcha = 'abcd';
        break;
      }

      // Attempt OCR solve
      const cleanBase64 = captchaImage
        .replace(/^data:image\/[a-z]+;base64,/, '')
        .replace(/[\r\n\s]/g, '');

      try {
        solvedCaptcha = await solveCaptchaImage(cleanBase64, apiKey);
      } catch (e) {
        console.error(`[CAPTCHA] OCR attempt ${attempt + 1} failed:`, e);
      }

      if (solvedCaptcha) break;
      console.warn(`[CAPTCHA] OCR attempt ${attempt + 1} failed, ${attempt + 1 < MAX_ATTEMPTS ? 'retrying with fresh captcha...' : 'giving up.'}`);
    }

    // Fallback: if no session was obtained at all
    if (!session) {
      captchaImage = DEMO_CAPTCHA_SVG;
      session = DEMO_SESSION;
      solvedCaptcha = 'abcd';
    }

    const sessionId = await encodeSession(session);

    return NextResponse.json(
      {
        captchaImage,
        solvedCaptcha,
        sessionId,
        rule: 'lowercase_letters_only',
      },
      {
        headers: {
          'x-session-id': sessionId,
          'Access-Control-Expose-Headers': 'x-session-id',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Error in captcha route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch captcha' },
      { status: 500 }
    );
  }
}
