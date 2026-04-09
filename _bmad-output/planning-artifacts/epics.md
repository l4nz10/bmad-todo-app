---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-design-specification.md
---

# bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a new todo item by entering a text description
FR2: User can view active todo items in a dedicated active tasks list
FR3: User can view completed todo items in a separate completed tasks list
FR4: System presents the active tasks list as the primary focus area and the completed tasks list as secondary but visible
FR5: User can mark a todo item as completed, moving it from the active list to the completed list
FR6: User can mark a completed todo item as active again, moving it back to the active list
FR7: User can delete a todo item from either list
FR8: System assigns a creation timestamp to each new todo item
FR9: System displays a timed undo notification when a todo item is deleted, allowing the user to reverse the action
FR10: Deleted items that are not undone are moved to a trash bin
FR11: User can view items in the trash bin
FR12: User can restore a deleted item from the trash bin to its original list (active or completed)
FR13: System automatically purges trash bin items older than one week
FR14: System saves the current input field text to local browser storage as the user types
FR15: User can resume a previously saved draft via a "Resume draft" action
FR16: System clears the saved draft when the user successfully creates a todo item
FR17: System displays an appropriate empty state when no active todo items exist
FR18: System displays a loading state while initial data is being retrieved
FR19: System displays an error state when data retrieval fails
FR20: System caches the current task list in local browser storage for offline access
FR21: System detects network connectivity loss and displays a clear notification to the user
FR22: System queues user actions performed while offline
FR23: System automatically replays queued actions when network connectivity is restored
FR24: System clears the offline notification when connectivity is restored and sync completes
FR25: System persists all todo items to a backend database
FR26: System retrieves and displays the user's todo lists on application load
FR27: All CRUD operations are reflected in the backend to ensure data durability across sessions
FR28: User can perform all actions on desktop, tablet, and mobile viewports
FR29: System provides touch-friendly interaction targets on mobile devices

### NonFunctional Requirements

NFR1: All CRUD operations reflect in the UI within 100ms via optimistic updates
NFR2: Initial application load completes within 2 seconds on a standard broadband connection
NFR3: API response times under 200ms for all endpoints under normal conditions
NFR4: Frontend bundle size kept minimal — no unnecessary dependencies or frameworks
NFR5: Smooth animations and transitions with no visible jank (60fps target)
NFR6: Application remains usable with cached data when network connectivity is lost
NFR7: Offline action queue replays reliably on reconnect using sequential order
NFR8: Conflicts between offline actions and server state resolved via last-write-wins
NFR9: Trash bin cleanup job runs reliably to purge items older than one week
NFR10: No data loss under any normal usage scenario (create, complete, delete, restore)

### Additional Requirements

- Manual monorepo setup using Turborepo + pnpm workspaces (no pre-built starter)
- Shared TypeScript types package in `packages/shared` with Todo, CreateTodoRequest, UpdateTodoRequest, ApiResponse, ApiError types
- Drizzle ORM + SQLite (better-sqlite3) with soft delete pattern (deleted flag + deletedAt timestamp)
- Pre-seeded `userId` column (default: 'default') for future multi-user support
- Client-side UUID generation for optimistic creates — server validates UUID format
- Single-server deployment: Fastify serves both API (`/api/*`) and frontend static files (`/*`)
- Docker multi-stage build + docker-compose.yml with SQLite volume mount
- Fastify JSON Schema validation on all request bodies and params
- @fastify/cors restricted to frontend origin, @fastify/helmet for security headers
- React Query (TanStack Query) for all server state management, caching, and optimistic updates
- Trash cleanup via setInterval (hourly) — no cron library needed
- Vite proxies `/api/*` to Fastify in development
- Pino structured logging (pretty-print in dev, JSON in production)
- Vitest for testing with @testing-library/react for frontend and Fastify inject() for backend
- Wrapped API response format: `{ data, meta? }` for success, `{ error, statusCode }` for errors
- camelCase naming convention everywhere (DB, API, code, files)
- Named exports only (no export default), no `any` type, no barrel index.ts files

