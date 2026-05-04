# FSM Finance Dashboard

Vite + React + TanStack Query frontend for uploading financial statements and viewing parsed summaries (Chart.js).

## Supported Organizations

- HSO / Express Mart
- 303 Software  
- NORTH Dispensaries
- Lucky Services
- Minted Ventures
- Tom's Vending
- FSM (Full Send Management)

## Features

- Upload UI with drag-and-drop
- **`VITE_API_URL`** — API origin at build/dev time (no meta-tag query hacks)
- **`@tanstack/react-query`** — upload uses `useMutation` for server state
- Chart.js report overview (bundled by Vite)

## Local development

```bash
cp .env.example .env   # then set VITE_API_URL to match backend host/port (backend PORT in .env)
npm install
npm run dev
```

Set **`VITE_API_URL`** in `.env` to your backend origin (**same port** as `PORT` in `finance-dashboard-backend/.env`, e.g. `http://localhost:3123`). Restart `npm run dev` after changing env vars.

While **`npm run dev`** is running, the browser calls **`/api` on the Vite origin** (same host/port as the UI). Vite **proxies** those requests to `VITE_API_URL`, which avoids **CORS / “Failed to fetch”** problems when talking to a backend on another port.

Production build:

```bash
npm run build   # output in dist/
npm run preview
```

## Deploy (GitHub Actions → S3 → CloudFront)

Production UI: **[https://finance.fullsend.management](https://finance.fullsend.management)** (same distribution as CloudFront hostname `d3glwhukv87k4z.cloudfront.net`).

The workflow runs `npm install && npm run build` then syncs **`dist/`** to S3.

Configure **`VITE_API_URL`** so the baked-in API origin matches your **backend** (no trailing slash)—not this SPA hostname, because CloudFront only serves static assets. Example: **`https://api.finance.fullsend.management`** once that host terminates TLS and proxies to Express.

## Live Demo

🌐 **View online:** [https://abigail-fsm.github.io/finance-dashboard](https://abigail-fsm.github.io/finance-dashboard)  
*(GitHub Pages must serve the built `dist/` output or equivalent.)*

## Development status

- **Phase 1:** Interface & Upload — done  
- **Phase 2:** Parser integration (API) — done  
- **Phase 3:** Analytics dashboard — planned  

---
*Built for FSM internal use • April 2026*
