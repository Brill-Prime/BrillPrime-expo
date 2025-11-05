
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

// Use Replit Neon PostgreSQL database URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Please check your database configuration.",
  );
}

// Create postgres client for Replit Neon PostgreSQL
const client = postgres(databaseUrl, {
  prepare: false,
});

export const db = drizzle(client, { schema });