### UX Design Requirements

UX-DR1: Card-based design system — white cards with `rounded-xl`, `shadow-sm` default, `shadow-md` on hover, on light gray (#F3F4F6) app background
UX-DR2: Design token implementation — color palette (10 semantic tokens: bg-primary #FAFAF9, bg-surface #FFFFFF, text-primary #1C1C1C, text-secondary #6B7280, text-muted #9CA3AF, accent #4B7BF5 or #0D9488, success #22C55E, warning #F59E0B, danger #EF4444, border #E5E7EB), typography (Inter font, 6-level type scale from 12px to 20px, weight as primary hierarchy differentiator), spacing (4px base unit, 7 tokens from 4px to 32px)
UX-DR3: TaskCard component — checkbox (left) + task text (center, flex) + metadata timestamp (right) + delete button (right), active variant (full opacity, primary text) and completed variant (reduced opacity 0.6, secondary text, strikethrough), hover shadow elevation, enter/exit/transfer animations
UX-DR4: InputCard component — card-styled text input with inline DraftChip, focus state shows accent ring on card container, auto-focus on page load, Enter to submit, Escape to clear input, placeholder "Add a task..."
UX-DR5: DraftChip component — accent-colored outline pill button, "Resume draft" text with truncated draft preview, appears only when draft exists in localStorage, disappears when user types new content or submits
UX-DR6: EmptyState component — centered "No tasks yet" (text-primary) + "Type above to get started" (text-muted), typography only (no illustrations), disappears when first task is created
UX-DR7: NetworkBar component — full-width bar below input card, above task lists, three states: offline (warning amber #FEF3C7 background with amber dot), syncing (pulsing animation), synced (success green, auto-dismisses after 2 seconds), non-blocking, `role="status"` with `aria-live="polite"`
UX-DR8: TrashButton + TrashDialog — trash icon with "Trash" label and item count badge, hidden when no trashed items, opens Radix Dialog modal showing deleted TaskCards with "Restore" button per item, shows deletion date and days until auto-purge, focus trap and Escape to close
UX-DR9: UndoToast — Radix Toast primitive, bottom-positioned, 5-second timed auto-dismiss, single "Undo" action button, replaces previous toast if new delete occurs while showing, task restored to original list on undo
UX-DR10: Animation system — card enter (150-200ms ease-out), card exit (150ms ease-out), cross-list transfer (200-300ms ease-in-out), toast enter (200ms ease-out slide-up), toast exit (150ms ease-in), shadow hover (150ms ease-out), status bar enter/exit (200ms), all respect `prefers-reduced-motion` media query
UX-DR11: Responsive implementation — mobile-first Tailwind classes, 4 breakpoints (default <640px full-width 16px margins, sm 640px+ max-width container, md 768px+ 24px margins, lg 1024px+ 32px margins hover states), touch targets minimum 44px (48px on mobile), full-width toast on mobile, no layout shifts between breakpoints
UX-DR12: Accessibility implementation — WCAG 2.1 AA contrast (4.5:1 body text, 3:1 interactive), full Tab-order keyboard navigation (input -> checkboxes -> delete buttons -> trash button), visible focus rings (accent color), semantic HTML (main, section, ul/li for task lists, proper heading hierarchy), Radix Visually Hidden for icon-only button labels, `aria-live="polite"` on NetworkBar and toast regions, task status changes announced to screen readers

### FR Coverage Map

FR1: Epic 1 - User can create a new todo item
FR2: Epic 1 - User can view active todo items
FR3: Epic 1 - User can view completed todo items
FR4: Epic 1 - Active list primary, completed list secondary
FR5: Epic 1 - User can mark todo as completed
FR6: Epic 1 - User can reactivate a completed todo
FR7: Epic 1 - User can delete a todo item
FR8: Epic 1 - System assigns creation timestamp
FR9: Epic 2 - Timed undo notification on delete
FR10: Epic 2 - Deleted items moved to trash bin
FR11: Epic 2 - User can view trash bin items
FR12: Epic 2 - User can restore from trash bin
FR13: Epic 2 - Auto-purge trash items older than one week
FR14: Epic 3 - Auto-save input text to localStorage
FR15: Epic 3 - Resume draft action
FR16: Epic 3 - Clear draft on successful create
FR17: Epic 1 - Empty state when no active items
FR18: Epic 1 - Loading state during data retrieval
FR19: Epic 1 - Error state when retrieval fails
FR20: Epic 4 - Cache task list in localStorage for offline
FR21: Epic 4 - Detect network loss and display notification
FR22: Epic 4 - Queue actions while offline
FR23: Epic 4 - Auto-replay queued actions on reconnect
FR24: Epic 4 - Clear notification when sync completes
FR25: Epic 1 - Persist todos to backend database
FR26: Epic 1 - Retrieve and display todos on app load
FR27: Epic 1 - CRUD reflected in backend
FR28: Epic 1 - All actions on desktop, tablet, and mobile
FR29: Epic 1 - Touch-friendly targets on mobile

## Epic List

### Epic 1: Core Task Management
Users can create, view, complete, reactivate, and delete todo items through a polished card-based interface with separate active and completed lists, backed by persistent server storage.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR17, FR18, FR19, FR25, FR26, FR27, FR28, FR29
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR6, UX-DR10, UX-DR11, UX-DR12

### Epic 2: Deletion Safety & Recovery
Users are protected from accidental deletions with an immediate undo toast and a trash bin where deleted items can be viewed and restored for up to one week.
**FRs covered:** FR9, FR10, FR11, FR12, FR13
**UX-DRs covered:** UX-DR8, UX-DR9

### Epic 3: Draft Persistence
Users never lose work-in-progress text — the app automatically saves what they're typing and offers a "Resume draft" action to pick up where they left off.
**FRs covered:** FR14, FR15, FR16
**UX-DRs covered:** UX-DR5

### Epic 4: Offline Resilience
Users can continue working seamlessly during network disruptions, with clear status communication and automatic sync when connectivity returns.
**FRs covered:** FR20, FR21, FR22, FR23, FR24
**UX-DRs covered:** UX-DR7

---

## Epic 1: Core Task Management

Users can create, view, complete, reactivate, and delete todo items through a polished card-based interface with separate active and completed lists, backed by persistent server storage.

### Story 1.1: Monorepo and Backend Foundation

As a developer,
I want a fully configured monorepo with a working REST API backed by SQLite,
So that the frontend has a reliable backend to integrate with for all task operations.

**Acceptance Criteria:**

**Given** the project is initialized from scratch
**When** `pnpm install` and `pnpm dev` are run
**Then** Turborepo starts the Fastify API server on port 3000
**And** the `packages/shared` package exports `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`, `ApiResponse<T>`, and `ApiError` types
**And** Drizzle ORM schema defines a `todos` table with columns: `id` (TEXT UUID PK), `userId` (TEXT default 'default', indexed), `text` (TEXT not null), `completed` (INTEGER 0/1 default 0), `deleted` (INTEGER 0/1 default 0), `deletedAt` (TEXT nullable ISO timestamp), `createdAt` (TEXT ISO timestamp), `updatedAt` (TEXT ISO timestamp)
**And** Drizzle migrations are generated and runnable

**Given** the API is running
**When** `POST /api/todos` is called with `{ "id": "<valid-uuid>", "text": "Test task" }`
**Then** a new todo is created and returned as `{ "data": { "id": "...", "text": "Test task", "completed": false, ... } }`
**And** the server validates UUID format and rejects invalid IDs with 400

**Given** active todos exist in the database
**When** `GET /api/todos` is called
**Then** all todos where `deleted = 0` are returned as `{ "data": [...], "meta": { "count": N } }`

**Given** a todo exists
**When** `PATCH /api/todos/:id` is called with `{ "completed": true }`
**Then** the todo's `completed` field is updated and the updated todo is returned

**Given** a todo exists
**When** `DELETE /api/todos/:id` is called
**Then** the todo is soft-deleted (`deleted = 1`, `deletedAt` set to current ISO timestamp)

**Given** the project root
**When** the project structure is inspected
**Then** `@fastify/cors` is configured to restrict to the frontend origin
**And** `@fastify/helmet` is registered for security headers
**And** Fastify JSON Schema validation is applied to all request bodies and params
**And** Pino logging is configured (pretty-print in dev, JSON in production)
**And** all error responses follow `{ "error": "message", "statusCode": N }` format
**And** all naming follows camelCase convention (DB columns, API JSON fields, code)
**And** a `Dockerfile` (multi-stage build) and `docker-compose.yml` (with SQLite volume mount at `/data/bmad.db`) exist
**And** `tsconfig.base.json` enforces strict TypeScript across all packages

### Story 1.2: Frontend App Shell with Design System

As a user,
I want to see a clean, responsive, card-based interface when I open the app,
So that the experience feels polished and works well on any device.

**Acceptance Criteria:**

**Given** the Vite React app is set up within the monorepo
**When** `pnpm dev` is run
**Then** Turborepo starts both the Vite dev server and the Fastify API
**And** Vite proxies `/api/*` requests to the Fastify backend

**Given** the Tailwind config is loaded
**When** the app renders
**Then** design tokens are applied: bg-primary (`#FAFAF9`), bg-surface (`#FFFFFF`), text-primary (`#1C1C1C`), text-secondary (`#6B7280`), text-muted (`#9CA3AF`), accent color, success (`#22C55E`), warning (`#F59E0B`), danger (`#EF4444`), border (`#E5E7EB`)
**And** Inter font is loaded and applied with the defined type scale (12px-20px, weight as hierarchy differentiator)
**And** spacing uses the 4px base unit scale

**Given** the app is viewed on any viewport
**When** the layout renders
**Then** a single-column centered layout is displayed (max-width 640px on sm+)
**And** mobile (<768px) uses full-width with 16px margins
**And** tablet (768px+) uses 24px margins
**And** desktop (1024px+) uses 32px margins with hover states enabled
**And** the app background is light gray (`#F3F4F6`) with white card surfaces

**Given** the layout shell is rendered
**When** the InputCard component is visible
**Then** it displays as a white card with `rounded-xl` and `shadow-sm`
**And** it contains a text input with placeholder "Add a task..."
**And** focus state shows an accent-colored ring on the card container
**And** the `<html>` includes `<meta name="viewport" content="width=device-width, initial-scale=1">`
**And** semantic HTML structure is used (`<main>`, proper heading hierarchy)
**And** all interactive elements are reachable via Tab with visible focus rings

### Story 1.3: Create and View Active Tasks

As a user,
I want to type a task and press Enter to see it appear instantly in my active list,
So that capturing tasks feels immediate and frictionless.

**Acceptance Criteria:**

**Given** the input field is focused and contains text
**When** the user presses Enter
**Then** a new TaskCard animates into the active list (150-200ms ease-out)
**And** the input field clears and retains focus
**And** a client-side UUID is generated for the new todo
**And** the UI updates optimistically before the server responds (React Query mutation with `onMutate`)
**And** the saved draft is cleared from localStorage (if any existed)

**Given** the input field is focused and empty
**When** the user presses Enter
**Then** nothing happens (no empty task creation)

**Given** the input field is focused
**When** the user presses Escape
**Then** the input text is cleared

**Given** active todos exist
**When** the app renders the active list
**Then** each todo is displayed as a TaskCard: checkbox (left) + task text (center) + creation timestamp (right) + delete button (right)
**And** TaskCards have white background, `rounded-xl`, `shadow-sm`, and `shadow-md` on hover (desktop)
**And** active tasks use full opacity with `text-primary` color
**And** a SectionHeader labeled "Active" appears above the list with semi-bold `text-secondary` styling
**And** the task list uses semantic `<ul>`/`<li>` HTML elements

**Given** no active todos exist
**When** the app renders
**Then** an EmptyState component displays "No tasks yet" (text-primary) and "Type above to get started" (text-muted)
**And** the EmptyState disappears when the first task is created

**Given** the optimistic create succeeds on the server
**When** the server confirms the creation
**Then** React Query settles the mutation silently (no visible change)

**Given** the optimistic create fails on the server
**When** the server returns an error
**Then** the optimistic update is rolled back and the task is removed from the list

**Given** the app is viewed on mobile (<768px)
**When** tasks are displayed
**Then** touch targets are at least 48px height
**And** delete buttons are always visible (not hover-dependent)

### Story 1.4: Complete, Reactivate, and View Completed Tasks

As a user,
I want to click a task's checkbox to mark it complete and see it move to the completed section,
So that I can track my progress and distinguish finished work from pending tasks.

**Acceptance Criteria:**

**Given** an active task exists
**When** the user clicks/taps the checkbox on the TaskCard
**Then** the task animates out of the active list and into the completed list (200-300ms ease-in-out cross-list transfer)
**And** the UI updates optimistically before the server confirms
**And** the completed section appears dynamically (it doesn't exist as an empty section)
**And** a SectionHeader labeled "Completed" appears above the completed list

**Given** completed tasks exist
**When** the completed section renders
**Then** TaskCards display at reduced opacity (0.6) with `text-secondary` color and strikethrough on task text
**And** the completed section is visually subordinate to the active section

**Given** a completed task exists
**When** the user clicks/taps the checkbox on the completed TaskCard
**Then** the task animates from the completed list back to the active list (200-300ms ease-in-out)
**And** the task returns to full opacity with active styling
**And** if no completed tasks remain, the completed section disappears

**Given** the user has `prefers-reduced-motion` enabled
**When** any cross-list transfer occurs
**Then** the animation is replaced by an instant state change

**Given** the optimistic toggle fails on the server
**When** the server returns an error
**Then** the task returns to its previous list with the original completion state

**Given** task status changes occur
**When** screen readers are active
**Then** status changes are announced (e.g., "Task completed", "Task reactivated")

### Story 1.5: Delete Tasks with Inline Removal

As a user,
I want to click a delete button on a task to remove it from my list,
So that I can keep my task lists clean and relevant.

**Acceptance Criteria:**

**Given** a task exists in either the active or completed list
**When** the user clicks/taps the delete button on the TaskCard
**Then** the TaskCard animates out of the list (150ms ease-out)
**And** the UI updates optimistically before the server confirms
**And** the backend soft-deletes the task (sets `deleted = 1` and `deletedAt` to current timestamp)

**Given** the delete button is focused via keyboard
**When** the user presses Enter
**Then** the delete action triggers identically to a click

**Given** the optimistic delete fails on the server
**When** the server returns an error
**Then** the task reappears in its original position in the list

**Given** the user has `prefers-reduced-motion` enabled
**When** a task is deleted
**Then** the exit animation is replaced by an instant removal

**Given** the delete button on mobile
**When** the button renders
**Then** it has a minimum touch target of 48px
**And** it is always visible (not hidden behind hover state)

### Story 1.6: Loading and Error States

As a user,
I want clear feedback when the app is loading or when something goes wrong,
So that I always understand the current state and can take action if needed.

**Acceptance Criteria:**

**Given** the app is opened and no cached data exists
**When** the initial API fetch is in progress
**Then** a LoadingState component displays skeleton cards in the list area
**And** the InputCard is visible and functional (user can type while loading)

**Given** the app is opened and cached data exists in localStorage
**When** the initial API fetch is in progress
**Then** the cached data is displayed immediately while the fetch completes in the background

**Given** the initial API fetch fails and no cached data exists
**When** the error state is triggered
**Then** an ErrorState component displays "Couldn't load your tasks" with a "Retry" button
**And** clicking "Retry" re-triggers the API fetch

**Given** the initial API fetch fails and cached data exists
**When** the error state is triggered
**Then** the cached data is displayed with a subtle warning indicating the data may be stale

**Given** the API fetch succeeds after a retry
**When** data is returned
**Then** the LoadingState or ErrorState is replaced by the task list
**And** the transition is smooth with no layout shift

---

## Epic 2: Deletion Safety & Recovery

Users are protected from accidental deletions with an immediate undo toast and a trash bin where deleted items can be viewed and restored for up to one week.

### Story 2.1: Undo Toast on Deletion

As a user,
I want to see an undo option immediately after deleting a task,
So that I can quickly reverse accidental deletions without losing data.

**Acceptance Criteria:**

**Given** a task is deleted from either the active or completed list
**When** the delete action completes (card animates out)
**Then** an UndoToast (Radix Toast) appears at the bottom of the viewport
**And** the toast displays a message (e.g., "Task deleted") with a single "Undo" button
**And** the toast auto-dismisses after 5 seconds
**And** the toast entrance animation is 200ms ease-out slide-up
**And** the toast exit animation is 150ms ease-in

**Given** the UndoToast is visible
**When** the user clicks/taps "Undo" within the 5-second window
**Then** the deleted task is restored to its original list (active or completed)
**And** the task animates back into its list (200ms ease-out)
**And** the backend restores the task (sets `deleted = 0`, `deletedAt = null`)
**And** the toast dismisses

**Given** the UndoToast is visible
**When** the 5-second timer expires without user action
**Then** the toast dismisses with its exit animation
**And** the task remains soft-deleted in the database (moved to trash bin)

**Given** an UndoToast is currently visible
**When** the user deletes another task
**Then** the previous toast is dismissed immediately
**And** a new UndoToast appears for the most recent deletion
**And** the previously deleted task's undo window is forfeited (it stays in trash)

**Given** the UndoToast is rendered on mobile (<768px)
**When** the viewport is narrow
**Then** the toast displays full-width at the bottom of the viewport

**Given** the user has `prefers-reduced-motion` enabled
**When** the toast appears or dismisses
**Then** animations are replaced by instant state changes

**Given** a screen reader is active
**When** the UndoToast appears
**Then** the toast region announces the deletion and undo availability via `aria-live`

### Story 2.2: Trash Bin View and Restore

As a user,
I want to browse my recently deleted tasks and restore any of them,
So that I can recover tasks I deleted intentionally but later need back.

**Acceptance Criteria:**

**Given** one or more soft-deleted tasks exist (within 7-day retention)
**When** the app renders
**Then** a TrashButton appears at the bottom of the page showing a trash icon, "Trash" label, and item count badge

**Given** no soft-deleted tasks exist
**When** the app renders
**Then** the TrashButton is hidden

**Given** the TrashButton is visible
**When** the user clicks/taps the TrashButton
**Then** a TrashDialog opens (Radix Dialog modal overlay)
**And** the dialog displays a header "Trash" and a list of deleted TaskCards
**And** each item shows the task text, deletion date, and days remaining until auto-purge
**And** each item has a "Restore" button
**And** focus is trapped within the dialog (Radix handles this)

**Given** the TrashDialog is open
**When** the user clicks "Restore" on a trashed item
**Then** the task is restored to its original list (active if it was active, completed if it was completed)
**And** the backend sets `deleted = 0` and `deletedAt = null` via `PATCH /api/trash/:id/restore`
**And** the item is removed from the trash list in the dialog
**And** the TrashButton count updates

**Given** the TrashDialog is open
**When** the user presses Escape, clicks the X button, or clicks the overlay
**Then** the dialog closes and focus returns to the TrashButton

**Given** the last trashed item is restored
**When** the trash list becomes empty
**Then** the dialog closes automatically
**And** the TrashButton hides

**Given** a screen reader is active
**When** the TrashDialog opens
**Then** the dialog is announced with proper `aria-labelledby` referencing the "Trash" heading

**Given** the TrashButton is in the Tab order
**When** the user navigates via keyboard
**Then** the TrashButton is focusable with a visible focus ring
**And** Enter opens the dialog

### Story 2.3: Automatic Trash Purge

As a user,
I want expired trash items to be cleaned up automatically,
So that deleted tasks don't accumulate indefinitely and my trash stays manageable.

**Acceptance Criteria:**

**Given** the Fastify server starts
**When** the trash cleanup plugin initializes
**Then** a `setInterval` job is registered to run every hour
**And** the cleanup runs once immediately on server start

**Given** the trash cleanup job runs
**When** soft-deleted todos exist with `deletedAt` older than 7 days
**Then** those records are permanently deleted from the database (`DELETE FROM todos WHERE deleted = 1 AND deletedAt < now - 7 days`)
**And** the deletion count is logged via Pino

**Given** the trash cleanup job runs
**When** no expired trash items exist
**Then** the job completes silently with no errors

**Given** the `GET /api/trash` endpoint is called
**When** the server queries for trashed items
**Then** only items where `deleted = 1` and `deletedAt` is within the last 7 days are returned
**And** the response format is `{ "data": [...], "meta": { "count": N } }`

**Given** the frontend has the trash dialog open
**When** a trash item has been auto-purged by the backend since the last fetch
**Then** the next refetch updates the trash list accurately (React Query handles stale data)

---

## Epic 3: Draft Persistence

Users never lose work-in-progress text — the app automatically saves what they're typing and offers a "Resume draft" action to pick up where they left off.

### Story 3.1: Auto-Save Draft and Resume

As a user,
I want my in-progress text to be saved automatically and resumable when I return,
So that I never lose a half-typed thought if I close the app or navigate away.

**Acceptance Criteria:**

**Given** the user is typing in the InputCard
**When** text is entered or changed
**Then** the current input text is saved to localStorage via the `useDraft` hook with ~300ms debounce
**And** saves are fire-and-forget (no error handling needed for localStorage writes)

**Given** the user opens the app and a draft exists in localStorage
**When** the InputCard renders
**Then** a DraftChip pill appears inside the InputCard (right-aligned next to the text input)
**And** the DraftChip displays "Resume draft" text with accent color outline styling
**And** the DraftChip is a focusable button with descriptive label (e.g., "Resume draft: Email professor about...")

**Given** no draft exists in localStorage
**When** the InputCard renders
**Then** the DraftChip is not visible

**Given** the DraftChip is visible
**When** the user clicks/taps the DraftChip
**Then** the saved draft text is populated into the input field
**And** the cursor is placed at the end of the text
**And** the DraftChip disappears

**Given** the DraftChip is visible
**When** the user starts typing new content in the input field
**Then** the DraftChip disappears
**And** the new text replaces the saved draft in localStorage

**Given** a draft exists in localStorage
**When** the user successfully creates a task (presses Enter with text)
**Then** the draft is cleared from localStorage
**And** the DraftChip does not appear after the input clears

**Given** the DraftChip is in the Tab order
**When** the user navigates via keyboard
**Then** the DraftChip is focusable with a visible focus ring
**And** Enter activates the resume action

**Given** the user closes the browser and reopens the app later
**When** the InputCard renders and a draft was previously saved
**Then** the DraftChip appears with the previously saved draft text available for resumption

---

## Epic 4: Offline Resilience

Users can continue working seamlessly during network disruptions, with clear status communication and automatic sync when connectivity returns.

### Story 4.1: Network Status Detection and Display

As a user,
I want to see a clear notification when my connection is lost and confirmation when it returns,
So that I understand the app's state and trust that my data is safe.

**Acceptance Criteria:**

**Given** the app is running and the network is available
**When** the browser detects connectivity loss (`offline` event / `navigator.onLine` becomes false)
**Then** a NetworkBar appears below the InputCard and above the task lists
**And** the bar displays a warning amber background (`#FEF3C7`) with an amber status dot and message text (e.g., "Connection lost — changes will sync")
**And** the bar entrance animation is 200ms ease-out
**And** the bar is non-blocking — all user actions remain available

**Given** the NetworkBar is visible (offline state)
**When** the browser detects connectivity restored (`online` event / `navigator.onLine` becomes true)
**Then** the bar transitions to a green "Synced" state with success color
**And** the "Synced" confirmation displays for 2 seconds
**And** the bar then dismisses with a 200ms ease-in exit animation

**Given** the NetworkBar and an UndoToast are both relevant
**When** they render simultaneously
**Then** the NetworkBar stays in its fixed position below the input card
**And** the UndoToast floats at the bottom of the viewport
**And** they do not overlap or stack on each other

**Given** a screen reader is active
**When** the network status changes
**Then** the NetworkBar announces the status change via `role="status"` and `aria-live="polite"`

**Given** the user has `prefers-reduced-motion` enabled
**When** the NetworkBar appears or dismisses
**Then** animations are replaced by instant state changes

**Given** the `useNetworkStatus` hook is initialized
**When** the component mounts
**Then** it registers listeners for `online` and `offline` events on `window`
**And** it checks `navigator.onLine` for initial state
**And** it exposes an `isOnline` boolean for consumption by other hooks

### Story 4.2: Offline Cache and Action Queue with Auto-Sync

As a user,
I want to keep using the app normally when offline and have my changes sync automatically when I'm back online,
So that network disruptions never interrupt my workflow or cause data loss.

**Acceptance Criteria:**

**Given** the app fetches the task list successfully from the API
**When** the data is received
**Then** the current task list is cached in localStorage for offline access
**And** the cache is updated on every successful fetch

**Given** the app is opened and the network is unavailable
**When** the app attempts to fetch from the API
**Then** the cached task list from localStorage is loaded and displayed
**And** the NetworkBar shows the offline state

**Given** the user is offline
**When** the user creates, completes, reactivates, or deletes a task
**Then** the UI updates optimistically as normal
**And** the action is queued in localStorage under key `bmad_offline_queue`
**And** each queued action stores `{ id, type: 'create' | 'update' | 'delete', payload, timestamp }` in ISO format

**Given** the user performs multiple actions while offline
**When** actions are queued
**Then** all actions are stored in sequential order by timestamp

**Given** the network is restored (detected by `useNetworkStatus`)
**When** queued actions exist in localStorage
**Then** the `useOfflineQueue` hook replays all queued actions sequentially (oldest first)
**And** each action uses the same React Query mutation functions as online operations
**And** the NetworkBar shows a syncing state (pulsing animation)

**Given** all queued actions have been replayed successfully
**When** the sync completes
**Then** the offline queue is cleared from localStorage
**And** the NetworkBar transitions to "Synced" (green, 2-second display, then dismisses)
**And** React Query refetches the task list to reconcile with server state

**Given** a conflict occurs during replay (e.g., a deleted task was already modified on the server)
**When** the server responds
**Then** last-write-wins resolution applies (server state is authoritative after replay)
**And** the UI reconciles to match server state after the refetch

**Given** a queued action fails during replay (server error, not conflict)
**When** the replay encounters the failure
**Then** the failed action is retried according to React Query retry logic
**And** if retry fails, the remaining queue is preserved for the next sync attempt

**Given** the app is opened after being closed while offline with pending actions
**When** the app initializes and the network is available
**Then** the offline queue is detected in localStorage
**And** queued actions are replayed automatically on startup
