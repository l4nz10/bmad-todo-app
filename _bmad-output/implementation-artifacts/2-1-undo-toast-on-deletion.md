# Story 2.1: Undo Toast on Deletion

Status: done

## Story

As a user,
I want to see an undo option immediately after deleting a task,
So that I can quickly reverse accidental deletions without losing data.

## Acceptance Criteria

1. **Given** a task is deleted from either the active or completed list **When** the delete action completes (card animates out) **Then** an UndoToast (Radix Toast) appears at the bottom of the viewport **And** the toast displays "Task deleted" with a single "Undo" button **And** the toast auto-dismisses after 5 seconds **And** the toast entrance animation is 200ms ease-out slide-up **And** the toast exit animation is 150ms ease-in

2. **Given** the UndoToast is visible **When** the user clicks/taps "Undo" within the 5-second window **Then** the deleted task is restored to its original list (active or completed) **And** the task animates back into its list (200ms ease-out) **And** the backend restores the task (sets `deleted = 0`, `deletedAt = null`) **And** the toast dismisses

3. **Given** the UndoToast is visible **When** the 5-second timer expires without user action **Then** the toast dismisses with its exit animation **And** the task remains soft-deleted in the database (moved to trash bin)

4. **Given** an UndoToast is currently visible **When** the user deletes another task **Then** the previous toast is dismissed immediately **And** a new UndoToast appears for the most recent deletion **And** the previously deleted task's undo window is forfeited (it stays in trash)

5. **Given** the UndoToast is rendered on mobile (<768px) **When** the viewport is narrow **Then** the toast displays full-width at the bottom of the viewport

6. **Given** the user has `prefers-reduced-motion` enabled **When** the toast appears or dismisses **Then** animations are replaced by instant state changes

7. **Given** a screen reader is active **When** the UndoToast appears **Then** the toast region announces the deletion and undo availability via `aria-live`

## Tasks / Subtasks

- [x] Task 1: Install Radix Toast and add constants (AC: 1)
  - [x] 1.1 Install `@radix-ui/react-toast` in apps/web
  - [x] 1.2 Create `apps/web/src/constants.ts` with `TOAST_DURATION_MS = 5000`

- [x] Task 2: Backend restore endpoint (AC: 2)
  - [x] 2.1 Create `apps/api/src/services/trashService.ts` with `restoreTodo(id)` — sets `deleted: false`, `deletedAt: null`, `updatedAt: now`, returns restored `Todo`
  - [x] 2.2 Create `apps/api/src/routes/trashRoutes.ts` with `PATCH /api/trash/:id/restore` — JSON Schema validation on `:id` param (UUID), 404 if not found or not deleted, returns `{ data: Todo }`
  - [x] 2.3 Register trash routes in `apps/api/src/app.ts`
  - [x] 2.4 Write backend tests: `apps/api/__tests__/routes/trashRoutes.test.ts` — restore success, 404 not found, 404 not deleted, 400 invalid UUID

- [x] Task 3: Frontend restore hook and query keys (AC: 2)
  - [x] 3.1 Add `trashKeys` to `apps/web/src/lib/queryKeys.ts`: `trashKeys = { all: ['trash'] as const }`
  - [x] 3.2 Create `apps/web/src/hooks/useRestoreTodo.ts` — `useMutation` calling `apiPatch<ApiResponse<Todo>>('/trash/${id}/restore')`, on success: invalidate `todoKeys.all` (restoring adds the todo back to the active list)
  - [x] 3.3 Write hook test: `apps/web/__tests__/hooks/useRestoreTodo.test.ts` — restore success invalidates todo cache, error handling

