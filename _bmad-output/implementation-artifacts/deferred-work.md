# Deferred Work

## Deferred from: code review of 1-1-monorepo-and-backend-foundation (2026-04-09)

- No rate limiting on any endpoint — no `@fastify/rate-limit` or equivalent; all endpoints open to unbounded request rates
- No pagination on GET /api/todos — `listActiveTodos` loads all rows into memory with no LIMIT
- docker-compose.yml hardcodes `CORS_ORIGIN=http://localhost:5173` in production config
- docker-compose.yml has no healthcheck — container marked healthy before Fastify is ready
- corepack pnpm version unpinned in Dockerfile — `pnpm@10` may install different patch than lockfile's `pnpm@10.33.0`
- Silent NaN on invalid PORT env var — `parseInt('abc')` returns NaN, no validation at startup
- Relative DATABASE_PATH resolves to process CWD, not project root — can create DB in unexpected location
- Migration SQL uses `DEFAULT false` instead of `DEFAULT 0` — Drizzle-generated, functionally equivalent in SQLite
- No content-type enforcement on POST/PATCH — Fastify defaults to JSON but doesn't explicitly enforce
- exactOptionalPropertyTypes disabled in tsconfig.base.json — weakens strict mode

## Deferred from: code review of 1-2-frontend-app-shell-with-design-system (2026-04-09)

- Double-submit race on rapid Enter presses in InputCard — no debounce or submitting guard; address in Story 1.3 when onSubmit is wired to mutation
- SQLite not closed on process exit — pre-existing from Story 1.1; no shutdown hook calls sqlite.close()
- migrate() called on every createDatabase invocation — pre-existing from Story 1.1; risk of lock contention if called concurrently
- apiClient includes mutation functions (apiPost/apiPatch/apiDelete) beyond story 1.2 scope — fetch wrappers not hooks; pragmatic to keep, validate fit in Story 1.3
