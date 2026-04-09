# Story 2.2: Trash Bin View and Restore

Status: done

## Story

As a user,
I want to browse my recently deleted tasks and restore any of them,
So that I can recover tasks I deleted intentionally but later need back.

## Acceptance Criteria

1. **Given** one or more soft-deleted tasks exist (within 7-day retention) **When** the app renders **Then** a TrashButton appears at the bottom of the page showing a trash icon, "Trash" label, and item count badge

2. **Given** no soft-deleted tasks exist **When** the app renders **Then** the TrashButton is hidden

3. **Given** the TrashButton is visible **When** the user clicks/taps the TrashButton **Then** a TrashDialog opens (Radix Dialog modal overlay) **And** the dialog displays a header "Trash" and a list of deleted TaskCards **And** each item shows the task text, deletion date, and days remaining until auto-purge **And** each item has a "Restore" button **And** focus is trapped within the dialog (Radix handles this)

4. **Given** the TrashDialog is open **When** the user clicks "Restore" on a trashed item **Then** the task is restored to its original list (active if it was active, completed if it was completed) **And** the backend sets `deleted = 0` and `deletedAt = null` via `PATCH /api/trash/:id/restore` **And** the item is removed from the trash list in the dialog **And** the TrashButton count updates

5. **Given** the TrashDialog is open **When** the user presses Escape, clicks the X button, or clicks the overlay **Then** the dialog closes and focus returns to the TrashButton

6. **Given** the last trashed item is restored **When** the trash list becomes empty **Then** the dialog closes automatically **And** the TrashButton hides

7. **Given** a screen reader is active **When** the TrashDialog opens **Then** the dialog is announced with proper `aria-labelledby` referencing the "Trash" heading

8. **Given** the TrashButton is in the Tab order **When** the user navigates via keyboard **Then** the TrashButton is focusable with a visible focus ring **And** Enter opens the dialog

## Tasks / Subtasks

- [x] Task 1: Backend — `GET /api/trash` endpoint (AC: 1, 2, 3)
  - [x] 1.1 Add `listTrashedTodos()` to `apps/api/src/services/trashService.ts` — `SELECT * FROM todos WHERE deleted = 1 AND deletedAt >= (now - 7 days)` ordered by `deletedAt DESC`, returns `Todo[]`
  - [x] 1.2 Add `GET /api/trash` route to `apps/api/src/routes/trashRoutes.ts` — returns `{ data: Todo[], meta: { count: N } }`
  - [x] 1.3 Write backend tests: `apps/api/__tests__/routes/trashRoutes.test.ts` — list returns trashed items, empty list when none, excludes active items, excludes items deleted >7 days ago

- [x] Task 2: Frontend — trash query hook and query keys (AC: 1, 2, 4)
  - [x] 2.1 Re-add `trashKeys` to `apps/web/src/lib/queryKeys.ts`: `trashKeys = { all: ['trash'] as const }`
  - [x] 2.2 Create `apps/web/src/hooks/useTrashTodos.ts` — `useQuery` calling `apiGet<ApiResponse<Todo[]>>('/trash')`, returns unwrapped `Todo[]` via `select: (res) => res.data`
  - [x] 2.3 Update `apps/web/src/hooks/useRestoreTodo.ts` — add `trashKeys.all` invalidation to `onSettled` alongside `todoKeys.all`
  - [x] 2.4 Add `TRASH_TTL_DAYS = 7` to `apps/web/src/constants.ts`
  - [x] 2.5 Write hook test: `apps/web/__tests__/hooks/useTrashTodos.test.ts` — fetches trash list, returns empty array when none

- [x] Task 3: TrashButton component (AC: 1, 2, 8)
  - [x] 3.1 Create `apps/web/src/components/TrashButton.tsx` — trash icon + "Trash" label + count badge; hidden when `count === 0`; receives `count: number` and `onClick: () => void` props
  - [x] 3.2 Accessible label: `aria-label="Trash, N items"` (dynamic count)
  - [x] 3.3 Visible focus ring using `focus-visible:ring-2 focus-visible:ring-accent`
  - [x] 3.4 Write component tests: `apps/web/__tests__/components/TrashButton.test.tsx` — renders with count, hidden when 0, calls onClick, accessible label, focusable

