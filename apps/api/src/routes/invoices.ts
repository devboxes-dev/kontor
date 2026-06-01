import { zValidator } from "@hono/zod-validator";
import { addDays, customers, type Database, invoices, leipzigDate, lineItems } from "@kontor/db";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const paymentTermDays = 14;

const invoiceInput = z.object({
  customerId: z.uuid(),
  lines: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.int().positive(),
      unitPriceCents: z.int().nonnegative(),
    }),
  ),
});

export function invoiceRoutes(db: Database) {
  return new Hono()
    .get("/", async (c) => {
      const rows = await db
        .select({
          id: invoices.id,
          number: invoices.number,
          customer: customers.name,
          issuedAt: invoices.issuedAt,
          dueOn: invoices.dueOn,
          paidAt: invoices.paidAt,
        })
        .from(invoices)
        .innerJoin(customers, eq(invoices.customerId, customers.id))
        .orderBy(desc(invoices.issuedAt));
      return c.json(rows);
    })
    .post("/", zValidator("json", invoiceInput), async (c) => {
      const input = c.req.valid("json");
      const issuedAt = new Date();
      const issuedOn = leipzigDate(issuedAt);
      const invoice = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(invoices)
          .values({
            customerId: input.customerId,
            issuedAt,
            dueOn: addDays(issuedOn, paymentTermDays),
          })
          .returning();
        await tx
          .insert(lineItems)
          .values(input.lines.map((line, index) => ({ ...line, invoiceId: created!.id, position: index + 1 })));
        return created!;
      });
      return c.json(invoice, 201);
    })
    .get("/:id", async (c) => {
      const id = c.req.param("id");
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      if (!invoice) return c.notFound();
      const lines = await db.select().from(lineItems).where(eq(lineItems.invoiceId, id)).orderBy(lineItems.position);
      return c.json({ ...invoice, lines });
    });
}
