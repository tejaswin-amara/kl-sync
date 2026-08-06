import { NextResponse } from 'next/server';
import { getCaptcha } from '@/lib/scraper';
import { encodeSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let captchaImage = '';
    let session;

    try {
      const captchaRes = await getCaptcha({ signal: AbortSignal.timeout(3000) });
      captchaImage = captchaRes.captchaImage;
      session = captchaRes.session;
    } catch (e) {
      console.warn('[CAPTCHA] ERP unreachable or timed out, using fallback captcha session:', e);
      captchaImage =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMCwyMCBRMzAsNSA2MCwyMCBUMTIwLDIwIiBzdHJva2U9IiNlMGUwZTAiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAsMTAgUTQwLDMwIDgwLDEwIFQxMjAsMzAiIHN0cm9rZT0iI2Q1ZDVkNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSI5MCUiIHk9IjU1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxMTExMTEiIGxldHRlci1zcGFjaW5nPSIzIj44ODg4PC90ZXh0Pjwvc3ZnPg==';
      session = {
        cookies: [{ name: 'PHPSESSID', value: 'demo_phpsessid_123' }],
        csrfToken: 'demo_csrf_token_123',
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
    }

    const sessionId = encodeSession(session);
    let solvedCaptcha = '8888';

    if (captchaImage && !session.csrfToken.includes('demo_csrf_token_123')) {
      try {
        const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
        const cleanBase64 = captchaImage
          .replace(/^data:image\/[a-z]+;base64,/, '')
          .replace(/[\r\n\s]/g, '');

        // Attempt 1: OCR Engine 2 with 2s timeout
        const formData = new URLSearchParams();
        formData.append('base64Image', `data:image/png;base64,${cleanBase64}`);
        formData.append('OCREngine', '2');

        const ocrRes = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          headers: {
            apikey: apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(2000),
        });

        if (ocrRes.ok) {
          const ocrData = await ocrRes.json();
          const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText;
          if (parsedText) {
            solvedCaptcha = parsedText.trim().replace(/[^a-zA-Z0-9]/g, '');
          }
        }

        // Attempt 2 Fallback: OCR Engine 1 with 2s timeout
        if (!solvedCaptcha || solvedCaptcha.length < 3) {
          const formData1 = new URLSearchParams();
          formData1.append('base64Image', `data:image/png;base64,${cleanBase64}`);
          formData1.append('OCREngine', '1');

          const ocrRes1 = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
              apikey: apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData1.toString(),
            signal: AbortSignal.timeout(2000),
          });

          if (ocrRes1.ok) {
            const ocrData1 = await ocrRes1.json();
            const parsedText1 = ocrData1?.ParsedResults?.[0]?.ParsedText;
            if (parsedText1) {
              solvedCaptcha = parsedText1.trim().replace(/[^a-zA-Z0-9]/g, '');
            }
          }
        }
      } catch (e) {
        console.error('OCR solving failed:', e);
      }
    }

    return NextResponse.json(
      {
        captchaImage,
        solvedCaptcha,
      },
      {
        headers: {
          'x-session-id': sessionId,
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
