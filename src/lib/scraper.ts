import * as cheerio from 'cheerio';

const ERP_URL = 'https://newerp.kluniversity.in';
const LOGIN_URL = `${ERP_URL}/index.php?r=site%2Flogin`;
const ATTENDANCE_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fsearchgetinput`;
const COURSE_LIST_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fcourselist`;

// --- Real ERP endpoints ---
const MARKS_URL = `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fgetstudentinternalmarks`;
const TIMETABLE_URL = `${ERP_URL}/index.php?r=timetables%2Funiversitymasteracademictimetableview%2Findexstudentindisearch`;
const FEE_URL = `${ERP_URL}/index.php?r=feepayments%2Fstudentfeeorderdetailsinfo%2Fmy_fee_orders`;
const PROFILE_URL = `${ERP_URL}/index.php?r=studentinfo%2Fstudentprofileinfo%2Fviewprofileindi`;
const CGPA_URL = `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fsearchgetmycgpa`;
const END_EXAM_URL = `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fsemendresult`;
const EXAM_SEATING_URL = `${ERP_URL}/index.php?r=examsection%2Fexam-invigilator-student-room-allotment-info%2Fstud_my_seating_plan`;
const CIRCULARS_URL = `${ERP_URL}/index.php?r=registraroffice%2Fregistrarofficecircularsvisibilitylistinfo%2Ftab_index_personal`;
const HOSTEL_INFO_URL = `${ERP_URL}/index.php?r=hostel%2Fhosteloccupancyinfo%2Fhostel-room-info`;
const LIBRARY_URL = `${ERP_URL}/index.php?r=library%2Fborrowers%2Fmy_circulation_history`;


const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScraperSession {
  cookies: {name: string, value: string}[];
  csrfToken: string;
  userAgent: string;
}

type CookieJar = Record<string, string>;

function getSetCookies(res: Response): string[] {
  const anyHeaders = res.headers as any;
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  return raw.split(/,(?=\s*[^=;,]+=)/);
}

function mergeSetCookies(jar: CookieJar, res: Response): void {
  for (const sc of getSetCookies(res)) {
    const firstSemi = sc.indexOf(';');
    const pair = (firstSemi > -1 ? sc.slice(0, firstSemi) : sc).trim();
    const eq = pair.indexOf('=');
    if (eq > -1) {
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) jar[name] = value;
    }
  }
}

function cookieHeader(jar: CookieJar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function jarToArray(jar: CookieJar): { name: string; value: string }[] {
  return Object.entries(jar).map(([name, value]) => ({ name, value }));
}

function arrayToJar(cookies: { name: string; value: string }[]): CookieJar {
  const jar: CookieJar = {};
  for (const c of cookies || []) {
    if (c && c.name) jar[c.name] = c.value;
  }
  return jar;
}

async function fetchWithJar(
  url: string,
  jar: CookieJar,
  init: RequestInit & { extraHeaders?: Record<string, string> } = {},
  maxRedirects = 5
): Promise<Response> {
  let currentUrl = url;
  let method = (init.method || 'GET').toUpperCase();
  let body = init.body;

  for (let i = 0; i <= maxRedirects; i++) {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      ...(init.extraHeaders || {}),
    };
    const cookies = cookieHeader(jar);
    if (cookies) headers['Cookie'] = cookies;
    if (body && method !== 'GET' && method !== 'HEAD') {
      headers['Content-Type'] =
        headers['Content-Type'] || 'application/x-www-form-urlencoded';
    }

    const res = await fetch(currentUrl, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : body,
      redirect: 'manual',
    });

    mergeSetCookies(jar, res);

    const status = res.status;
    const location = res.headers.get('location');
    if (status >= 300 && status < 400 && location) {
      let next = new URL(location, currentUrl).toString();
      next = next.replace(/^http:\/\//i, 'https://');
      currentUrl = next;
      if (status === 303 || status === 302 || status === 301) {
        method = 'GET';
        body = undefined;
      }
      continue;
    }
    return res;
  }
  throw new Error('Too many redirects while contacting the ERP');
}

