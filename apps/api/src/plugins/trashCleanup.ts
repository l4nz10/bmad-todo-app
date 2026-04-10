import type { FastifyInstance } from 'fastify';
import { createDatabase } from '../db/client.ts';
import { createTrashService } from '../services/trashService.ts';

const TRASH_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

export async function registerTrashCleanup(app: FastifyInstance, databasePath: string): Promise<void> {
  const { db, sqlite } = createDatabase(databasePath);
  const trashService = createTrashService(db);

  function runCleanup() {
    try {
      const result = trashService.purgeExpiredTodos();
      if (result.purgedCount > 0) {
        app.log.info({ purgedCount: result.purgedCount }, 'Trash cleanup: purged expired items');
      }
    } catch (error) {
      app.log.error(error, 'Trash cleanup: failed to purge expired items');
    }
  }

  runCleanup();

  const intervalId = setInterval(runCleanup, TRASH_CLEANUP_INTERVAL_MS);

  app.addHook('onClose', () => {
    clearInterval(intervalId);
    sqlite.close();
  });
}
