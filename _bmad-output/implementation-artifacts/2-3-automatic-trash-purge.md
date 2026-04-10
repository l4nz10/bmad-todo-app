# Story 2.3: Automatic Trash Purge

Status: done

## Story

As a user,
I want expired trash items to be cleaned up automatically,
So that deleted tasks don't accumulate indefinitely and my trash stays manageable.

## Acceptance Criteria

1. **Given** the Fastify server starts **When** the trash cleanup plugin initializes **Then** a `setInterval` job is registered to run every hour **And** the cleanup runs once immediately on server start

2. **Given** the trash cleanup job runs **When** soft-deleted todos exist with `deletedAt` older than 7 days **Then** those records are permanently deleted from the database (`DELETE FROM todos WHERE deleted = 1 AND deletedAt < now - 7 days`) **And** the deletion count is logged via Pino

3. **Given** the trash cleanup job runs **When** no expired trash items exist **Then** the job completes silently with no errors

4. **Given** the `GET /api/trash` endpoint is called **When** the server queries for trashed items **Then** only items where `deleted = 1` and `deletedAt` is within the last 7 days are returned **And** the response format is `{ "data": [...], "meta": { "count": N } }`

5. **Given** the frontend has the trash dialog open **When** a trash item has been auto-purged by the backend since the last fetch **Then** the next refetch updates the trash list accurately (React Query handles stale data)

## Tasks / Subtasks

- [x] Task 1: Add `purgeExpiredTodos()` to trashService (AC: 2, 3)
  - [x] 1.1 Add `purgeExpiredTodos()` method to `createTrashService` in `apps/api/src/services/trashService.ts` — hard DELETE all rows where `deleted = true` AND `deletedAt < (now - 7 days)`, returns `{ purgedCount: number }`
  - [x] 1.2 Reuse existing `TRASH_TTL_DAYS = 7` constant already in the service
  - [x] 1.3 Use Drizzle's `lt()` operator with the cutoff ISO timestamp for the `deletedAt` comparison (opposite of `gte()` used in `listTrashedTodos`)
  - [x] 1.4 Use `.run()` instead of `.all()` — no need to return deleted rows, just execute. Access `changes` from the RunResult to get the count of deleted rows

- [x] Task 2: Create `trashCleanup.ts` plugin (AC: 1, 2, 3)
  - [x] 2.1 Create `apps/api/src/plugins/trashCleanup.ts` exporting `registerTrashCleanup(app: FastifyInstance, databasePath: string): Promise<void>`
  - [x] 2.2 Create its own database connection via `createDatabase(databasePath)` — follows established pattern from `registerTrashRoutes` and `registerTodoRoutes`
  - [x] 2.3 Create `createTrashService(db)` instance for the purge method
  - [x] 2.4 Define `TRASH_CLEANUP_INTERVAL_MS = 60 * 60 * 1000` (1 hour) as a constant in the plugin file
  - [x] 2.5 Run `purgeExpiredTodos()` once immediately on plugin registration, log result with `app.log.info({ purgedCount }, 'Trash cleanup: purged expired items')` — log even when count is 0 for observability on startup
  - [x] 2.6 Set up `setInterval` calling the same cleanup function every hour
  - [x] 2.7 Register `app.addHook('onClose', ...)` to `clearInterval` and `sqlite.close()` on shutdown

- [x] Task 3: Register cleanup plugin in app.ts (AC: 1)
  - [x] 3.1 Import `registerTrashCleanup` from `./plugins/trashCleanup.ts` in `apps/api/src/app.ts`
  - [x] 3.2 Call `await registerTrashCleanup(app, dbPath)` after route registration (after `registerTrashRoutes`)

- [x] Task 4: Backend tests (AC: 1, 2, 3)
  - [x] 4.1 Add purge tests to `apps/api/__tests__/routes/trashRoutes.test.ts` in a new `describe('Trash Cleanup')` block
  - [x] 4.2 Test: purges items deleted more than 7 days ago — create todo, delete it, backdate `deletedAt` to 8 days ago via direct DB access, call `purgeExpiredTodos()`, verify row is gone from DB
  - [x] 4.3 Test: preserves items deleted less than 7 days ago — create and delete a todo (recent), call `purgeExpiredTodos()`, verify row still exists
  - [x] 4.4 Test: returns correct purgedCount — backdate multiple items, purge, assert count matches
  - [x] 4.5 Test: returns purgedCount 0 when no expired items — call purge on empty/fresh DB
  - [x] 4.6 Test: verify `GET /api/trash` no longer returns purged items — backdate item, call purge via direct service, then hit `GET /api/trash` endpoint and verify item absent
  - [x] 4.7 Test pattern: Use same `createTestApp()` and direct DB import pattern established in the existing "excludes items deleted more than 7 days ago" test

- [x] Task 5: Verify no frontend changes needed (AC: 4, 5)
  - [x] 5.1 Confirm `GET /api/trash` already filters by 7-day window (it does — see `listTrashedTodos` in trashService.ts)
  - [x] 5.2 Confirm React Query refetch on `['trash']` key will naturally exclude purged items — no frontend code changes required
  - [x] 5.3 Run full test suite (`pnpm test`) to verify zero regressions