export interface CaptchaResponse {
  captchaImage: string;
  session: ScraperSession;
}

export async function getCaptcha(): Promise<CaptchaResponse> {
  try {
    const jar: CookieJar = {};
    const loginRes = await fetchWithJar(LOGIN_URL, jar);
    const html = await loginRes.text();
    const $ = cheerio.load(html);

    let csrfToken = ($('input[name="_csrf"]').val() as string) || '';
    if (!csrfToken) {
      const csrfMatch = html.match(/name="_csrf"[^>]*value="([^"]+)"/);
      if (csrfMatch) csrfToken = csrfMatch[1];
    }
    if (!csrfToken) {
      throw new Error('CSRF Token not found (ERP login page structure may have changed)');
    }

    let captchaSrc = $('#loginFormCaptcha-image').attr('src');
    if (!captchaSrc) {
      const m = html.match(/id="loginFormCaptcha-image"[^>]*src="([^"]+)"/);
      if (m) captchaSrc = m[1].replace(/&amp;/g, '&');
    }
    if (!captchaSrc) {
      throw new Error('Captcha element/source not found');
    }

    const captchaUrl = new URL(captchaSrc, LOGIN_URL).toString();
    const imageRes = await fetchWithJar(captchaUrl, jar, {
      extraHeaders: { Referer: LOGIN_URL },
    });

    const imageBuffer = await imageRes.arrayBuffer();
    const captchaBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;

    return {
      captchaImage: captchaBase64,
      session: {
        cookies: jarToArray(jar),
        csrfToken,
        userAgent: USER_AGENT,
      },
    };
  } catch (error) {
    console.error('getCaptcha Error:', error);
    throw error;
  }
}

export interface SemesterOption {
  value: string;
  label: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  session: ScraperSession;
  csrfToken: string;
  academicYears: SemesterOption[];
  semesters: SemesterOption[];
  deviceId?: string;
  needsCaptchaRetry?: boolean;
}

const DEVICE_COOKIE = 'kl_erp_device_id';

