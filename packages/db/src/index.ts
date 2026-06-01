import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";

export * from "./schema.ts";
export * from "./calendar.ts";
export { schema };

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export function connect(url: string): Database {
  return drizzle(url, { schema, casing: "snake_case" });
}
