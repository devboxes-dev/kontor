import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema.ts";
import type { Database } from "./index.ts";

// An in-memory PostgreSQL with every migration applied, one per test.
export async function createTestDatabase(): Promise<Database> {
  const db = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
  return db;
}
