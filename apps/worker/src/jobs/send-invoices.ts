import { type Database, findInvoice, invoices } from "@kontor/db";
import { renderInvoicePdf } from "@kontor/pdf";
import { eq, isNull } from "drizzle-orm";
import type { MailSender } from "../mail.ts";

export async function sendInvoices(db: Database, mail: MailSender, now = new Date()) {
  const unsent = await db.select({ id: invoices.id }).from(invoices).where(isNull(invoices.sentAt));
  for (const { id } of unsent) {
    const invoice = (await findInvoice(db, id))!;
    await mail.send(
      {
        to: invoice.customer.email,
        subject: `Ihre Rechnung ${invoice.number}`,
        text: `Guten Tag,\n\nim Anhang finden Sie Ihre Rechnung ${invoice.number}.\n\nViele Grüße\nIhr Kontor-Team`,
        attachments: [{ filename: `Rechnung-${invoice.number}.pdf`, content: await renderInvoicePdf(invoice) }],
      },
      { idempotencyKey: `invoice-${invoice.id}` },
    );
    await db.update(invoices).set({ sentAt: now }).where(eq(invoices.id, id));
  }
  return { sent: unsent.length };
}
