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

## Deferred from: code review of 1-3-create-and-view-active-tasks (2026-04-09)

- Tests assert on CSS class names (brittle) — multiple tests check `className.toContain('bg-surface')` etc.; breaks on styling refactor. Pre-existing pattern from Story 1.2.
- `formatDate` no guard for invalid date string — `new Date(isoString)` could produce Invalid Date if `createdAt` is malformed. Backend validates dates so low risk.
- Mutate before initial query resolves could flash — optimistic update on undefined cache shows single item then full list on refetch. Edge case requiring specific timing.

## Deferred from: code review of 1-4-complete-reactivate-and-view-completed-tasks (2026-04-09)

- Toggle on freshly-created optimistic todo hits 404 — if user toggles a task before the POST create completes, PATCH fails because server doesn't have the todo yet. Pre-existing race condition between create and toggle mutations; low probability in normal usage.

## Deferred from: code review of 1-5-delete-tasks-with-inline-removal (2026-04-09)

- isPending blocks all concurrent deletes globally — single shared mutation instance serializes all delete operations; same pattern as useToggleTodo from Story 1.4
- Concurrent delete + toggle produces split-brain optimistic state — two mutations snapshot cache independently; whichever settles last may restore stale data
- apiDelete calls .json() unconditionally — will throw on 204 No Content; pre-existing in apiClient.ts
- Rollback no-ops when cache was empty at mutation time — `if (context?.previous)` guard skips rollback when cache is undefined; same pattern as useToggleTodo
- onSettled invalidation may cause brief flicker — refetch races with optimistic state on slow networks; standard React Query pattern
- Delete button icon uses text-text-muted color, potentially low contrast on mobile where hover:text-danger never fires — pre-existing in TaskCard.tsx (not modifiable per spec)
