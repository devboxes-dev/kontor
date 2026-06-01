import type { Database } from "@kontor/db";
import { Hono } from "hono";
import { customerRoutes } from "./routes/customers.ts";
import { invoiceRoutes } from "./routes/invoices.ts";

export function createApp(db: Database) {
  return new Hono()
    .get("/health", (c) => c.json({ ok: true }))
    .route("/customers", customerRoutes(db))
    .route("/invoices", invoiceRoutes(db));
}
