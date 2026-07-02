# Automatic Gate & Entryways — Field Service Management Platform

Enterprise field service management platform for AutomaticGateAndEntryways.com by Micah Rowland. Handles the full workflow from estimate requests through invoicing and job dispatch.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/gate-app run dev` — run the frontend (port 20300, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (wouter routing, Tailwind CSS v4, framer-motion, recharts, shadcn/ui components)
- API: Express 5 (port 8080, proxied at /api)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT stored in localStorage (`auth_token`, `auth_user`). Bearer token on all protected routes.
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/gate-app/src/` — React frontend
  - `pages/` — login, dashboard, estimates, invoices, jobs, users, settings, time-entries, client-portal
  - `components/layout/` — AppLayout (sidebar nav), ProtectedRoute
  - `hooks/use-auth.ts` — auth state management
  - `lib/api.ts` — sets base URL and token getter for API client
- `artifacts/api-server/src/` — Express API server
  - `routes/` — auth, users, estimates, invoices, jobs, portfolio, faq, blog, newsletter, analytics, notifications, settings, timeEntries
  - `lib/auth.ts` — JWT + bcrypt utilities, requireAuth/requireRole middleware
- `lib/db/src/schema/` — Drizzle schemas for all tables
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — Generated hooks from Orval

## Architecture decisions

- Contract-first API: OpenAPI spec generates all React Query hooks + Zod schemas. Never write hooks manually.
- Auth is JWT-only with localStorage. No sessions/cookies needed for the SPA.
- Role-based access: admin > manager > supervisor > crew > client. Protected routes enforce roles client-side; API enforces server-side.
- Analytics uses raw SQL `sql<number>` Drizzle helper with `::int`/`::float` casts (not ORM column refs) to avoid Drizzle camelCase/snake_case mapping issues.
- Estimate → Invoice → Job conversion flow: `POST /api/estimates/:id/convert` creates the invoice automatically.

## Product

Five user roles with tailored experiences:
- **Admin** (Micah): Full dashboard, all management pages, settings, team management
- **Manager**: Estimates, invoices, jobs, team (read-only for crew), analytics
- **Supervisor**: Jobs assigned to them, time tracking
- **Crew**: Jobs assigned to them, time entry logging
- **Client**: Their own estimates, invoices, and job status

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@automaticgate.com | admin123 |
| Manager | manager@automaticgate.com | manager123 |
| Supervisor | supervisor@automaticgate.com | supervisor123 |
| Crew | crew@automaticgate.com | crew123 |
| Client | client@automaticgate.com | client123 |

## User preferences

- Luxury branding: Matte Black (#111111) + Gold (#C9A84C) + Off-White palette
- Fonts: Playfair Display (headings/logo) + Inter (body)
- Glassmorphism and card-based UI
- Demo accounts must be prominently displayed on the login page

## Gotchas

- Analytics route uses raw SQL with `::int`/`::float` casts — do NOT use `invoicesTable.amountPaid` (Drizzle ORM camelCase property) in raw `sql<>` template strings; use the actual column name `amount_paid`.
- Google Fonts must be loaded via `<link>` in `index.html`, NOT via `@import` in CSS (causes PostCSS build error with Tailwind v4).
- API codegen hook names: `useConvertEstimateToInvoice` (not `useConvertEstimate`), `useMarkInvoicePaid` (not `usePayInvoice`). Always check generated `lib/api-client-react/src/generated/api.ts` for exact names.
- The analytics estimate counter in estimates.ts is an in-memory counter that resets on server restart. Not a DB sequence.
- **API double-prefix bug:** Orval-generated hooks already include `/api/` in their paths (e.g. `/api/portfolio`). `setBaseUrl` in `lib/api.ts` must NOT append `/api` — only the Vite `BASE_URL` sub-path (empty string at root). Adding `/api` causes every request to hit `/api/api/…` → 404.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
