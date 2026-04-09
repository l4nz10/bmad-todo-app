# Story 1.6: Loading and Error States

Status: done

## Story

As a user,
I want clear feedback when the app is loading or when something goes wrong,
So that I always understand the current state and can take action if needed.

## Acceptance Criteria

1. **Given** the app is opened and no cached data exists **When** the initial API fetch is in progress **Then** a LoadingState component displays skeleton cards in the list area **And** the InputCard is visible and functional (user can type while loading)
2. **Given** the initial API fetch fails and no cached data exists **When** the error state is triggered **Then** an ErrorState component displays "Couldn't load your tasks" with a "Retry" button **And** clicking "Retry" re-triggers the API fetch
3. **Given** the API fetch succeeds after a retry **When** data is returned **Then** the ErrorState is replaced by the task list **And** the transition is smooth with no layout shift
4. **Given** the user has `prefers-reduced-motion` enabled **When** loading or error states are displayed **Then** no pulse/shimmer animations play on skeleton cards
5. **Given** a screen reader is active **When** the loading state is displayed **Then** an accessible announcement conveys the loading status **And** when loading completes or errors, the new state is announced

## Tasks / Subtasks

- [x] Task 1: Create `LoadingState` component with skeleton cards (AC: 1, 4, 5)
  - [x] 1.1 Create `apps/web/src/components/LoadingState.tsx` — renders 3 skeleton card placeholders that mirror `TaskCard` dimensions (white card, `rounded-xl`, `shadow-sm`, internal bars for checkbox/text/timestamp). Use Tailwind `animate-pulse` on skeleton bars. Include `aria-busy="true"` and `role="status"` with visually hidden "Loading tasks..." text.
  - [x] 1.2 Extend `prefers-reduced-motion` in `globals.css` — disable `animate-pulse` when reduced motion is preferred (skeleton cards render as static gray blocks).
  - [x] 1.3 Create `apps/web/__tests__/components/LoadingState.test.tsx` — test skeleton renders 3 cards, has `aria-busy="true"`, has `role="status"`, has accessible "Loading tasks..." text.
- [x] Task 2: Create `ErrorState` component with retry (AC: 2, 3, 5)
  - [x] 2.1 Create `apps/web/src/components/ErrorState.tsx` — renders "Couldn't load your tasks" (`text-text-primary`) with a "Retry" button (`text-accent`, underline or button style, min 48px touch target). Accepts `onRetry: () => void` prop. Include `role="alert"` for screen reader announcement on mount.
  - [x] 2.2 Create `apps/web/__tests__/components/ErrorState.test.tsx` — test renders message text, renders retry button, calls `onRetry` on click, has `role="alert"`.
- [x] Task 3: Wire loading and error states into App.tsx (AC: 1, 2, 3, 5)
  - [x] 3.1 Destructure `isLoading`, `isError`, `error`, `refetch` from `useTodos()` (currently only `data` is destructured).
  - [x] 3.2 Add conditional rendering: if `isLoading` show `<LoadingState />` in list area (InputCard remains above). If `isError` show `<ErrorState onRetry={refetch} />` in list area (InputCard remains above). Otherwise render existing todo lists.
  - [x] 3.3 Add screen reader announcements: announce "Tasks loaded" on successful initial fetch (transition from loading to data). Announce "Couldn't load your tasks" on error.
  - [x] 3.4 Update `apps/web/__tests__/components/App.test.tsx` — add tests: loading state shown while fetch is pending (use never-resolving fetch mock); error state shown when fetch fails (500 mock); retry button triggers refetch; successful retry replaces error with task list; InputCard is visible during both loading and error states.

## Dev Notes

### Architecture Compliance

**CRITICAL — Follow these patterns exactly (established in Stories 1.1-1.5):**

- **Naming:** PascalCase for component files, camelCase for hooks/utils. camelCase for all variables, functions, props
- **Exports:** Named exports ONLY. No `export default`
- **Types:** Strict TypeScript. No `any`. Import types from `@bmad/shared` where applicable
- **State:** React Query for all server state. No Redux, no Context for server data
- **Tailwind token double-prefix:** `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-bg`, `bg-surface`, `ring-accent`, `text-accent`, `text-danger`, `border-border`
- **No animation libraries** — CSS transitions, Tailwind utilities, and `@starting-style` only
- **No barrel `index.ts`** — direct imports only
- **No `console.log`** — remove before commit

### React Query Loading State Model

React Query provides distinct states — use them consistently:
- `isLoading` — initial load (no cached data yet). Show `<LoadingState />` skeleton cards
- `isFetching` — background refetch (cached data visible). No visible loading indicator
- `isMutating` — mutation in progress. No visible indicator (optimistic update already showing)

The `useTodos` hook currently returns the full `useQuery` result. In `App.tsx`, only `data` is destructured. Story 1.6 must also destructure `isLoading`, `isError`, `error`, and `refetch`.