### Review Findings

- [x] [Review][Decision] AC #3: Info log fires when purgedCount=0, spec says "completes silently" — Fixed: logging now conditional on purgedCount > 0
- [x] [Review][Patch] Missing boundary test for items deleted exactly 7 days ago — Fixed: added "preserves items deleted exactly 7 days ago" test
- [x] [Review][Defer] Duplicate DB connection per module [trashCleanup.ts:8] — deferred, pre-existing pattern (same as trashRoutes, todoRoutes; dev notes say "do NOT refactor now")
- [x] [Review][Defer] deletedAt nullable without isNotNull guard [trashService.ts:51] — deferred, pre-existing pattern (same approach in listTrashedTodos and restoreTodo)
- [x] [Review][Defer] No batching/limit on unbounded DELETE [trashService.ts:50-52] — deferred, scale concern for SQLite todo app
- [x] [Review][Defer] setInterval needs .unref() for clean exit on unhandled crash [trashCleanup.ts:22] — deferred, minor defensive measure
- [x] [Review][Defer] Test code duplication and resource leak risk on assertion failure [trashRoutes.test.ts] — deferred, pre-existing test pattern throughout file

## Dev Notes

### Architecture Compliance

CRITICAL — Follow these patterns exactly (established in Stories 1.1-2.2):

- **Naming:** PascalCase for component files, camelCase for hooks/utils/plugins. camelCase for all variables, functions, props
- **Exports:** Named exports ONLY. No `export default`
- **Types:** Strict TypeScript. No `any`. Import types from `@bmad/shared` when needed
- **Constants:** No inline magic numbers. Define named constants (`TRASH_CLEANUP_INTERVAL_MS`, etc.)
- **Logging:** Use Fastify's Pino logger (`app.log.info()`, `app.log.error()`) — no `console.log`
- **Error handling:** Never swallow errors silently. Log all errors. The cleanup job should catch and log errors, not crash the server

### Backend Patterns (from Stories 1.1-2.2)

**Plugin registration pattern** — follow `cors.ts` / `helmet.ts`:
```typescript
export async function registerTrashCleanup(app: FastifyInstance, databasePath: string): Promise<void> {
  // Create DB connection (established pattern — each module gets its own)
  // Set up interval
  // Register onClose hook for cleanup
}
```

