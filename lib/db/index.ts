import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "@/lib/db/schema";

// Edge-compatible configuration - don't use dotenv in Edge runtime
// Next.js automatically loads environment variables
const sql = neon(process.env.DATABASE_URL!);

// Provide the schema to drizzle so the returned `db` object is properly typed
export const db = drizzle(sql, { schema });