export async function loginAndFetchSemesters(
  username: string,
  pass: string,
  captcha: string,
  session: ScraperSession,
  deviceId?: string
): Promise<LoginResult> {
  const jar = arrayToJar(session.cookies);
  if (deviceId) jar[DEVICE_COOKIE] = deviceId;

  const params = new URLSearchParams();
  params.append('_csrf', session.csrfToken);
  params.append('LoginForm[username]', username);
  params.append('LoginForm[password]', pass);
  params.append('LoginForm[captcha]', captcha);
  params.append('LoginForm[qr_code]', '');
  params.append('LoginForm[rememberMe]', '1');
  params.append('login-button', '');

  const loginCookies = cookieHeader(jar);
  const loginRes = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: {
      'Cookie': loginCookies,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': session.userAgent,
      'Origin': ERP_URL,
      'Referer': LOGIN_URL,
    },
    body: params,
    redirect: 'manual',
  });

  mergeSetCookies(jar, loginRes);

  let loginText = '';
  if (loginRes.status >= 300 && loginRes.status < 400) {
    const location = loginRes.headers.get('location');
    if (location) {
      const dest = new URL(location, LOGIN_URL).toString().replace(/^http:\/\//i, 'https://');
      await fetchWithJar(dest, jar);
    }
  } else {
    loginText = await loginRes.text();
  }

  const attendanceRes = await fetchWithJar(ATTENDANCE_URL, jar, {
    extraHeaders: { Referer: LOGIN_URL },
  });
  const attendanceHtml = await attendanceRes.text();

  const authenticated =
    /name="DynamicModel\[academicyear\]"/.test(attendanceHtml) ||
    /name="DynamicModel\[semesterid\]"/.test(attendanceHtml);

  if (!authenticated) {
    const $err = cheerio.load(loginText || attendanceHtml);
    const fieldErrors = $err('.help-block, .help-block-error, .invalid-feedback, .alert-danger')
      .map((_i, el) => $err(el).text().trim())
      .get()
      .filter(Boolean);
    const errText = fieldErrors.join(' | ');
    const rendered = (loginText || '').replace(/<script[\s\S]*?<\/script>/gi, '');
    const signal = (errText + ' ' + rendered).toLowerCase();
    const crashBody = (loginText || '').toLowerCase();

    const harvested = jar[DEVICE_COOKIE];
    const isTokenCrash = /unknown property|useraccesstoken|yiisoft|exception/.test(crashBody);
    if (isTokenCrash && harvested) {
      return {
        success: false,
        needsCaptchaRetry: true,
        deviceId: harvested,
        message: 'First-time device setup with the ERP — please enter the new captcha once more to finish signing in.',
        session: { ...session, cookies: jarToArray(jar), csrfToken: session.csrfToken },
        csrfToken: session.csrfToken,
        academicYears: [],
        semesters: [],
      };
    }
    if (isTokenCrash) {
      throw new Error("KLU ERP server error during login (a bug on the university's side). Please refresh the captcha and try again.");
    }

    if (/incorrect username or password|invalid (username|password|login|credentials)|wrong password|password is incorrect|user (does not exist|not found)|account (is )?(locked|disabled|inactive|blocked)/.test(signal)) {
      throw new Error('Incorrect username or password.');
    }

    if (/verification code is incorrect|invalid captcha|incorrect captcha|captcha (is )?(incorrect|invalid|wrong)/.test(signal)) {
      throw new Error('Captcha incorrect — please re-enter the captcha and try again.');
    }

    throw new Error(errText ? `Login failed: ${errText}` : 'Login failed: the ERP rejected the request. Please refresh the captcha and try again.');
  }

  const csrfTokenMatch = attendanceHtml.match(/name="_csrf"[^>]*value="([^"]+)"/);
  const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : session.csrfToken;

  const $ = cheerio.load(attendanceHtml);

  const academicYears: SemesterOption[] = [];
  let selectedYearValue = '';
  $('select[name="DynamicModel[academicyear]"] option').each((i, el) => {
    const value = $(el).attr('value');
    const label = $(el).text().trim();
    if (value) {
      academicYears.push({ value, label });
      if ($(el).attr('selected')) {
        selectedYearValue = value;
      }
    }
  });

  if (selectedYearValue) {
    const idx = academicYears.findIndex(y => y.value === selectedYearValue);
    if (idx > -1) {
      const [selectedYear] = academicYears.splice(idx, 1);
      academicYears.unshift(selectedYear);
    }
  }

  const semesters: SemesterOption[] = [];
  let selectedSemValue = '';
  $('select[name="DynamicModel[semesterid]"] option').each((i, el) => {
    const value = $(el).attr('value');
    const label = $(el).text().trim();
    if (value) {
      semesters.push({ value, label });
      if ($(el).attr('selected')) {
        selectedSemValue = value;
      }
    }
  });

  if (selectedSemValue) {
    const idx = semesters.findIndex(s => s.value === selectedSemValue);
    if (idx > -1) {
      const [selectedSem] = semesters.splice(idx, 1);
      semesters.unshift(selectedSem);
    }
  }

  return {
    success: true,
    message: 'Login Successful',
    session: {
      ...session,
      cookies: jarToArray(jar),
      csrfToken,
    },
    csrfToken,
    academicYears,
      semesters,
    deviceId: jar[DEVICE_COOKIE],
  };
}

