import { NextResponse } from 'next/server';
import { getCaptcha } from '@/lib/scraper';
import { encodeSession } from '@/lib/session';

export async function GET() {
  try {
    const { captchaImage, session } = await getCaptcha();

    // Encode session to send as session_id
    const sessionId = encodeSession(session);

    let solvedCaptcha = '';
    try {
      const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
      const cleanBase64 = captchaImage
        .replace(/^data:image\/[a-z]+;base64,/, '')
        .replace(/[\r\n\s]/g, '');

      // Attempt 1: OCR Engine 2
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
      });

      if (ocrRes.ok) {
        const ocrData = await ocrRes.json();
        const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText;
        if (parsedText) {
          solvedCaptcha = parsedText.trim().replace(/[^a-zA-Z0-9]/g, '');
        }
      }

      // Attempt 2 Fallback: OCR Engine 1 if Engine 2 returned empty or short result
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
