import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Single shared client. postgres-js handles connection pooling internally.
// `prepare: false` is recommended on serverless / edge environments.
const client = postgres(connectionString, {
  max: 10,
  ssl: connectionString.includes("railway.internal") ? false : "require",
});

export const db = drizzle(client, { schema });
export { schema };
