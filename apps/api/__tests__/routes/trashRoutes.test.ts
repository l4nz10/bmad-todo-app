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

async function createAndDeleteTodo(app: Awaited<ReturnType<typeof buildApp>>) {
  const id = randomUUID();
  await app.inject({
    method: 'POST',
    url: '/api/todos',
    payload: { id, text: 'Task to delete' },
  });
  await app.inject({
    method: 'DELETE',
    url: `/api/todos/${id}`,
  });
  return id;
}

describe('Trash Routes', () => {
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

  describe('GET /api/trash', () => {
    it('returns trashed items', async () => {
      const id = await createAndDeleteTodo(app);

      const response = await app.inject({
        method: 'GET',
        url: '/api/trash',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const trashed = body.data.find((t: { id: string }) => t.id === id);
      expect(trashed).toBeDefined();
      expect(trashed.deleted).toBe(true);
      expect(trashed.deletedAt).toBeDefined();
      expect(body.meta.count).toBe(body.data.length);
    });

    it('returns empty list when no trashed items', async () => {
      // Create a fresh app with empty DB for this test
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const response = await freshApp.inject({
        method: 'GET',
        url: '/api/trash',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toEqual([]);
      expect(body.meta.count).toBe(0);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('excludes active (non-deleted) items', async () => {
      const id = randomUUID();
      await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id, text: 'Active task' },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/trash',
      });

      const body = response.json();
      const found = body.data.find((t: { id: string }) => t.id === id);
      expect(found).toBeUndefined();
    });

    it('excludes items deleted more than 7 days ago', async () => {
      // Create a fresh app to control data precisely
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      // Create and delete a todo, then manually backdate its deletedAt
      const id = await createAndDeleteTodo(freshApp);
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

      // Directly update the deletedAt via inject to backdate it
      // We need to use the database directly — get it via a workaround:
      // Create another todo that IS within range for comparison
      const recentId = await createAndDeleteTodo(freshApp);

      // Use raw SQL via the app's database — but we don't have direct access.
      // Instead, we can verify behavior by checking the response excludes old items.
      // The recently deleted item should appear, but we can't easily backdate via API.
      // Let's use a different approach: build the app with direct DB access.
      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      db.update(todosTable)
        .set({ deletedAt: eightDaysAgo })
        .where(eq(todosTable.id, id))
        .run();

      const response = await freshApp.inject({
        method: 'GET',
        url: '/api/trash',
      });

      const body = response.json();
      const oldItem = body.data.find((t: { id: string }) => t.id === id);
      expect(oldItem).toBeUndefined();
      const recentItem = body.data.find((t: { id: string }) => t.id === recentId);
      expect(recentItem).toBeDefined();

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('orders by deletedAt descending (most recent first)', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const oldId = await createAndDeleteTodo(freshApp);
      const recentId = await createAndDeleteTodo(freshApp);

      // Backdate oldId to 2 days ago so ordering is deterministic
      const { createDatabase } = await import('../../src/db/client.ts');
      const { db: freshDb } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      freshDb.update(todosTable).set({ deletedAt: twoDaysAgo }).where(eq(todosTable.id, oldId)).run();

      const response = await freshApp.inject({
        method: 'GET',
        url: '/api/trash',
      });

      const body = response.json();
      expect(body.data.length).toBe(2);
      // Most recently deleted should be first
      expect(body.data[0].id).toBe(recentId);
      expect(body.data[1].id).toBe(oldId);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });
  });

  describe('Trash Cleanup', () => {
    it('purges items deleted more than 7 days ago', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const id = await createAndDeleteTodo(freshApp);

      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      db.update(todosTable).set({ deletedAt: eightDaysAgo }).where(eq(todosTable.id, id)).run();

      const { createTrashService } = await import('../../src/services/trashService.ts');
      const trashService = createTrashService(db);
      const result = trashService.purgeExpiredTodos();

      expect(result.purgedCount).toBe(1);

      const rows = db.select().from(todosTable).where(eq(todosTable.id, id)).all();
      expect(rows.length).toBe(0);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('preserves items deleted less than 7 days ago', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const id = await createAndDeleteTodo(freshApp);

      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      const { createTrashService } = await import('../../src/services/trashService.ts');
      const trashService = createTrashService(db);
      const result = trashService.purgeExpiredTodos();

      expect(result.purgedCount).toBe(0);

      const rows = db.select().from(todosTable).where(eq(todosTable.id, id)).all();
      expect(rows.length).toBe(1);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('returns correct purgedCount for multiple expired items', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const id1 = await createAndDeleteTodo(freshApp);
      const id2 = await createAndDeleteTodo(freshApp);
      const id3 = await createAndDeleteTodo(freshApp);

      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      db.update(todosTable).set({ deletedAt: eightDaysAgo }).where(eq(todosTable.id, id1)).run();
      db.update(todosTable).set({ deletedAt: eightDaysAgo }).where(eq(todosTable.id, id2)).run();

      const { createTrashService } = await import('../../src/services/trashService.ts');
      const trashService = createTrashService(db);
      const result = trashService.purgeExpiredTodos();

      expect(result.purgedCount).toBe(2);

      const rows1 = db.select().from(todosTable).where(eq(todosTable.id, id1)).all();
      expect(rows1.length).toBe(0);
      const rows2 = db.select().from(todosTable).where(eq(todosTable.id, id2)).all();
      expect(rows2.length).toBe(0);
      const rows3 = db.select().from(todosTable).where(eq(todosTable.id, id3)).all();
      expect(rows3.length).toBe(1);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('returns purgedCount 0 when no expired items exist', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);

      const { createTrashService } = await import('../../src/services/trashService.ts');
      const trashService = createTrashService(db);
      const result = trashService.purgeExpiredTodos();

      expect(result.purgedCount).toBe(0);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('GET /api/trash no longer returns purged items', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const expiredId = await createAndDeleteTodo(freshApp);
      const recentId = await createAndDeleteTodo(freshApp);

      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      db.update(todosTable).set({ deletedAt: eightDaysAgo }).where(eq(todosTable.id, expiredId)).run();

      const { createTrashService } = await import('../../src/services/trashService.ts');
      const trashService = createTrashService(db);
      trashService.purgeExpiredTodos();

      const response = await freshApp.inject({
        method: 'GET',
        url: '/api/trash',
      });

      const body = response.json();
      expect(response.statusCode).toBe(200);
      const purgedItem = body.data.find((t: { id: string }) => t.id === expiredId);
      expect(purgedItem).toBeUndefined();
      const recentItem = body.data.find((t: { id: string }) => t.id === recentId);
      expect(recentItem).toBeDefined();

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });

    it('preserves items deleted exactly 7 days ago', async () => {
      const freshEnv = createTestApp();
      const freshApp = await buildApp({ databasePath: freshEnv.dbPath });
      await freshApp.ready();

      const id = await createAndDeleteTodo(freshApp);

      const { createDatabase } = await import('../../src/db/client.ts');
      const { db } = createDatabase(freshEnv.dbPath);
      const { todos: todosTable } = await import('../../src/db/schema.ts');
      const { eq } = await import('drizzle-orm');

      const exactlySevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      db.update(todosTable).set({ deletedAt: exactlySevenDaysAgo }).where(eq(todosTable.id, id)).run();

      const { createTrashService } = await import('../../src/services/trashService.ts');
      const trashService = createTrashService(db);
      const result = trashService.purgeExpiredTodos();

      expect(result.purgedCount).toBe(0);

      const rows = db.select().from(todosTable).where(eq(todosTable.id, id)).all();
      expect(rows.length).toBe(1);

      await freshApp.close();
      rmSync(freshEnv.tmpDir, { recursive: true, force: true });
    });
  });

  describe('PATCH /api/trash/:id/restore', () => {
    it('restores a soft-deleted todo', async () => {
      const id = await createAndDeleteTodo(app);

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/trash/${id}/restore`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toMatchObject({
        id,
        text: 'Task to delete',
        deleted: false,
        deletedAt: null,
      });
      expect(body.data.updatedAt).toBeDefined();
    });

    it('restored todo appears in active list', async () => {
      const id = await createAndDeleteTodo(app);

      await app.inject({
        method: 'PATCH',
        url: `/api/trash/${id}/restore`,
      });

      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/todos',
      });

      const todos = listResponse.json().data;
      const restored = todos.find((t: { id: string }) => t.id === id);
      expect(restored).toBeDefined();
      expect(restored.deleted).toBe(false);
    });

    it('returns 404 for non-existent todo', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/trash/${randomUUID()}/restore`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: 'Todo not found or not deleted',
        statusCode: 404,
      });
    });

    it('returns 404 for todo that is not deleted', async () => {
      const id = randomUUID();
      await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { id, text: 'Active task' },
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/trash/${id}/restore`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: 'Todo not found or not deleted',
        statusCode: 404,
      });
    });

    it('returns 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/trash/not-a-uuid/restore',
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
