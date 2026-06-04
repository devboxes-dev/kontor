import { type Database, invoices } from "@kontor/db";
import { createTestDatabase } from "@kontor/db/testing";
import { beforeEach, expect, it } from "vitest";
import { sendInvoices } from "../src/jobs/send-invoices.ts";
import { createInvoice, fakeMail } from "./helpers.ts";

let db: Database;

beforeEach(async () => {
  db = await createTestDatabase();
});

it("sends each new invoice once, with its PDF attached", async () => {
  const invoice = await createInvoice(db, { sent: false });
  const mail = fakeMail();

  expect(await sendInvoices(db, mail.sender)).toEqual({ sent: 1 });
  expect(await sendInvoices(db, mail.sender)).toEqual({ sent: 0 });

  expect(mail.delivered).toHaveLength(1);
  expect(mail.delivered[0]).toMatchObject({
    to: "buchhaltung@gaertnerei-lindenau.example",
    subject: `Ihre Rechnung ${invoice.number}`,
    attachments: [{ filename: `Rechnung-${invoice.number}.pdf` }],
  });
  const [stored] = await db.select().from(invoices);
  expect(stored!.sentAt).not.toBeNull();
});
