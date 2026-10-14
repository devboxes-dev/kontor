import { zValidator } from "@hono/zod-validator";
import {
  addDays,
  customers,
  type Database,
  findInvoice,
  invoices,
  leipzigDate,
  lineItems,
} from "@kontor/db";
import { renderInvoicePdf } from "@kontor/pdf";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const paymentTermDays = 14;

const invoiceInput = z.object({
  customerId: z.uuid(),
  lines: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.int().positive(),
        unitPriceCents: z.int().nonnegative(),
      }),
    )
    .min(1),
});

const idParam = z.object({ id: z.uuid() });

export function invoiceRoutes(db: Database) {
  return new Hono()
    .get("/", zValidator("query", z.object({ status: z.literal("open").optional() })), async (c) => {
      const open = c.req.valid("query").status === "open";
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
        .where(open ? isNull(invoices.paidAt) : undefined)
        .orderBy(open ? asc(invoices.dueOn) : desc(invoices.issuedAt));
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
    .get("/:id", zValidator("param", idParam), async (c) => {
      const invoice = await findInvoice(db, c.req.valid("param").id);
      return invoice ? c.json(invoice) : c.notFound();
    })
    .get("/:id/pdf", zValidator("param", idParam), async (c) => {
      const invoice = await findInvoice(db, c.req.valid("param").id);
      if (!invoice) return c.notFound();
      const pdf = await renderInvoicePdf(invoice);
      return c.body(new Uint8Array(pdf), 200, {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="Rechnung-${invoice.number}.pdf"`,
      });
    })
    .post("/:id/payment", zValidator("param", idParam), async (c) => {
      const [paid] = await db
        .update(invoices)
        .set({ paidAt: new Date() })
        .where(and(eq(invoices.id, c.req.valid("param").id), isNull(invoices.paidAt)))
        .returning();
      return paid ? c.json(paid) : c.notFound();
    });
}