- [x] Task 4: TrashDialog component (AC: 3, 4, 5, 6, 7)
  - [x] 4.1 Install `@radix-ui/react-dialog` in `apps/web`
  - [x] 4.2 Create `apps/web/src/components/TrashDialog.tsx` using Radix Dialog primitives (`Dialog.Root`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Close`, `Dialog.Title`)
  - [x] 4.3 Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `trashedTodos: Todo[]`, `onRestore: (id: string) => void`
  - [x] 4.4 Each trashed item displays: task text, deletion date (formatted), days remaining until auto-purge, and a "Restore" button
  - [x] 4.5 Days remaining calculation: `TRASH_TTL_DAYS - daysSince(deletedAt)` — show as "N days left" or "Expires today"
  - [x] 4.6 `Dialog.Title` with `id` for `aria-labelledby` referencing "Trash" heading
  - [x] 4.7 Close button (X) using `Dialog.Close`
  - [x] 4.8 Overlay styling: semi-transparent background (`bg-black/50`)
  - [x] 4.9 Content styling: `bg-surface rounded-xl shadow-lg` centered, max-width 480px, scrollable list if many items
  - [x] 4.10 Write component tests: `apps/web/__tests__/components/TrashDialog.test.tsx` — renders items, restore button calls onRestore, close button works, empty list, accessible title, days remaining display

- [x] Task 5: Wire trash flow into App.tsx (AC: 1, 2, 3, 4, 5, 6)
  - [x] 5.1 Add `useTrashTodos` hook call in App.tsx
  - [x] 5.2 Add state: `const [trashOpen, setTrashOpen] = useState(false)`
  - [x] 5.3 Create `handleTrashRestore(id: string)` — calls `restoreTodo.mutate({ id })`, announces "Task restored" on success
  - [x] 5.4 Auto-close dialog when trash list becomes empty after restore (check in `onSuccess` or via `useEffect` on trash data length)
  - [x] 5.5 Render `<TrashButton>` after `</main>` closing tag (bottom of page), pass `count={trashTodos.length}` and `onClick={() => setTrashOpen(true)}`
  - [x] 5.6 Render `<TrashDialog>` with `open={trashOpen}`, `onOpenChange={setTrashOpen}`, `trashedTodos`, `onRestore={handleTrashRestore}`
  - [x] 5.7 Write integration tests in `apps/web/__tests__/components/App.test.tsx`: trash button shows with count, opens dialog, restore removes item from dialog, dialog closes when empty, trash button hides when no items

## Dev Notes

### Architecture Compliance

CRITICAL — Follow these patterns exactly (established in Stories 1.1-2.1):

- **Naming:** PascalCase for component files, camelCase for hooks/utils. camelCase for all variables, functions, props
- **Exports:** Named exports ONLY. No `export default`
- **Types:** Strict TypeScript. No `any`. Import `Todo`, `ApiResponse` from `@bmad/shared`
- **State:** React Query for all server state. `useQuery` for trash list, `useMutation` for restore. No Redux, no Context for server data
- **API Client:** Use existing `apiGet` from `apps/web/src/lib/apiClient.ts` for the trash list query. Use existing `useRestoreTodo` hook for restore (already calls `apiPatch`)
- **Query Keys:** Use `trashKeys.all` for trash queries, `todoKeys.all` for todo invalidation — both from `apps/web/src/lib/queryKeys.ts`
- **Announcements:** Reuse existing `announce()` helper in App.tsx (creates `{ text, key }` state for unique re-renders)
- **isPending guard:** Always guard mutation handlers with `if (mutation.isPending) return`
- **Mutation callbacks:** `onSuccess`/`onError` passed to `.mutate()` call, not `useMutation()` options (except `onSettled` for cache invalidation)

### Backend Patterns (from Stories 1.1, 2.1)

The backend uses Fastify + Drizzle ORM + SQLite:
- Services contain business logic, routes handle HTTP concerns
- Fastify JSON Schema validation on route params
- Error format: `{ error: "message", statusCode: 404 }`
- Success format (list): `{ data: Todo[], meta: { count: N } }` — see existing `GET /api/todos` for the pattern
- Success format (single item): `{ data: Todo }`
- `trashService.ts` already exists at `apps/api/src/services/trashService.ts` with `restoreTodo(id)` — ADD `listTrashedTodos()` to the same service
- `trashRoutes.ts` already exists at `apps/api/src/routes/trashRoutes.ts` with `PATCH /api/trash/:id/restore` — ADD `GET /api/trash` to the same file
- REUSE the existing `toTodo()` mapper in `trashService.ts` for row → `Todo` conversion
- REUSE the existing `UUID_PATTERN` and `uuidParamsSchema` constants in `trashRoutes.ts`

The GET /api/trash endpoint pattern:
```
GET /api/trash
→ trashService.listTrashedTodos()
→ SELECT * FROM todos WHERE deleted = 1 AND deletedAt >= (now - 7 days) ORDER BY deletedAt DESC
→ Returns { data: Todo[], meta: { count: N } }
→ Returns { data: [], meta: { count: 0 } } when empty
```

### Frontend Patterns (from Stories 1.1-2.1)

`useTodos()` returns unwrapped `Todo[]` via `select: (res) => res.data` — follow the same pattern for `useTrashTodos()`. Check the actual implementation at `apps/web/src/hooks/useTodos.ts` and mirror the `select` pattern.

Tailwind token double-prefix: `text-text-primary`, `text-text-secondary`, `bg-bg`, `bg-surface`.

Card component styling established in `TaskCard.tsx`:
- `bg-surface rounded-xl shadow-sm p-3`
- Flex layout with gap-3
- Date formatted with `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })`
- Delete button uses `min-h-12 min-w-12` for 48px touch target

For trashed items in the dialog, create a simplified variant with:
- Task text (no checkbox — trashed items are not toggleable)
- Deletion date (use `deletedAt` instead of `createdAt`)
- Days remaining until auto-purge
- "Restore" button (replaces delete button)

### Radix Dialog Integration Pattern

`@radix-ui/react-dialog` requires this structure:
```tsx
<Dialog.Root open={trashOpen} onOpenChange={setTrashOpen}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl shadow-lg p-6 w-[calc(100%-2rem)] max-w-[480px] max-h-[80vh] overflow-y-auto">
      <Dialog.Title className="text-lg font-semibold text-text-primary mb-4">Trash</Dialog.Title>
      {/* trashed items list */}
      <Dialog.Close asChild>
        <button aria-label="Close" className="absolute top-4 right-4 ...">X</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Key Radix Dialog behaviors:
