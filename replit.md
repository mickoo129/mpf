# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## MPF Compare App

A full-stack React+Vite web app for comparing Hong Kong MPF (Mandatory Provident Fund) performance using **real data** scraped from the MPFA mobile website.

### Architecture
- **Frontend**: React + Vite + Tailwind CSS + Recharts (`artifacts/mpf-compare`)
- **API Backend**: Express server on port 8080 (`artifacts/api-server`)
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **Scraper**: Cheerio-based scraper targeting `mfp.mpfa.org.hk/mobile/eng/mpp_list.jsp`
- **Cron job**: Daily 8am Mon–Fri HKT to refresh MPFA data

### Data Source
- Real MPFA data scraped from `mfp.mpfa.org.hk/mobile/eng/mpp_list.jsp` using Cheerio
- 447 fund rows scraped, covering all major trustees and fund categories
- Returns available: 1Y, 5Y, 10Y, Since Launch, 2025, 2024, 2023, 2022, 2021

### Features
- **Fund Rankings**: Top 10 and Bottom 10 funds across 9 real MPFA periods
- **Fund Detail**: Individual fund page with calendar year bar chart + multi-period return breakdown; shows fund size, FER, risk class, launch date
- **Category Comparison**: Average returns by fund category with bar chart visualization; expandable fund lists
- **Trustee Comparison**: Side-by-side comparison of two trustees with all fund performance listed

### DB Schema
- `mpf_funds` — fund metadata (cfId, trustee, scheme, fundType, FER, riskClass, etc.)
- `mpf_returns` — returns by fund + period (annualized + cumulative)
- `mpf_sync_log` — sync history with error tracking

### API Endpoints (port 8080)
- `GET /api/mpf/funds/rankings?period=1y&limit=10` — top/bottom funds
- `GET /api/mpf/funds/:cfId` — fund detail with all returns
- `GET /api/mpf/categories?period=1y` — category averages
- `GET /api/mpf/trustees?period=1y` — trustee stats + fund lists
- `GET /api/mpf/sync/status` — last sync status
- `POST /api/mpf/sync` — trigger manual sync

### Key Files
- `artifacts/mpf-compare/src/lib/api.ts` — Frontend API client, types, PERIODS, helpers
- `artifacts/mpf-compare/src/pages/Rankings.tsx` — Top/bottom 10 ranking page
- `artifacts/mpf-compare/src/pages/FundDetail.tsx` — Fund detail with calendar bar chart
- `artifacts/mpf-compare/src/pages/CategoryComparison.tsx` — Category comparison page
- `artifacts/mpf-compare/src/pages/TrusteeComparison.tsx` — Trustee comparison page
- `artifacts/mpf-compare/src/App.tsx` — Main app with routing and layout
- `artifacts/api-server/src/lib/mpf-scraper.ts` — MPFA cheerio scraper
- `artifacts/api-server/src/routes/mpf.ts` — 8 API endpoints
- `lib/db/src/schema/mpf-funds.ts` — DB schema

### Vite Dev Proxy
Vite proxies `/api` → `http://localhost:8080` in development.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