### Backend API (Already Complete — Do NOT Modify)

```
GET /api/todos
Success: { data: Todo[], meta: { count: N } }
Error: { error: "message", statusCode: N }
```

The `apiGet` in `apiClient.ts` throws `new Error(message)` on non-ok responses. React Query captures this as the `error` field. The QueryClient in `main.tsx` is configured with `retry: 1` (one automatic retry on failure).

### LoadingState Component Spec

Render 3 skeleton cards that match `TaskCard` dimensions:
- Each skeleton: white card (`bg-surface rounded-xl shadow-sm`) with internal gray bars (`bg-gray-200 rounded animate-pulse`)
- Bars mimic TaskCard layout: small circle (checkbox area) + long bar (text) + short bar (timestamp)
- Fixed height to prevent layout shift when real data loads
- `aria-busy="true"` on the container, `role="status"`, visually hidden text "Loading tasks..."
- Respect `prefers-reduced-motion`: disable `animate-pulse` (static gray blocks instead)

### ErrorState Component Spec

- Message: "Couldn't load your tasks" in `text-text-primary`
- Retry button: "Retry" — styled as a text button with `text-accent` and underline, or as a contained button. Min touch target 48px height.
- Props: `onRetry: () => void`
- Use `role="alert"` (assertive announcement on mount — appropriate for error states)
- Follow `EmptyState` visual pattern: centered content in the list area

### App.tsx Wiring Pattern

```typescript
const { data: todos, isLoading, isError, refetch } = useTodos();
```

Conditional render order:
1. InputCard always renders (user can type while loading — AC1)
2. If `isLoading` → render `<LoadingState />`
3. If `isError` → render `<ErrorState onRetry={refetch} />`
4. Otherwise → render existing active/completed sections

For announcements on initial load success, use a `useEffect` that watches for the transition from loading to data available. Use the existing `announce()` helper.

### Existing Files to Reuse (Do NOT Recreate)

| File | What it provides |
|------|-----------------|
| `apps/web/src/components/EmptyState.tsx` | Visual pattern reference for centered state messages |
| `apps/web/src/hooks/useTodos.ts` | Returns `useQuery` result with `isLoading`, `isError`, `error`, `refetch` |
| `apps/web/src/lib/apiClient.ts` | `apiGet` throws on error — React Query captures it |
| `apps/web/src/App.tsx` | Already has `announce()` helper, `aria-live` region |
| `apps/web/src/globals.css` | Design tokens, `prefers-reduced-motion` media query |

### Anti-Patterns to Avoid

- Do NOT modify `TaskCard.tsx` — it is complete
- Do NOT modify backend routes or services — backend is complete from Story 1.1
- Do NOT implement undo toast — that is Story 2.1
- Do NOT implement trash bin — that is Story 2.2
- Do NOT implement NetworkBar or offline handling — that is Epic 4
- Do NOT implement localStorage caching — that is Epic 4 (AC2 about cached data from epics is out of scope for this story since no cache layer exists yet; focus on the no-cache paths: loading skeleton and error+retry)
- Do NOT use `export default`, `any` type, barrel `index.ts`, or `console.log`
- Do NOT create a `constants.ts` file for this story — no magic numbers needed
- Do NOT guard test assertions conditionally (`if (cached)`) — all assertions must be unconditional (Story 1.5 review fix)
- Do NOT use positional selectors in tests (`getAllByRole[0]`) — use accessible name selectors (Story 1.5 review fix)

### Project Structure Notes

Files to create:
```
apps/web/src/components/LoadingState.tsx           # NEW
apps/web/src/components/ErrorState.tsx              # NEW
apps/web/__tests__/components/LoadingState.test.tsx  # NEW
apps/web/__tests__/components/ErrorState.test.tsx    # NEW
```

Files to modify:
```
apps/web/src/App.tsx                               # MODIFY — wire isLoading/isError/refetch, conditional rendering
apps/web/src/globals.css                           # MODIFY — extend prefers-reduced-motion for animate-pulse
apps/web/__tests__/components/App.test.tsx          # MODIFY — add loading/error state integration tests
```

Files NOT to modify:
```
apps/web/src/components/TaskCard.tsx               # DO NOT MODIFY
apps/web/src/components/EmptyState.tsx             # DO NOT MODIFY
apps/web/src/components/InputCard.tsx              # DO NOT MODIFY
apps/web/src/hooks/useTodos.ts                    # DO NOT MODIFY — already returns full useQuery result
apps/api/**                                       # DO NOT MODIFY — backend complete
```

### Previous Story Intelligence (Stories 1.1-1.5)

