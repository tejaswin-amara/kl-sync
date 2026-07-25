import { getCaptcha, loginAndFetchSemesters, fetchTimetableData } from '../lib/scraper';
import * as fs from 'fs';
import Tesseract from 'tesseract.js';

async function run() {
  let loginRes;
  let attempts = 0;
  
  while (attempts < 20) {
    attempts++;
    console.log(`\nAttempt ${attempts}: Fetching captcha...`);
    const captchaRes = await getCaptcha();
    
    const base64Data = captchaRes.captchaImage.replace(/^data:image\/[a-z]+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('Solving captcha with Tesseract...');
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    
    const captchaText = text.replace(/[^a-zA-Z0-9]/g, '').trim();
    console.log('OCR Result:', captchaText);
    
    if (captchaText.length !== 5) {
      console.log('OCR returned bad length, retrying...');
      continue;
    }
    
    console.log('Logging in...');
    try {
      loginRes = await loginAndFetchSemesters(
        '2500030018',
        'AmmaNanna123$',
        captchaText,
        captchaRes.session
      );
      if (loginRes.success && loginRes.session) {
        console.log('Login successful!');
        break;
      }
    } catch (e: any) {
      console.error('Login failed error:', e.message);
    }
  }
  
  if (!loginRes || !loginRes.success || !loginRes.session) {
    console.error('Failed to login after 5 attempts');
    return;
  }
  
  console.log('Fetching timetable HTML...');
  const res = await fetchTimetableData(
    loginRes.session, 
    loginRes.session.csrfToken || '', 
    '29', 
    '1'
  );
  
  if (!res.success) {
    console.error('Fetch failed', res);
    return;
  }
  
  console.log('Timetable Data (first 10 rows):');
  console.dir(res.data.slice(0, 10), { depth: null });
}

run().catch(console.error);
