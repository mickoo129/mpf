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

A frontend-only React+Vite web app for comparing Hong Kong MPF (Mandatory Provident Fund) performance.

### Features
- **Fund Rankings**: Top 10 and Bottom 10 funds across 11 time periods (daily, weekly, monthly, MTD, YTD, 3M, 6M, 1Y, 3Y, 5Y, 10Y)
- **Fund Detail**: Individual fund page with price trend chart (Recharts AreaChart) and all-period return breakdown
- **Category Comparison**: Average returns by fund category (equity HK/global/Asia/China/US/Europe, bond, mixed, money market, conservative, guaranteed, target date, index) with bar chart visualization
- **Trustee Comparison**: Side-by-side comparison of two trustees with all fund performance listed

### Data
- Sample MPF data with 60+ realistic funds from 11 trustees
- Fund categories: equity (HK, global, Asia, China, US, Europe), bond, mixed, money market, conservative, guaranteed, target date, index
- Price history generated with realistic volatility patterns for charting
- Returns computed from price history for all time periods

### Key Files
- `artifacts/mpf-compare/src/data/mpf-data.ts` - All fund data, types, and utility functions
- `artifacts/mpf-compare/src/pages/Rankings.tsx` - Top/bottom 10 ranking page
- `artifacts/mpf-compare/src/pages/FundDetail.tsx` - Individual fund detail with chart
- `artifacts/mpf-compare/src/pages/CategoryComparison.tsx` - Category comparison page
- `artifacts/mpf-compare/src/pages/TrusteeComparison.tsx` - Trustee comparison page
- `artifacts/mpf-compare/src/App.tsx` - Main app with routing and layout

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
