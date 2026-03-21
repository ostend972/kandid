import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL (or POSTGRES_URL) environment variable is not set'
  );
}

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
