# Story 1.3: Create and View Active Tasks

Status: done

## Story

As a user,
I want to type a task and press Enter to see it appear instantly in my active list,
So that capturing tasks feels immediate and frictionless.

## Acceptance Criteria

1. **Given** the input field is focused and contains text **When** the user presses Enter **Then** a new TaskCard animates into the active list (150-200ms ease-out) **And** the input field clears and retains focus **And** a client-side UUID is generated for the new todo **And** the UI updates optimistically before the server responds (React Query mutation with `onMutate`) **And** the saved draft is cleared from localStorage (if any existed)
2. **Given** the input field is focused and empty **When** the user presses Enter **Then** nothing happens (no empty task creation)
3. **Given** the input field is focused **When** the user presses Escape **Then** the input text is cleared
4. **Given** active todos exist **When** the app renders the active list **Then** each todo is displayed as a TaskCard: checkbox (left) + task text (center) + creation timestamp (right) + delete button (right) **And** TaskCards have white background, `rounded-xl`, `shadow-sm`, and `shadow-md` on hover (desktop) **And** active tasks use full opacity with `text-primary` color **And** a SectionHeader labeled "Active" appears above the list with semi-bold `text-secondary` styling **And** the task list uses semantic `<ul>`/`<li>` HTML elements
5. **Given** no active todos exist **When** the app renders **Then** an EmptyState component displays "No tasks yet" (text-primary) and "Type above to get started" (text-muted) **And** the EmptyState disappears when the first task is created
6. **Given** the optimistic create succeeds on the server **When** the server confirms the creation **Then** React Query settles the mutation silently (no visible change)
7. **Given** the optimistic create fails on the server **When** the server returns an error **Then** the optimistic update is rolled back and the task is removed from the list
8. **Given** the app is viewed on mobile (<768px) **When** tasks are displayed **Then** touch targets are at least 48px height **And** delete buttons are always visible (not hover-dependent)

## Tasks / Subtasks

