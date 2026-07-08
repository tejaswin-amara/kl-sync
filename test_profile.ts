import { getCaptcha } from './src/lib/scraper';
import { loginAndFetchSemesters } from './src/lib/scraper';
import Tesseract from 'tesseract.js';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function run() {
    console.log("Fetching captcha...");
    const captchaRes = await getCaptcha();
    
    // solve captcha
    console.log("Solving captcha...");
    const base64Data = captchaRes.captchaImage.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    });
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    
    const captchaText = text.replace(/[^a-zA-Z0-9]/g, '').trim();
    console.log("Solved:", captchaText);
    
    console.log("Logging in...");
    let loginRes;
    try {
        loginRes = await loginAndFetchSemesters('2520090104', 'Tejaswin@123', captchaText, captchaRes.session);
    } catch (e: any) {
        if (e.message.includes('Captcha')) {
            console.log("Captcha failed, please run again");
            return;
        }
        throw e;
    }
    
    if (loginRes.needsCaptchaRetry) {
        console.log("Needs retry for device binding. Captcha failed.");
        return;
    }
    
    console.log("Login success! Fetching profile HTML...");
    
    // fetch profile directly
    const ERP_URL = 'https://newerp.kluniversity.in';
    const PROFILE_URL = `${ERP_URL}/index.php?r=studentinfo%2Fstudentprofileinfo%2Fviewprofileindi`;
    
    const cookies = loginRes.session.cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(PROFILE_URL, {
        headers: {
            'Cookie': cookies,
            'User-Agent': loginRes.session.userAgent,
            'Origin': ERP_URL,
            'Referer': ERP_URL
        }
    });
    
    const html = await res.text();
    fs.writeFileSync('profile_dump.html', html);
    console.log("Wrote profile_dump.html");
}

async function runLoop() { while(true) { try { await run(); if (require("fs").existsSync("profile_dump.html")) break; } catch(e){} } } runLoop();