**Service pattern** — `trashService.ts` already has:
- `TRASH_TTL_DAYS = 7` constant
- `listTrashedTodos()` — uses `gte(todos.deletedAt, cutoff)` for items WITHIN 7 days
- `restoreTodo(id)` — restores with TTL check
- The `toTodo()` mapper (not needed for purge since we don't return data)
- ADD `purgeExpiredTodos()` to the returned object

**Drizzle delete pattern:**
```typescript
purgeExpiredTodos(): { purgedCount: number } {
  const cutoff = new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const result = db.delete(todos)
    .where(and(eq(todos.deleted, true), lt(todos.deletedAt, cutoff)))
    .run();
  return { purgedCount: result.changes };
}
```

Note: `lt()` is the opposite of `gte()` — items with `deletedAt < cutoff` are expired. Import `lt` from `drizzle-orm`.

**Database connection pattern** — each module creates its own:
- `registerTodoRoutes(app, databasePath)` creates connection + onClose hook
- `registerTrashRoutes(app, databasePath)` creates connection + onClose hook
- `registerTrashCleanup(app, databasePath)` should follow the same pattern
- This is a known deferred item (duplicate connections) — do NOT try to refactor it now

**Interval cleanup on shutdown:**
```typescript
const intervalId = setInterval(runCleanup, TRASH_CLEANUP_INTERVAL_MS);
app.addHook('onClose', () => {
  clearInterval(intervalId);
  sqlite.close();
});
```

**Pino logging format:**
```typescript
app.log.info({ purgedCount: result.purgedCount }, 'Trash cleanup: purged expired items');
```
Structured logging — data object first, message string second. This produces JSON like:
`{"purgedCount":3,"msg":"Trash cleanup: purged expired items"}`

### Error Handling in the Cleanup Job

The cleanup job runs on a timer — it must NEVER crash the server. Wrap the purge call in try/catch:
```typescript
async function runCleanup() {
  try {
    const result = trashService.purgeExpiredTodos();
    app.log.info({ purgedCount: result.purgedCount }, 'Trash cleanup: purged expired items');
  } catch (error) {
    app.log.error(error, 'Trash cleanup: failed to purge expired items');
  }
}
```

Note: The function itself is synchronous (Drizzle + better-sqlite3 is sync), but wrapping in try/catch is still critical.

### Testing Patterns (from Stories 1.1-2.2)

**Backend test setup** — reuse existing pattern from `trashRoutes.test.ts`:
```typescript
function createTestApp() {
  const tmpDir = mkdtempSync(join(tmpdir(), 'bmad-test-'));
  const dbPath = join(tmpDir, 'test.db');
  return { tmpDir, dbPath };
}
```

**Direct DB access for backdating** — already established pattern in existing trash tests (line 122-128 of trashRoutes.test.ts):
```typescript
const { createDatabase } = await import('../../src/db/client.ts');
const { db } = createDatabase(freshEnv.dbPath);
const { todos: todosTable } = await import('../../src/db/schema.ts');
const { eq } = await import('drizzle-orm');
const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
db.update(todosTable).set({ deletedAt: eightDaysAgo }).where(eq(todosTable.id, id)).run();
```

**Testing the service directly** — for purge tests, you can test the service method directly rather than only through HTTP endpoints:
```typescript
const { createTrashService } = await import('../../src/services/trashService.ts');
const trashService = createTrashService(db);
const result = trashService.purgeExpiredTodos();
expect(result.purgedCount).toBe(N);
```

**Verifying hard delete** — after purge, query the DB directly to confirm rows are gone:
```typescript
const rows = db.select().from(todosTable).where(eq(todosTable.id, id)).all();
expect(rows.length).toBe(0);
```

### Files to Create

```
apps/api/src/plugins/trashCleanup.ts    (NEW — cleanup plugin)
```

### Files to Modify

```
apps/api/src/services/trashService.ts   (ADD purgeExpiredTodos method)
apps/api/src/app.ts                     (ADD registerTrashCleanup import and call)
apps/api/__tests__/routes/trashRoutes.test.ts  (ADD purge test suite)
```

### Files NOT to Modify

```
apps/api/src/routes/trashRoutes.ts       # Routes are complete — DO NOT MODIFY
apps/api/src/routes/todoRoutes.ts        # DO NOT MODIFY
apps/api/src/db/schema.ts               # DO NOT MODIFY
apps/api/src/db/client.ts               # DO NOT MODIFY
apps/api/src/server.ts                  # DO NOT MODIFY
apps/web/**                             # NO FRONTEND CHANGES — DO NOT MODIFY
```

### Previous Story Intelligence (Stories 1.1-2.2)

**Key learnings to apply:**
- Each route/plugin module creates its own DB connection via `createDatabase(databasePath)` — do NOT try to share connections
- `app.addHook('onClose', ...)` for cleanup — every module that opens a DB connection registers its own close hook
- `trashService.ts` already has the cutoff date calculation pattern: `new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()` — reuse exactly
- Backend tests use temp directories with `mkdtempSync` and clean up with `rmSync` — follow the same pattern
- All assertions must be unconditional (no `if` guards)
- The "No permanent purge mechanism" deferred item from Story 2-2 review is EXACTLY what this story resolves

### Deferred Work This Story Addresses

From `deferred-work.md` (Story 2-2 review):
> "No permanent purge mechanism — soft-deleted items with deleted=true accumulate in the database indefinitely; TTL is only a display filter"

This story converts the display-only 7-day filter into an actual cleanup mechanism that hard-deletes expired records.

### References

- [Source: planning-artifacts/epics.md#Epic 2, Story 2.3] — Acceptance criteria, BDD scenarios
- [Source: planning-artifacts/architecture.md#API & Communication Patterns] — "Trash Cleanup: Scheduled cleanup on server start and then at a regular interval (e.g., every hour)"
- [Source: planning-artifacts/architecture.md#Project Structure] — `plugins/trashCleanup.ts` planned location
- [Source: planning-artifacts/architecture.md#Anti-Patterns to Avoid] — No console.log, no magic numbers, no silent catches
- [Source: planning-artifacts/prd.md#Reliability] — "Trash bin cleanup job runs reliably to purge items older than one week"
- [Source: implementation-artifacts/2-2-trash-bin-view-and-restore.md] — trashService patterns, test patterns, review findings
- [Source: implementation-artifacts/deferred-work.md] — "No permanent purge mechanism" deferred item resolved by this story

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Added `purgeExpiredTodos()` method to `createTrashService` using Drizzle's `lt()` operator and `.run()` for hard DELETE of expired trash items (deleted > 7 days ago). Returns `{ purgedCount: number }` from `result.changes`.
- Created `trashCleanup.ts` plugin following established plugin pattern (own DB connection, onClose hook). Runs cleanup immediately on registration for observability, then every hour via `setInterval`.
- Registered plugin in `app.ts` after `registerTrashRoutes`.
- Added 5 tests in `describe('Trash Cleanup')` block: purge expired items, preserve recent items, correct count for multiple items, zero count on empty DB, and API integration test verifying purged items are excluded from `GET /api/trash`.
- Verified no frontend changes needed — `listTrashedTodos` already filters by 7-day window, React Query refetch naturally excludes purged items.
- Full test suite: 33 API tests passed, 111 web tests passed, 0 regressions.

### Change Log

- 2026-04-10: Implemented automatic trash purge (Story 2.3) — service method, cleanup plugin, app registration, 5 backend tests, no frontend changes needed.

### File List

New:
- apps/api/src/plugins/trashCleanup.ts

Modified:
- apps/api/src/services/trashService.ts
- apps/api/src/app.ts
- apps/api/__tests__/routes/trashRoutes.test.ts