- [x] Task 4: UndoToast component (AC: 1, 5, 6, 7)
  - [x] 4.1 Create `apps/web/src/components/UndoToast.tsx` using Radix Toast primitives (`Toast.Provider`, `Toast.Root`, `Toast.Title`, `Toast.Action`, `Toast.Viewport`)
  - [x] 4.2 Props: `deletedTodo: Todo | null`, `onUndo: () => void`, `onDismiss: () => void` — toast opens when `deletedTodo` is non-null
  - [x] 4.3 Layout: "Task deleted" message + "Undo" action button, viewport positioned bottom-center (full-width on mobile <768px)
  - [x] 4.4 Use `TOAST_DURATION_MS` from constants for auto-dismiss duration
  - [x] 4.5 Add toast slide-up/slide-down keyframe animations to `apps/web/src/globals.css` with `prefers-reduced-motion` override
  - [x] 4.6 Radix Toast handles `aria-live` announcement automatically via its viewport
  - [x] 4.7 Write component tests: `apps/web/__tests__/components/UndoToast.test.tsx` — renders when deletedTodo provided, calls onUndo on click, calls onDismiss on auto-close, has accessible roles

- [x] Task 5: Wire undo flow into App.tsx (AC: 1, 2, 3, 4)
  - [x] 5.1 Add state: `const [pendingUndo, setPendingUndo] = useState<Todo | null>(null)` to track the most recently deleted todo
  - [x] 5.2 Modify `handleDeleteTodo`: before calling `deleteTodo.mutate()`, snapshot the full `Todo` object from `todos` array. On mutation success, call `setPendingUndo(snapshotTodo)` instead of (or in addition to) `announce('Task deleted')`
  - [x] 5.3 Create `handleUndo`: calls `restoreTodo.mutate({ id: pendingUndo.id })`, clears `pendingUndo`, announces "Task restored"
  - [x] 5.4 Create `handleToastDismiss`: clears `pendingUndo` (no action needed — task stays soft-deleted)
  - [x] 5.5 When a new delete occurs while `pendingUndo` is set: the previous undo is forfeited (setPendingUndo replaces the old value, Radix Toast auto-replaces)
  - [x] 5.6 Render `<UndoToast deletedTodo={pendingUndo} onUndo={handleUndo} onDismiss={handleToastDismiss} />` — must be inside `<Toast.Provider>` which wraps the app content
  - [x] 5.7 Write integration tests in `apps/web/__tests__/components/App.test.tsx`: delete shows toast, undo restores task, toast auto-dismisses, new delete replaces previous toast

## Dev Notes

### Architecture Compliance

CRITICAL — Follow these patterns exactly (established in Stories 1.1-1.6):

- **Naming:** PascalCase for component files, camelCase for hooks/utils. camelCase for all variables, functions, props
- **Exports:** Named exports ONLY. No `export default`
- **Types:** Strict TypeScript. No `any`. Import `Todo`, `ApiResponse` from `@bmad/shared`
- **State:** React Query for all server state. `useMutation` for restore. No Redux, no Context for server data
- **API Client:** Use existing `apiPatch` from `apps/web/src/lib/apiClient.ts` — do NOT create new fetch wrappers
- **Query Keys:** Use `todoKeys.all` from `apps/web/src/lib/queryKeys.ts` for cache invalidation
- **Announcements:** Reuse existing `announce()` helper in App.tsx (creates `{ text, key }` state for unique re-renders)
- **isPending guard:** Always guard mutation handlers with `if (mutation.isPending) return` to prevent rapid double-clicks

### Backend Patterns (from Story 1.1)

The backend uses Fastify + Drizzle ORM + SQLite:
- Routes register via `app.register(routes, { prefix: '/api' })` in `apps/api/src/app.ts`
- Services contain business logic, routes handle HTTP concerns
- Fastify JSON Schema validation on all request bodies and params
- Error format: `{ error: "message", statusCode: 404 }`
- Success format: `{ data: Todo }` for single items
- Soft-delete columns already exist: `deleted` (INTEGER 0/1), `deletedAt` (TEXT ISO timestamp nullable)

