import { NextResponse } from 'next/server';
import { getCaptcha } from '@/lib/scraper';
import { encodeSession } from '@/lib/session';
import { DEMO_SESSION, DEMO_CAPTCHA_SVG } from '@/lib/fixtures';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let captchaImage = '';
    let session;

    try {
      const captchaRes = await getCaptcha({ signal: AbortSignal.timeout(8000) });
      captchaImage = captchaRes.captchaImage;
      session = captchaRes.session;
    } catch (e) {
      console.warn('[CAPTCHA] ERP unreachable or timed out, using fallback captcha session:', e);
      captchaImage = DEMO_CAPTCHA_SVG;
      session = DEMO_SESSION;
    }

    const sessionId = await encodeSession(session);
    let solvedCaptcha = session.csrfToken.includes('demo_csrf_token_123') ? 'abcd' : '';

    if (captchaImage && !session.csrfToken.includes('demo_csrf_token_123')) {
      try {
        const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
        const cleanBase64 = captchaImage
          .replace(/^data:image\/[a-z]+;base64,/, '')
          .replace(/[\r\n\s]/g, '');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const runOcrEngine = async (engine: string): Promise<string> => {
          const formData = new URLSearchParams();
          formData.append('base64Image', `data:image/png;base64,${cleanBase64}`);
          formData.append('OCREngine', engine);

          const res = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
            signal: controller.signal,
          });

          if (!res.ok) return '';
          const ocrData = await res.json();
          const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText || '';
          // KL University ERP captchas strictly contain only lowercase English letters (a-z)
          return parsedText.trim().toLowerCase().replace(/[^a-z]/g, '');
        };

        const results = await Promise.allSettled([
          runOcrEngine('2'),
          runOcrEngine('1'),
        ]);
        clearTimeout(timeoutId);

        for (const res of results) {
          if (res.status === 'fulfilled' && res.value && res.value.length >= 3) {
            solvedCaptcha = res.value.toLowerCase().replace(/[^a-z]/g, '');
            break;
          }
        }
      } catch (e) {
        console.error('OCR solving failed:', e);
        solvedCaptcha = '';
      }
    }

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
