import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDatabase } from '../../src/db/client.ts';
import { createTodoService, isValidUuid } from '../../src/services/todoService.ts';

describe('isValidUuid', () => {
  it('accepts valid UUID v4', () => {
    expect(isValidUuid(randomUUID())).toBe(true);
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('123')).toBe(false);
    // UUID v1 format (wrong version nibble)
    expect(isValidUuid('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
  });
});

describe('TodoService', () => {
  let tmpDir: string;
  let service: ReturnType<typeof createTodoService>;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'bmad-svc-test-'));
    const dbPath = join(tmpDir, 'test.db');
    const { db } = createDatabase(dbPath);
    service = createTodoService(db);
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('createTodo', () => {
    it('creates a todo with correct fields', () => {
      const id = randomUUID();
      const todo = service.createTodo(id, 'New task');

      expect(todo.id).toBe(id);
      expect(todo.text).toBe('New task');
      expect(todo.completed).toBe(false);
      expect(todo.deleted).toBe(false);
      expect(todo.userId).toBe('default');
      expect(todo.deletedAt).toBeNull();
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });
  });

  describe('listActiveTodos', () => {
    it('returns only non-deleted todos', () => {
      const id1 = randomUUID();
      const id2 = randomUUID();
      service.createTodo(id1, 'Active task');
      service.createTodo(id2, 'To be deleted');
      service.softDeleteTodo(id2);

      const result = service.listActiveTodos();
      const ids = result.todos.map(t => t.id);
      expect(ids).toContain(id1);
      expect(ids).not.toContain(id2);
      expect(result.count).toBe(result.todos.length);
    });
  });

  describe('updateTodo', () => {
    it('updates completed status', () => {
      const id = randomUUID();
      service.createTodo(id, 'Task');

      const updated = service.updateTodo(id, { completed: true });
      expect(updated).not.toBeNull();
      expect(updated!.completed).toBe(true);
    });

    it('updates text', () => {
      const id = randomUUID();
      service.createTodo(id, 'Old text');

      const updated = service.updateTodo(id, { text: 'New text' });
      expect(updated).not.toBeNull();
      expect(updated!.text).toBe('New text');
    });

    it('returns null for non-existent id', () => {
      const result = service.updateTodo(randomUUID(), { completed: true });
      expect(result).toBeNull();
    });

    it('sets updatedAt on mutation', () => {
      const id = randomUUID();
      const created = service.createTodo(id, 'Task');
      const updated = service.updateTodo(id, { text: 'Changed' });
      expect(updated).not.toBeNull();
      expect(updated!.updatedAt).toBeDefined();
      // updatedAt should be >= createdAt (may be same ms, but must not be earlier)
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.createdAt).getTime());
    });
  });

  describe('softDeleteTodo', () => {
    it('sets deleted flag and deletedAt', () => {
      const id = randomUUID();
      service.createTodo(id, 'To delete');

      const deleted = service.softDeleteTodo(id);
      expect(deleted).not.toBeNull();
      expect(deleted!.deleted).toBe(true);
      expect(deleted!.deletedAt).toBeDefined();
    });

    it('returns null for non-existent id', () => {
      const result = service.softDeleteTodo(randomUUID());
      expect(result).toBeNull();
    });

    it('returns null for already deleted todo', () => {
      const id = randomUUID();
      service.createTodo(id, 'Task');
      service.softDeleteTodo(id);

      const secondDelete = service.softDeleteTodo(id);
      expect(secondDelete).toBeNull();
    });
  });
});