The restore endpoint pattern:
```
PATCH /api/trash/:id/restore
→ trashService.restoreTodo(id)
→ UPDATE todos SET deleted = 0, deletedAt = NULL, updatedAt = now WHERE id = :id AND deleted = 1
→ Returns { data: restoredTodo }
→ 404 if todo not found OR not currently deleted
```

### Frontend Delete Flow (current state — from Story 1.5)

Current `handleDeleteTodo` in App.tsx:
```typescript
const handleDeleteTodo = (id: string) => {
  if (deleteTodo.isPending) return;
  deleteTodo.mutate(
    { id },
    {
      onSuccess: () => {
        announce('Task deleted');
      },
      onError: () => {
        announce('Action failed. Please try again.');
      },
    },
  );
};
```

The `useDeleteTodo` hook already does optimistic removal via `onMutate` (filters todo from cache). The mutation returns `ApiResponse<Todo>` (the soft-deleted todo). The undo flow must:
1. **Before mutating**: snapshot the `Todo` from the `todos` array (need the full object for restore context)
2. **On success**: store the deleted todo in `pendingUndo` state, announce "Task deleted"
3. **On undo click**: call `restoreTodo.mutate({ id })`, which hits `PATCH /api/trash/:id/restore`
4. **On undo success**: invalidate `todoKeys.all` to refetch (todo reappears), announce "Task restored"

### Radix Toast Integration Pattern

`@radix-ui/react-toast` requires this structure:
```tsx
<Toast.Provider duration={TOAST_DURATION_MS}>
  {/* app content */}
  <Toast.Root open={!!deletedTodo} onOpenChange={(open) => !open && onDismiss()}>
    <Toast.Title>Task deleted</Toast.Title>
    <Toast.Action altText="Undo deletion" asChild>
      <button onClick={onUndo}>Undo</button>
    </Toast.Action>
  </Toast.Root>
  <Toast.Viewport className="..." />
</Toast.Provider>
```

Key Radix Toast behaviors:
- `Toast.Provider` wraps the entire app (or at least the tree needing toasts)
- `Toast.Viewport` is a fixed-position container — place at bottom-center
- `Toast.Action` must have `altText` for screen readers
- `duration` on Provider sets default auto-dismiss time
- Opening a new toast while one is showing auto-dismisses the previous (AC4 for free)
- `onOpenChange(false)` fires on both auto-dismiss and manual close — use this for `onDismiss`

### Animation Keyframes for Toast

Add to `globals.css`:
```css
@keyframes toast-slide-in {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes toast-slide-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
}
```

Apply via Radix data attributes:
```css
[data-state="open"] { animation: toast-slide-in 200ms ease-out; }
[data-state="closed"] { animation: toast-slide-out 150ms ease-in; }
```

Disable under `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  [data-state="open"], [data-state="closed"] { animation: none; }
}
```

### Styling Guidelines

- Toast background: `bg-surface` (white card) with `shadow-lg` for elevation
- Toast text: `text-text-primary` for message, 12px/0.75rem for toast messages per UX spec
- Undo button: `text-accent` with `underline`, min 48px touch target (`min-h-12`)
- Viewport: `fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-[420px]` — full-width mobile, constrained desktop
- Toast padding: `p-4` with `rounded-xl` to match card design language
- No stacking: only one toast at a time (Radix handles this automatically)

### Testing Patterns (from Stories 1.1-1.6)

- Frontend tests: `@testing-library/react` + Vitest, `vi.spyOn(globalThis, 'fetch')` for mocking
- Backend tests: Fastify `inject()` method, in-memory SQLite
- Hook tests: `staleTime: Infinity`, `gcTime: Infinity` in QueryClient, `createElement` wrapper (no JSX in `.ts` files)
- App integration tests: `renderWithProviders()` with fresh QueryClient (`retry: false, gcTime: 0`)
- Use accessible name selectors: `getByRole('button', { name: /undo/i })` not positional indexes
- All assertions unconditional (no `if` guards)
- Test error announcements separately from success paths
- Use `vi.useFakeTimers()` for toast auto-dismiss timing tests
- Mock `matchMedia` for `prefers-reduced-motion` tests if needed

