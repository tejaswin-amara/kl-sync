import { ScraperSession } from './scraper'

// ponytail: session tokens just hold the user's own ERP cookies. Encrypting them is YAGNI 
// because tampering only breaks their own session, no privilege escalation is possible.
// Removed node:crypto to allow running API routes on the Vercel Edge runtime (zero cold start).

export function encodeSession(session: ScraperSession): string {
  const json = JSON.stringify(session)
  return 'b64.' + btoa(unescape(encodeURIComponent(json)))
}

export function decodeSession(token: string): ScraperSession {
  const b64 = token.startsWith('b64.') ? token.slice(4) : token
  return JSON.parse(decodeURIComponent(escape(atob(b64))))
}
