import Fastify, { type FastifyError } from 'fastify';
import { config } from './config.ts';
import { registerCors } from './plugins/cors.ts';
import { registerHelmet } from './plugins/helmet.ts';
import { registerTodoRoutes } from './routes/todoRoutes.ts';

export interface BuildAppOptions {
  databasePath?: string;
}

export async function buildApp(options?: BuildAppOptions) {
  const app = Fastify({
    logger: config.isDev
      ? { transport: { target: 'pino-pretty' } }
      : true,
  });

  await registerCors(app);
  await registerHelmet(app);

  const dbPath = options?.databasePath ?? config.databasePath;
  await registerTodoRoutes(app, dbPath);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const message = statusCode >= 500 && !config.isDev
      ? 'Internal Server Error'
      : error.message ?? 'Internal Server Error';
    reply.status(statusCode).send({
      error: message,
      statusCode,
    });
  });

  return app;
}
