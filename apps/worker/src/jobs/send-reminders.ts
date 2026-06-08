import { addDays, type Database, findInvoice, invoices, leipzigDate, reminders } from "@kontor/db";
import { labels, renderInvoicePdf } from "@kontor/pdf";
import { and, count, eq, isNull, lt } from "drizzle-orm";
import type { MailSender } from "../mail.ts";

export const reminderLevels = [
  { level: 1, daysOverdue: 7 },
  { level: 2, daysOverdue: 14 },
  { level: 3, daysOverdue: 21 },
] as const;

export async function sendReminders(db: Database, mail: MailSender, now = new Date()) {
  const today = leipzigDate(now);

  const overdue = await db
    .select({ id: invoices.id, dueOn: invoices.dueOn, reminded: count(reminders.id) })
    .from(invoices)
    .leftJoin(reminders, eq(reminders.invoiceId, invoices.id))
    .where(and(isNull(invoices.paidAt), lt(invoices.dueOn, today)))
    .groupBy(invoices.id);

  let sent = 0;
  for (const { id, dueOn, reminded } of overdue) {
    const next = reminderLevels[reminded];
    if (!next || addDays(dueOn, next.daysOverdue) > today) continue;

    const invoice = (await findInvoice(db, id))!;
    const title = labels.reminder[next.level];
    const pdf = await renderInvoicePdf({ ...invoice, reminder: { level: next.level } });
    await mail.send({
      to: invoice.customer.email,
      subject: title,
      text: `Guten Tag,\n\nzu Rechnung ${invoice.number} konnten wir noch keine Zahlung feststellen. Die Details finden Sie im Anhang.\n\nViele Grüße\nIhr Kontor-Team`,
      attachments: [{ filename: `${title}-${invoice.number}.pdf`, content: pdf }],
    });
    await db.insert(reminders).values({ invoiceId: id, level: next.level, sentOn: today });
    sent++;
  }
  return { sent };
}
