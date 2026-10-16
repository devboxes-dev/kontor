import { type Database, reminders } from "@kontor/db";
import { createTestDatabase } from "@kontor/db/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendReminders } from "../src/jobs/send-reminders.ts";
import { createInvoice, fakeMail } from "./helpers.ts";

let db: Database;

beforeEach(async () => {
  db = await createTestDatabase();
});

// 06:00 in Leipzig on the given day, when the reminder job runs.
const morningOf = (date: string) => new Date(`${date}T04:00:00Z`);

describe("sendReminders", () => {
  it("sends the first reminder seven days after the due date", async () => {
    const invoice = await createInvoice(db, { dueOn: "2026-04-15" });
    const mail = fakeMail();

    await sendReminders(db, mail.sender, morningOf("2026-04-21"));
    expect(mail.delivered).toHaveLength(0);

    await sendReminders(db, mail.sender, morningOf("2026-04-22"));
    expect(mail.delivered.map((sent) => sent.subject)).toEqual([`Zahlungserinnerung zu Rechnung ${invoice.number}`]);
  });

  it("sends the next reminder every seven days, with the late fee from the second on", async () => {
    await createInvoice(db, { dueOn: "2026-04-15" });
    const mail = fakeMail();

    for (const day of ["2026-04-22", "2026-04-29", "2026-05-06", "2026-05-13"]) {
      await sendReminders(db, mail.sender, morningOf(day));
    }

    const sent = await db.select().from(reminders).orderBy(reminders.level);
    expect(sent.map(({ level, lateFeeCents, sentOn }) => ({ level, lateFeeCents, sentOn }))).toEqual([
      { level: 1, lateFeeCents: 0, sentOn: "2026-04-22" },
      { level: 2, lateFeeCents: 500, sentOn: "2026-04-29" },
      { level: 3, lateFeeCents: 500, sentOn: "2026-05-06" },
    ]);
    expect(mail.delivered).toHaveLength(3);
  });

  it("does not remind paid or unsent invoices", async () => {
    await createInvoice(db, { paid: true });
    await createInvoice(db, { sent: false });
    const mail = fakeMail();

    expect(await sendReminders(db, mail.sender, morningOf("2026-04-22"))).toEqual({ sent: 0 });
  });

  it("sends a reminder only once when the job runs twice on a day", async () => {
    await createInvoice(db, { dueOn: "2026-04-15" });
    const mail = fakeMail();

    await sendReminders(db, mail.sender, morningOf("2026-04-22"));
    await sendReminders(db, mail.sender, new Date("2026-04-22T12:00:00Z"));

    expect(mail.delivered).toHaveLength(1);
  });

  it("does not redeliver a reminder on retry when the mail API accepted it but its response was lost", async () => {
    const invoice = await createInvoice(db, { dueOn: "2026-10-07" });
    const mail = fakeMail();
    const send = vi.fn(mail.sender.send).mockImplementationOnce(async (...args) => {
      await mail.sender.send(...args);
      throw new Error("mail API response lost");
    });

    await expect(sendReminders(db, { send }, new Date("2026-10-14T04:02:00Z"))).rejects.toThrow("mail API response lost");
    expect(mail.delivered).toHaveLength(1);
    expect(await db.select().from(reminders)).toHaveLength(0);

    expect(await sendReminders(db, { send }, new Date("2026-10-14T04:17:00Z"))).toEqual({ sent: 1 });
    expect(mail.delivered).toHaveLength(1);
    expect(await db.select().from(reminders)).toMatchObject([{ invoiceId: invoice.id, level: 1, sentOn: "2026-10-14" }]);
  });

  it("moves a reminder due on a weekend to Monday", async () => {
    await createInvoice(db, { dueOn: "2026-04-18" });
    const mail = fakeMail();

    await sendReminders(db, mail.sender, morningOf("2026-04-25"));
    await sendReminders(db, mail.sender, morningOf("2026-04-26"));
    expect(mail.delivered).toHaveLength(0);

    await sendReminders(db, mail.sender, morningOf("2026-04-27"));
    expect(mail.delivered).toHaveLength(1);
  });
});
