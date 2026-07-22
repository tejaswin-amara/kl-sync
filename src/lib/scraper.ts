import * as cheerio from 'cheerio';

const ERP_URL = 'https://newerp.kluniversity.in';
const LOGIN_URL = `${ERP_URL}/index.php?r=site%2Flogin`;
const ATTENDANCE_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fsearchgetinput`;
const COURSE_LIST_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fcourselist`;

// --- Real ERP endpoints ---
export const ERP_ENDPOINTS: Record<string, string> = {
  marks: `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fgetstudentinternalmarks`,
  timetable: `${ERP_URL}/index.php?r=timetables%2Funiversitymasteracademictimetableview%2Findexstudentindisearch`,
  fee: `${ERP_URL}/index.php?r=feepayments%2Fstudentfeeorderdetailsinfo%2Fmy_fee_orders`,
  profile: `${ERP_URL}/index.php?r=studentinfo%2Fstudentprofileinfo%2Fviewprofileindi`,
  cgpa: `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fsearchgetmycgpa`,
  'end-exam': `${ERP_URL}/index.php?r=studentinfo%2Fstudentendexamresult%2Fsemendresult`,
  'exam-seating': `${ERP_URL}/index.php?r=examsection%2Fexam-invigilator-student-room-allotment-info%2Fstud_my_seating_plan`,
  circulars: `${ERP_URL}/index.php?r=registraroffice%2Fregistrarofficecircularsvisibilitylistinfo%2Ftab_index_personal`,
  hostel: `${ERP_URL}/index.php?r=hostel%2Fhosteloccupancyinfo%2Fhostel-room-info`,
  library: `${ERP_URL}/index.php?r=library%2Fborrowers%2Fmy_circulation_history`,
};

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScraperSession {
  cookies: { name: string; value: string }[];
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
      throw new Error(
        'CSRF Token not found (ERP login page structure may have changed)'
      );
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

  const loginRes = await fetchWithJar(LOGIN_URL, jar, {
    method: 'POST',
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: ERP_URL,
      Referer: LOGIN_URL,
    },
    body: params,
  });

  mergeSetCookies(jar, loginRes);

  let loginText = '';
  if (loginRes.status >= 300 && loginRes.status < 400) {
    const location = loginRes.headers.get('location');
    if (location) {
      const dest = new URL(location, LOGIN_URL)
        .toString()
        .replace(/^http:\/\//i, 'https://');
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
    const fieldErrors = $err(
      '.help-block, .help-block-error, .invalid-feedback, .alert-danger'
    )
      .map((_i, el) => $err(el).text().trim())
      .get()
      .filter(Boolean);
    const errText = fieldErrors.join(' | ');
    const rendered = (loginText || '').replace(
      /<script[\s\S]*?<\/script>/gi,
      ''
    );
    const signal = (errText + ' ' + rendered).toLowerCase();
    const crashBody = (loginText || '').toLowerCase();

    const harvested = jar[DEVICE_COOKIE];
    const isTokenCrash =
      /unknown property|useraccesstoken|yiisoft|exception/.test(crashBody);
    if (isTokenCrash && harvested) {
      return {
        success: false,
        needsCaptchaRetry: true,
        deviceId: harvested,
        message:
          'First-time device setup with the ERP — please enter the new captcha once more to finish signing in.',
        session: {
          ...session,
          cookies: jarToArray(jar),
          csrfToken: session.csrfToken,
        },
        csrfToken: session.csrfToken,
        academicYears: [],
        semesters: [],
      };
    }
    if (isTokenCrash) {
      throw new Error(
        "KLU ERP server error during login (a bug on the university's side). Please refresh the captcha and try again."
      );
    }

    if (
      /incorrect username or password|invalid (username|password|login|credentials)|wrong password|password is incorrect|user (does not exist|not found)|account (is )?(locked|disabled|inactive|blocked)/.test(
        signal
      )
    ) {
      throw new Error('Incorrect username or password.');
    }

    if (
      /verification code is incorrect|invalid captcha|incorrect captcha|captcha (is )?(incorrect|invalid|wrong)/.test(
        signal
      )
    ) {
      throw new Error(
        'Captcha incorrect — please re-enter the captcha and try again.'
      );
    }

    throw new Error(
      errText
        ? `Login failed: ${errText}`
        : 'Login failed: the ERP rejected the request. Please refresh the captcha and try again.'
    );
  }

  const csrfTokenMatch = attendanceHtml.match(
    /name="_csrf"[^>]*value="([^"]+)"/
  );
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
    const idx = academicYears.findIndex((y) => y.value === selectedYearValue);
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
    const idx = semesters.findIndex((s) => s.value === selectedSemValue);
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

  const hasThead = table.find('thead tr').length > 0;
  let headerRow = hasThead
    ? table.find('thead tr').last()
    : table.find('tr').first();

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
  
  let rowsToIterate: any;
  if (hasThead) {
    rowsToIterate = bodyRows.length > 0 ? bodyRows : rows.slice(1);
  } else {
    const allRows = bodyRows.length > 0 ? bodyRows : rows;
    rowsToIterate = allRows.slice(1);
  }

  rowsToIterate.each((i: number, row: any) => {
    const rowData: any = {};
    const cells = $(row).find('td, th');

    if (
      cells.length === 1 &&
      $(cells[0]).text().trim().includes('No results found')
    ) {
      return;
    }
    if (cells.length === 0) return;

    cells.each((j: number, cell: any) => {
      const clone = $(cell).clone();
      clone.find('br, div, p').before(' ');
      const cellText = clone.text().replace(/\s+/g, ' ').trim();

      if (headers[j]) {
        rowData[headers[j]] = cellText;
      } else {
        rowData[`Column_${j}`] = cellText;
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
      Origin: ERP_URL,
      Referer: ATTENDANCE_URL,
    },
  });

  const courseListHtml = await courseListRes.text();
  const attendanceData = parseGenericTable(courseListHtml);

  return {
    success: true,
    message: 'Attendance Data Fetched Successfully',
    attendanceData: attendanceData,
  };
}

export async function fetchGenericModuleData(
  session: ScraperSession,
  targetUrl: string
) {
  const jar = arrayToJar(session.cookies);

  const res = await fetchWithJar(targetUrl, jar, {
    method: 'GET',
    extraHeaders: {
      Origin: ERP_URL,
      Referer: ERP_URL,
    },
  });

  const html = await res.text();

  if (html.includes('id="login-form"')) {
    throw new Error('Session expired or invalid ERP route.');
  }

  const data = parseGenericTable(html);

  return {
    success: true,
    data: data,
    rawHtmlLength: html.length,
  };
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
  params.append(
    'UniversityMasterAcademicTimetableView[academicyear]',
    academicYear
  );
  params.append(
    'UniversityMasterAcademicTimetableView[semesterid]',
    semesterId
  );
  params.append(
    'UniversityMasterAcademicTimetableView[semester]',
    semesterId
  );
  params.append('DynamicModel[academicyear]', academicYear);
  params.append('DynamicModel[semesterid]', semesterId);
  params.append('DynamicModel[semester]', semesterId);

  const res = await fetchWithJar(ERP_ENDPOINTS['timetable'], jar, {
    method: 'POST',
    body: params,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: ERP_URL,
      Referer: ERP_ENDPOINTS['timetable'],
    },
  });
  const html = await res.text();
  if (html.includes('id="login-form"'))
    throw new Error('Session expired or invalid ERP route.');
  
  let data = parseGenericTable(html);

  if (!data || data.length === 0) {
    const getUrl = `${ERP_ENDPOINTS['timetable']}&UniversityMasterAcademicTimetableView[academicyear]=${academicYear}&UniversityMasterAcademicTimetableView[semesterid]=${semesterId}&DynamicModel[academicyear]=${academicYear}&DynamicModel[semesterid]=${semesterId}`;
    const getRes = await fetchWithJar(getUrl, jar, {
      method: 'GET',
      extraHeaders: {
        Origin: ERP_URL,
        Referer: ERP_ENDPOINTS['timetable'],
      },
    });
    const getHtml = await getRes.text();
    if (!getHtml.includes('id="login-form"')) {
      const parsedGet = parseGenericTable(getHtml);
      if (parsedGet && parsedGet.length > 0) {
        data = parsedGet;
      }
    }
  }

  return { success: true, data };
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

  const res = await fetchWithJar(ERP_ENDPOINTS['marks'], jar, {
    method: 'POST',
    body: params,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: ERP_URL,
      Referer: ERP_ENDPOINTS['marks'],
    },
  });
  const html = await res.text();
  if (html.includes('id="login-form"'))
    throw new Error('Session expired or invalid ERP route.');
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

  const res = await fetchWithJar(ERP_ENDPOINTS['end-exam'], jar, {
    method: 'POST',
    body: params,
    extraHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: ERP_URL,
      Referer: ERP_ENDPOINTS['end-exam'],
    },
  });
  const html = await res.text();
  if (html.includes('id="login-form"'))
    throw new Error('Session expired or invalid ERP route.');
  return { success: true, data: parseGenericTable(html) };
}

