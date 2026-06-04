import { customers, type Database, invoices, lineItems } from "@kontor/db";
import type { Mail, MailSender } from "../src/mail.ts";

// Behaves like the mail API: a repeated idempotency key delivers nothing.
export function fakeMail() {
  const delivered: (Mail & { idempotencyKey?: string })[] = [];
  const sender: MailSender = {
    async send(mail, { idempotencyKey } = {}) {
      if (idempotencyKey && delivered.some((sent) => sent.idempotencyKey === idempotencyKey)) return;
      delivered.push({ ...mail, idempotencyKey });
    },
  };
  return { sender, delivered };
}

export async function createInvoice(
  db: Database,
  { dueOn = "2026-04-15", sent = true, paid = false }: { dueOn?: string; sent?: boolean; paid?: boolean } = {},
) {
  const [customer] = await db
    .insert(customers)
    .values({
      name: "Gärtnerei Lindenau GmbH",
      email: "buchhaltung@gaertnerei-lindenau.example",
      street: "Saalfelder Straße 9",
      postalCode: "04179",
      city: "Leipzig",
      country: "DE",
    })
    .returning();
  const [invoice] = await db
    .insert(invoices)
    .values({
      customerId: customer!.id,
      issuedAt: new Date("2026-03-31T22:15:00Z"),
      dueOn,
      sentAt: sent ? new Date("2026-04-01T08:00:00Z") : null,
      paidAt: paid ? new Date("2026-04-10T09:30:00Z") : null,
    })
    .returning();
  await db.insert(lineItems).values({
    invoiceId: invoice!.id,
    position: 1,
    description: "Kontor Basis, April 2026",
    quantity: 1,
    unitPriceCents: 2900,
  });
  return invoice!;
}
