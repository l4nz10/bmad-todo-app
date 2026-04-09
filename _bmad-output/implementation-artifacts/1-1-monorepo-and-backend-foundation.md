# Story 1.1: Monorepo and Backend Foundation

Status: done

## Story

As a developer,
I want a fully configured monorepo with a working REST API backed by SQLite,
So that the frontend has a reliable backend to integrate with for all task operations.

## Acceptance Criteria

1. **Given** the project is initialized from scratch **When** `pnpm install` and `pnpm dev` are run **Then** Turborepo starts the Fastify API server on port 3000
2. **Given** the project is initialized **When** the shared package is inspected **Then** `packages/shared` exports `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`, `ApiResponse<T>`, and `ApiError` types
3. **Given** the database schema **When** Drizzle ORM schema is inspected **Then** a `todos` table exists with columns: `id` (TEXT UUID PK), `userId` (TEXT default 'default', indexed), `text` (TEXT not null), `completed` (INTEGER 0/1 default 0), `deleted` (INTEGER 0/1 default 0), `deletedAt` (TEXT nullable ISO timestamp), `createdAt` (TEXT ISO timestamp), `updatedAt` (TEXT ISO timestamp)
4. **Given** the database schema **When** Drizzle migrations are generated **Then** migrations are runnable and produce the correct table structure
5. **Given** the API is running **When** `POST /api/todos` is called with `{ "id": "<valid-uuid>", "text": "Test task" }` **Then** a new todo is created and returned as `{ "data": { "id": "...", "text": "Test task", "completed": false, ... } }` **And** the server validates UUID format and rejects invalid IDs with 400
6. **Given** active todos exist **When** `GET /api/todos` is called **Then** all todos where `deleted = 0` are returned as `{ "data": [...], "meta": { "count": N } }`
7. **Given** a todo exists **When** `PATCH /api/todos/:id` is called with `{ "completed": true }` **Then** the todo's `completed` field is updated and the updated todo is returned
8. **Given** a todo exists **When** `DELETE /api/todos/:id` is called **Then** the todo is soft-deleted (`deleted = 1`, `deletedAt` set to current ISO timestamp)
9. **Given** the project root **When** the project structure is inspected **Then** `@fastify/cors` is configured, `@fastify/helmet` is registered, Fastify JSON Schema validation is applied, Pino logging is configured, error responses follow `{ "error": "message", "statusCode": N }` format, all naming follows camelCase, Docker files exist

## Tasks / Subtasks