- `Dialog.Portal` renders into `document.body` — no z-index conflicts
- Focus is automatically trapped within `Dialog.Content` when `modal={true}` (default)
- Escape closes the dialog automatically
- Clicking overlay closes the dialog (handled by Radix)
- `Dialog.Title` provides `aria-labelledby` automatically
- `[data-state="open"|"closed"]` attributes on Overlay and Content enable animations
- Do NOT use `Dialog.Trigger` here — the TrashButton is rendered separately and controls `open` state via `setTrashOpen(true)`

jsdom pointer capture stub: Radix Dialog also uses pointer events. The same stub from Story 2.1 tests may be needed:
```javascript
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});
```

### Days Remaining Calculation

```typescript
function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRASH_TTL_DAYS - elapsed);
}
```

Display rules:
- `> 1 day` → "N days left"
- `1 day` → "1 day left"
- `0 days` → "Expires today"

### Dialog Auto-Close on Empty

When the last trashed item is restored, the dialog should close automatically. Implementation options:
- **Preferred:** In the `handleTrashRestore` `onSuccess` callback, check if the restored item was the last one. However, since `invalidateQueries` triggers a refetch, the trash list updates asynchronously. Instead, use a `useEffect` watching `trashTodos.length`:
```typescript
useEffect(() => {
  if (trashOpen && trashTodos.length === 0) {
    setTrashOpen(false);
  }
}, [trashOpen, trashTodos.length]);
```

