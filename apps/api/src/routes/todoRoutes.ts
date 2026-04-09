import type { FastifyInstance } from 'fastify';
import { createDatabase } from '../db/client.ts';
import { createTodoService, isValidUuid } from '../services/todoService.ts';

const UUID_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

const createTodoSchema = {
  body: {
    type: 'object',
    required: ['id', 'text'],
    properties: {
      id: { type: 'string', pattern: UUID_PATTERN },
      text: { type: 'string', minLength: 1, maxLength: 500 },
    },
    additionalProperties: false,
  },
} as const;

const uuidParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: UUID_PATTERN },
  },
} as const;

const updateTodoSchema = {
  body: {
    type: 'object',
    minProperties: 1,
    properties: {
      completed: { type: 'boolean' },
      text: { type: 'string', minLength: 1, maxLength: 500 },
    },
    additionalProperties: false,
  },
  params: uuidParamsSchema,
} as const;

const todoParamsSchema = {
  params: uuidParamsSchema,
} as const;

export async function registerTodoRoutes(app: FastifyInstance, databasePath: string): Promise<void> {
  const { db, sqlite } = createDatabase(databasePath);
  const todoService = createTodoService(db);

  app.addHook('onClose', () => {
    sqlite.close();
  });

  app.post<{ Body: { id: string; text: string } }>('/api/todos', { schema: createTodoSchema }, async (request, reply) => {
    const { id, text } = request.body;

    try {
      const todo = todoService.createTodo(id, text);
      return reply.status(201).send({ data: todo });
    } catch (err) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
        return reply.status(409).send({ error: 'A todo with this ID already exists', statusCode: 409 });
      }
      throw err;
    }
  });

  app.get('/api/todos', async (_request, reply) => {
    const result = todoService.listActiveTodos();
    return reply.send({
      data: result.todos,
      meta: { count: result.count },
    });
  });

  app.patch<{ Params: { id: string }; Body: { completed?: boolean; text?: string } }>('/api/todos/:id', { schema: updateTodoSchema }, async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;

    if (!isValidUuid(id)) {
      return reply.status(400).send({ error: 'Invalid UUID format', statusCode: 400 });
    }

    const todo = todoService.updateTodo(id, updates);
    if (!todo) {
      return reply.status(404).send({ error: 'Todo not found', statusCode: 404 });
    }

    return reply.send({ data: todo });
  });

  app.delete<{ Params: { id: string } }>('/api/todos/:id', { schema: todoParamsSchema }, async (request, reply) => {
    const { id } = request.params;

    if (!isValidUuid(id)) {
      return reply.status(400).send({ error: 'Invalid UUID format', statusCode: 400 });
    }

    const todo = todoService.softDeleteTodo(id);
    if (!todo) {
      return reply.status(404).send({ error: 'Todo not found', statusCode: 404 });
    }

    return reply.send({ data: todo });
  });
}
