# Story 1.2: Frontend App Shell with Design System

Status: done

## Story

As a user,
I want to see a clean, responsive, card-based interface when I open the app,
So that the experience feels polished and works well on any device.

## Acceptance Criteria

1. **Given** the Vite React app is set up within the monorepo **When** `pnpm dev` is run **Then** Turborepo starts both the Vite dev server and the Fastify API **And** Vite proxies `/api/*` requests to the Fastify backend
2. **Given** the Tailwind config is loaded **When** the app renders **Then** design tokens are applied: bg-primary (`#FAFAF9`), bg-surface (`#FFFFFF`), text-primary (`#1C1C1C`), text-secondary (`#6B7280`), text-muted (`#9CA3AF`), accent color, success (`#22C55E`), warning (`#F59E0B`), danger (`#EF4444`), border (`#E5E7EB`) **And** Inter font is loaded and applied with the defined type scale (12px-20px, weight as hierarchy differentiator) **And** spacing uses the 4px base unit scale
3. **Given** the app is viewed on any viewport **When** the layout renders **Then** a single-column centered layout is displayed (max-width 640px on sm+) **And** mobile (<768px) uses full-width with 16px margins **And** tablet (768px+) uses 24px margins **And** desktop (1024px+) uses 32px margins with hover states enabled **And** the app background is light gray (`#F3F4F6`) with white card surfaces
4. **Given** the layout shell is rendered **When** the InputCard component is visible **Then** it displays as a white card with `rounded-xl` and `shadow-sm` **And** it contains a text input with placeholder "Add a task..." **And** focus state shows an accent-colored ring on the card container **And** the `<html>` includes `<meta name="viewport" content="width=device-width, initial-scale=1">` **And** semantic HTML structure is used (`<main>`, proper heading hierarchy) **And** all interactive elements are reachable via Tab with visible focus rings

## Tasks / Subtasks