// --- GENERIC TABLE PARSER ----------------------------------------------------
function parseGenericTable(html: string) {
    const $ = cheerio.load(html);
    
    let table = $('table').first();
    let maxRows = 0;
    $('table').each((_i, el) => {
        const rowCount = $(el).find('tr').length;
        if (rowCount > maxRows) {
            maxRows = rowCount;
            table = $(el);
        }
    });

    const data: any[] = [];

    // Extract headers: find the row with the most 'th' or 'td' in thead
    let headerRow = table.find('thead tr').last();
    if (headerRow.length === 0) {
        headerRow = table.find('tr').first();
    }

    const headers: string[] = [];
    headerRow.find('th, td').each((i, el) => {
        let text = $(el).text().trim();
        if (!text) text = `Column_${i}`;
        // deduplicate headers
        let suffix = 0;
        let finalStr = text;
        while (headers.includes(finalStr)) {
            suffix++;
            finalStr = `${text}_${suffix}`;
        }
        headers.push(finalStr);
    });

    const rows = table.find('tr');
    const bodyRows = table.find('tbody tr');
    const rowsToIterate = bodyRows.length > 0 ? bodyRows : rows.slice(1);

    rowsToIterate.each((i, row) => {
        const rowData: any = {};
        const cells = $(row).find('td');
        
        if (cells.length === 1 && $(cells[0]).text().trim().includes('No results found')) {
            return;
        }
        // skip if it's just a header row in tbody
        if (cells.length === 0) return;

        cells.each((j, cell) => {
            if (headers[j]) {
                rowData[headers[j]] = $(cell).text().trim();
            } else {
                rowData[`Column_${j}`] = $(cell).text().trim();
            }
        });
        
        if (Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    });

    return data;
}

export async function fetchAttendanceData(
  session: ScraperSession,
  csrfToken: string,
  academicYear: string,
  semesterId: string
) {
  const jar = arrayToJar(session.cookies);
  const ajaxParams = new URLSearchParams();
  ajaxParams.append('_csrf', csrfToken);
  ajaxParams.append('DynamicModel[academicyear]', academicYear);
  ajaxParams.append('DynamicModel[semesterid]', semesterId);

  const courseListRes = await fetchWithJar(COURSE_LIST_URL, jar, {
    method: 'POST',
    body: ajaxParams,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': ERP_URL,
      'Referer': ATTENDANCE_URL,
    },
  });

  const courseListHtml = await courseListRes.text();
  const attendanceData = parseGenericTable(courseListHtml);
  
  return {
    success: true,
    message: 'Attendance Data Fetched Successfully',
    attendanceData: attendanceData
  };
}

export async function fetchGenericModuleData(session: ScraperSession, targetUrl: string) {
  const jar = arrayToJar(session.cookies);
  
  const res = await fetchWithJar(targetUrl, jar, {
    method: 'GET',
    extraHeaders: {
      'Origin': ERP_URL,
      'Referer': ERP_URL,
    },
  });

  const html = await res.text();
  
  // If the page redirected to login, it means session expired or route is wrong
  if (html.includes('id="login-form"')) {
      throw new Error("Session expired or invalid ERP route.");
  }
  
  const data = parseGenericTable(html);
  
  return {
    success: true,
    data: data,
    rawHtmlLength: html.length 
  };
}

  // --- Profile parser ---
function parseProfileData(html: string) {
  const $ = cheerio.load(html);
  const data: Record<string, string> = {};

  const text = $('body').text() || html;

  // 1. More aggressive name parsing
  const profileBg = $('.profile_bg');
  const nameEl = profileBg.find('h4').filter((_i, el) => !$(el).text().includes('Student Profile'));
  let name = nameEl.text().trim() || profileBg.contents().filter((_i, el) => el.type === 'text').text().trim();
  
  if (!name || name.length < 3) {
    // Look for "Welcome : AMARA TEJASWIN" or similar
    const welcomeMatch = text.match(/(?:Welcome|Hello|Name)[\s:-]*([A-Za-z\s]{4,40})(?:\s|\||$)/i);
    if (welcomeMatch) {
       name = welcomeMatch[1].trim();
    }
  }
  // Clean up any extraneous strings from the name
  if (name) data.name = name.replace(/University ID.*/i, '').trim();

  // 2. Extract exact photo URL
  const imgMatch = html.match(/src=["']([^"']*(?:studentphotos|profile)[^"']*)["']/i);
  if (imgMatch) {
    data.photoUrl = imgMatch[1];
  }

  // University ID from text like 'University ID : 2520090104'
  const uidMatch = text.match(/University\s*ID\s*[:\s]*(\d+)/i);
  if (uidMatch) data.universityId = uidMatch[1];
  // Key-value rows from the profile table
  const fieldMap: Record<string, string> = {
    'admission date': 'admissionDate',
    'date of birth': 'dob',
    'blood group': 'bloodGroup',
    'email': 'email',
    'height': 'height',
    'weight': 'weight',
    'regulation': 'regulation',
    'program': 'program',
  };
  $('table tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 2) {
      const label = $(cells[0]).text().trim().toLowerCase();
      const value = $(cells[1]).text().trim().replace(/^:\s*/, '');
      const key = fieldMap[label];
      if (key) data[key] = value;
    }
  });

  return data;
}

