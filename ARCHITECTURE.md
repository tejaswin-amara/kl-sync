# 🏛️ KL Sync - Architecture & System Design (ByteByteGo Method)

## 1. System Overview & Core Requirements
**KL Sync** is an ultra-fast, stateless, dark-themed modern web client for KL University's legacy ERP system. It acts as an intermediary edge proxy layer that intercepts legacy ASP.NET/HTML responses, transforms them into structured JSON payloads, and presents them in a responsive Next.js 16 dashboard.

---

## 2. High-Level Architecture Diagram

```
                                  [ CLIENT LAYER ]
                     +---------------------------------------+
                     |  Next.js 16 / React 19 Frontend UI    |
                     |  (Tailwind v4, Framer Motion, Lucide) |
                     +---------------------------------------+
                                         |
                                         | HTTPS (REST API)
                                         v
                                  [ EDGE PROXY LAYER ]
               +---------------------------------------------------+
               |  Next.js Serverless Route Handlers (/api/*)       |
               |  - Session Manager (AES-256-GCM Encrypted Token)  |
               |  - Cheerio HTML Scraper & Parser Engine           |
               |  - Sharp Image Processor (/api/fetch-photo)       |
               +---------------------------------------------------+
                                         |
                                         | HTTPS (Legacy Form Data & Cookies)
                                         v
                              [ LEGACY BACKEND LAYER ]
                     +---------------------------------------+
                     |   KL University Legacy ERP Server     |
                     |   (ASPX Web Forms / IIS / SQL Server) |
                     +---------------------------------------+
```

---

## 3. Data Strategy: Storage, Caching, and Security

### Storage (Stateless Model)
- **Zero Database (NoSQL/SQL) Persistence**: To prevent compliance risks, data leaks, and storage bloat, no student credentials or personal data are stored in a persistent database.
- **Client Session Token**: Session data (including ASP.NET ERP cookies) is encrypted server-side using **AES-256-GCM** with SHA-256 key derivation from `SESSION_SECRET` and returned to the client in an HttpOnly cookie or secure request header.

### Caching Strategy
1. **Client-Side Caching (SWR / Memory)**:
   - Dashboard data (attendance, timetable, CGPA, marks) is cached in client-side memory using SWR / React state.
   - Re-validation happens asynchronously on tab focus or manual refresh button click.
2. **Edge Asset Caching (Photo Proxy)**:
   - Profile images processed via `sharp` in `/api/fetch-photo` use `Cache-Control: public, max-age=86400, immutable` headers for browser edge caching.

---

## 4. API Communication & Protocols

| Endpoint | Method | Protocol | Description | Payload Input | Response Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/captcha` | `GET` | REST | Retrieves ERP Captcha | None | Base64 Image + Raw Session Token |
| `/api/login` | `POST` | REST | Authenticates against ERP | `{ username, password, captcha, sessionToken }` | Encrypted AES-256-GCM Session Token |
| `/api/erp-proxy` | `POST` | REST | Generic Scraper Proxy | `{ targetUrl, sessionToken }` | Parsed JSON Payload (`attendance`, `marks`, etc.) |
| `/api/fetch-photo` | `POST` | REST | Image Proxy | `{ photoUrl, sessionToken }` | Binary Image Stream |

---

## 5. Scalability, Bottlenecks & Failure Modes

1. **ERP Down / Timeout**:
   - *Issue*: Legacy university servers crash during result declarations.
   - *Mitigation*: Graceful degradation with client-side cached state, exponential backoff retries, and informative toast notifications.
2. **Parsing Schema Drift**:
   - *Issue*: ERP updates its HTML table markup.
   - *Mitigation*: Fallback parsing rules in `src/lib/scraper.ts`, resilient DOM query selectors, and fail-safe default fields.
3. **High Request Concurrency**:
   - *Issue*: Multiple dashboard widgets firing parallel ERP requests.
   - *Mitigation*: Request batching inside Next.js API layer to bundle upstream ERP calls where possible.