### Styling Guidelines

**TrashButton:**
- Position: bottom of page, after `</main>` content
- Layout: `flex items-center gap-2 px-4 py-3`
- Icon: trash SVG (match style of delete button icon in TaskCard)
- Label: "Trash" in `text-text-secondary text-sm`
- Badge: count in `bg-accent text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5`
- Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg`
- Hidden when count is 0 — do not render the button at all

**TrashDialog Overlay:**
- `fixed inset-0 bg-black/50 z-40`
- Animation: fade in/out (optional, respect `prefers-reduced-motion`)

**TrashDialog Content:**
- `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- `bg-surface rounded-xl shadow-lg p-6`
- `w-[calc(100%-2rem)] max-w-[480px]`
- `max-h-[80vh] overflow-y-auto`
- `z-50`

**Trashed Item Card (inside dialog):**
- Similar to TaskCard: `bg-bg rounded-xl p-3 flex items-center gap-3`
- No checkbox (items are not toggleable in trash)
- Task text: `text-text-primary text-[0.9375rem]`
- Deletion date + days remaining: `text-text-secondary text-xs`
- Restore button: `text-accent text-sm font-medium underline hover:text-accent/80 min-h-12 px-4`

### Testing Patterns (from Stories 1.1-2.1)

- Frontend tests: `@testing-library/react` + Vitest, `vi.spyOn(globalThis, 'fetch')` for mocking
- Backend tests: Fastify `inject()` method, in-memory SQLite (see existing `trashRoutes.test.ts` for setup pattern)
- Hook tests: `staleTime: Infinity`, `gcTime: Infinity` in QueryClient, `createElement` wrapper (no JSX in `.ts` files)
- App integration tests: `renderWithProviders()` with fresh QueryClient (`retry: false, gcTime: 0`)
- Use accessible name selectors: `getByRole('button', { name: /restore/i })` not positional indexes
- All assertions unconditional (no `if` guards)
- Test error announcements separately from success paths
- jsdom stub for `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture` needed for Radix components

**Backend test for 7-day filter:** To test that items older than 7 days are excluded from `GET /api/trash`, you need to insert a todo with a `deletedAt` in the past. Since `trashService.restoreTodo` sets `deletedAt` to null, you'll need to directly insert a row with a specific `deletedAt` value via the db object in the test.

Files NOT to modify:
```
apps/web/src/components/TaskCard.tsx               # DO NOT MODIFY
apps/web/src/components/EmptyState.tsx             # DO NOT MODIFY
apps/web/src/components/InputCard.tsx              # DO NOT MODIFY
apps/web/src/components/LoadingState.tsx           # DO NOT MODIFY
apps/web/src/components/ErrorState.tsx             # DO NOT MODIFY
apps/web/src/components/SectionHeader.tsx          # DO NOT MODIFY
apps/web/src/hooks/useTodos.ts                    # DO NOT MODIFY
apps/web/src/hooks/useDeleteTodo.ts               # DO NOT MODIFY
apps/web/src/hooks/useCreateTodo.ts               # DO NOT MODIFY
apps/web/src/hooks/useToggleTodo.ts               # DO NOT MODIFY
apps/web/src/components/UndoToast.tsx              # DO NOT MODIFY
```

### Previous Story Intelligence (Stories 1.1-2.1)

