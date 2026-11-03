# Staging environment and release gate

Staging must use its own PostgreSQL database, domain, and secrets. Never point staging at production data or use the publicly documented demo passwords.

## Required staging configuration
- Node.js 22, pnpm 10, PostgreSQL 16
- `DATABASE_URL`: staging-only PostgreSQL connection, TLS enforced by hosting provider
- `SESSION_SECRET`: randomly generated secret of at least 32 characters, stored in the host secret manager
- `CORS_ORIGINS`: exact HTTPS staging frontend origin (no wildcard)
- `PORT`: application API port
- `NODE_ENV=production`: enables secure cookie behavior when staging uses HTTPS
- `BASE_PATH=/`: frontend build path
- A reverse proxy must serve the frontend and route `/api/*` to the API on the **same HTTPS origin**.

## Release procedure
1. Provision staging Postgres and configure a tested backup/restore policy.
2. Apply schema changes via reviewed migrations; do not run destructive schema push against production.
3. Install dependencies using `pnpm install --frozen-lockfile`.
4. Run `pnpm run typecheck`, `pnpm --filter @workspace/api-server run build`, and `pnpm --filter @workspace/gate-app run build`.
5. Start the API using `pnpm --filter @workspace/api-server start`; serve the built frontend behind the HTTPS reverse proxy.
6. Confirm `/api/healthz` is healthy. Run authentication and five-role integration tests **only against disposable test data**; the test suite promotes registered users to roles and creates records.
7. Run browser smoke tests for login, reload, logout, protected routes, cookie flags, and each role's navigation.
8. Validate estimates, invoices, jobs, time entries, and uploads manually on staging; verify denied cross-client access.
9. Review error logs, backup restore, monitoring, rollback, and migration recovery before a production release.

## Production release blockers
- Rotate/delete any legacy accounts using the published demo passwords; removing the UI does **not** invalidate existing database credentials.
- Replace the disabled invoice payment-marking endpoint with a verified payment-provider webhook if online payments are required.
- Audit unauthenticated estimate submissions for validation, abuse prevention, and unique numbering.
- Verify authorization on every mutation and attachment endpoint, not just the role smoke tests.
- Set up actual staging hosting, TLS certificates, DNS, secret storage, monitoring, and backups. This repository does not provision cloud infrastructure by itself.
