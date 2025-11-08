import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { schema } from "@/lib/db/schema";

// Load environment variables for Node.js runtime (used in seed scripts)
// In Edge runtime, environment variables are automatically available
if (typeof window === 'undefined' && !process.env.VERCEL) {
  config({ path: '.env' });
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the database connection
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
