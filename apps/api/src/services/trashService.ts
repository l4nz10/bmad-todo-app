import { eq, and, gte, lt, desc } from 'drizzle-orm';
import type { AppDatabase } from '../db/client.ts';
import { todos } from '../db/schema.ts';
import type { Todo } from '@bmad/shared';

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

const TRASH_TTL_DAYS = 7;

export function createTrashService(db: AppDatabase) {
  return {
    listTrashedTodos(): { todos: Todo[]; count: number } {
      const cutoff = new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const rows = db.select().from(todos)
        .where(and(eq(todos.deleted, true), gte(todos.deletedAt, cutoff)))
        .orderBy(desc(todos.deletedAt))
        .all();
      return {
        todos: rows.map(toTodo),
        count: rows.length,
      };
    },

    restoreTodo(id: string): Todo | null {
      const now = new Date().toISOString();
      const cutoff = new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const rows = db.update(todos)
        .set({ deleted: false, deletedAt: null, updatedAt: now })
        .where(and(eq(todos.id, id), eq(todos.deleted, true), gte(todos.deletedAt, cutoff)))
        .returning()
        .all();

      const row = rows[0];
      return row ? toTodo(row) : null;
    },

    purgeExpiredTodos(): { purgedCount: number } {
      const cutoff = new Date(Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const result = db.delete(todos)
        .where(and(eq(todos.deleted, true), lt(todos.deletedAt, cutoff)))
        .run();
      return { purgedCount: result.changes };
    },
  };
}
