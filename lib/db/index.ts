import { drizzle } from 'drizzle-orm/neon-http';
import { schema } from "@/lib/db/schema";

// Note: In Edge runtime, environment variables are automatically available
// No need to call dotenv config() which uses process.cwd()
export const db = drizzle(process.env.DATABASE_URL!, { schema });
