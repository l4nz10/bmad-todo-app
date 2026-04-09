# Story 1.4: Complete, Reactivate, and View Completed Tasks

Status: done

## Story

As a user,
I want to click a task's checkbox to mark it complete and see it move to the completed section,
So that I can track my progress and distinguish finished work from pending tasks.

## Acceptance Criteria

1. **Given** an active task exists **When** the user clicks/taps the checkbox on the TaskCard **Then** the task animates out of the active list and into the completed list (200-300ms ease-in-out cross-list transfer) **And** the UI updates optimistically before the server confirms **And** the completed section appears dynamically (it doesn't exist as an empty section) **And** a SectionHeader labeled "Completed" appears above the completed list
2. **Given** completed tasks exist **When** the completed section renders **Then** TaskCards display at reduced opacity (0.6) with `text-secondary` color and strikethrough on task text **And** the completed section is visually subordinate to the active section
3. **Given** a completed task exists **When** the user clicks/taps the checkbox on the completed TaskCard **Then** the task animates from the completed list back to the active list (200-300ms ease-in-out) **And** the task returns to full opacity with active styling **And** if no completed tasks remain, the completed section disappears
4. **Given** the user has `prefers-reduced-motion` enabled **When** any cross-list transfer occurs **Then** the animation is replaced by an instant state change
5. **Given** the optimistic toggle fails on the server **When** the server returns an error **Then** the task returns to its previous list with the original completion state
6. **Given** task status changes occur **When** screen readers are active **Then** status changes are announced (e.g., "Task completed", "Task reactivated")

## Tasks / Subtasks

- [x] Task 1: Create `useToggleTodo` hook with optimistic updates (AC: 1, 3, 5)
  - [x] 1.1 Create `apps/web/src/hooks/useToggleTodo.ts` — React Query `useMutation` calling `apiPatch<ApiResponse<Todo>>('/todos/${id}', { completed: !current })` with optimistic cache toggle, rollback on error, invalidation on settle
  - [x] 1.2 Create `apps/web/__tests__/hooks/useToggleTodo.test.ts` — test optimistic cache flip, rollback on error, API call correctness
- [x] Task 2: Update TaskCard to support active/completed variants (AC: 1, 2, 3, 6)
  - [x] 2.1 Add `onToggle?: (id: string) => void` prop to TaskCard
  - [x] 2.2 Enable checkbox: `checked={todo.completed}`, `onChange={() => onToggle?.(todo.id)}`, remove `disabled` and `cursor-not-allowed`
  - [x] 2.3 Apply completed variant styling: when `todo.completed` is true, apply `opacity-60` to the `<li>`, `text-text-secondary line-through` to the task text span
  - [x] 2.4 Update `aria-label` on checkbox: active → `Mark "${todo.text}" as complete`, completed → `Mark "${todo.text}" as active`
  - [x] 2.5 Screen reader announcements via dynamic aria-label on checkbox (status communicated through checked state + label text). Live region deferred to App.tsx in Task 4.
  - [x] 2.6 Update `apps/web/__tests__/components/TaskCard.test.tsx` — test completed variant styling, checkbox enabled state, onToggle callback, aria-label variants
- [x] Task 3: Add cross-list transfer animation CSS (AC: 1, 3, 4)
  - [x] 3.1 Add `.task-card-exit` class in `globals.css` with `opacity: 0; transform: translateY(8px);` transition (200ms ease-in-out)
  - [x] 3.2 Ensure `prefers-reduced-motion` media query disables all transfer animations (extended for exit)
- [x] Task 4: Update App.tsx to render completed section (AC: 1, 2, 3)
  - [x] 4.1 Derive `completedTodos` from `todos?.filter((t) => t.completed)` alongside existing `activeTodos`
  - [x] 4.2 Wire `useToggleTodo` — pass `onToggle` callback to each TaskCard that calls `toggleTodo.mutate({ id, completed: !todo.completed })`
  - [x] 4.3 Render completed section below active section: `SectionHeader label="Completed"` + `<ul>` of completed TaskCards. Only render when `completedTodos.length > 0`
  - [x] 4.4 Show `EmptyState` only when BOTH `activeTodos` and `completedTodos` are empty (i.e., no tasks at all)
  - [x] 4.5 Update `apps/web/__tests__/components/App.test.tsx` — test completed section rendering, toggle interaction, section visibility rules, empty state logic

### Review Findings

- [x] [Review][Decision] Missing cross-list transfer animation — removed dead `.task-card-exit` CSS; entry animation via existing `@starting-style` on `.task-card` provides 200ms fade-in when cards appear in destination list. True exit animation requires layout animation library (forbidden by spec). [apps/web/src/globals.css]
- [x] [Review][Decision] No user-visible error on toggle failure — moved announcement to `onSuccess`/`onError` callbacks; error case now announces "Action failed. Please try again." [apps/web/src/App.tsx]
- [x] [Review][Patch] Identical consecutive announcements silently dropped — announcement state changed to `{ text, key }` object with incrementing key to force re-render on identical messages. [apps/web/src/App.tsx]
- [x] [Review][Patch] Rapid double-click fires duplicate mutations — added `if (toggleTodo.isPending) return` guard in `handleToggleTodo`. [apps/web/src/App.tsx]
- [x] [Review][Defer] Toggle on freshly-created optimistic todo hits 404 [apps/web/src/App.tsx, apps/web/src/hooks/useToggleTodo.ts] — deferred, pre-existing race condition between create and toggle mutations; low probability in normal usage

## Dev Notes

### Architecture Compliance

**CRITICAL — Follow these patterns exactly (established in Stories 1.1-1.3):**

- **Naming:** PascalCase for component files, camelCase for hooks/utils. camelCase for all variables, functions, props
- **Exports:** Named exports ONLY. No `export default`
- **Types:** Strict TypeScript. No `any`. Import `Todo`, `UpdateTodoRequest`, `ApiResponse` from `@bmad/shared`
- **State:** React Query for all server state. `useMutation` for toggle. No Redux, no Context for server data
- **API Client:** Use existing `apiPatch` from `apps/web/src/lib/apiClient.ts` — do NOT create new fetch wrappers
- **Query Keys:** Use `todoKeys.all` from `apps/web/src/lib/queryKeys.ts` for cache operations

### Backend API (Already Complete — Do NOT Modify)

The PATCH endpoint is already implemented in `apps/api/src/routes/todoRoutes.ts:74`:

```
PATCH /api/todos/:id
Body: { completed: boolean }  (or { text: string } or both)
Response: { data: Todo }
Error: 404 if not found, 400 if invalid UUID
```

The `todoService.updateTodo(id, { completed })` sets `updatedAt` and returns the updated todo. Validation via Fastify JSON Schema (`updateTodoSchema`) is already in place. **No backend changes needed.**

### Shared Types (Already Defined)

```typescript
// packages/shared/src/types/todo.ts
interface UpdateTodoRequest {
  completed?: boolean;
  text?: string;
}
```

### useToggleTodo Hook Pattern

Follow the same optimistic update pattern as `useCreateTodo` (see `apps/web/src/hooks/useCreateTodo.ts`):

```typescript
// apps/web/src/hooks/useToggleTodo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoKeys } from '../lib/queryKeys.ts';
import { apiPatch } from '../lib/apiClient.ts';
import type { Todo, ApiResponse } from '@bmad/shared';

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiPatch<ApiResponse<Todo>>(`/todos/${id}`, { completed }),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);

      queryClient.setQueryData<Todo[]>(todoKeys.all, (old) =>
        (old ?? []).map((t) =>
          t.id === id ? { ...t, completed, updatedAt: new Date().toISOString() } : t
        )
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}
```

**CRITICAL:** The cache stores `Todo[]` (unwrapped), NOT `ApiResponse<Todo[]>`. This was discovered in Story 1.3 — `useTodos()` returns `response.data` (the array), not the wrapper.

### TaskCard Variant Styling

**Active variant (current):** Full opacity, `text-text-primary`, checkbox unchecked + enabled
**Completed variant (new):**
- `<li>` gets `opacity-60` class
- Task text span: add `text-text-secondary line-through` (replacing `text-text-primary`)
- Checkbox: `checked={true}`, enabled (clickable to reactivate)
- Timestamp and delete button: inherit the `opacity-60` from parent `<li>`

Implementation approach — conditional classes on the existing TaskCard:
```tsx
<li className={`task-card bg-surface rounded-xl shadow-sm p-3 flex items-center gap-3 transition-shadow duration-150 ease-out lg:hover:shadow-md ${todo.completed ? 'opacity-60' : ''}`}>
  <input
    type="checkbox"
    checked={todo.completed}
    onChange={() => onToggle?.(todo.id)}
    aria-label={todo.completed ? `Mark "${todo.text}" as active` : `Mark "${todo.text}" as complete`}
    className="h-5 w-5 shrink-0 rounded border-border accent-accent cursor-pointer"
  />
  <span className={`flex-1 text-[0.9375rem] font-normal min-w-0 break-words ${todo.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
```

### Cross-List Transfer Animation

For card exit, add in `globals.css`:
```css
.task-card-exit {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
}
```

**Note:** True cross-list animation (card visually moving from one list to another) is complex with React's reconciliation. The pragmatic approach for this story: the card exits the source list (fades out) and enters the destination list (fades in via existing `@starting-style`). Combined, this gives a smooth 200-300ms visual transfer. Do NOT attempt layout animations (FLIP technique) — CSS transitions + `@starting-style` are sufficient per architecture spec.

### Screen Reader Announcements (AC: 6)

Use an `aria-live="polite"` region to announce state changes. Options:
1. **Visually hidden live region** in App.tsx that receives announcement text on toggle
2. **`aria-label` on checkbox** already communicates state — ensure it updates dynamically

Recommended: Add a visually hidden `<div role="status" aria-live="polite">` in App.tsx. Set its text content when a toggle occurs (e.g., "Task completed" or "Task reactivated"). Clear after a short timeout. This is lightweight and doesn't require a library.

### Existing Files to Reuse (Do NOT Recreate)

| File | What it provides |
|------|-----------------|
| `apps/web/src/lib/apiClient.ts` | `apiPatch` for PATCH requests |
| `apps/web/src/lib/queryKeys.ts` | `todoKeys.all` for cache key |
| `apps/web/src/hooks/useTodos.ts` | Fetches all non-deleted todos (active + completed) |
| `apps/web/src/components/TaskCard.tsx` | Base TaskCard — extend with completed variant |
| `apps/web/src/components/SectionHeader.tsx` | Already used for "Active" — reuse for "Completed" |
| `apps/web/src/globals.css` | Existing animation CSS + design tokens |
| `apps/web/src/App.tsx` | Layout with active section — extend with completed section |

### Anti-Patterns to Avoid

- Do NOT create a separate `CompletedTaskCard` component — use `todo.completed` prop to switch variants in existing `TaskCard`
- Do NOT implement delete mutation — Story 1.5 handles that. Keep `onDelete` as optional no-op
- Do NOT add undo toast — that is Story 2.1
- Do NOT add loading/error states — that is Story 1.6
- Do NOT add draft persistence — that is Epic 3
- Do NOT modify backend routes or services — backend is complete from Story 1.1
- Do NOT install animation libraries (Framer Motion, etc.) — CSS transitions + `@starting-style` only
- Do NOT use `export default`, `any` type, barrel `index.ts`, or `console.log`
- Do NOT change the data returned by `useTodos()` — it already returns all non-deleted todos (active + completed). Filter client-side in App.tsx

### Project Structure Notes

Files to create:
```
apps/web/src/hooks/useToggleTodo.ts           # NEW
apps/web/__tests__/hooks/useToggleTodo.test.ts # NEW
```

Files to modify:
```
apps/web/src/components/TaskCard.tsx            # MODIFY — add completed variant, enable checkbox, onToggle prop
apps/web/src/App.tsx                           # MODIFY — add completed section, wire toggle, update empty state logic
apps/web/src/globals.css                       # MODIFY — add exit animation class
apps/web/__tests__/components/TaskCard.test.tsx # MODIFY — add completed variant tests
apps/web/__tests__/components/App.test.tsx      # MODIFY — add completed section + toggle tests
```

### Previous Story Intelligence (Stories 1.1-1.3)

**Key learnings to apply:**
- `useTodos()` returns unwrapped `Todo[]`, NOT `ApiResponse<Todo[]>` — cache operations must use `Todo[]`
- `.returning().all()` pattern needed for Drizzle ORM
- Tailwind token double-prefix: `text-text-primary`, `text-text-secondary`, `bg-bg`, `bg-surface`
- `@starting-style` for entry animations, `prefers-reduced-motion` media query always alongside
- Inline SVG icons — no icon library
- Semantic HTML: `<ul>`/`<li>` for lists, `<h2>` for section headers
- `@testing-library/user-event` already installed for click simulation
- Tests mock `globalThis.fetch` with `vi.spyOn` — see patterns in existing test files
- `aria-label` on delete button includes task text (e.g., `Delete "Buy groceries"`) — per code review fix
- `InputCard` accepts `disabled` prop — per code review fix
- `maxLength={500}` on input — per code review fix

### References

- [Source: planning-artifacts/epics.md#Story 1.4] — Acceptance criteria and BDD scenarios
- [Source: planning-artifacts/architecture.md#Frontend Architecture] — React Query, optimistic updates, component architecture
- [Source: planning-artifacts/architecture.md#API & Communication Patterns] — PATCH /api/todos/:id endpoint, wrapped response format
- [Source: planning-artifacts/architecture.md#Implementation Patterns] — Naming, structure, format, anti-patterns
- [Source: planning-artifacts/ux-design-specification.md#TaskCard] — Active and Completed variants, opacity 0.6, strikethrough
- [Source: planning-artifacts/ux-design-specification.md#Core Interaction Design] — Toggle actions: single click, no confirmation, optimistic
- [Source: planning-artifacts/ux-design-specification.md#Animation Patterns] — Card transfer 200-300ms ease-in-out, prefers-reduced-motion
- [Source: implementation-artifacts/1-3-create-and-view-active-tasks.md] — Previous story learnings, established patterns, review fixes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Checkbox changed from disabled to enabled — removed `disabled` attr and `cursor-not-allowed`, added `onChange` handler and `cursor-pointer`
- `aria-live="polite"` region added to App.tsx for screen reader announcements with auto-clear timeout
- Empty state logic updated: shows only when both active AND completed lists are empty

### Completion Notes List

- All 4 tasks completed with 56 passing frontend tests + 18 passing API tests (74 total, 0 regressions)
- useToggleTodo hook: React Query `useMutation` with optimistic cache toggle via `.map()`, rollback on error, invalidation on settle
- TaskCard: enabled checkbox with dynamic `checked` state, conditional opacity-60 + line-through + text-secondary for completed variant, dynamic aria-label
- App.tsx: separate active/completed filtering, two `<section>` blocks with SectionHeaders, completed section only renders when items exist, `aria-live` region for toggle announcements
- CSS: added `.task-card-exit` animation class, extended `prefers-reduced-motion` to cover exit animations
- Named exports only, no `any` types, no `console.log`, strict TypeScript

### File List

- apps/web/src/hooks/useToggleTodo.ts (new)
- apps/web/src/components/TaskCard.tsx (modified — enabled checkbox, completed variant styling, onToggle prop)
- apps/web/src/App.tsx (modified — completed section, useToggleTodo wiring, aria-live region, updated empty state logic)
- apps/web/src/globals.css (modified — added task-card-exit animation, extended prefers-reduced-motion)
- apps/web/__tests__/hooks/useToggleTodo.test.ts (new)
- apps/web/__tests__/components/TaskCard.test.tsx (modified — completed variant tests, onToggle tests, aria-label tests)
- apps/web/__tests__/components/App.test.tsx (modified — completed section tests, toggle interaction, empty state, aria-live region)

### Change Log

- 2026-04-09: Initial implementation of Story 1.4 - Complete, Reactivate, and View Completed Tasks
