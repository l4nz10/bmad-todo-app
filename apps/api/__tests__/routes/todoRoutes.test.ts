import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildApp } from '../../src/app.ts';

function createTestApp() {
  const tmpDir = mkdtempSync(join(tmpdir(), 'bmad-test-'));
  const dbPath = join(tmpDir, 'test.db');
  return { tmpDir, dbPath };
}

describe('Todo Routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let tmpDir: string;

  beforeAll(async () => {
    const testEnv = createTestApp();
    tmpDir = testEnv.tmpDir;
    app = await buildApp({ databasePath: testEnv.dbPath });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('POST /api/todos', () => {
    it('creates a todo and returns wrapped response', async () => {
      const id = randomUUID();
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id, text: 'Test task' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data).toMatchObject({
        id,
        text: 'Test task',
        completed: false,
        deleted: false,
        userId: 'default',
      });
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
      expect(body.data.deletedAt).toBeNull();
    });

    it('rejects invalid UUID with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id: 'not-a-uuid', text: 'Test task' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBeDefined();
      expect(body.statusCode).toBe(400);
    });

    it('rejects empty text with 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id: randomUUID(), text: '' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/todos', () => {
    it('returns only non-deleted todos with count', async () => {
      // Create a fresh app with clean DB for this test
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      try {
        // Create two todos
        const id1 = randomUUID();
        const id2 = randomUUID();
        await freshApp.inject({
          method: 'POST',
          url: '/api/todos',
          payload: { id: id1, text: 'Task 1' },
        });
        await freshApp.inject({
          method: 'POST',
          url: '/api/todos',
          payload: { id: id2, text: 'Task 2' },
        });

        // Soft-delete one
        await freshApp.inject({
          method: 'DELETE',
          url: `/api/todos/${id1}`,
        });

        const response = await freshApp.inject({
          method: 'GET',
          url: '/api/todos',
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.data).toHaveLength(1);
        expect(body.meta.count).toBe(1);
        expect(body.data[0].id).toBe(id2);
      } finally {
        await freshApp.close();
        rmSync(freshEnv.tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('updates completed status', async () => {
      const id = randomUUID();
      await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id, text: 'To complete' },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/todos/${id}`,
        payload: { completed: true },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.completed).toBe(true);
      expect(body.data.id).toBe(id);
    });

    it('returns 404 for non-existent id', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/todos/${randomUUID()}`,
        payload: { completed: true },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.error).toBe('Todo not found');
      expect(body.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('soft-deletes the todo', async () => {
      const id = randomUUID();
      await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id, text: 'To delete' },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/todos/${id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.deleted).toBe(true);
      expect(body.data.deletedAt).toBeDefined();
      expect(body.data.id).toBe(id);
    });
  });
});