// --- Profile fetcher (custom parser, not a table) ---
export async function fetchProfileData(session: ScraperSession) {
  const jar = arrayToJar(session.cookies);
  const res = await fetchWithJar(ERP_ENDPOINTS['profile'], jar, {
    method: 'GET',
    extraHeaders: { Origin: ERP_URL, Referer: ERP_URL },
  });
  const html = await res.text();
  if (html.includes('id="login-form"'))
    throw new Error('Session expired or invalid ERP route.');

  // Extract all profile tab URLs from the HTML
  const tabUrls = new Map<string, string>();

  const $ = cheerio.load(html);

  // 1. Extract from <a> tags inside nav/tabs
  $('a').each((_i: any, a: any) => {
    const href = $(a).attr('href');
    const text = $(a).text().trim();
    if (
      href &&
      href.includes('index.php?r=') &&
      !href.includes('viewprofileindi')
    ) {
      if (
        $(a).parents('li, .nav, .tabs, .ui-tabs-nav, .tab-pane, .panel')
          .length > 0
      ) {
        tabUrls.set(href, text || 'Unknown Tab');
      }
    }
  });

  // 2. Extract from CJuiTabs javascript configs
  const scriptRegex1 =
    /'([^']+)'\s*:\s*\{\s*'ajax'\s*:\s*'(\/index\.php\?r=[^']+)'/gi;
  let match1;
  while ((match1 = scriptRegex1.exec(html)) !== null) {
    if (!match1[2].includes('viewprofileindi')) {
      tabUrls.set(match1[2].replace('&amp;', '&'), match1[1]);
    }
  }

  // 3. Extract from generic url configs
  const scriptRegex2 = /'url'\s*:\s*'(\/index\.php\?r=[^']+)'/gi;
  let match2;
  while ((match2 = scriptRegex2.exec(html)) !== null) {
    if (!match2[1].includes('viewprofileindi')) {
      const u = match2[1].replace('&amp;', '&');
      if (!tabUrls.has(u)) {
        tabUrls.set(u, 'Unknown Tab');
      }
    }
  }

  // Fetch all tab URLs concurrently
  const tabPromises = Array.from(tabUrls.entries()).map(async ([url, name]) => {
    try {
      const tabRes = await fetchWithJar(
        `https://newerp.kluniversity.in${url}`,
        jar,
        {
          method: 'GET',
          extraHeaders: {
            Origin: ERP_URL,
            Referer: ERP_ENDPOINTS['profile'],
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );
      return { name, html: await tabRes.text() };
    } catch (e) {
      return { name, html: '' };
    }
  });

  const tabHtmls = await Promise.all(tabPromises);
  const allPages = [{ name: 'Personal Information', html }, ...tabHtmls];

  return { success: true, data: parseProfileData(allPages) };
}

function parseProfileData(pages: { name: string; html: string }[]) {

  const mainHtml = pages[0].html;
  const $main = cheerio.load(mainHtml);
  const data: Record<string, any> = {};

  const text = $main('body').text() || mainHtml;

  // 1. Name parsing
  const profileBg = $main('.profile_bg');
  const nameEl = profileBg
    .find('h4')
    .filter(
      (_i: any, el: any) => !$main(el).text().includes('Student Profile')
    );
  let name =
    nameEl.text().trim() ||
    profileBg
      .contents()
      .filter((_i: any, el: any) => el.type === 'text')
      .text()
      .trim();

  if (!name || name.length < 3) {
    const welcomeMatch = text.match(
      /(?:Welcome|Hello|Name)[\s:-]*([A-Za-z\s]{4,40})(?:\s|\||$)/i
    );
    if (welcomeMatch) name = welcomeMatch[1].trim();
  }
  if (name) data.name = name.replace(/University ID.*/i, '').trim();

  // University ID
  const uidMatch = text.match(/University\s*ID\s*[:\s]*(\d+)/i);
  if (uidMatch) data.universityId = uidMatch[1];

  // 2. Photo extraction
  $main('img').each((_i: any, img: any) => {
    const src = $main(img).attr('src');
    if (src) {
      const lowerSrc = src.toLowerCase();
      if (
        lowerSrc.endsWith('.js') ||
        lowerSrc.includes('logo') ||
        lowerSrc.includes('captcha')
      )
        return;

      const uid = data.universityId || '';
      if (
        lowerSrc.includes('studentphotos') ||
        lowerSrc.includes('profile') ||
        (uid && src.includes(uid))
      ) {
        data.photoUrl = src;
      }
    }
  });
  if (!data.photoUrl) {
    const imgMatch = mainHtml.match(
      /<img[^>]*src=["']([^"']*(?:studentphotos|profile|uploads|data:\s*image)[^"']*)["']/i
    );
    if (imgMatch && !imgMatch[1].toLowerCase().endsWith('.js')) {
      let photoSrc = imgMatch[1];
      if (photoSrc.replace(/\\s/g, '').toLowerCase().startsWith('data:image')) {
        photoSrc = photoSrc.replace(/\\s/g, '');
      }
      data.photoUrl = photoSrc;
    }
  }

  // 3. Extract ALL dynamic profile fields across ALL fetched HTMLs
  const extendedDetails: any = {};

  pages.forEach((page, pageIdx) => {
    const $ = cheerio.load(page.html);

    $('table').each((_i: any, table: any) => {
      const $table = $(table);
      const rows = $table.find('tr');
      if (rows.length < 2) return;

      // Find the row with the most cells to be the header row
      let maxCells = 0;
      let headerRowIdx = 0;
      let potentialHeaders: string[] = [];

      rows.slice(0, 3).each((idx: number, row: any) => {
        const cells = $(row).find('th, td');
        if (cells.length > maxCells) {
          maxCells = cells.length;
          headerRowIdx = idx;
          potentialHeaders = cells
            .map((_: any, el: any) =>
              $(el)
                .text()
                .trim()
                .replace(/[\r\n]+/g, ' ')
            )
            .get();
        }
      });

      // Re-evaluate hasColons based on the potentialHeaders
      let hasColons = false;
      for (let i = 0; i < potentialHeaders.length; i += 2) {
        if (
          potentialHeaders[i].includes(':') ||
          (i + 1 < potentialHeaders.length &&
            potentialHeaders[i + 1].includes(':'))
        ) {
          hasColons = true;
        }
      }

      let tableName =
        page.name && page.name !== 'Unknown Tab'
          ? page.name
          : `table${pageIdx}_${_i + 1}`;
      const prevHeading = $table
        .prevAll('h1, h2, h3, h4, h5, h6, legend, .panel-heading')
        .first()
        .text()
        .trim();
      const parentHeading = $table
        .parent()
        .prevAll('h1, h2, h3, h4, h5, h6, legend, .panel-heading')
        .first()
        .text()
        .trim();

      let tabLinkName = '';
      const tabPaneId = $table
        .closest('.tab-pane, [id^="tab"], [id^="yt"]')
        .attr('id');
      if (tabPaneId) {
        tabLinkName = $main(`a[href="#${tabPaneId}"]`).text().trim();
      }

      if (tabLinkName) {
        tableName = tabLinkName;
      } else if (
        prevHeading &&
        prevHeading.length > 2 &&
        prevHeading.length < 50
      ) {
        tableName = prevHeading;
      } else if (
        parentHeading &&
        parentHeading.length > 2 &&
        parentHeading.length < 50
      ) {
        tableName = parentHeading;
      } else if (_i > 0 && page.name && page.name !== 'Unknown Tab') {
        tableName = `${page.name} ${_i + 1}`;
      }

      const cleanKey = tableName.replace(/[^a-zA-Z0-9\s]/g, '');
      const finalKey = cleanKey || `section${pageIdx}_${_i + 1}`;

      if (!hasColons) {
        const headers = potentialHeaders;
        if (headers.filter((h: string) => h).length > 0) {
          const tableData: any[] = [];
          rows.slice(headerRowIdx + 1).each((_k: any, row: any) => {
            const cells = $(row)
              .find('td')
              .map((_l: any, el: any) => {
                const $el = $(el);
                const link = $el.find('a').first();
                if (link.length > 0 && link.attr('href')) {
                  let href = link.attr('href') || '';
                  if (href.startsWith('/'))
                    href = `https://newerp.kluniversity.in${href}`;
                  return {
                    type: 'link',
                    text: $el.text().trim() || 'Link',
                    url: href,
                  };
                }
                return $el.text().trim();
              })
              .get();
            if (cells.length > 0) {
              const rowObj: any = {};
              headers.forEach((h: string, idx: number) => {
                if (h) rowObj[h] = cells[idx] || '';
              });
              if (Object.values(rowObj).some((v: any) => v !== '')) {
                tableData.push(rowObj);
              }
            }
          });

          if (tableData.length > 0) {
            extendedDetails[finalKey] = tableData;
          }
        }
      } else {
        // Fallback for pairs (only on the main page to avoid overriding)
        if (pageIdx === 0) {
          const cells = $table.find('td');
          for (let i = 0; i < cells.length; i += 2) {
            if (i + 1 < cells.length) {
              let label = $(cells[i]).text().trim();
              let value = $(cells[i + 1])
                .text()
                .trim()
                .replace(/^:\s*/, '')
                .trim();
              label = label.replace(/^:\s*/, '').replace(/:$/, '').trim();
              if (label && label.length > 1 && value && value !== ':') {
                if (!extendedDetails[label]) {
                  extendedDetails[label] = value;
                }
                const lKey = label.toLowerCase();
                if (lKey.includes('admission date')) data.admissionDate = value;
                if (lKey.includes('date of birth') || lKey === 'dob')
                  data.dob = value;
                if (lKey.includes('blood group')) data.bloodGroup = value;
                if (lKey.includes('email')) data.email = value;
                if (lKey.includes('height')) data.height = value;
                if (lKey.includes('weight')) data.weight = value;
                if (lKey.includes('regulation')) data.regulation = value;
                if (lKey.includes('program')) data.program = value;
              }
            }
          }
        }
      }
    });
  });

  data.extendedProfile = JSON.stringify(extendedDetails);
  return data;
}
// --- Simple GET fetchers ---
