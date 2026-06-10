import { type Database, reminders } from "@kontor/db";
import { createTestDatabase } from "@kontor/db/testing";
import { beforeEach, describe, expect, it } from "vitest";
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
    await createInvoice(db, { dueOn: "2026-04-15" });
    const mail = fakeMail();

    await sendReminders(db, mail.sender, morningOf("2026-04-21"));
    expect(mail.delivered).toHaveLength(0);

    await sendReminders(db, mail.sender, morningOf("2026-04-22"));
    expect(mail.delivered.map((sent) => sent.subject)).toEqual(["Zahlungserinnerung"]);
  });

  it("sends the next reminder every seven days, up to the third", async () => {
    await createInvoice(db, { dueOn: "2026-04-15" });
    const mail = fakeMail();

    for (const day of ["2026-04-22", "2026-04-29", "2026-05-06", "2026-05-13"]) {
      await sendReminders(db, mail.sender, morningOf(day));
    }

    const sent = await db.select().from(reminders).orderBy(reminders.level);
    expect(sent.map(({ level, sentOn }) => ({ level, sentOn }))).toEqual([
      { level: 1, sentOn: "2026-04-22" },
      { level: 2, sentOn: "2026-04-29" },
      { level: 3, sentOn: "2026-05-06" },
    ]);
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
});