Files NOT to modify:
```
apps/web/src/components/TaskCard.tsx               # DO NOT MODIFY
apps/web/src/components/EmptyState.tsx             # DO NOT MODIFY
apps/web/src/components/InputCard.tsx              # DO NOT MODIFY
apps/web/src/components/LoadingState.tsx           # DO NOT MODIFY
apps/web/src/components/ErrorState.tsx             # DO NOT MODIFY
apps/web/src/hooks/useTodos.ts                    # DO NOT MODIFY
apps/web/src/hooks/useDeleteTodo.ts               # DO NOT MODIFY — optimistic delete already works
```

### Previous Story Intelligence (Stories 1.1-1.6)

**Key learnings to apply:**
- `useTodos()` returns unwrapped `Todo[]` via `response.data`, NOT `ApiResponse<Todo[]>`
- Tailwind token double-prefix: `text-text-primary`, `text-text-secondary`, `bg-bg`, `bg-surface`
- `@starting-style` for entry animations, `prefers-reduced-motion` media query always alongside
- Tests mock `globalThis.fetch` with `vi.spyOn` — see patterns in existing test files
- `announce()` helper in App.tsx uses `{ text, key }` state object with incrementing key
- Component tests follow existing pattern: render, assert text, assert roles
- App integration tests use `renderWithProviders()` with fresh QueryClient (`retry: false, gcTime: 0`)
- All assertions must be unconditional (no `if` guards — Story 1.5 review fix)
- Use accessible name selectors in tests, not positional indexes (Story 1.5 review fix)
- Always test error announcements separately (Story 1.5 review fix)
- `isPending` guard on all mutation handlers (Story 1.4 review fix)
- Mutation callbacks (`onSuccess`/`onError`) passed to `.mutate()` call, not `useMutation()` options
- Backend route tests use Fastify `inject()` — no HTTP server needed
- `apiPatch` already exists in `apiClient.ts` — use it for the restore call

### References