// --- POST-based fetchers (need csrf + form params) ---

export async function fetchTimetableData(
  session: ScraperSession,
  csrfToken: string,
  academicYear: string,
  semesterId: string
) {
  const jar = arrayToJar(session.cookies);
  const params = new URLSearchParams();
  params.append('_csrf', csrfToken);
  params.append('UniversityMasterAcademicTimetableView[academicyear]', academicYear);
  params.append('UniversityMasterAcademicTimetableView[semesterid]', semesterId);

  const res = await fetchWithJar(TIMETABLE_URL, jar, {
    method: 'POST',
    body: params,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': ERP_URL,
      'Referer': TIMETABLE_URL,
    },
  });
  const html = await res.text();
  if (html.includes('id="login-form"')) throw new Error('Session expired or invalid ERP route.');
  return { success: true, data: parseGenericTable(html) };
}

export async function fetchMarksData(
  session: ScraperSession,
  csrfToken: string,
  academicYear: string,
  semesterId: string
) {
  const jar = arrayToJar(session.cookies);
  const params = new URLSearchParams();
  params.append('_csrf', csrfToken);
  params.append('DynamicModel[academicyear]', academicYear);
  // ponytail: ERP uses 'semester' (not 'semesterid') for marks endpoint
  params.append('DynamicModel[semester]', semesterId);

  const res = await fetchWithJar(MARKS_URL, jar, {
    method: 'POST',
    body: params,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': ERP_URL,
      'Referer': MARKS_URL,
    },
  });
  const html = await res.text();
  if (html.includes('id="login-form"')) throw new Error('Session expired or invalid ERP route.');
  return { success: true, data: parseGenericTable(html) };
}

export async function fetchEndExamResults(
  session: ScraperSession,
  csrfToken: string,
  academicYear: string,
  semesterId: string
) {
  const jar = arrayToJar(session.cookies);
  const params = new URLSearchParams();
  params.append('_csrf', csrfToken);
  params.append('DynamicModel[academicyear]', academicYear);
  params.append('DynamicModel[semester]', semesterId);

  const res = await fetchWithJar(END_EXAM_URL, jar, {
    method: 'POST',
    body: params,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': ERP_URL,
      'Referer': END_EXAM_URL,
    },
  });
  const html = await res.text();
  if (html.includes('id="login-form"')) throw new Error('Session expired or invalid ERP route.');
  return { success: true, data: parseGenericTable(html) };
}

// --- Profile fetcher (custom parser, not a table) ---
export async function fetchProfileData(session: ScraperSession) {
  const jar = arrayToJar(session.cookies);
  const res = await fetchWithJar(PROFILE_URL, jar, {
    method: 'GET',
    extraHeaders: { Origin: ERP_URL, Referer: ERP_URL },
  });
  const html = await res.text();
  if (html.includes('id="login-form"')) throw new Error('Session expired or invalid ERP route.');
  return { success: true, data: parseProfileData(html) };
}

// --- Simple GET fetchers ---
export const fetchFeeData = (s: ScraperSession) => fetchGenericModuleData(s, FEE_URL);
export const fetchCGPAData = (s: ScraperSession) => fetchGenericModuleData(s, CGPA_URL);
export const fetchExamSeatingData = (s: ScraperSession) => fetchGenericModuleData(s, EXAM_SEATING_URL);
export const fetchCircularsData = (s: ScraperSession) => fetchGenericModuleData(s, CIRCULARS_URL);
export const fetchHostelData = (s: ScraperSession) => fetchGenericModuleData(s, HOSTEL_INFO_URL);
export const fetchLibraryData = (s: ScraperSession) => fetchGenericModuleData(s, LIBRARY_URL);


