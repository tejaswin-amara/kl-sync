# Repo-wide Ponytail Audit Report: KL Sync ERP Client

yagni: 138-line hand-rolled regex/keyword NLP intent matcher with hardcoded mock responses. Use direct LLM tool dispatch via /api/ai/chat route. [src/lib/ai/executor.ts]
delete: 86-line unused custom SWR replacement hook useERPData with custom state & localStorage caching. nothing (useSWR is already used by all active data hooks). [src/hooks/useERPData.ts]
yagni: Duplicated 96-line AIChatDialog modal component and dual mode switcher. Single responsive AIChatSheet drawer component. [src/components/ai/AIChatDialog.tsx]
shrink: 70 lines of custom DOM cloning, element stripping, and manual text formatting in parseGenericTable. Cheerio native $cell.text() with whitespace normalization. [src/lib/scrapers/http-jar.ts]
stdlib: 45 lines of custom string cleaning, currency symbol regex, and accounting parens in parseCurrency. parseFloat(str.replace(/[^0-9.-]/g, '')) or Intl.NumberFormat. [src/lib/fee-utils.ts]
native: 40-line custom global pub/sub event emitter, memoryState, and Redux-style dispatch reducer in use-toast. React 19 useSyncExternalStore standard hook. [src/hooks/use-toast.ts]
native: 35 lines of set-cookie header splitting regex and manual CookieJar conversions. Native Response.headers.getSetCookie() and Headers API. [src/lib/scrapers/http-jar.ts]
native: External @upstash/redis package dependency and 25 lines of Redis try-catch wrappers for captcha nonces. Native in-memory / AES-encrypted token verification. [src/lib/captcha.ts]
stdlib: 18 lines of manual Uint8Array hex conversion and triple Map expiration sweeping loops. Node crypto.hash('sha256', input, 'hex') and lazy expiration. [src/lib/captcha.ts]
yagni: 15 lines across single-line re-export barrel files scraper.ts and schemas/index.ts. Direct domain module imports. [src/lib/scraper.ts]

net: -569 lines, -1 deps possible.