- [Source: planning-artifacts/epics.md#Epic 2, Story 2.1] — Acceptance criteria, BDD scenarios
- [Source: planning-artifacts/architecture.md#Frontend Architecture] — React Query, Radix Toast, component organization
- [Source: planning-artifacts/architecture.md#Route Structure] — PATCH /api/trash/:id/restore endpoint contract
- [Source: planning-artifacts/architecture.md#Database Schema] — soft-delete columns, restore query
- [Source: planning-artifacts/architecture.md#State Update Patterns] — optimistic update pattern
- [Source: planning-artifacts/architecture.md#Constants] — TOAST_DURATION_MS, constants file location
- [Source: planning-artifacts/ux-design-specification.md#Feedback Patterns] — Toast 5s duration, bottom-positioned, single action
- [Source: planning-artifacts/ux-design-specification.md#Animation Patterns] — Toast enter 200ms ease-out, exit 150ms ease-in
- [Source: planning-artifacts/ux-design-specification.md#Accessibility] — aria-live, focus, keyboard
- [Source: planning-artifacts/ux-design-specification.md#Responsive] — Full-width toast on mobile <768px
- [Source: implementation-artifacts/1-5-delete-tasks-with-inline-removal.md] — Delete mutation flow, useDeleteTodo hook, App.tsx wiring
- [Source: implementation-artifacts/1-6-loading-and-error-states.md] — LoadingState/ErrorState patterns, announce() usage

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- jsdom lacks `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture` — Radix Toast uses pointer capture internally. Fixed by stubbing these methods on `Element.prototype` in test setup (`beforeAll`)
- Radix Toast `onOpenChange(false)` fires on both auto-dismiss and manual close — used for `handleToastDismiss`
- `apiPatch` sends empty object `{}` as body (required by the fetch wrapper which always JSON-stringifies the body)

### Completion Notes List

- All 5 tasks completed with 90 passing frontend tests + 23 passing API tests (113 total, 0 regressions)
- Backend: `trashService.restoreTodo(id)` sets `deleted=false`, `deletedAt=null`, `updatedAt=now`; `PATCH /api/trash/:id/restore` with UUID validation, 404 for not-found/not-deleted
- Frontend: `UndoToast` component using Radix Toast primitives with `Toast.Provider`, `Toast.Root`, `Toast.Title`, `Toast.Action`, `Toast.Viewport`; positioned bottom-center, full-width on mobile
- `useRestoreTodo` hook: `useMutation` calling `apiPatch('/trash/${id}/restore')`, invalidates `todoKeys.all` on settle
- App.tsx: `pendingUndo` state tracks last deleted todo; `handleDeleteTodo` snapshots todo before mutation, sets `pendingUndo` on success; `handleUndo` calls restore mutation; `handleToastDismiss` clears state
- CSS: `@keyframes toast-slide-in/out` with 200ms/150ms durations, `prefers-reduced-motion` override
- Named exports only, no `any` types, no `console.log`, strict TypeScript

### File List

- apps/web/src/constants.ts (new)
- apps/api/src/services/trashService.ts (new)
- apps/api/src/routes/trashRoutes.ts (new)
- apps/api/src/app.ts (modified — registered trashRoutes)
- apps/api/__tests__/routes/trashRoutes.test.ts (new — 5 tests)
- apps/web/src/lib/queryKeys.ts (modified — added trashKeys)
- apps/web/src/hooks/useRestoreTodo.ts (new)
- apps/web/__tests__/hooks/useRestoreTodo.test.ts (new — 3 tests)
- apps/web/src/components/UndoToast.tsx (new)
- apps/web/__tests__/components/UndoToast.test.tsx (new — 5 tests)
- apps/web/src/App.tsx (modified — pendingUndo state, handleUndo, handleToastDismiss, UndoToast render)
- apps/web/src/globals.css (modified — toast keyframe animations, reduced-motion override)
- apps/web/__tests__/components/App.test.tsx (modified — 3 new undo integration tests, pointer capture stubs)
- apps/web/package.json (modified — @radix-ui/react-toast dependency)

### Review Findings

- [x] [Review][Decision] Undo retry impossible after restore failure — resolved: keep toast open until mutation settles (option A applied) [apps/web/src/App.tsx:78]
- [x] [Review][Patch] Toast viewport uses `sm:` breakpoint (640px) instead of `md:` (768px) for mobile full-width — fixed [apps/web/src/components/UndoToast.tsx:33]
- [x] [Review][Patch] Toast timer may not restart on consecutive deletes — fixed: added `key={deletedTodo?.id}` to `Toast.Root` [apps/web/src/components/UndoToast.tsx:15]
- [x] [Review][Patch] `trashKeys` exported but never used — removed [apps/web/src/lib/queryKeys.ts]
- [x] [Review][Patch] UUID validation duplicated — removed manual `isValidUuid` check, JSON Schema handles it [apps/api/src/routes/trashRoutes.ts]
- [x] [Review][Defer] Double database connection — `registerTrashRoutes` calls `createDatabase()` separately from `registerTodoRoutes`, opening two SQLite connections to the same file — deferred, pre-existing pattern
- [x] [Review][Defer] No auth/user-scoping on restore endpoint — `PATCH /api/trash/:id/restore` has no ownership check, any caller can restore any deleted todo — deferred, pre-existing (all routes lack auth)
- [x] [Review][Defer] `toTodo` exposes `userId` in API response — potential information disclosure in multi-tenant scenarios — deferred, pre-existing pattern

### Change Log

- 2026-04-09: Story created by create-story workflow — comprehensive developer guide with full context
- 2026-04-09: Implementation of Story 2.1 - Undo Toast on Deletion
- 2026-04-09: Code review completed — 1 decision-needed, 4 patches, 3 deferred, 12 dismissed