- [x] Task 1: Create Vite React app in monorepo (AC: #1)
  - [x] 1.1 Scaffold `apps/web` using `npm create vite@latest web -- --template react-ts` inside `apps/`, then clean default files
  - [x] 1.2 Create `apps/web/package.json` with name `@bmad/web`, add dependencies: `react`, `react-dom`, `@bmad/shared` (workspace:\*), `@tanstack/react-query`
  - [x] 1.3 Create `apps/web/tsconfig.json` extending `../../tsconfig.base.json` with `"jsx": "react-jsx"`, `"allowImportingTsExtensions": true`, `"noEmit": true`
  - [x] 1.4 Configure `apps/web/vite.config.ts`: register `@vitejs/plugin-react` and `@tailwindcss/vite` plugins, add `/api` proxy to `http://localhost:3000`, add vitest `test` block with `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/test/setup.ts'`
  - [x] 1.5 Verify `pnpm dev` starts both Vite (port 5173) and Fastify (port 3000) via Turborepo, and `/api/todos` proxied correctly
- [x] Task 2: Set up Tailwind CSS v4 with design tokens (AC: #2)
  - [x] 2.1 Install `tailwindcss` and `@tailwindcss/vite` (NOT the PostCSS plugin — Tailwind v4 uses a Vite plugin directly)
  - [x] 2.2 Create `apps/web/src/globals.css` with `@import "tailwindcss";` then add `@theme` block defining all design tokens (see Dev Notes for exact values)
  - [x] 2.3 Load Inter font via `@import` from Google Fonts CDN in `globals.css`, set as default `--font-sans`
  - [x] 2.4 Verify tokens work: create a minimal test element using `bg-primary`, `text-primary`, `font-sans` classes and confirm rendering
- [x] Task 3: Create app shell layout (AC: #3, #4)
  - [x] 3.1 Create `apps/web/src/main.tsx` with React 19 `createRoot`, QueryClientProvider, import `globals.css`
  - [x] 3.2 Create `apps/web/src/App.tsx` with layout shell: `<main>` with single-column centered container (max-w-[640px]), responsive margins (px-4 / md:px-6 / lg:px-8), app background `bg-[#F3F4F6]` min-h-screen
  - [x] 3.3 Set `<meta name="viewport" content="width=device-width, initial-scale=1">` in `apps/web/index.html`
  - [x] 3.4 Add semantic HTML structure with proper heading hierarchy (`<h1>` for app title)
- [x] Task 4: Build InputCard component (AC: #4)
  - [x] 4.1 Create `apps/web/src/components/InputCard.tsx`: white card (`bg-surface rounded-xl shadow-sm`), text input with placeholder "Add a task...", focus ring on card container using accent color
  - [x] 4.2 Wire Enter key to submit (no-op handler for now — actual create mutation is Story 1.3), Escape to clear input
  - [x] 4.3 Ensure keyboard accessibility: input focusable, visible focus ring, proper `<label>` (visually hidden) for accessibility
- [x] Task 5: Build EmptyState component (AC: #3)
  - [x] 5.1 Create `apps/web/src/components/EmptyState.tsx`: centered text "No tasks yet" (text-primary) + "Type above to get started" (text-muted), uses appropriate heading level
- [x] Task 6: Create API client and query infrastructure (AC: #1)
  - [x] 6.1 Create `apps/web/src/lib/apiClient.ts`: typed fetch wrapper using base URL `/api`, handles JSON parsing, throws on non-ok responses with error message extraction
  - [x] 6.2 Create `apps/web/src/lib/queryKeys.ts`: query key factory (`todoKeys.all`, `todoKeys.detail(id)`)
  - [x] 6.3 Create `apps/web/src/hooks/useTodos.ts`: React Query `useQuery` for `GET /api/todos` returning typed `Todo[]` — displays EmptyState when empty
- [x] Task 7: Write frontend tests (AC: #1, #2, #3, #4)
  - [x] 7.1 Create `apps/web/src/test/setup.ts` importing `@testing-library/jest-dom`
  - [x] 7.2 Create `apps/web/__tests__/components/InputCard.test.tsx`: renders with placeholder, focus shows ring, Enter key triggers handler, Escape clears input
  - [x] 7.3 Create `apps/web/__tests__/components/EmptyState.test.tsx`: renders both text lines, uses correct semantic heading
  - [x] 7.4 Create `apps/web/__tests__/components/App.test.tsx`: layout renders with correct structure, InputCard visible, responsive classes applied

## Dev Notes

### Architecture Compliance

**CRITICAL — Follow these patterns exactly:**

- **Naming:** PascalCase for component files (`InputCard.tsx`), camelCase for hooks/utils (`useTodos.ts`, `apiClient.ts`)
- **Exports:** Named exports ONLY. No `export default`. Exception: framework config files (`vite.config.ts`) are exempt per code review decision from Story 1-1
- **Types:** Strict TypeScript. No `any` type. No escape hatches. Use Fastify generics pattern (established in Story 1-1 review)
- **Imports:** Import types from `@bmad/shared` (`Todo`, `ApiResponse`, `ApiError`). No barrel `index.ts` in app packages — direct imports only
- **Components:** Functional components with hooks. Co-located styles via Tailwind utility classes
- **State:** React Query for server state. No Redux, no Context for server data

### Technical Stack (Exact Versions — April 2026)

- **Vite 8.x** — uses Rolldown bundler by default. `@vitejs/plugin-react` v6 uses Oxc (no Babel)
- **React 19.x** — `forwardRef` deprecated (use `ref` as prop). `use()` hook available. `createRoot` from `react-dom/client`
- **Tailwind CSS 4.x** — NO `tailwind.config.js`. Config via CSS `@theme` blocks. Use `@tailwindcss/vite` plugin (NOT PostCSS). Single `@import "tailwindcss"` replaces old directives. Content auto-detection built in
- **@tanstack/react-query 5.x** — fully React 19 compatible
- **@testing-library/react 16.x** — `@testing-library/dom` is a peer dependency (install explicitly)
- **Vitest 4.x** — shares Vite config, use `jsdom` environment for component tests
- **Radix UI** — `@radix-ui/react-toast` 1.2.x, `@radix-ui/react-dialog` 1.1.x (NOT needed in this story, but install for future use is optional — do NOT install unless needed)

### Tailwind CSS v4 Design Tokens

**CRITICAL: Tailwind v4 does NOT use `tailwind.config.js`. All customization goes in CSS `@theme` blocks.**

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', sans-serif;

  --color-primary: #FAFAF9;
  --color-surface: #FFFFFF;
  --color-text-primary: #1C1C1C;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-accent: #4B7BF5;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-border: #E5E7EB;
}
```

Usage in classes: `bg-primary`, `bg-surface`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-accent`, `border-border`, etc.

### Typography Scale

| Level | Size | Weight | Tailwind Class |
|-------|------|--------|----------------|
| App Title | 20px / 1.25rem | 600 | `text-xl font-semibold` |
| Section Label | 13px / 0.8125rem | 600 | `text-[0.8125rem] font-semibold` |
| Task Text | 15px / 0.9375rem | 400 | `text-[0.9375rem] font-normal` |
| Metadata | 12px / 0.75rem | 400 | `text-xs font-normal` |
| Input | 15px / 0.9375rem | 400 | `text-[0.9375rem] font-normal` |

### Spacing

Base unit: 4px. Use Tailwind spacing scale (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `gap-4` = 16px, `gap-6` = 24px).

### Card Component Pattern

```
White background, rounded-xl (12px), shadow-sm default
Internal padding: p-3 (12px)
Gap between cards: gap-4 (16px) in the list
Hover: shadow-md transition (150ms ease-out) — desktop only (lg:hover:shadow-md)
```

### Responsive Breakpoints

| Breakpoint | Width | Margins | Container |
|---|---|---|---|
| Default (mobile) | < 640px | px-4 (16px) | full-width |
| `sm` | 640px+ | px-4 | max-w-[640px] mx-auto |
| `md` | 768px+ | px-6 (24px) | max-w-[640px] mx-auto |
| `lg` | 1024px+ | px-8 (32px) | max-w-[640px] mx-auto, hover states |

### Vite Proxy Configuration

```typescript
// In vite.config.ts — DO NOT rewrite the path, the backend expects /api prefix
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```

### API Client Pattern

```typescript
// lib/apiClient.ts — single fetch wrapper, all API calls go through this
const BASE_URL = '/api';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}
```

### React Query Setup

```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});
```

### Project Structure (This Story)

```
apps/
└── web/
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── main.tsx              # Entry point, QueryClientProvider
    │   ├── App.tsx               # Layout shell
    │   ├── globals.css           # Tailwind imports + @theme tokens
    │   ├── components/
    │   │   ├── InputCard.tsx     # Task input card
    │   │   └── EmptyState.tsx    # No-tasks message
    │   ├── hooks/
    │   │   └── useTodos.ts      # React Query hook for todos
    │   ├── lib/
    │   │   ├── apiClient.ts     # Fetch wrapper
    │   │   └── queryKeys.ts     # Query key factory
    │   └── test/
    │       └── setup.ts         # @testing-library/jest-dom import
    └── __tests__/
        └── components/
            ├── InputCard.test.tsx
            ├── EmptyState.test.tsx
            └── App.test.tsx
```

### Previous Story Intelligence (Story 1-1)

**Learnings from implementation:**
- Framework config files (`vite.config.ts`, etc.) are exempt from the no-`export default` rule
- Use `allowImportingTsExtensions` + `noEmit` in tsconfig for `.ts` extension imports with tsx runtime
- `pnpm.onlyBuiltDependencies` in root `package.json` needed for native modules (better-sqlite3, esbuild)
- `.returning().all()` pattern needed for Drizzle ORM v0.45 (no direct destructuring from `.returning()`)

**Learnings from code review:**
- Always use typed generics instead of `as` type casts (e.g., Fastify generics for routes)
- Add `maxLength` to string inputs (500 char limit established)
- Error messages must not leak internal details in production
- Tests must use try/finally for cleanup when creating temporary resources
- Always handle graceful shutdown in server entry points

**Existing files NOT to modify (from Story 1-1):**
- `package.json` (root), `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` — already configured
- `apps/api/*` — backend is complete and tested
- `packages/shared/*` — shared types already exported

### Anti-Patterns to Avoid

- Do NOT use `tailwind.config.js` — Tailwind v4 uses CSS `@theme` blocks
- Do NOT install PostCSS/autoprefixer — built into `@tailwindcss/vite`
- Do NOT use `@tailwind base/components/utilities` — use `@import "tailwindcss"`
- Do NOT use `export default` in app source files (config files exempt)
- Do NOT create barrel `index.ts` files in app packages
- Do NOT use `any` type
- Do NOT use `console.log` — remove before commit
- Do NOT use `forwardRef` — React 19 supports `ref` as a standard prop
- Do NOT install Radix UI primitives in this story — they are not needed until Stories 2.1+ (undo toast, trash dialog)
- Do NOT build TaskCard in this story — that is Story 1.3
- Do NOT add mutation hooks (create/update/delete) — only the list query for displaying empty state
- Do NOT add draft persistence, offline queue, or network status — those are later epics

### References

- [Source: planning-artifacts/architecture.md#Frontend Architecture] — React Query, component architecture, state management
- [Source: planning-artifacts/architecture.md#Implementation Patterns] — Naming, structure, format patterns
- [Source: planning-artifacts/architecture.md#Project Structure & Boundaries] — Directory structure, architectural boundaries
- [Source: planning-artifacts/ux-design-specification.md#Design System Foundation] — Tailwind + Radix approach, customization strategy
- [Source: planning-artifacts/ux-design-specification.md#Visual Design Foundation] — Color system, typography, spacing
- [Source: planning-artifacts/ux-design-specification.md#Component Strategy] — InputCard, EmptyState specs
- [Source: planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] — Breakpoints, WCAG, keyboard nav
- [Source: planning-artifacts/epics.md#Story 1.2] — Acceptance criteria and BDD scenarios
- [Source: planning-artifacts/prd.md#Technical Success] — Performance, maintainability goals
- [Source: implementation-artifacts/1-1-monorepo-and-backend-foundation.md#Review Findings] — Code review learnings

## File List

- apps/web/package.json (new)
- apps/web/tsconfig.json (new)
- apps/web/.env.example (new)
- apps/web/vite.config.ts (new)
- apps/web/index.html (new)
- apps/web/public/favicon.svg (new)
- apps/web/src/main.tsx (new)
- apps/web/src/App.tsx (new)
- apps/web/src/globals.css (new)
- apps/web/src/components/InputCard.tsx (new)
- apps/web/src/components/EmptyState.tsx (new)
- apps/web/src/hooks/useTodos.ts (new)
- apps/web/src/lib/apiClient.ts (new)
- apps/web/src/lib/queryKeys.ts (new)
- apps/web/src/test/setup.ts (new)
- apps/web/__tests__/components/InputCard.test.tsx (new)
- apps/web/__tests__/components/EmptyState.test.tsx (new)
- apps/web/__tests__/components/App.test.tsx (new)
- apps/api/src/db/client.ts (modified — explicit return type for createDatabase)
- apps/api/__tests__/services/todoService.test.ts (modified — destructure db from createDatabase)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Added `"lib": ["ES2022", "DOM", "DOM.Iterable"]` to web tsconfig — base tsconfig only has ES2022, DOM types needed for browser APIs
- Added `vite` as explicit devDependency — Vitest imports from vite, needs it resolvable in the package
- Fixed `createDatabase` return type in API client.ts — the code review patch changed the return to `{ db, sqlite }` but didn't add explicit type annotation, causing TS4058 with `declaration: true`
- Fixed API service test to destructure `{ db }` from `createDatabase` — aligned with code review patch

### Completion Notes List

- All 7 tasks completed with 15 passing frontend tests + 18 passing API tests (33 total, 0 regressions)
- Vite 6 + React 19 + Tailwind CSS 4 configured with @tailwindcss/vite plugin and CSS @theme tokens
- Design system tokens: 10 color tokens, Inter font, 4px spacing base, responsive breakpoints
- InputCard: white card with focus ring, Enter to submit, Escape to clear, visually hidden label
- EmptyState: semantic h2 heading, dual text lines
- API client: typed fetch wrappers for GET/POST/PATCH/DELETE with error extraction
- React Query infrastructure: QueryClient with 1min staleTime, useTodos hook, query key factory
- Named exports only throughout, no `any` types, PascalCase components, camelCase hooks/utils

### Review Findings

- [x] [Review][Defer] D1: apiClient includes mutation functions (apiPost/apiPatch/apiDelete) beyond story scope — deferred to Story 1.3; they are fetch wrappers not hooks, pragmatic to keep [apiClient.ts]
- [x] [Review][Patch] P1: `as` type assertions in apiClient error handling — fixed: added `isErrorBody` type guard and `extractErrorMessage` helper [apiClient.ts]
- [x] [Review][Patch] P2: Responsive breakpoints missing `sm:` prefix — fixed: `sm:max-w-[640px] sm:mx-auto` [App.tsx:11]
- [x] [Review][Patch] P3: Missing `lg:hover:shadow-md` on InputCard — fixed: added desktop hover state [InputCard.tsx:25]
- [x] [Review][Patch] P4: App background color hardcoded `bg-[#F3F4F6]` — fixed: added `--color-bg` token, using `bg-bg` [globals.css, App.tsx]
- [x] [Review][Patch] P5: VITE_API_URL env var defined but unused — fixed: replaced with comment explaining proxy config [.env.example]
- [x] [Review][Defer] W1: Double-submit race on rapid Enter presses — deferred, address in Story 1.3 when onSubmit is wired to mutation
- [x] [Review][Defer] W2: SQLite not closed on process exit — deferred, pre-existing from Story 1.1
- [x] [Review][Defer] W3: migrate() called on every createDatabase invocation — deferred, pre-existing from Story 1.1

### Change Log

- 2026-04-09: Initial implementation of Story 1.2 - Frontend App Shell with Design System
- 2026-04-09: Code review completed — 1 decision-needed, 5 patches, 3 deferred, 12 dismissed
