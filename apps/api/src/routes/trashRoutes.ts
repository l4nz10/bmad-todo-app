import type { FastifyInstance } from 'fastify';
import { createDatabase } from '../db/client.ts';
import { createTrashService } from '../services/trashService.ts';

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

const uuidParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: UUID_PATTERN },
  },
  additionalProperties: false,
} as const;

const restoreParamsSchema = {
  params: uuidParamsSchema,
} as const;

export async function registerTrashRoutes(app: FastifyInstance, databasePath: string): Promise<void> {
  const { db, sqlite } = createDatabase(databasePath);
  const trashService = createTrashService(db);

  app.addHook('onClose', () => {
    sqlite.close();
  });

  app.get('/api/trash', async (_request, reply) => {
    const result = trashService.listTrashedTodos();
    return reply.send({
      data: result.todos,
      meta: { count: result.count },
    });
  });

  app.patch<{ Params: { id: string } }>('/api/trash/:id/restore', { schema: restoreParamsSchema }, async (request, reply) => {
    const { id } = request.params;

    const todo = trashService.restoreTodo(id);
    if (!todo) {
      return reply.status(404).send({ error: 'Todo not found or not deleted', statusCode: 404 });
    }

    return reply.send({ data: todo });
  });
}
