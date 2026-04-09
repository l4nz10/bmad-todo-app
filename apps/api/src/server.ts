import { buildApp } from './app.ts';
import { config } from './config.ts';

async function start() {
  try {
    const app = await buildApp();

    const shutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully`);
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
    process.on('SIGINT', () => { void shutdown('SIGINT'); });

    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
