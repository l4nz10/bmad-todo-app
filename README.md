# BMAD ToDo App

A full-stack task management application with soft-delete, trash recovery, and automatic cleanup. Built as a pnpm monorepo with Turborepo.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite, React Query |
| **Backend** | Fastify 5, TypeScript, Drizzle ORM, better-sqlite3 |
| **Shared** | `@bmad/shared` package with shared types (Todo, API response) |
| **Testing** | Vitest, Testing Library |
| **Build** | Turborepo, pnpm workspaces |

## Project Structure

```
apps/
  api/          Fastify REST API (port 3000)
  web/          React SPA (port 5173)
packages/
  shared/       Shared TypeScript types
```

## Prerequisites

- Node.js >= 20
- pnpm >= 10

## Getting Started

```bash
# Install dependencies
pnpm install

# Start both API and frontend in dev mode
pnpm dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:3000`.

### Run individually

```bash
pnpm --filter api dev     # API only
pnpm --filter web dev     # Frontend only
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Type-check all packages |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List active tasks |
| `POST` | `/api/todos` | Create a task |
| `PATCH` | `/api/todos/:id` | Update a task (complete/reactivate) |
| `DELETE` | `/api/todos/:id` | Soft-delete a task |
| `GET` | `/api/trash` | List trashed tasks (last 7 days) |
| `PATCH` | `/api/trash/:id/restore` | Restore a trashed task |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API server port |
| `DATABASE_PATH` | `./bmad.db` | SQLite database file path |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## Features

- **Task Management** -- Create, complete, reactivate, and delete tasks
- **Soft Delete with Undo** -- Deleted tasks go to trash with an undo toast
- **Trash Bin** -- View and restore deleted tasks within a 7-day window
- **Automatic Trash Purge** -- Background job permanently removes expired trash items every hour
- **Optimistic Updates** -- Instant UI feedback via React Query mutations
- **Loading & Error States** -- Skeleton loaders and retry-capable error displays

## Docker

```bash
# Build and run with Docker Compose
docker compose up --build
```

This starts the API on port 3000 with a persistent SQLite volume.

## Database

SQLite with Drizzle ORM. Migrations run automatically on startup.

```bash
# Generate a new migration after schema changes
pnpm --filter api db:generate

# Run migrations manually
pnpm --filter api db:migrate
```
