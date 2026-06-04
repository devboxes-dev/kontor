import { eq } from "drizzle-orm";
import type { Database } from "./index.ts";
import { customers, invoices, lineItems } from "./schema.ts";

export async function findInvoice(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.id, id));
  if (!row) return undefined;
  const lines = await db.select().from(lineItems).where(eq(lineItems.invoiceId, id)).orderBy(lineItems.position);
  return { ...row.invoices, customer: row.customers, lines };
}
