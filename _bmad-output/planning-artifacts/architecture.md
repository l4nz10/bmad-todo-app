---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-03'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'bmad'
user_name: 'Valerio'
date: '2026-04-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
29 FRs across 7 capability areas: Task Management (8), Deletion Safety (5), Draft Persistence (3), Visual Status Communication (3), Offline Resilience (5), Data Persistence (3), Responsive Experience (2). The core CRUD is straightforward; complexity comes from the layered safety nets (undo toast → trash bin) and offline resilience (cache → queue → replay).

**Non-Functional Requirements:**
- Performance: <100ms optimistic UI updates, <200ms API responses, <2s initial load, 60fps animations
- Reliability: Offline usability, sequential queue replay, last-write-wins conflict resolution, zero data loss
- These NFRs drive the architecture toward a thick client with local state management and background synchronization.

**Scale & Complexity:**
- Primary domain: Full-stack web (SPA + REST API)
- Complexity level: Low-medium
- Estimated architectural components: ~6 (SPA frontend, REST API, database, localStorage layer, sync engine, trash cleanup job)

### Technical Constraints & Dependencies

- Solo developer — architecture must be simple to understand, deploy, and maintain
- Modern evergreen browsers only — no legacy compatibility concerns
- Single-user, no auth in MVP — but architecture must not prevent auth addition
- Tailwind CSS + Radix UI chosen in UX spec — constrains frontend framework to React ecosystem
- Card-based UI with animations — requires component-level animation state management

### Cross-Cutting Concerns Identified

- **State synchronization:** Local state (optimistic), server state (authoritative), offline queue (pending) — three sources of truth that must reconcile
- **Optimistic update lifecycle:** Create/complete/delete must update UI instantly, then confirm or rollback based on server response
- **Animation coordination:** Card enter/exit/transfer animations interact with state changes — animation must complete before DOM removal
- **Error propagation:** Network failures affect CRUD, sync, and initial load differently — each needs its own error handling path

## Starter Template Evaluation

### Primary Technology Domain

Full-stack TypeScript web application (SPA + REST API) in a monorepo structure.

### Starter Options Considered

**Pre-built monorepo starters evaluated:**
- Fuelstack — Turborepo + Fastify + Vite React + Drizzle. Too many batteries included (Next.js, GraphQL options) for this scope.
- connected-repo-starter — Fastify + React + tRPC + OrchidORM. Adds tRPC complexity not needed for 5 endpoints.
- react-fastify-drizzle-turborepo — Closest match but includes auth and Postgres, requires stripping.

**Verdict:** All pre-built starters include more than needed. A manual setup from official scaffolding tools is simpler for this project's scope.

### Selected Approach: Manual Monorepo Setup

**Rationale:**
- API surface is 4-5 REST endpoints — no framework-heavy starter justified
- Solo developer benefits from understanding every line of the codebase
- Stripping unnecessary features from a starter takes longer than building up
- Official scaffolding tools (Vite CLI, Fastify CLI) provide clean, minimal starting points

**Initialization Commands:**

```bash
# Initialize monorepo
npx create-turbo@latest bmad --pm pnpm

# Frontend app (inside apps/)
npm create vite@latest web -- --template react-ts

# Backend app (inside apps/)
mkdir api && cd api && npm init -y
# Add Fastify + TypeScript manually per Fastify docs

# Add Tailwind CSS to frontend
npx @tailwindcss/cli init
```

### Architectural Decisions Provided by Setup

**Language & Runtime:**
- TypeScript strict mode across all packages
- Node.js runtime for backend (Fastify)
- Browser runtime for frontend (Vite + React)
- Shared type definitions in `packages/shared`

**Monorepo Tooling:**
- Turborepo for build orchestration and task caching
- pnpm for package management (workspace protocol)
- Shared `tsconfig` base configuration

**Frontend Stack:**
- Vite as build tool and dev server (HMR)
- React 19 with TypeScript
- Tailwind CSS for utility-first styling
- Radix UI for headless accessible primitives

**Backend Stack:**
- Fastify with TypeScript
- SQLite database (file-based, zero-config)
- JSON Schema validation (Fastify built-in)

**Build & Development:**
- `turbo dev` — runs both frontend and backend in parallel
- `turbo build` — builds both apps with dependency ordering
- `turbo lint` — lints all packages
- Vite provides frontend HMR; Fastify uses tsx for backend watch mode

