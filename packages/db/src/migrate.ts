import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const db = drizzle(url);
await migrate(db, { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
await db.$client.end();
