import * as cheerio from 'cheerio';

const ERP_URL = 'https://newerp.kluniversity.in';
const ALLOWED_HOST = new URL(ERP_URL).hostname;
const LOGIN_URL = `${ERP_URL}/index.php?r=site%2Flogin`;
const ATTENDANCE_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fsearchgetinput`;
const COURSE_LIST_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fcourselist`;

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScraperSession {
  cookies: any[];
  csrfToken: string;
  userAgent: string;
}

// --- Cookie jar ---------------------------------------------------------------
// The ERP now sits behind a load balancer that pins each session to a backend
// via a sticky `SERVERID` cookie, and the login page is reached through a chain
// of 302 redirects that set cookies on different hops (SERVERID on the 302s,
// PHPSESSID/_csrf on the final 200). The captcha image, the login POST and the
// attendance requests must all carry the SAME cookies (same backend, same
// PHP session) or the captcha validates against the wrong session and login
// fails. So we keep a single jar and accumulate every Set-Cookie across hops.

type CookieJar = Record<string, string>;

// Robustly read all Set-Cookie headers (one cookie each), preferring the
// dedicated array API and falling back to a careful comma-split.
function getSetCookies(res: Response): string[] {
  const anyHeaders = res.headers as any;
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  // Split only on commas that begin a new "name=value" pair (not commas inside
  // Expires dates).
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

// Fetch with manual redirect following so we capture cookies on every hop and
// keep the jar consistent. The ERP redirects to http:// — we upgrade back to
// https to preserve Secure cookies.
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
    const currentHost = new URL(currentUrl).hostname;
    if (currentHost !== ALLOWED_HOST) {
      throw new Error(`Security Error: Attempted to fetch unauthorized host ${currentHost}`);
    }

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
      const nextUrl = new URL(location, currentUrl);
      const allowedHostname = new URL(ERP_URL).hostname;

      if (nextUrl.hostname !== allowedHostname) {
        throw new Error(`Security Error: SSRF attempt prevented. Redirect to untrusted host: ${nextUrl.hostname}`);
      }

      // Resolve relative + upgrade http -> https, then follow.
      let next = nextUrl.toString();
      next = next.replace(/^http:\/\//i, 'https://');
      currentUrl = next;
      // Per browser behaviour, 301/302/303 turn the follow-up into a GET.
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
  captchaImage: string; // Base64
  session: ScraperSession;
}

export async function getCaptcha(): Promise<CaptchaResponse> {
  try {
    const jar: CookieJar = {};

    // 1. Load the login page (follows the 302 chain, collecting SERVERID +
    //    PHPSESSID + _csrf into the jar).
    const loginRes = await fetchWithJar(LOGIN_URL, jar);
    const html = await loginRes.text();

    // 2. Parse HTML
    const $ = cheerio.load(html);

    // Get CSRF Token (hidden form field). Fall back to a regex if the markup
    // shifts slightly.
    let csrfToken = ($('input[name="_csrf"]').val() as string) || '';
    if (!csrfToken) {
      const csrfMatch = html.match(/name="_csrf"[^>]*value="([^"]+)"/);
      if (csrfMatch) csrfToken = csrfMatch[1];
    }
    if (!csrfToken) {
      throw new Error('CSRF Token not found (ERP login page structure may have changed)');
    }

    // Get Captcha Image URL
    let captchaSrc = $('#loginFormCaptcha-image').attr('src');
    if (!captchaSrc) {
      const m = html.match(/id="loginFormCaptcha-image"[^>]*src="([^"]+)"/);
      if (m) captchaSrc = m[1].replace(/&amp;/g, '&');
    }
    if (!captchaSrc) {
      throw new Error('Captcha element/source not found');
    }

    const captchaUrl = new URL(captchaSrc, LOGIN_URL).toString();

    // 3. Fetch the captcha image with the SAME jar so it is generated within the
    //    same backend + PHP session the user will log in against.
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
  // The signed device cookie issued by the ERP. The client persists this and
  // sends it back on future logins (see the device-registration note below).
  deviceId?: string;
  // True when this attempt registered a new device but the ERP's failing
  // post-login token step aborted it. The captcha is now spent, so the client
  // must fetch a fresh captcha and submit once more — this time the stored
  // deviceId makes the login succeed.
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
  // Reuse the jar built during getCaptcha so the login POST hits the same
  // backend (SERVERID) and PHP session (PHPSESSID) the captcha was issued for.
  const jar = arrayToJar(session.cookies);

  // The current ERP crashes on login (UserAccessToken error) unless the request
  // carries a previously-issued device cookie. Inject the stored one if we have
  // it so the ERP "finds" the device instead of trying to create it.
  if (deviceId) jar[DEVICE_COOKIE] = deviceId;

  const params = new URLSearchParams();
  params.append('_csrf', session.csrfToken);
  params.append('LoginForm[username]', username);
  params.append('LoginForm[password]', pass);
  params.append('LoginForm[captcha]', captcha);
  params.append('LoginForm[qr_code]', ''); // present in the current login form
  params.append('LoginForm[rememberMe]', '1');
  params.append('login-button', '');

  // POST manually (no auto-follow). Success used to be a 302, but the current
  // ERP returns 200 on success too, so we don't rely on the status code — we
  // keep the body to diagnose failures and verify auth via the attendance page.
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
    // Classic redirect-on-success: follow it to settle cookies.
    const location = loginRes.headers.get('location');
    if (location) {
      const destUrl = new URL(location, LOGIN_URL);
      if (destUrl.hostname !== ALLOWED_HOST) {
        throw new Error(`Security Error: Attempted to redirect to unauthorized host ${destUrl.hostname}`);
      }
      const dest = destUrl.toString().replace(/^http:\/\//i, 'https://');
      await fetchWithJar(dest, jar);
    }
  } else {
    loginText = await loginRes.text();
  }

  // --- Verify authentication by loading the attendance search page ----------
  // This is the source of truth: an authenticated session shows the academic
  // year / semester selects; an unauthenticated one bounces back to the login
  // form.
  const attendanceRes = await fetchWithJar(ATTENDANCE_URL, jar, {
    extraHeaders: { Referer: LOGIN_URL },
  });
  const attendanceHtml = await attendanceRes.text();

  const authenticated =
    /name="DynamicModel\[academicyear\]"/.test(attendanceHtml) ||
    /name="DynamicModel\[semesterid\]"/.test(attendanceHtml);

  console.error(
    '[login] deviceIdSent=%s attendancePageLen=%d authenticated=%s yearSelect=%s semSelect=%s',
    deviceId ? 'yes' : 'no',
    attendanceHtml.length,
    authenticated,
    /name="DynamicModel\[academicyear\]"/.test(attendanceHtml),
    /name="DynamicModel\[semesterid\]"/.test(attendanceHtml)
  );

  if (!authenticated) {
    // Classify the failure. IMPORTANT: do not match against the raw HTML — the
    // login page ALWAYS contains the word "captcha" (field label / image id) and
    // embeds every client-validation string (incl. "The verification code is
    // incorrect.") inside <script>, so matching the full body mislabels a wrong
    // password as a captcha error. We therefore look only at:
    //  (a) errText — the server-rendered field/form errors (cheerio .text()
    //      excludes <script>), and
    //  (b) `rendered` — the body with <script> blocks stripped out,
    // and we match on SPECIFIC error phrases, not the bare word "captcha".
    const $err = cheerio.load(loginText || attendanceHtml);
    const fieldErrors = $err('.help-block, .help-block-error, .invalid-feedback, .alert-danger')
      .map((_i, el) => $err(el).text().trim())
      .get()
      .filter(Boolean);
    const errText = fieldErrors.join(' | ');
    const rendered = (loginText || '').replace(/<script[\s\S]*?<\/script>/gi, '');
    const signal = (errText + ' ' + rendered).toLowerCase();
    const crashBody = (loginText || '').toLowerCase();

    console.error('[login] not authenticated. parsed errors:', errText || '(none)');

    // 1) The ERP's UserAccessToken crash (their error) — happens on a CORRECT
    //    login from an unregistered device, and issues a device cookie. If we
    //    harvested one, credentials+captcha were right: drive the device-setup
    //    retry. (Checked first; the 159-byte crash body has no error markup.)
    const harvested = jar[DEVICE_COOKIE];
    const isTokenCrash = /unknown property|useraccesstoken|yiisoft|exception/.test(crashBody);
    if (isTokenCrash && harvested) {
      return {
        success: false,
        needsCaptchaRetry: true,
        deviceId: harvested,
        message:
          'First-time device setup with the ERP — please enter the new captcha once more to finish signing in.',
        session: { ...session, cookies: jarToArray(jar), csrfToken: session.csrfToken },
        csrfToken: session.csrfToken,
        academicYears: [],
        semesters: [],
      };
    }
    if (isTokenCrash) {
      throw new Error(
        "KLU ERP server error during login (an issue on the university's side). " +
          'Please refresh the captcha and try again.'
      );
    }

    // 2) Wrong username/password. This phrase is NOT among the embedded
    //    client-validation messages, so it only appears when the ERP actually
    //    rejects the credentials.
    if (
      /incorrect username or password|invalid (username|password|login|credentials)|wrong password|password is incorrect|user (does not exist|not found)|account (is )?(locked|disabled|inactive|blocked)/.test(
        signal
      )
    ) {
      throw new Error('Incorrect username or password.');
    }

    // 3) Wrong captcha — match the SPECIFIC server message, never the bare word
    //    "captcha" (which is always present in the page chrome).
    if (
      /verification code is incorrect|invalid captcha|incorrect captcha|captcha (is )?(incorrect|invalid|wrong)/.test(
        signal
      )
    ) {
      throw new Error('Captcha incorrect — please re-enter the captcha and try again.');
    }

    // 4) Otherwise surface the ERP's own rendered error if we parsed one.
    throw new Error(
      errText ? `Login failed: ${errText}` : 'Login failed: the ERP rejected the request. Please refresh the captcha and try again.'
    );
  }

  // Extract a fresh CSRF token for the authenticated context.
  const csrfTokenMatch = attendanceHtml.match(/name="_csrf"[^>]*value="([^"]+)"/);
  const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : session.csrfToken;

  // Parse Academic Years and Semesters
  const $ = cheerio.load(attendanceHtml);

  const academicYears: SemesterOption[] = [];
  $('select[name="DynamicModel[academicyear]"] option').each((i, el) => {
    const value = $(el).attr('value');
    const label = $(el).text().trim();
    if (value) academicYears.push({ value, label });
  });

  const semesters: SemesterOption[] = [];
  $('select[name="DynamicModel[semesterid]"] option').each((i, el) => {
    const value = $(el).attr('value');
    const label = $(el).text().trim();
    if (value) semesters.push({ value, label });
  });

  console.error('[login] SUCCESS parsed years=%d semesters=%d', academicYears.length, semesters.length);

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
  const attendanceData = parseAttendanceHtml(courseListHtml);
  
  return {
    success: true,
    message: 'Attendance Data Fetched Successfully',
    attendanceData: attendanceData
  };
}