**Docker:**
- Multi-stage Dockerfile (build → production)
- `docker-compose.yml` for local development
- SQLite database file mounted as volume for persistence

**Project Structure:**
```
bmad/
├── apps/
│   ├── web/                # Frontend SPA
│   │   ├── src/
│   │   │   ├── components/ # React components (TaskCard, InputCard, etc.)
│   │   │   ├── hooks/      # Custom hooks (useOfflineQueue, useDraft, etc.)
│   │   │   ├── lib/        # API client, localStorage utils
│   │   │   └── App.tsx
│   │   ├── tailwind.config.ts
│   │   └── vite.config.ts
│   └── api/                # Backend API
│       ├── src/
│       │   ├── routes/     # Fastify route handlers
│       │   ├── db/         # SQLite schema and queries
│       │   └── server.ts
│       └── tsconfig.json
├── packages/
│   └── shared/             # Shared TypeScript types
│       └── src/
│           └── types.ts    # Todo, TrashItem, ApiResponse types
├── docker-compose.yml
├── Dockerfile
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data modeling with Drizzle ORM + SQLite
- Frontend state management with React Query
- API route structure and validation
- Single-server deployment (Fastify serves frontend)

**Important Decisions (Shape Architecture):**
- Pre-seeded `userId` column for future multi-user
- Offline queue implementation approach
- Error handling standards

**Deferred Decisions (Post-MVP):**
- Authentication method and provider
- CI/CD pipeline
- Monitoring and APM
- Scaling strategy (if SQLite outgrown)

### Data Architecture

**Database:** SQLite via `better-sqlite3` (synchronous, fast, zero-config)

**ORM:** Drizzle ORM
- TypeScript-first schema definition
- SQL-like query builder — no magic, readable queries
- Built-in migration generation and runner
- Type-safe results that flow through to shared types

**Schema Design:**

```
todos
├── id          TEXT (UUID, primary key)
├── userId      TEXT (default: 'default', indexed — future multi-user)
├── text        TEXT (not null)
├── completed   INTEGER (0 or 1, default 0)
├── deleted     INTEGER (0 or 1, default 0 — soft delete)
├── deletedAt   TEXT (ISO timestamp, null if not deleted)
├── createdAt   TEXT (ISO timestamp)
├── updatedAt   TEXT (ISO timestamp)
```

**Key design decisions:**
- Soft deletes via `deleted` flag + `deletedAt` timestamp — no separate trash table
- Trash cleanup query: `DELETE FROM todos WHERE deleted = 1 AND deletedAt < (now - 7 days)`
- `userId` pre-seeded as `'default'` — adding auth later means filtering by real userId, no schema change
- UUIDs generated client-side for optimistic creates (sent to server, server accepts or rejects)

### Authentication & Security

**MVP:** No authentication. Single user assumed.

**Future-proofing:**
- `userId` column exists from day one (default value `'default'`)
- API route structure allows auth middleware insertion: `fastify.register(todoRoutes, { prefix: '/api' })` — wrapping with auth is one line
- No session management, no tokens, no cookies in MVP

**Basic Security:**
- `@fastify/cors` — restrict to frontend origin only
- `@fastify/helmet` — security headers (XSS protection, content-type sniffing, etc.)
- Input validation via Fastify JSON Schema on all endpoints
- No SQL injection risk — Drizzle ORM parameterizes all queries

### API & Communication Patterns

**API Style:** REST with JSON request/response bodies

**Route Structure:**

| Method | Route | Description |
|---|---|---|
| GET | `/api/todos` | List all active todos (where deleted = 0) |
| POST | `/api/todos` | Create a new todo (client sends UUID) |
| PATCH | `/api/todos/:id` | Update todo (toggle completed, edit text) |
| DELETE | `/api/todos/:id` | Soft delete (sets deleted = 1, deletedAt = now) |
| GET | `/api/trash` | List deleted todos (where deleted = 1, within 7 days) |
| PATCH | `/api/trash/:id/restore` | Restore from trash (sets deleted = 0, deletedAt = null) |

**Validation:** Fastify built-in JSON Schema validation on all request bodies and params. Schema defined alongside route handlers.

**Error Handling Standard:**
```json
{
  "error": "Human-readable error message",
  "statusCode": 400
}
```
- 400 for validation errors
- 404 for not found
- 500 for unexpected server errors
- Fastify's error handler formats all errors consistently

**Trash Cleanup:** Scheduled cleanup on server start and then at a regular interval (e.g., every hour) — deletes todos where `deleted = 1` and `deletedAt` is older than 7 days. Simple `setInterval` — no cron library needed for MVP.

### Frontend Architecture

**State Management:** React Query (TanStack Query)
- Manages all server state: todo list fetching, mutations, caching
- Built-in optimistic update support for create, complete, and delete operations
- Automatic refetch on window focus and network reconnect
- Retry logic for failed mutations

**Custom Hooks (not React Query):**
- `useOfflineQueue` — detects network status, queues mutations when offline, replays sequentially on reconnect
- `useDraft` — saves/restores input text to localStorage with debounced writes (~300ms)
- `useNetworkStatus` — listens to `navigator.onLine` and `online`/`offline` events, exposes status for NetworkBar

**Component Architecture:**
- Functional components with hooks
- Co-located styles via Tailwind utility classes
- Radix primitives for Toast and Dialog — styled with Tailwind
- Animation via CSS transitions + Tailwind `transition` utilities (or Framer Motion if CSS proves insufficient)

**Client-Side IDs:**
- Frontend generates UUIDs for new todos before sending to API
- Enables optimistic rendering — the todo appears in the list with its final ID immediately
- Server accepts the client-provided ID (validates UUID format)

### Infrastructure & Deployment

**Single-Server Architecture:**
- Fastify serves both the API (`/api/*`) and the frontend static files (`/*`)
- Vite builds the frontend to `dist/` — Fastify serves this via `@fastify/static`
- One process, one port, one container

**Docker Setup:**
```dockerfile
# Multi-stage build
# Stage 1: Build frontend + backend
# Stage 2: Production Node.js slim image
#   - Copies built frontend to static directory
#   - Copies compiled backend
#   - Runs Fastify on single port (e.g., 3000)
#   - SQLite file at /data/bmad.db (volume mount)
```

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - bmad-data:/data
    environment:
      - DATABASE_PATH=/data/bmad.db
      - NODE_ENV=production
volumes:
  bmad-data:
```

**Environment Configuration:**
- `.env` files per environment (development, production)
- Fastify's `@fastify/env` plugin for validation and loading
- Key variables: `DATABASE_PATH`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`

**Logging:** Fastify's built-in Pino logger — structured JSON, zero configuration. Pretty-print in development, JSON in production.

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo setup (Turborepo, pnpm workspaces, shared types)
2. Database schema + Drizzle ORM setup + migrations
3. Fastify API with route handlers and validation
4. React frontend with React Query integration
5. Offline queue and draft persistence hooks
6. Static file serving + Docker configuration
7. Polish: animations, empty/loading/error states, toast/dialog

**Cross-Component Dependencies:**
- Shared types (`packages/shared`) used by both frontend and backend — must be defined first
- Client-side UUID generation must match server UUID validation
- React Query cache keys must align with API route structure
- Offline queue replay must use the same mutation functions as online operations

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming:**
- Table names: plural, camelCase — `todos`
- Column names: camelCase — `userId`, `createdAt`, `deletedAt`
- Primary keys: `id`
- Foreign keys: `{entity}Id` — e.g., `userId`
- Indexes: `idx_{table}_{column}` — e.g., `idx_todos_userId`

**API Naming:**
- Endpoints: plural nouns, lowercase — `/api/todos`, `/api/trash`
- Route params: camelCase — `/api/todos/:id`
- Query params: camelCase — `?userId=default`
- JSON fields: camelCase throughout — `{ "createdAt": "...", "deletedAt": "..." }`
- No transformation layer needed — DB, API, and frontend all use camelCase

**Code Naming:**
- React components: PascalCase — `TaskCard`, `InputCard`, `NetworkBar`
- Hooks: camelCase with `use` prefix — `useOfflineQueue`, `useDraft`
- Functions: camelCase — `createTodo`, `restoreFromTrash`
- Variables/constants: camelCase — `todoList`, `isOnline`
- Types/interfaces: PascalCase — `Todo`, `CreateTodoRequest`, `ApiError`
- Enums: PascalCase name, UPPER_SNAKE values — `enum TodoStatus { ACTIVE, COMPLETED }`

**File Naming:**
- React components: PascalCase — `TaskCard.tsx`, `InputCard.tsx`
- Hooks: camelCase — `useOfflineQueue.ts`, `useDraft.ts`
- Utilities/libs: camelCase — `apiClient.ts`, `localStorage.ts`
- Route handlers: camelCase — `todoRoutes.ts`, `trashRoutes.ts`
- Config files: camelCase or standard names — `drizzle.config.ts`, `vite.config.ts`
- Types: camelCase — `todo.ts`, `api.ts` (inside shared package)
- Test files: match source file name + `.test` — `todoRoutes.test.ts`, `TaskCard.test.tsx`

### Structure Patterns

**Test Organization:**
```
apps/
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   └── TaskCard.tsx
│   │   └── hooks/
│   │       └── useOfflineQueue.ts
│   └── __tests__/
│       ├── components/
│       │   └── TaskCard.test.tsx
│       └── hooks/
│           └── useOfflineQueue.test.ts
└── api/
    ├── src/
    │   └── routes/
    │       └── todoRoutes.ts
    └── __tests__/
        └── routes/
            └── todoRoutes.test.ts
```

Test directory mirrors source directory structure. Test files named `{source}.test.{ext}`.

**Component Organization:**
- Organized by type (components, hooks, lib) not by feature — the app is too small for feature-based organization
- Each component is a single file unless it exceeds ~150 lines, then extract sub-components into the same directory
- No `index.ts` barrel files — import directly from the file (`import { TaskCard } from './components/TaskCard'`)

**Shared Package Organization:**
```
packages/shared/src/
├── types/
│   ├── todo.ts        # Todo, CreateTodoRequest, UpdateTodoRequest
│   └── api.ts         # ApiResponse, ApiError
└── index.ts           # Re-exports all types
```

### Format Patterns

**API Response Format (wrapped):**

Success responses:
```json
{
  "data": [{ "id": "...", "text": "...", "completed": false }],
  "meta": { "count": 3 }
}
```

Single item responses:
```json
{
  "data": { "id": "...", "text": "...", "completed": false }
}
```

Error responses:
```json
{
  "error": "Todo not found",
  "statusCode": 404
}
```

**Data Format Rules:**
- Dates: ISO 8601 strings everywhere — `"2026-04-03T10:30:00.000Z"`
- Booleans: `true`/`false` in JSON, `0`/`1` in SQLite (Drizzle handles conversion)
- Nulls: explicit `null` in JSON, never `undefined` in API responses
- IDs: UUID v4 strings — `"550e8400-e29b-41d4-a716-446655440000"`
- Empty arrays: `[]` never `null` — `GET /api/todos` returns `{ "data": [] }` when empty

### Communication Patterns

**React Query Keys:**
- Consistent key factory pattern:
  - `['todos']` — all active todos
  - `['todos', id]` — single todo
  - `['trash']` — all trashed todos
- Mutations invalidate related query keys automatically

**State Update Patterns:**
- All React state updates are immutable (React Query handles this internally)
- Optimistic updates use React Query's `onMutate` → `onError` (rollback) → `onSettled` (refetch) pattern
- localStorage writes are fire-and-forget (no error handling needed for draft/cache writes)

**Offline Queue Events:**
- Queue stored in localStorage under key `bmad_offline_queue`
- Each queued action: `{ id: string, type: 'create' | 'update' | 'delete', payload: object, timestamp: string }`
- Replay order: sequential by timestamp, oldest first
- On conflict: last-write-wins (server state is authoritative after replay)

### Process Patterns

**Error Handling:**
- **Backend:** Fastify error handler catches all errors, formats as `{ error, statusCode }`. Unhandled errors become 500s. All errors logged via Pino.
- **Frontend:** React Query `onError` callbacks handle mutation failures. Global error boundary catches rendering errors. Network errors trigger NetworkBar, not error toasts.
- **User-facing errors:** Short, plain language. "Couldn't save your task" not "POST /api/todos returned 500 Internal Server Error".
- **Never swallow errors silently** — every error is either shown to the user or logged.

**Loading State Patterns:**
- `isLoading` — initial load (no cached data yet). Show skeleton/spinner in list area.
- `isFetching` — background refetch (cached data visible). No visible loading indicator.
- `isMutating` — mutation in progress. No visible indicator (optimistic update already showing).
- React Query provides all three states — use them consistently.

**Validation Patterns:**
- **Server-side:** Fastify JSON Schema validates all inputs. This is the source of truth.
- **Client-side:** Minimal — empty string check on task input before submitting. No form library needed.
- **Never duplicate validation logic** — if the server rejects, the client shows the server's error message.

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow camelCase naming for all code, DB columns, and API fields — no snake_case anywhere
2. Use the wrapped response format `{ data, meta? }` for success, `{ error, statusCode }` for errors
3. Place tests in `__tests__/` directories mirroring source structure
4. Use PascalCase for component files, camelCase for everything else
5. Generate UUIDs client-side for new todos, validate UUID format server-side
6. Use ISO 8601 strings for all dates — no timestamps, no custom formats
7. Handle errors explicitly — no silent catches, no empty catch blocks

**Anti-Patterns to Avoid:**
- No `export default` — use named exports everywhere for better refactoring
- No `any` type — strict TypeScript, no escape hatches
- No barrel `index.ts` files in app packages — direct imports only
- No mixing fetch/axios — use one API client function in `lib/apiClient.ts`
- No console.log for debugging — use Pino logger on backend, remove console.logs before commit
- No inline magic numbers — define constants (`TOAST_DURATION_MS = 5000`, `TRASH_TTL_DAYS = 7`)

## Project Structure & Boundaries

### Complete Project Directory Structure

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
│
├── apps/
│   ├── web/                          # Frontend SPA
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── src/
│   │   │   ├── main.tsx              # App entry point, React Query provider
│   │   │   ├── App.tsx               # Root component, layout shell
│   │   │   ├── globals.css           # Tailwind imports, custom properties
│   │   │   ├── constants.ts          # TOAST_DURATION_MS, TRASH_TTL_DAYS, etc.
│   │   │   ├── components/
│   │   │   │   ├── TaskCard.tsx       # Single todo card (active + completed variants)
│   │   │   │   ├── InputCard.tsx      # Task input with draft chip
│   │   │   │   ├── DraftChip.tsx      # Resume draft pill button
│   │   │   │   ├── EmptyState.tsx     # No-tasks-yet message
│   │   │   │   ├── SectionHeader.tsx  # "Active" / "Completed" labels
│   │   │   │   ├── NetworkBar.tsx     # Offline/syncing/synced status bar
│   │   │   │   ├── TrashButton.tsx    # Trash icon + count, opens dialog
│   │   │   │   ├── TrashDialog.tsx    # Modal with trashed items + restore
│   │   │   │   ├── UndoToast.tsx      # Deletion undo notification
│   │   │   │   ├── LoadingState.tsx   # Skeleton cards during initial load
│   │   │   │   └── ErrorState.tsx     # Load failure with retry
│   │   │   ├── hooks/
│   │   │   │   ├── useTodos.ts        # React Query queries + mutations for todos
│   │   │   │   ├── useTrash.ts        # React Query queries + mutations for trash
│   │   │   │   ├── useOfflineQueue.ts # Offline action queuing + replay
│   │   │   │   ├── useDraft.ts        # localStorage draft persistence
│   │   │   │   └── useNetworkStatus.ts# Online/offline detection
│   │   │   └── lib/
│   │   │       ├── apiClient.ts       # Fetch wrapper, base URL, error handling
│   │   │       ├── queryKeys.ts       # React Query key factory
│   │   │       └── storage.ts         # localStorage helpers (typed get/set)
│   │   └── __tests__/
│   │       ├── components/
│   │       │   ├── TaskCard.test.tsx
│   │       │   ├── InputCard.test.tsx
│   │       │   ├── TrashDialog.test.tsx
│   │       │   └── UndoToast.test.tsx
│   │       └── hooks/
│   │           ├── useTodos.test.ts
│   │           ├── useOfflineQueue.test.ts
│   │           └── useDraft.test.ts
│   │
│   └── api/                           # Backend API
│       ├── .env.example
│       ├── package.json
│       ├── tsconfig.json
│       ├── drizzle.config.ts          # Drizzle ORM configuration
│       ├── src/
│       │   ├── server.ts              # Fastify server setup, plugin registration
│       │   ├── app.ts                 # App factory (for testing)
│       │   ├── config.ts              # Environment variable loading + validation
│       │   ├── db/
│       │   │   ├── schema.ts          # Drizzle schema definition (todos table)
│       │   │   ├── client.ts          # Database connection (better-sqlite3)
│       │   │   └── migrations/        # Drizzle-generated SQL migrations
│       │   ├── routes/
│       │   │   ├── todoRoutes.ts      # CRUD endpoints for /api/todos
│       │   │   └── trashRoutes.ts     # Trash endpoints for /api/trash
│       │   ├── services/
│       │   │   ├── todoService.ts     # Business logic for todo operations
│       │   │   └── trashService.ts    # Trash cleanup + restore logic
│       │   └── plugins/
│       │       ├── cors.ts            # CORS configuration
│       │       ├── helmet.ts          # Security headers
│       │       ├── staticFiles.ts     # Serves built frontend in production
│       │       └── trashCleanup.ts    # setInterval for 7-day purge
│       └── __tests__/
│           ├── routes/
│           │   ├── todoRoutes.test.ts
│           │   └── trashRoutes.test.ts
│           └── services/
│               ├── todoService.test.ts
│               └── trashService.test.ts
│
└── packages/
    └── shared/                        # Shared TypeScript types
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts               # Re-exports all types
            └── types/
                ├── todo.ts            # Todo, CreateTodoRequest, UpdateTodoRequest
                └── api.ts             # ApiResponse<T>, ApiError
```

### Architectural Boundaries

**API Boundary:**
- All frontend-to-backend communication goes through `lib/apiClient.ts` → HTTP → Fastify routes
- No direct database access from frontend
- API routes are the only entry point to backend logic
- Routes delegate to services; services use Drizzle ORM for data access

**Service Layer Boundary:**
- Route handlers validate input (JSON Schema) and format responses
- Services contain business logic (e.g., "soft delete sets deleted=1 and deletedAt=now")
- Services use Drizzle ORM directly — no separate repository layer (too simple for that abstraction)

**State Boundary:**
- React Query owns server state (todo list, trash list)
- localStorage owns client-only state (draft text, offline queue, cached todos)
- No state shared between these two systems except through explicit sync (offline queue replay → React Query mutation)

**Data Flow:**
```
User Action → React Component → Hook (useTodos/useTrash)
  → React Query Mutation (optimistic update to cache)
    → apiClient.ts → HTTP → Fastify Route
      → Service → Drizzle ORM → SQLite
    ← JSON Response ← Fastify Route
  ← React Query settles (confirm or rollback)
← UI re-renders from cache
```

### Requirements to Structure Mapping

| FR Category | Frontend Files | Backend Files | Shared |
|---|---|---|---|
| Task Management (FR1-8) | `TaskCard`, `InputCard`, `SectionHeader`, `useTodos` | `todoRoutes`, `todoService`, `schema` | `Todo`, `CreateTodoRequest` |
| Deletion Safety (FR9-13) | `UndoToast`, `TrashButton`, `TrashDialog`, `useTrash` | `trashRoutes`, `trashService`, `trashCleanup` | `ApiResponse` |
| Draft Persistence (FR14-16) | `DraftChip`, `useDraft`, `storage` | — (client-only) | — |
| Visual Status (FR17-19) | `EmptyState`, `LoadingState`, `ErrorState` | — | — |
| Offline Resilience (FR20-24) | `NetworkBar`, `useOfflineQueue`, `useNetworkStatus`, `storage` | — (client-only until replay) | — |
| Data Persistence (FR25-27) | `apiClient`, `useTodos` | `todoRoutes`, `todoService`, `schema`, `client` | `Todo` |
| Responsive (FR28-29) | All components (Tailwind responsive classes) | — | — |

### Development Workflow Integration

**Development:**
- `pnpm dev` → `turbo dev` → runs Vite dev server (port 5173) + Fastify dev server (port 3000) in parallel
- Vite proxies `/api/*` to Fastify in development (configured in `vite.config.ts`)
- Changes to `packages/shared` trigger rebuilds in both apps via Turborepo dependency graph

**Build:**
- `pnpm build` → `turbo build` → builds shared types first, then API and web in parallel
- Vite outputs static files to `apps/web/dist/`
- API compiles TypeScript to `apps/api/dist/`

**Production:**
- Docker copies `apps/web/dist/` into the API container
- Fastify serves static files from this directory via `@fastify/static`
- Single container, single port (3000), SQLite file at `/data/bmad.db`

**Testing:**
- `pnpm test` → `turbo test` → runs Vitest in both apps
- Frontend tests use `@testing-library/react` + Vitest
- Backend tests use Fastify's `inject()` method for route testing (no HTTP server needed)

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. TypeScript strict mode flows through all packages. Drizzle ORM works natively with better-sqlite3. React Query integrates cleanly with the fetch-based apiClient. Radix UI primitives work with React 19. No version conflicts identified.

**Pattern Consistency:** camelCase naming is uniform across database columns, API JSON fields, and TypeScript code — no transformation layer needed. Wrapped API response format `{ data, meta? }` is consistent across all endpoints. Error format `{ error, statusCode }` is consistent across all error paths.

**Structure Alignment:** Monorepo structure (apps/web, apps/api, packages/shared) cleanly separates concerns while enabling shared types. Service layer (routes → services → Drizzle) provides clear boundaries. State boundary (React Query for server state, localStorage for client state) prevents overlap.

### Requirements Coverage Validation

**Functional Requirements:** All 29 FRs are mapped to specific files in the project structure. Every FR category has clear architectural support in both frontend and backend (or client-only where appropriate). No orphaned requirements.

**Non-Functional Requirements:**
- Performance: Optimistic UI via React Query, Fastify + in-process SQLite for API speed, Vite for bundle optimization
- Reliability: Offline queue, localStorage caching, soft deletes, trash retention, last-write-wins conflict resolution
- All NFR targets have specific architectural support

### Implementation Readiness Validation

**Decision Completeness:** All critical decisions documented with rationale. Technology stack fully specified. Implementation sequence defined with dependency ordering.

**Structure Completeness:** Full directory tree with every file named and purpose-documented. FR-to-file mapping table provides traceability. No placeholder directories.

**Pattern Completeness:** Naming conventions cover all contexts (DB, API, code, files). Error handling specified for both frontend and backend. Loading state patterns aligned with React Query's state model.

### Gap Analysis Results

**No critical gaps.**

**Important gap identified:**
- **Offline queue testing strategy** — Testing network failure scenarios requires mocking `navigator.onLine` and `online`/`offline` events. The test setup should include a `mockNetworkStatus` utility in `__tests__/` that can simulate offline/online transitions. Not blocking, but should be addressed when writing offline queue tests.

**Future considerations (not gaps, intentionally deferred):**
- Authentication integration pattern (deferred to post-MVP)
- CI/CD pipeline configuration (deferred)
- Database scaling beyond SQLite (deferred)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (low-medium)
- [x] Technical constraints identified (solo dev, modern browsers, no auth)
- [x] Cross-cutting concerns mapped (state sync, optimistic updates, animations, error propagation)

**Architectural Decisions**
- [x] Critical decisions documented (Drizzle, React Query, Fastify, SQLite)
- [x] Technology stack fully specified with rationale
- [x] Integration patterns defined (apiClient → REST → service → ORM)
- [x] Performance considerations addressed (optimistic UI, in-process SQLite)

**Implementation Patterns**
- [x] Naming conventions established (camelCase everywhere)
- [x] Structure patterns defined (type-based organization, mirrored test dirs)
- [x] Communication patterns specified (React Query keys, offline queue format)
- [x] Process patterns documented (error handling, loading states, validation)

**Project Structure**
- [x] Complete directory structure defined with all files
- [x] Component boundaries established (API, service, state, data)
- [x] Integration points mapped (data flow diagram)
- [x] Requirements to structure mapping complete (FR-to-file table)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — small, well-scoped project with consistent decisions throughout.

**Key Strengths:**
- Single naming convention (camelCase) eliminates an entire class of consistency bugs
- Single-server deployment minimizes operational complexity
- Clear FR-to-file mapping makes epic/story creation straightforward
- Client-side UUID generation enables clean optimistic updates
- Pre-seeded `userId` avoids future migration pain

**Areas for Future Enhancement:**
- Add authentication layer when multi-user is needed
- Consider PostgreSQL migration if data volume outgrows SQLite
- Add CI/CD pipeline for automated testing and deployment
- Add Framer Motion if CSS transitions prove insufficient for card animations

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt about a naming or pattern choice, check the Enforcement Guidelines section

**First Implementation Priority:**
Initialize the monorepo using the commands in the Starter Template section. This becomes the first implementation story.
