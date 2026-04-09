const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const DATABASE_PATH = process.env['DATABASE_PATH'] ?? './bmad.db';
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

export const config = {
  port: PORT,
  databasePath: DATABASE_PATH,
  nodeEnv: NODE_ENV,
  corsOrigin: CORS_ORIGIN,
  isDev: NODE_ENV === 'development',
} as const;