function parseAttendanceHtml(html: string) {
    const $ = cheerio.load(html);
    const table = $('table').first();
    const headers: string[] = [];
    const data: any[] = [];

    // Get headers
    // Try standard thead > tr > th
    table.find('thead tr th').each((i, el) => {
        headers.push($(el).text().trim());
    });
    
    // If no headers found, try the first row of the table body or just the first tr
    if (headers.length === 0) {
        const firstRow = table.find('tr').first();
        firstRow.find('th, td').each((i, el) => {
            headers.push($(el).text().trim());
        });
    }

    // Get data
    // If we used the first row as header, we should skip it
    const rows = table.find('tr');
    const startIndex = (table.find('thead').length > 0) ? 0 : 1; 
    // Wait, if using thead, tbody rows start at 0 (relative to tbody) or we just select tbody tr
    
    const bodyRows = table.find('tbody tr');
    const rowsToIterate = bodyRows.length > 0 ? bodyRows : rows.slice(1);

    rowsToIterate.each((i, row) => {
        const rowData: any = {};
        const cells = $(row).find('td');
        
        // Check for "No results found"
        // The ERP displays a single cell spanning columns with this text when no data exists
        if (cells.length === 1 && $(cells[0]).text().trim().includes('No results found')) {
            return; // Skip this row
        }

        // Only process if we have cells matching headers roughly
        if (cells.length > 0) {
            cells.each((j, cell) => {
                const header = headers[j] || `col_${j}`;
                rowData[header] = $(cell).text().trim();
            });
            data.push(rowData);
        }
    });

    return data;
}