**Key learnings to apply:**
- `useTodos()` returns unwrapped `Todo[]` via `select: (res) => res.data`, NOT `ApiResponse<Todo[]>` — follow the same pattern for `useTrashTodos()`
- Tailwind token double-prefix: `text-text-primary`, `text-text-secondary`, `bg-bg`, `bg-surface`
- Tests mock `globalThis.fetch` with `vi.spyOn` — see patterns in existing test files
- `announce()` helper in App.tsx uses `{ text, key }` state object with incrementing key
- All assertions must be unconditional (no `if` guards — Story 1.5 review fix)
- Use accessible name selectors in tests, not positional indexes (Story 1.5 review fix)
- Always test error announcements separately (Story 1.5 review fix)
- `isPending` guard on all mutation handlers (Story 1.4 review fix)
- Mutation callbacks (`onSuccess`/`onError`) passed to `.mutate()` call, not `useMutation()` options
- Backend route tests use Fastify `inject()` — no HTTP server needed
- `apiGet` and `apiPatch` already exist in `apiClient.ts` — do NOT create new fetch wrappers
- Mobile breakpoint: use `md:` (768px) not `sm:` (640px) for mobile-responsive conditions (Story 2.1 review fix)
- `key` prop on Radix controlled components to force remount when data changes (Story 2.1 review fix)
- JSON Schema on Fastify handles UUID validation — do not duplicate with manual `isValidUuid` (Story 2.1 review fix)
- `trashKeys` was removed from `queryKeys.ts` during 2.1 review because it was unused — it needs to be re-added now for the trash query
- `useRestoreTodo` currently only invalidates `todoKeys.all` — it must also invalidate `trashKeys.all` so the trash list updates after restore

### References

