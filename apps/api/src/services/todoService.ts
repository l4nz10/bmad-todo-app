import { eq, and } from 'drizzle-orm';
import type { AppDatabase } from '../db/client.ts';
import { todos } from '../db/schema.ts';
import type { Todo } from '@bmad/shared';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DEFAULT_USER_ID = 'default';

function toTodo(row: typeof todos.$inferSelect): Todo {
  return {
    id: row.id,
    userId: row.userId,
    text: row.text,
    completed: row.completed,
    deleted: row.deleted,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function isValidUuid(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

export function createTodoService(db: AppDatabase) {
  return {
    createTodo(id: string, text: string): Todo {
      const now = new Date().toISOString();
      const rows = db.insert(todos).values({
        id,
        userId: DEFAULT_USER_ID,
        text,
        completed: false,
        deleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      }).returning().all();

      const row = rows[0];
      if (!row) {
        throw new Error('Failed to create todo');
      }

      return toTodo(row);
    },

    listActiveTodos(): { todos: Todo[]; count: number } {
      const rows = db.select().from(todos).where(eq(todos.deleted, false)).all();
      return {
        todos: rows.map(toTodo),
        count: rows.length,
      };
    },

    updateTodo(id: string, updates: { completed?: boolean; text?: string }): Todo | null {
      const now = new Date().toISOString();
      const rows = db.update(todos)
        .set({ ...updates, updatedAt: now })
        .where(and(eq(todos.id, id), eq(todos.deleted, false)))
        .returning()
        .all();

      const row = rows[0];
      return row ? toTodo(row) : null;
    },

    softDeleteTodo(id: string): Todo | null {
      const now = new Date().toISOString();
      const rows = db.update(todos)
        .set({ deleted: true, deletedAt: now, updatedAt: now })
        .where(and(eq(todos.id, id), eq(todos.deleted, false)))
        .returning()
        .all();

      const row = rows[0];
      return row ? toTodo(row) : null;
    },
  };
}
