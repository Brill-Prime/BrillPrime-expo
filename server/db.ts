
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema";

// Use Supabase database URL
const databaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_DATABASE_URL must be set. Please check your Supabase configuration.",
  );
}

// Create postgres client for Supabase
const client = postgres(databaseUrl, {
  prepare: false,
  ssl: 'require'
});

export const db = drizzle(client, { schema });
