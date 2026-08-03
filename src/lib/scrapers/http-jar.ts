import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export const ERP_URL = 'https://newerp.kluniversity.in';
export const LOGIN_URL = `${ERP_URL}/index.php?r=site%2Flogin`;
export const ATTENDANCE_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fsearchgetinput`;
export const COURSE_LIST_URL = `${ERP_URL}/index.php?r=studentattendance%2Fstudentdailyattendance%2Fcourselist`;

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

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ScraperSession {
  cookies: { name: string; value: string }[];
  csrfToken: string;
  userAgent: string;
}

export type CookieJar = Record<string, string>;

export function getSetCookies(res: Response): string[] {
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  return raw.split(/,(?=\s*[^=;,]+=)/);
}

export function mergeSetCookies(jar: CookieJar, res: Response): void {
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

export function cookieHeader(jar: CookieJar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

export function jarToArray(jar: CookieJar): { name: string; value: string }[] {
  return Object.entries(jar).map(([name, value]) => ({ name, value }));
}

export function arrayToJar(
  cookies: { name: string; value: string }[]
): CookieJar {
  const jar: CookieJar = {};
  for (const c of cookies || []) {
    if (c && c.name) jar[c.name] = c.value;
  }
  return jar;
}

export async function fetchWithJar(
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
      signal: init.signal || AbortSignal.timeout(1500),
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

export function parseGenericTable(
  html: string | null | undefined
): Record<string, unknown>[] {
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return [];
  }

  const trimmedInput = html.trim();
  if (
    (trimmedInput.startsWith('{') && trimmedInput.endsWith('}')) ||
    (trimmedInput.startsWith('[') && trimmedInput.endsWith(']'))
  ) {
    try {
      const parsedJson = JSON.parse(trimmedInput);
      if (Array.isArray(parsedJson)) {
        if (
          parsedJson.every((item) => typeof item === 'object' && item !== null)
        ) {
          return parsedJson;
        }
      } else if (typeof parsedJson === 'object' && parsedJson !== null) {
        for (const key of [
          'html',
          'data',
          'content',
          'body',
          'table',
          'response',
        ]) {
          if (
            typeof parsedJson[key] === 'string' &&
            parsedJson[key].includes('<table')
          ) {
            return parseGenericTable(parsedJson[key]);
          }
        }
        for (const key of ['data', 'rows', 'result', 'items']) {
          if (
            Array.isArray(parsedJson[key]) &&
            parsedJson[key].every(
              (item: unknown) => typeof item === 'object' && item !== null
            )
          ) {
            return parsedJson[key] as Record<string, unknown>[];
          }
        }
      }
    } catch {
      // Not JSON, continue with HTML table parsing
    }
  }

  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  if (cleanHtml.trim() === '') {
    return [];
  }

  const $ = cheerio.load(cleanHtml);
  const tables = $('table');

  if (tables.length === 0) {
    return [];
  }

  function getDirectRows($table: cheerio.Cheerio<Element>): Element[] {
    const rows: Element[] = [];
    $table.children().each((_i: number, child: Element) => {
      const tag = child.tagName?.toLowerCase();
      if (tag === 'tr') {
        rows.push(child);
      } else if (tag === 'tbody' || tag === 'thead' || tag === 'tfoot') {
        $(child)
          .children('tr')
          .each((_j: number, trChild: Element) => {
            rows.push(trChild);
          });
      }
    });
    return rows;
  }

  function getNodeText($cell: cheerio.Cheerio<Element>): string {
    const $clone = $cell.clone();
    $clone
      .find('script, style, noscript, template, input[type="hidden"]')
      .remove();
    $clone.find('br').replaceWith('\n');
    $clone
      .find('div, p, tr, li, h1, h2, h3, h4, h5, h6')
      .before('\n')
      .after('\n');
    $clone
      .find('span, a, b, i, strong, em, small, font, td, th')
      .before(' ')
      .after(' ');
    const text = $clone.text();

    const lines = text
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean);
    return lines.join('\n');
  }

  function getNodeHref($cell: cheerio.Cheerio<Element>): string | null {
    const a = $cell.find('a[href]').first();
    if (a.length > 0) {
      const href = a.attr('href');
      return href ? href.trim() : null;
    }
    return null;
  }

  let bestRows: Record<string, unknown>[] = [];
  let maxColsFound = 0;

  tables.each((_tIdx: number, tableElem: Element) => {
    const $table = $(tableElem);
    const allTrs = getDirectRows($table);

    if (allTrs.length === 0) return;

    let headers: string[] = [];
    let dataRowStartIndex = 0;

    const firstTr = $(allTrs[0]);
    const ths = firstTr.children('th');
    if (ths.length > 0) {
      headers = ths.map((_i: number, el: Element) => getNodeText($(el))).get();
      dataRowStartIndex = 1;
    } else {
      const tds = firstTr.children('td');
      if (tds.length > 0) {
        headers = tds
          .map((_i: number, el: Element) => getNodeText($(el)))
          .get();
        dataRowStartIndex = 1;
      }
    }

    headers = headers.map((h, idx) => {
      const clean = h.trim();
      return clean !== '' ? clean : `column_${idx + 1}`;
    });

    const counts: Record<string, number> = {};
    headers = headers.map((h) => {
      counts[h] = (counts[h] || 0) + 1;
      return counts[h] > 1 ? `${h}_${counts[h]}` : h;
    });

    const currentTableData: Record<string, unknown>[] = [];

    for (let i = dataRowStartIndex; i < allTrs.length; i++) {
      const $row = $(allTrs[i]);
      const cells = $row.children('td, th');

      if (cells.length === 0) continue;

      const rowObj: Record<string, unknown> = {};
      let hasValue = false;

      cells.each((cIdx: number, cellElem: Element) => {
        const $cell = $(cellElem);
        const colName = headers[cIdx] || `column_${cIdx + 1}`;
        const cellText = getNodeText($cell);
        const href = getNodeHref($cell);

        if (cellText !== '') hasValue = true;

        if (href) {
          rowObj[colName] = cellText;
          rowObj[`${colName}_href`] = href;
        } else {
          rowObj[colName] = cellText;
        }
      });

      if (hasValue) {
        currentTableData.push(rowObj);
      }
    }

    if (
      currentTableData.length > bestRows.length ||
      (currentTableData.length === bestRows.length &&
        headers.length > maxColsFound)
    ) {
      bestRows = currentTableData;
      maxColsFound = headers.length;
    }
  });

  return bestRows;
}