**Key learnings to apply:**
- `useTodos()` returns unwrapped `Todo[]` via `response.data`, NOT `ApiResponse<Todo[]>` — but `isLoading`/`isError` come from the `useQuery` wrapper, not the data shape
- Tailwind token double-prefix: `text-text-primary`, `text-text-secondary`, `bg-bg`, `bg-surface`
- `@starting-style` for entry animations, `prefers-reduced-motion` media query always alongside
- Tests mock `globalThis.fetch` with `vi.spyOn` — see patterns in existing test files
- `announce()` helper in App.tsx uses `{ text, key }` state object with incrementing key
- Component tests follow `EmptyState.test.tsx` pattern: render, assert text, assert roles
- App integration tests use `renderWithProviders()` with a fresh QueryClient (`retry: false, gcTime: 0`)
- For loading state tests: mock fetch with a never-resolving Promise (`new Promise(() => {})`) to keep `isLoading` true
- For error state tests: mock fetch returning 500 status
- All assertions must be unconditional (no `if` guards — Story 1.5 review fix)
- Use accessible name selectors in tests, not positional indexes (Story 1.5 review fix)
- Always test error announcements separately — simulate failure and assert aria-live text (Story 1.5 review fix)

### References

- [Source: planning-artifacts/epics.md#Story 1.6] — Acceptance criteria
- [Source: planning-artifacts/architecture.md#Frontend Architecture] — React Query, component architecture
- [Source: planning-artifacts/architecture.md#Process Patterns] — Loading state patterns (isLoading/isFetching/isMutating)
- [Source: planning-artifacts/architecture.md#Error Handling] — Frontend error handling patterns
- [Source: planning-artifacts/ux-design-specification.md#State Patterns] — Loading/error state visual design
- [Source: planning-artifacts/ux-design-specification.md#Feedback Patterns] — State feedback hierarchy
- [Source: planning-artifacts/ux-design-specification.md#Accessibility] — aria-live, aria-busy, role patterns
- [Source: implementation-artifacts/1-5-delete-tasks-with-inline-removal.md] — Previous story patterns and review fixes
- [Source: implementation-artifacts/1-4-complete-reactivate-and-view-completed-tasks.md] — Mutation handler patterns, announce() helper

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `isLoading` from `useTodos()` correctly reflects React Query's initial load state (no cached data)
- Two `role="status"` elements exist in the DOM (LoadingState + sr-only announcement region) — tests use `aria-busy` attribute to disambiguate
- Error announcement text duplicated between `ErrorState` component (`role="alert"`) and `aria-live` region — tests use `getByRole('alert').toHaveTextContent()` to target the component specifically
- Existing "shows empty state when no todos are loaded" test needed `async/await waitFor` since empty state now appears after fetch resolves (not synchronously)

### Completion Notes List

- All 3 tasks completed with 76 passing frontend tests + 18 passing API tests (94 total, 0 regressions)
- LoadingState component: 3 skeleton cards with `animate-pulse`, `aria-busy="true"`, `role="status"`, sr-only "Loading tasks..." text
- ErrorState component: "Couldn't load your tasks" message with "Retry" button (`text-accent`, min 48px touch target), `role="alert"`, accepts `onRetry` prop
- App.tsx: destructures `isLoading`, `isError`, `refetch` from `useTodos()`; conditional render (loading → error → content); `wasLoadingRef` tracks load-to-data transition for "Tasks loaded" / error announcements
- CSS: `prefers-reduced-motion` extended to disable `animate-pulse`
- Named exports only, no `any` types, no `console.log`, strict TypeScript

### File List

- apps/web/src/components/LoadingState.tsx (new)
- apps/web/src/components/ErrorState.tsx (new)
- apps/web/__tests__/components/LoadingState.test.tsx (new)
- apps/web/__tests__/components/ErrorState.test.tsx (new)
- apps/web/src/App.tsx (modified — isLoading/isError/refetch wiring, conditional rendering, load completion announcements)
- apps/web/src/globals.css (modified — prefers-reduced-motion extended for animate-pulse)
- apps/web/__tests__/components/App.test.tsx (modified — 5 new loading/error state tests, 1 existing test updated to async)

### Review Findings

- [x] [Review][Dismissed] No loading indicator during retry — false positive; React Query resets to loading state on refetch, LoadingState shows correctly during retry
- [x] [Review][Patch][Fixed] Missing test: "Tasks loaded" screen reader announcement — added test asserting aria-live text after successful fetch
- [x] [Review][Patch][Fixed] Missing test: error announcement via aria-live region — added test asserting aria-live text after failed fetch
- [x] [Review][Patch][Fixed] Missing test: retry failure re-shows error state — added test for retry→failure→error path

### Change Log

- 2026-04-09: Story created by create-story workflow — comprehensive developer guide with full context
- 2026-04-09: Implementation of Story 1.6 - Loading and Error States
- 2026-04-09: Code review — 1 decision-needed (dismissed as false positive), 3 patches fixed, 12 dismissed