- [Source: planning-artifacts/epics.md#Epic 2, Story 2.2] — Acceptance criteria, BDD scenarios
- [Source: planning-artifacts/architecture.md#Frontend Architecture] — React Query, Radix Dialog, component organization
- [Source: planning-artifacts/architecture.md#Route Structure] — GET /api/trash, PATCH /api/trash/:id/restore endpoint contracts
- [Source: planning-artifacts/architecture.md#Database Schema] — soft-delete columns, trash queries, 7-day filter
- [Source: planning-artifacts/architecture.md#State Update Patterns] — React Query key factory, trash keys
- [Source: planning-artifacts/architecture.md#Constants] — TRASH_TTL_DAYS, constants file location
- [Source: planning-artifacts/ux-design-specification.md#Component Strategy] — TrashButton anatomy, TrashDialog anatomy, states
- [Source: planning-artifacts/ux-design-specification.md#Experience Mechanics] — Task Deletion flow, trash bin access
- [Source: planning-artifacts/ux-design-specification.md#Accessibility] — aria-labelledby, focus trap, keyboard navigation, focus rings
- [Source: planning-artifacts/ux-design-specification.md#Responsive] — Full-width toast on mobile <768px, section stacking layout
- [Source: implementation-artifacts/2-1-undo-toast-on-deletion.md] — Restore mutation, trashService, trashRoutes, review fixes

### Review Findings

- [x] [Review][Decision] Shared `restoreTodo` mutation blocks undo and trash restore simultaneously — FIXED: split into `undoRestore` and `trashRestore` instances [apps/web/src/App.tsx]
- [x] [Review][Decision] `restoreTodo` allows restoring expired (>7d) items via direct API call — FIXED: added TTL check to `restoreTodo` [apps/api/src/services/trashService.ts]
- [x] [Review][Patch] Focus does not return to TrashButton after dialog close — FIXED: added forwardRef to TrashButton, ref + focus restoration in App.tsx [apps/web/src/components/TrashButton.tsx, apps/web/src/App.tsx]
- [x] [Review][Patch] Missing `additionalProperties: false` on trash UUID schema — FIXED [apps/api/src/routes/trashRoutes.ts]
- [x] [Review][Defer] Duplicate SQLite connections per route module — pre-existing from Story 1.1; each route module calls `createDatabase()` independently
- [x] [Review][Defer] Auto-close effect fires before restore feedback — dialog snaps closed before user processes the "Task restored" announcement [apps/web/src/App.tsx:119-123]
- [x] [Review][Defer] Rapid delete-then-delete overwrites `pendingUndo` silently — only most recent deletion is undoable [apps/web/src/App.tsx:64-81]
- [x] [Review][Defer] `daysRemaining` client/server off-by-one at day boundary — floor division vs ISO string comparison can disagree by 1 day
- [x] [Review][Defer] No permanent purge mechanism — soft-deleted items accumulate in DB forever
- [x] [Review][Defer] `useTrashTodos` fetches with default staleTime(0) — unnecessary requests on every focus/mount
- [x] [Review][Defer] `formatDate` missing year at Dec/Jan boundary — "Dec 31" without year context
- [x] [Review][Defer] No optimistic update on trash restore — user sees no immediate visual feedback

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Radix Dialog emits a console warning when `Description` or `aria-describedby` is not provided — fixed by passing `aria-describedby={undefined}` to `Dialog.Content`
- Ordering test for `GET /api/trash` initially failed due to same-millisecond timestamps on sequential deletes — fixed by backdating one item in the test
- Existing App tests used a simple `mockFetchWithTodos` that returned one response for all fetches — updated to route-aware mock that distinguishes `/api/todos` from `/api/trash`

### Completion Notes List

- All 5 tasks completed with 111 passing frontend tests + 28 passing API tests (139 total, 0 regressions)
- Backend: `listTrashedTodos()` filters by `deleted=true AND deletedAt >= (now - 7 days)`, ordered by `deletedAt DESC`; `GET /api/trash` returns `{ data: Todo[], meta: { count: N } }`
- Frontend: `useTrashTodos` hook with `trashKeys.all` query key; `useRestoreTodo` now invalidates both `todoKeys.all` and `trashKeys.all`
- `TrashButton` component: trash icon + "Trash" label + count badge; hidden when count is 0; accessible label with dynamic count; visible focus ring
- `TrashDialog` component: Radix Dialog modal with overlay, header, item list (text, deletion date, days remaining, restore button), close button; auto-close on empty; `aria-describedby={undefined}` to suppress Radix warning
- App.tsx: `useTrashTodos` for trash data, `trashOpen` state, `handleTrashRestore` with isPending guard, auto-close effect, TrashButton + TrashDialog rendered
- Named exports only, no `any` types, strict TypeScript throughout

### File List

- apps/web/src/constants.ts (modified — added TRASH_TTL_DAYS)
- apps/web/src/lib/queryKeys.ts (modified — re-added trashKeys)
- apps/api/src/services/trashService.ts (modified — added listTrashedTodos with 7-day filter)
- apps/api/src/routes/trashRoutes.ts (modified — added GET /api/trash route)
- apps/api/__tests__/routes/trashRoutes.test.ts (modified — added 5 GET /api/trash tests)
- apps/web/src/hooks/useTrashTodos.ts (new)
- apps/web/__tests__/hooks/useTrashTodos.test.ts (new — 2 tests)
- apps/web/src/hooks/useRestoreTodo.ts (modified — added trashKeys.all invalidation)
- apps/web/src/components/TrashButton.tsx (new)
- apps/web/__tests__/components/TrashButton.test.tsx (new — 6 tests)
- apps/web/src/components/TrashDialog.tsx (new)
- apps/web/__tests__/components/TrashDialog.test.tsx (new — 9 tests)
- apps/web/src/App.tsx (modified — wired trash flow with TrashButton, TrashDialog, useTrashTodos, auto-close)
- apps/web/__tests__/components/App.test.tsx (modified — 4 new trash integration tests, updated fetch mock)
- apps/web/package.json (modified — @radix-ui/react-dialog dependency)
- pnpm-lock.yaml (modified — lockfile update)

### Change Log

- 2026-04-09: Story created by create-story workflow — comprehensive developer guide with full context
- 2026-04-09: Implementation of Story 2.2 - Trash Bin View and Restore