- [x] Task 1: Build TaskCard component (AC: #4, #8)
  - [x] 1.1 Create `apps/web/src/components/TaskCard.tsx` with anatomy: checkbox (left) + task text (center, flex) + metadata timestamp (right) + delete button (right)
  - [x] 1.2 Style active variant: `bg-surface rounded-xl shadow-sm`, full opacity, `text-text-primary` for task text, `text-text-secondary text-xs` for timestamp
  - [x] 1.3 Add hover state: `lg:hover:shadow-md` with `transition-shadow duration-150 ease-out` (desktop only)
  - [x] 1.4 Add delete button: inline SVG trash icon (no icon library — keep bundle light), `text-text-muted hover:text-danger` on desktop, always visible on mobile, min touch target 48px (`min-h-12 min-w-12`)
  - [x] 1.5 Add checkbox: styled checkbox (left), non-functional in this story (complete/reactivate is Story 1.4) — render as visual placeholder only, disabled
  - [x] 1.6 Format `createdAt` timestamp as short date (e.g., "Apr 9") — use `Intl.DateTimeFormat` with `{ month: 'short', day: 'numeric' }`. Do NOT use relative time ("2h ago") as it requires a timer/interval to stay current
  - [x] 1.7 Ensure card enter animation: use CSS `@starting-style` with opacity 0 → 1 and translateY(-8px) → 0, duration 150-200ms ease-out, respect `prefers-reduced-motion`
  - [x] 1.8 Ensure semantic HTML: `<li>` wrapper, checkbox uses `<input type="checkbox">` or `<button>` with `aria-label`, delete button has `aria-label="Delete task"`
- [x] Task 2: Build SectionHeader component (AC: #4)
  - [x] 2.1 Create `apps/web/src/components/SectionHeader.tsx`: label text with `text-[0.8125rem] font-semibold text-text-secondary uppercase tracking-wide`
  - [x] 2.2 Use `<h2>` element for semantic heading hierarchy (App title is `<h1>`)
- [x] Task 3: Wire create mutation with optimistic updates (AC: #1, #2, #3, #6, #7)
  - [x] 3.1 Create `apps/web/src/hooks/useCreateTodo.ts`: React Query `useMutation` calling `apiPost<ApiResponse<Todo>>('/todos', payload)`
  - [x] 3.2 Implement optimistic update in `onMutate`: cancel outgoing refetches, snapshot previous cache, insert new todo into cache with client-generated UUID via `crypto.randomUUID()`
  - [x] 3.3 Implement rollback in `onError`: restore previous cache snapshot from `onMutate` context
  - [x] 3.4 Implement `onSettled`: invalidate `todoKeys.all` to reconcile with server state
  - [x] 3.5 Wire InputCard `onSubmit` to call `useCreateTodo` mutation: validate non-empty trimmed text, generate UUID, construct `CreateTodoRequest` payload `{ id, text }`, call mutate, clear input on success
  - [x] 3.6 Prevent double-submit: disable mutation while `isPending` is true (addresses deferred W1 from Story 1.2 review)
  - [x] 3.7 Clear any existing draft from localStorage on successful create (prepare for Epic 3 — key: `bmad_draft`)
- [x] Task 4: Update App.tsx to render task list (AC: #4, #5)
  - [x] 4.1 In `App.tsx`, use existing `useTodos()` hook to get active todos (filter `completed === false`)
  - [x] 4.2 Render SectionHeader "Active" + `<ul>` of TaskCard components when active todos exist
  - [x] 4.3 Render EmptyState when no active todos exist (already built in Story 1.2)
  - [x] 4.4 Pass `onDelete` callback as no-op to TaskCard (delete mutation is Story 1.5) — but render the button for visual completeness
  - [x] 4.5 Ensure task list renders newest first (sort by `createdAt` descending) or server order if already sorted
- [x] Task 5: Write tests (AC: #1-#8)
  - [x] 5.1 Create `apps/web/__tests__/components/TaskCard.test.tsx`: renders task text, timestamp, checkbox, delete button; active variant styling; hover shadow class present; semantic HTML (`li`, `aria-label` on buttons); mobile touch target size
  - [x] 5.2 Create `apps/web/__tests__/components/SectionHeader.test.tsx`: renders label text, uses `<h2>` element, correct styling classes
  - [x] 5.3 Create `apps/web/__tests__/hooks/useCreateTodo.test.ts`: successful creation updates cache optimistically; failed creation rolls back cache; empty text is not submitted; UUID format is valid
  - [x] 5.4 Update `apps/web/__tests__/components/App.test.tsx`: active todos render as TaskCard list with SectionHeader; empty state shows when no todos; new task appears after creation

## Dev Notes

### Architecture Compliance

**CRITICAL — Follow these patterns exactly:**

- **Naming:** PascalCase for component files (`TaskCard.tsx`), camelCase for hooks/utils (`useCreateTodo.ts`). camelCase for all variables, functions, props
- **Exports:** Named exports ONLY. No `export default`. Framework config files are the only exception
- **Types:** Strict TypeScript. No `any` type. Import `Todo`, `CreateTodoRequest`, `ApiResponse` from `@bmad/shared`
- **Imports:** Direct imports only — no barrel `index.ts` in app packages. Example: `import { TaskCard } from './components/TaskCard'`
- **Components:** Functional components with hooks. Co-located styles via Tailwind utility classes
- **State:** React Query for all server state. `useMutation` for create. `useQuery` for list. No Redux, no Context for server data

### Technical Stack (Exact Versions — April 2026)

- **React 19.1.x** — `ref` as standard prop (no `forwardRef`), `use()` hook available, `createRoot` from `react-dom/client`
- **@tanstack/react-query 5.96.x** — `useMutation` with `onMutate`/`onError`/`onSettled` for optimistic updates
- **Tailwind CSS 4.1.x** — CSS `@theme` blocks for tokens, `@starting-style` variant for entry animations, `@tailwindcss/vite` plugin
- **Vitest 3.1.x** + **@testing-library/react 16.x** — component and hook tests
- **UUID generation:** Use `crypto.randomUUID()` (native browser API, no package needed) — 3-4x faster than `uuid` package, supported in all modern browsers

### Optimistic Update Pattern (React Query v5)

```typescript
// useCreateTodo.ts — follow this exact pattern
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from '../lib/queryKeys';
import { apiPost } from '../lib/apiClient';
import type { Todo, CreateTodoRequest, ApiResponse } from '@bmad/shared';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTodo: CreateTodoRequest) =>
      apiPost<ApiResponse<Todo>>('/todos', newTodo),

    onMutate: async (newTodo) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.all });

      // 2. Snapshot previous value
      const previous = queryClient.getQueryData<ApiResponse<Todo[]>>(todoKeys.all);

      // 3. Optimistically insert new todo
      queryClient.setQueryData<ApiResponse<Todo[]>>(todoKeys.all, (old) => {
        const optimisticTodo: Todo = {
          id: newTodo.id,
          userId: 'default',
          text: newTodo.text,
          completed: false,
          deleted: false,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          data: [optimisticTodo, ...(old?.data ?? [])],
          meta: { count: (old?.meta?.count ?? 0) + 1 },
        };
      });

      // 4. Return context with snapshot for rollback
      return { previous };
    },

    onError: (_err, _newTodo, context) => {
      // Rollback to previous cache state
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.all, context.previous);
      }
    },

    onSettled: () => {
      // Refetch to reconcile with server
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}
```

### TaskCard Component Structure

```
┌─────────────────────────────────────────────────────┐
│ ☐  │  Task description text          │ Apr 9  │ 🗑  │
│    │  (flex-1, truncate if needed)    │ (xs)   │     │
└─────────────────────────────────────────────────────┘
     checkbox  task text (center)    timestamp  delete
```

- Checkbox: `<input type="checkbox">` or styled `<button>`, disabled in this story (complete is Story 1.4)
- Task text: `text-[0.9375rem] font-normal text-text-primary`, flex-1
- Timestamp: `text-xs text-text-secondary`, formatted from `createdAt`
- Delete button: icon button, `aria-label="Delete task"`, calls `onDelete` prop

### Card Animation with Tailwind CSS v4

Use `@starting-style` for enter animations (no JS class toggling needed):

```css
/* In globals.css or inline via Tailwind arbitrary values */
@starting-style {
  .task-card {
    opacity: 0;
    transform: translateY(-8px);
  }
}

.task-card {
  transition: opacity 200ms ease-out, transform 200ms ease-out, box-shadow 150ms ease-out;
}
```

Or use Tailwind utilities directly:
```tsx
<li className="animate-in fade-in slide-in-from-top-2 duration-200 ease-out
               motion-reduce:animate-none">
```

**CRITICAL:** Always add `motion-reduce:animate-none` or `prefers-reduced-motion` media query check. The UX spec requires all animations to respect user motion preferences.

### Existing Files to Reuse (Do NOT Recreate)

These files exist from Stories 1.1 and 1.2 — use them directly:

| File | What it provides | How to use |
|------|-----------------|------------|
| `apps/web/src/lib/apiClient.ts` | `apiGet`, `apiPost`, `apiPatch`, `apiDelete` | Call `apiPost<ApiResponse<Todo>>('/todos', payload)` for create |
| `apps/web/src/lib/queryKeys.ts` | `todoKeys.all`, `todoKeys.detail(id)` | Use `todoKeys.all` for cache key |
| `apps/web/src/hooks/useTodos.ts` | `useTodos()` hook returning `ApiResponse<Todo[]>` | Already wired in App.tsx for fetching list |
| `apps/web/src/components/InputCard.tsx` | Input card with Enter/Escape handling | Wire `onSubmit` prop to create mutation |
| `apps/web/src/components/EmptyState.tsx` | "No tasks yet" message | Already rendered conditionally |
| `apps/web/src/globals.css` | All design tokens via `@theme` | Tokens already available: `bg-surface`, `text-text-primary`, etc. |
| `apps/web/src/App.tsx` | Layout shell with InputCard + EmptyState | Extend to add SectionHeader + task list |

### Tailwind Token Usage (Established in Story 1.2)

```
bg-surface       → white card background
bg-bg            → app background (#F3F4F6)
text-text-primary → main text color
text-text-secondary → timestamps, completed text
text-text-muted  → placeholder, helper text
text-accent      → interactive elements, focus rings
text-danger      → delete button hover
ring-accent      → focus rings
border-border    → card borders if needed
shadow-sm        → default card shadow
shadow-md        → hover card shadow (desktop)
rounded-xl       → card border radius
```

### Typography Scale (Established in Story 1.2)

| Element | Tailwind Class |
|---------|----------------|
| Section Label ("Active") | `text-[0.8125rem] font-semibold` |
| Task Text | `text-[0.9375rem] font-normal` |
| Timestamp | `text-xs font-normal` |
| Input | `text-[0.9375rem] font-normal` |

### Responsive Behavior

- Mobile (<768px): Delete buttons always visible, touch targets min 48px, full-width cards with px-4 margins
- Desktop (1024px+): Delete buttons can be hover-revealed OR always visible (always visible is simpler and accessible — prefer always visible), hover shadow elevation via `lg:hover:shadow-md`
- All breakpoints: Same single-column layout, max-w-[640px] centered

### InputCard Integration

The existing `InputCard` component accepts an `onSubmit` callback. Wire it to the create mutation:

```typescript
// In App.tsx
const createTodo = useCreateTodo();

const handleCreateTodo = (text: string) => {
  createTodo.mutate({
    id: crypto.randomUUID(),
    text: text.trim(),
  });
};

// Pass to InputCard
<InputCard onSubmit={handleCreateTodo} disabled={createTodo.isPending} />
```

The InputCard already handles:
- Enter key to call `onSubmit` with current text
- Escape key to clear input
- Empty string prevention (check trimmed length)
- Focus ring on card container

### Anti-Patterns to Avoid

- Do NOT install `uuid` package — use native `crypto.randomUUID()`
- Do NOT build completed task variant in this story — that is Story 1.4
- Do NOT add undo toast on delete — that is Story 2.1
- Do NOT implement actual delete mutation — Story 1.5 handles that. TaskCard's delete button should call `onDelete` prop (passed as no-op for now)
- Do NOT add checkbox toggle functionality — Story 1.4 handles complete/reactivate. Render checkbox as disabled visual element
- Do NOT add draft persistence (localStorage save on typing) — that is Epic 3
- Do NOT add loading/error states — that is Story 1.6
- Do NOT use Framer Motion or any animation library — CSS transitions and `@starting-style` are sufficient
- Do NOT use `export default`, `any` type, or barrel `index.ts` files
- Do NOT use `console.log` — remove before commit
- Do NOT modify existing API routes or backend code — backend is complete from Story 1.1

### Project Structure Notes

Files to create in this story:
```
apps/web/src/
├── components/
│   ├── TaskCard.tsx          # NEW — single task card component
│   └── SectionHeader.tsx     # NEW — "Active" / "Completed" section label
├── hooks/
│   └── useCreateTodo.ts      # NEW — React Query create mutation with optimistic updates
└── __tests__/
    ├── components/
    │   ├── TaskCard.test.tsx      # NEW
    │   └── SectionHeader.test.tsx # NEW
    └── hooks/
        └── useCreateTodo.test.ts  # NEW
```

Files to modify:
```
apps/web/src/App.tsx              # MODIFY — add task list rendering with SectionHeader + TaskCards
apps/web/src/components/InputCard.tsx  # MODIFY — wire onSubmit to create mutation (if not already accepting prop)
apps/web/__tests__/components/App.test.tsx  # MODIFY — add tests for task list rendering
```

### Previous Story Intelligence (Stories 1.1 and 1.2)

**Learnings from Story 1.1 implementation:**
- `.returning().all()` pattern needed for Drizzle ORM v0.45
- `pnpm.onlyBuiltDependencies` needed in root package.json for native modules
- Use Fastify generic types instead of `as` casts (fixed in code review)
- `maxLength: 500` enforced on text input at API level
- Error messages must not leak internal details in production
- Tests must use try/finally for cleanup

**Learnings from Story 1.2 implementation:**
- Tailwind v4 uses `@tailwindcss/vite` plugin, NOT PostCSS — already configured
- `@import "tailwindcss"` replaces old directives — already in globals.css
- Token classes use double prefix: `text-text-primary`, `text-text-secondary`, `bg-bg`
- API client already has `apiPost`, `apiPatch`, `apiDelete` — created "ahead of schedule" in Story 1.2 (deferred item D1 from review)
- InputCard already has Enter/Escape handlers, focus ring, visually hidden label
- `sm:max-w-[640px] sm:mx-auto` for responsive container (fixed in review P2)
- `lg:hover:shadow-md` for desktop hover states (fixed in review P3)
- Double-submit race condition flagged in review W1 — address by checking `isPending` before calling mutate

**Learnings from Story 1.2 code review:**
- Use type guards instead of `as` assertions (P1 fix)
- `bg-bg` token added for app background color (P4 fix)
- Framework config files exempt from no-`export default` rule

### References

- [Source: planning-artifacts/epics.md#Story 1.3] — Acceptance criteria and BDD scenarios
- [Source: planning-artifacts/architecture.md#Frontend Architecture] — React Query, optimistic updates, component architecture
- [Source: planning-artifacts/architecture.md#API & Communication Patterns] — POST /api/todos endpoint, wrapped response format
- [Source: planning-artifacts/architecture.md#Implementation Patterns] — Naming, structure, format, anti-patterns
- [Source: planning-artifacts/ux-design-specification.md#Component Strategy] — TaskCard anatomy, InputCard integration, SectionHeader
- [Source: planning-artifacts/ux-design-specification.md#Animation Patterns] — Card enter 150-200ms ease-out, shadow hover 150ms, prefers-reduced-motion
- [Source: planning-artifacts/ux-design-specification.md#Visual Design Foundation] — Color system, typography scale, spacing
- [Source: planning-artifacts/ux-design-specification.md#Responsive Design] — Breakpoints, touch targets, mobile behavior
- [Source: implementation-artifacts/1-1-monorepo-and-backend-foundation.md] — API endpoint details, backend patterns
- [Source: implementation-artifacts/1-2-frontend-app-shell-with-design-system.md] — Design tokens, existing components, review findings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `useTodos()` returns `response.data` (unwrapped `Todo[]`), not the wrapped `ApiResponse` — optimistic update in `useCreateTodo` must set cache as `Todo[]` not `ApiResponse<Todo[]>`
- Installed `@testing-library/user-event` as devDependency — needed for simulating user typing and keyboard events in App integration test
- `onSettled` invalidation clears cache when no active query observer is subscribed — hook tests use `staleTime: Infinity` and `gcTime: Infinity` to keep cache alive, and verify optimistic behavior via `some()` check rather than exact equality

### Completion Notes List

- All 5 tasks completed with 38 passing frontend tests + 18 passing API tests (56 total, 0 regressions)
- TaskCard component: card-based layout with checkbox (disabled), task text, short date timestamp via `Intl.DateTimeFormat`, inline SVG trash icon delete button, 48px min touch targets, `@starting-style` enter animation with `prefers-reduced-motion` respect
- SectionHeader component: `<h2>` semantic element, uppercase semi-bold text-secondary styling
- useCreateTodo hook: React Query `useMutation` with optimistic cache insert, rollback on error, `invalidateQueries` on settle, draft localStorage cleanup
- App.tsx: active todo filtering, SectionHeader + TaskCard list rendering, EmptyState when empty, double-submit prevention via `isPending` guard
- Named exports only, no `any` types, no `console.log`, camelCase throughout, strict TypeScript

### Change Log

- 2026-04-09: Initial implementation of Story 1.3 - Create and View Active Tasks

### File List

- apps/web/src/components/TaskCard.tsx (new)
- apps/web/src/components/SectionHeader.tsx (new)
- apps/web/src/hooks/useCreateTodo.ts (new)
- apps/web/src/globals.css (modified — added task-card animation with @starting-style and prefers-reduced-motion)
- apps/web/src/App.tsx (modified — added task list rendering with SectionHeader, TaskCard, useCreateTodo, active filtering)
- apps/web/__tests__/components/TaskCard.test.tsx (new)
- apps/web/__tests__/components/SectionHeader.test.tsx (new)
- apps/web/__tests__/hooks/useCreateTodo.test.ts (new)
- apps/web/__tests__/components/App.test.tsx (modified — added tests for task list rendering and task creation)
- apps/web/package.json (modified — added @testing-library/user-event devDependency)

### Review Findings

- [x] [Review][Decision] InputCard `disabled` prop not passed during pending state — resolved: added `disabled` prop to InputCard, passed `isPending` from App.tsx
- [x] [Review][Patch] Unused `options` parameter in `renderWithProviders` test helper — fixed: removed unused parameter
- [x] [Review][Patch] Redundant `vi.restoreAllMocks()` — fixed: removed duplicate `beforeEach` call
- [x] [Review][Patch] Delete button `aria-label` not task-specific — fixed: now includes task text (e.g., `Delete "Buy groceries"`)
- [x] [Review][Patch] No `maxLength` on text input — fixed: added `maxLength={500}` to input element
- [x] [Review][Defer] Tests assert on CSS class names (brittle) — multiple tests check `className.toContain('bg-surface')` etc.; breaks on styling refactor [TaskCard.test.tsx, App.test.tsx] — deferred, pre-existing pattern from Story 1.2
- [x] [Review][Defer] `formatDate` no guard for invalid date string — `new Date(isoString)` could produce Invalid Date if `createdAt` is malformed [TaskCard.tsx:14] — deferred, backend validates dates
- [x] [Review][Defer] Mutate before initial query resolves could flash — optimistic update on undefined cache shows single item then full list on refetch [useCreateTodo.ts:20-32] — deferred, edge case requires specific timing
