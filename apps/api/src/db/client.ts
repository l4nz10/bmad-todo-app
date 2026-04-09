import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.ts';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(CURRENT_DIR, 'migrations');

interface DatabaseConnection {
  db: ReturnType<typeof drizzle>;
  sqlite: SqliteDatabase;
}

export function createDatabase(databasePath: string): DatabaseConnection {
  const sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return { db, sqlite };
}

export type AppDatabase = DatabaseConnection['db'];