- [x] Task 1: Initialize monorepo structure (AC: #1)
  - [x] 1.1 Run `npx create-turbo@latest` with pnpm, clean up default apps/packages
  - [x] 1.2 Configure `pnpm-workspace.yaml` with `apps/*` and `packages/*`
  - [x] 1.3 Create `tsconfig.base.json` with strict TypeScript settings
  - [x] 1.4 Configure `turbo.json` with `dev`, `build`, `lint`, `test` pipelines
  - [x] 1.5 Add root `.gitignore`, `.env.example`
- [x] Task 2: Create shared types package (AC: #2)
  - [x] 2.1 Create `packages/shared/package.json` with name `@bmad/shared`
  - [x] 2.2 Create `packages/shared/tsconfig.json` extending base config
  - [x] 2.3 Create `packages/shared/src/types/todo.ts` with `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`
  - [x] 2.4 Create `packages/shared/src/types/api.ts` with `ApiResponse<T>`, `ApiError`
  - [x] 2.5 Create `packages/shared/src/index.ts` re-exporting all types
- [x] Task 3: Set up API app with Fastify (AC: #1, #9)
  - [x] 3.1 Create `apps/api/package.json` with Fastify, TypeScript, tsx dependencies
  - [x] 3.2 Create `apps/api/tsconfig.json` extending base config
  - [x] 3.3 Create `apps/api/src/config.ts` with environment variable loading (PORT, DATABASE_PATH, NODE_ENV, CORS_ORIGIN)
  - [x] 3.4 Create `apps/api/src/app.ts` (app factory for testing) and `apps/api/src/server.ts` (server entry)
  - [x] 3.5 Register `@fastify/cors` (restrict to frontend origin) in `apps/api/src/plugins/cors.ts`
  - [x] 3.6 Register `@fastify/helmet` in `apps/api/src/plugins/helmet.ts`
  - [x] 3.7 Configure Pino logging (pretty-print in dev, JSON in production)
  - [x] 3.8 Set up global error handler formatting errors as `{ "error": "message", "statusCode": N }`
- [x] Task 4: Set up database with Drizzle ORM + SQLite (AC: #3, #4)
  - [x] 4.1 Install `drizzle-orm`, `better-sqlite3`, `drizzle-kit`
  - [x] 4.2 Create `apps/api/drizzle.config.ts`
  - [x] 4.3 Create `apps/api/src/db/schema.ts` with `todos` table definition (all columns as specified)
  - [x] 4.4 Create `apps/api/src/db/client.ts` with database connection
  - [x] 4.5 Generate and run initial migration with `drizzle-kit generate` and `drizzle-kit migrate`
- [x] Task 5: Implement todo service layer (AC: #5, #6, #7, #8)
  - [x] 5.1 Create `apps/api/src/services/todoService.ts` with `createTodo`, `listActiveTodos`, `updateTodo`, `softDeleteTodo`
  - [x] 5.2 Implement UUID format validation (reject non-UUID-v4 ids with 400)
  - [x] 5.3 Implement soft delete logic (set `deleted = 1`, `deletedAt = now`)
  - [x] 5.4 Ensure `updatedAt` is set on every mutation
- [x] Task 6: Implement API routes with JSON Schema validation (AC: #5, #6, #7, #8, #9)
  - [x] 6.1 Create `apps/api/src/routes/todoRoutes.ts` with all 4 endpoints
  - [x] 6.2 Define JSON Schema for POST body (`id`: string UUID, `text`: string non-empty)
  - [x] 6.3 Define JSON Schema for PATCH body (`completed`: boolean optional, `text`: string optional)
  - [x] 6.4 Define JSON Schema for route params (`:id` as string UUID)
  - [x] 6.5 Wrap all responses in `{ "data": ... }` or `{ "data": [...], "meta": { "count": N } }` format
- [x] Task 7: Create Docker configuration (AC: #9)
  - [x] 7.1 Create `Dockerfile` with multi-stage build (build stage + production stage)
  - [x] 7.2 Create `docker-compose.yml` with SQLite volume mount at `/data/bmad.db`
- [x] Task 8: Write backend tests (AC: #5, #6, #7, #8)
  - [x] 8.1 Set up Vitest configuration for API app
  - [x] 8.2 Create `apps/api/__tests__/routes/todoRoutes.test.ts` using Fastify `inject()`:
    - Test POST /api/todos creates a todo and returns wrapped response
    - Test POST /api/todos with invalid UUID returns 400
    - Test POST /api/todos with empty text returns 400
    - Test GET /api/todos returns only non-deleted todos with count
    - Test PATCH /api/todos/:id updates completed status
    - Test PATCH /api/todos/:id with non-existent id returns 404
    - Test DELETE /api/todos/:id soft-deletes the todo
  - [x] 8.3 Create `apps/api/__tests__/services/todoService.test.ts` for service layer unit tests

## Dev Notes

### Architecture Compliance

**CRITICAL - Follow these patterns exactly:**

- **Naming:** camelCase everywhere - DB columns, API JSON fields, TypeScript code, file names (except PascalCase components)
- **Exports:** Named exports ONLY. No `export default`. No barrel `index.ts` files in app packages (shared package `index.ts` is the one exception for re-exports)
- **Types:** Strict TypeScript. No `any` type. No escape hatches
- **API Response Format:**
  - Success: `{ "data": <item> }` or `{ "data": [...], "meta": { "count": N } }`
  - Error: `{ "error": "Human-readable message", "statusCode": N }`
- **Dates:** ISO 8601 strings everywhere (`"2026-04-03T10:30:00.000Z"`)
- **Booleans:** `true`/`false` in JSON, `0`/`1` in SQLite (Drizzle handles conversion)
- **IDs:** UUID v4 strings, generated client-side, validated server-side
- **Nulls:** Explicit `null` in JSON, never `undefined` in API responses
- **Empty arrays:** `[]` never `null`

### Technical Stack (Exact Versions)

- **Runtime:** Node.js 20+ (LTS) — required by both Fastify v5 and Vite 8
- **Package Manager:** pnpm 10.x (workspace protocol, version catalogs)
- **Monorepo:** Turborepo 2.9.x (`npx create-turbo@latest`)
- **Backend Framework:** Fastify 5.8.x — requires Node 20+, all v4 deprecated APIs removed, route params no longer have Object prototype (use `Object.hasOwn()`)
- **ORM:** drizzle-orm 0.45.x with `better-sqlite3` — config uses `dialect: "sqlite"`, `driver: "better-sqlite3"`
- **Migration Tool:** drizzle-kit 0.30.x — `npx drizzle-kit generate` then `npx drizzle-kit migrate`
- **Testing:** Vitest (latest stable)
- **Logging:** Pino (built into Fastify)
- **Security:** `@fastify/cors` 11.x, `@fastify/helmet` 13.x (Fastify v5-compatible)
- **Env:** `@fastify/env` 6.x (Fastify v5-compatible)

### Database Schema

```sql
CREATE TABLE todos (
  id TEXT PRIMARY KEY,          -- UUID v4
  userId TEXT NOT NULL DEFAULT 'default',  -- indexed, for future multi-user
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,    -- 0 = false, 1 = true
  deleted INTEGER NOT NULL DEFAULT 0,      -- 0 = false, 1 = true (soft delete)
  deletedAt TEXT,                          -- ISO timestamp, null if not deleted
  createdAt TEXT NOT NULL,                 -- ISO timestamp
  updatedAt TEXT NOT NULL                  -- ISO timestamp
);

CREATE INDEX idx_todos_userId ON todos(userId);
```

### API Endpoints

| Method | Route | Request Body | Response |
|--------|-------|-------------|----------|
| POST | `/api/todos` | `{ "id": "uuid", "text": "string" }` | `{ "data": { Todo } }` |
| GET | `/api/todos` | - | `{ "data": [Todo], "meta": { "count": N } }` |
| PATCH | `/api/todos/:id` | `{ "completed"?: boolean, "text"?: string }` | `{ "data": { Todo } }` |
| DELETE | `/api/todos/:id` | - | `{ "data": { Todo } }` (soft-deleted todo) |

### Error Codes

- `400` — Invalid UUID format, empty text, invalid request body
- `404` — Todo not found
- `500` — Unexpected server error

### Project Structure (This Story)

```
bmad/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── apps/
│   └── api/
│       ├── .env.example
│       ├── package.json
│       ├── tsconfig.json
│       ├── drizzle.config.ts
│       ├── src/
│       │   ├── server.ts          # Entry point — starts Fastify
│       │   ├── app.ts             # App factory (for testing with inject())
│       │   ├── config.ts          # Env var loading
│       │   ├── db/
│       │   │   ├── schema.ts      # Drizzle schema (todos table)
│       │   │   ├── client.ts      # Database connection
│       │   │   └── migrations/    # Generated by drizzle-kit
│       │   ├── routes/
│       │   │   └── todoRoutes.ts  # All 4 CRUD endpoints
│       │   ├── services/
│       │   │   └── todoService.ts # Business logic
│       │   └── plugins/
│       │       ├── cors.ts        # @fastify/cors config
│       │       └── helmet.ts      # @fastify/helmet config
│       └── __tests__/
│           ├── routes/
│           │   └── todoRoutes.test.ts
│           └── services/
│               └── todoService.test.ts
└── packages/
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts           # Re-exports
            └── types/
                ├── todo.ts        # Todo, CreateTodoRequest, UpdateTodoRequest
                └── api.ts         # ApiResponse<T>, ApiError
```

### Key Implementation Details

**App Factory Pattern:** Separate `app.ts` (creates and configures Fastify instance) from `server.ts` (calls `app.ts` then listens). This lets tests use `inject()` without starting an HTTP server.

**Drizzle Schema Definition Example:**
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().default('default'),
  text: text('text').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deletedAt'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});
```

**Drizzle integer mode 'boolean':** Automatically converts between JS boolean and SQLite 0/1. Use this for `completed` and `deleted` columns.

**UUID Validation Regex:** `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

**Fastify JSON Schema Example (POST /api/todos):**
```json
{
  "body": {
    "type": "object",
    "required": ["id", "text"],
    "properties": {
      "id": { "type": "string", "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$" },
      "text": { "type": "string", "minLength": 1 }
    },
    "additionalProperties": false
  }
}
```

**Fastify Test Pattern (inject):**
```typescript
import { buildApp } from '../../src/app';

const app = await buildApp({ /* test config */ });
const response = await app.inject({
  method: 'POST',
  url: '/api/todos',
  payload: { id: 'valid-uuid-here', text: 'Test task' },
});
expect(response.statusCode).toBe(201);
```

**Dev Server:** `tsx watch src/server.ts` for backend hot reload during development.

**Vite Proxy (for Story 1.2, but configure now):** The API does NOT need to serve static files in dev mode. Vite will proxy `/api/*` to the Fastify server. Static file serving (`@fastify/static`) is a production-only concern handled later.

### Anti-Patterns to Avoid

- Do NOT use `export default` — named exports only
- Do NOT create barrel `index.ts` files in app packages
- Do NOT use `any` type anywhere
- Do NOT use `console.log` — use Pino logger
- Do NOT hardcode magic numbers — define constants (e.g., `DEFAULT_USER_ID = 'default'`)
- Do NOT create a separate repository layer — services use Drizzle directly
- Do NOT add authentication — single user MVP, but userId column exists for future
- Do NOT add trash routes in this story — that's Epic 2
- Do NOT add static file serving plugin yet — that's Story 1.2+

### Project Structure Notes

- Alignment with architecture document's project structure: exact match
- No `apps/web/` directory created in this story — only `apps/api/` and `packages/shared/`
- The web app will be added in Story 1.2

### References

- [Source: planning-artifacts/architecture.md#Starter Template Evaluation] — Initialization commands and manual setup rationale
- [Source: planning-artifacts/architecture.md#Data Architecture] — Schema design and Drizzle ORM patterns
- [Source: planning-artifacts/architecture.md#API & Communication Patterns] — Route structure, validation, error handling
- [Source: planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming, structure, format patterns
- [Source: planning-artifacts/architecture.md#Infrastructure & Deployment] — Docker setup, single-server architecture
- [Source: planning-artifacts/epics.md#Story 1.1] — Full acceptance criteria and BDD scenarios
- [Source: planning-artifacts/prd.md#Technical Success] — Clean architecture, performance, maintainability goals

## File List

- package.json (new)
- pnpm-workspace.yaml (new)
- turbo.json (new)
- tsconfig.base.json (new)
- .gitignore (new)
- .env.example (new)
- Dockerfile (new)
- docker-compose.yml (new)
- pnpm-lock.yaml (new)
- packages/shared/package.json (new)
- packages/shared/tsconfig.json (new)
- packages/shared/src/index.ts (new)
- packages/shared/src/types/todo.ts (new)
- packages/shared/src/types/api.ts (new)
- apps/api/package.json (new)
- apps/api/tsconfig.json (new)
- apps/api/.env.example (new)
- apps/api/drizzle.config.ts (new)
- apps/api/vitest.config.ts (new)
- apps/api/src/server.ts (new)
- apps/api/src/app.ts (new)
- apps/api/src/config.ts (new)
- apps/api/src/db/schema.ts (new)
- apps/api/src/db/client.ts (new)
- apps/api/src/db/migrations/0000_superb_jazinda.sql (new)
- apps/api/src/db/migrations/meta/_journal.json (new)
- apps/api/src/db/migrations/meta/0000_snapshot.json (new)
- apps/api/src/routes/todoRoutes.ts (new)
- apps/api/src/services/todoService.ts (new)
- apps/api/src/plugins/cors.ts (new)
- apps/api/src/plugins/helmet.ts (new)
- apps/api/__tests__/routes/todoRoutes.test.ts (new)
- apps/api/__tests__/services/todoService.test.ts (new)

### Review Findings

- [x] [Review][Decision] `export default` in vitest.config.ts and drizzle.config.ts — RESOLVED: framework config files exempted from no-default-export rule

- [x] [Review][Patch] `pino-pretty` not declared as a dependency — runtime crash in dev mode [apps/api/src/app.ts:14]
- [x] [Review][Patch] UUID regex case-sensitivity mismatch — route JSON Schema is lowercase-only, service regex uses `/i` flag [apps/api/src/routes/todoRoutes.ts:5, apps/api/src/services/todoService.ts:6]
- [x] [Review][Patch] Dockerfile copies migrations to src/ path but production resolves to dist/ path — runtime crash in Docker [Dockerfile:21]
- [x] [Review][Patch] `buildApp()` error unhandled in server.ts — outside try/catch block [apps/api/src/server.ts:6]
- [x] [Review][Patch] `@fastify/env` declared as dependency but never imported [apps/api/package.json:19]
- [x] [Review][Patch] No `maxLength` on `text` field in createTodoSchema — unbounded input [apps/api/src/routes/todoRoutes.ts:13]
- [x] [Review][Patch] PATCH/DELETE params schema lacks UUID pattern validation — relies on manual JS check only [apps/api/src/routes/todoRoutes.ts:29-34, 38-45]
- [x] [Review][Patch] Empty PATCH body `{}` passes validation and triggers spurious DB write [apps/api/src/routes/todoRoutes.ts:19-35]
- [x] [Review][Patch] Duplicate UUID on POST returns raw 500 instead of 409 Conflict [apps/api/src/routes/todoRoutes.ts:51-55]
- [x] [Review][Patch] Global error handler leaks internal error messages in production [apps/api/src/app.ts:24-32]
- [x] [Review][Patch] Route handlers use unchecked `as` type casts instead of Fastify generic types [apps/api/src/routes/todoRoutes.ts:52,67,68,83]
- [x] [Review][Patch] SQLite connection never closed on server shutdown — resource leak [apps/api/src/db/client.ts, apps/api/src/routes/todoRoutes.ts:48]
- [x] [Review][Patch] No SIGTERM/SIGINT graceful shutdown handling [apps/api/src/server.ts]
- [x] [Review][Patch] Test: leaked app instance in GET test block — no try/finally cleanup [apps/api/__tests__/routes/todoRoutes.test.ts:79-117]
- [x] [Review][Patch] updatedAt mutation test lacks actual timestamp comparison [apps/api/__tests__/services/todoService.test.ts:95-102]

- [x] [Review][Defer] No rate limiting on any endpoint — deferred, infrastructure concern
- [x] [Review][Defer] No pagination on GET /api/todos — deferred, future story scope
- [x] [Review][Defer] docker-compose.yml hardcodes localhost CORS origin for production — deferred, deployment config
- [x] [Review][Defer] docker-compose.yml has no healthcheck — deferred, deployment config
- [x] [Review][Defer] corepack pnpm version unpinned in Dockerfile (pnpm@10 vs pnpm@10.33.0) — deferred, minor
- [x] [Review][Defer] Silent NaN on invalid PORT env var — deferred, config validation
- [x] [Review][Defer] Relative DATABASE_PATH resolves to CWD not project root — deferred, config concern
- [x] [Review][Defer] Migration SQL uses DEFAULT false instead of DEFAULT 0 — deferred, Drizzle-generated artifact
- [x] [Review][Defer] No content-type enforcement on POST/PATCH — deferred, minor
- [x] [Review][Defer] exactOptionalPropertyTypes disabled in tsconfig — deferred, strictness preference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `create-turbo` conflicted with existing directories; manually scaffolded monorepo instead (matches architecture doc recommendation)
- Fixed `@types/better-sqlite3` version (7.6.14 doesn't exist, used 7.6.13)
- Approved native builds for better-sqlite3 and esbuild via `pnpm.onlyBuiltDependencies`
- Added `allowImportingTsExtensions` + `noEmit` to tsconfigs for `.ts` extension imports with tsx runtime
- Used `.returning().all()` pattern for Drizzle ORM as destructuring from `.returning()` directly isn't supported in v0.45

### Completion Notes List

- All 8 tasks completed with 18 passing tests (7 route tests, 11 service tests)
- Monorepo structure follows architecture doc exactly: apps/api + packages/shared
- Named exports only, no `any` types, no `console.log`, camelCase naming throughout
- App factory pattern enables test isolation with Fastify inject()
- Drizzle migrations auto-run on database creation via client.ts
- UUID v4 validation on POST body (via JSON Schema) and PATCH/DELETE params (via service layer)
- Soft delete pattern: sets deleted=true + deletedAt=ISO timestamp, excludes from GET listing

### Change Log

- 2026-04-09: Initial implementation of Story 1.1 - Monorepo and Backend Foundation
