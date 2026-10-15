import { addDays, type Database, findInvoice, invoices, leipzigDate, reminders } from "@kontor/db";
import { labels, renderInvoicePdf } from "@kontor/pdf";
import { and, count, eq, isNotNull, isNull, lt } from "drizzle-orm";
import type { MailSender } from "../mail.ts";

const reminderLevels = [
  { level: 1, daysOverdue: 7, lateFeeCents: 0 },
  { level: 2, daysOverdue: 14, lateFeeCents: 500 },
  { level: 3, daysOverdue: 21, lateFeeCents: 500 },
] as const;

export async function sendReminders(db: Database, mail: MailSender, now = new Date()) {
  const today = leipzigDate(now);
  if (isWeekend(today)) return { sent: 0 };

  const overdue = await db
    .select({ id: invoices.id, dueOn: invoices.dueOn, reminded: count(reminders.id) })
    .from(invoices)
    .leftJoin(reminders, eq(reminders.invoiceId, invoices.id))
    .where(and(isNotNull(invoices.sentAt), isNull(invoices.paidAt), lt(invoices.dueOn, today)))
    .groupBy(invoices.id);

  let sent = 0;
  for (const { id, dueOn, reminded } of overdue) {
    const next = reminderLevels[reminded];
    if (!next || addDays(dueOn, next.daysOverdue) > today) continue;

    const invoice = (await findInvoice(db, id))!;
    const title = labels.reminder[next.level];
    const pdf = await renderInvoicePdf({ ...invoice, reminder: { level: next.level, lateFeeCents: next.lateFeeCents } });
    await mail.send({
      to: invoice.customer.email,
      subject: `${title} zu Rechnung ${invoice.number}`,
      text: `Guten Tag,\n\nzu Rechnung ${invoice.number} konnten wir noch keine Zahlung feststellen. Die Details finden Sie im Anhang.\n\nViele Grüße\nIhr Kontor-Team`,
      attachments: [{ filename: `${title}-${invoice.number}.pdf`, content: pdf }],
    });
    await db.insert(reminders).values({ invoiceId: id, level: next.level, lateFeeCents: next.lateFeeCents, sentOn: today });
    sent++;
  }
  return { sent };
}

function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}
