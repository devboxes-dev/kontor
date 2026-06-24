import { connect } from "@kontor/db";
import { Cron } from "croner";
import { sendInvoices } from "./jobs/send-invoices.ts";
import { sendReminders } from "./jobs/send-reminders.ts";
import { httpMailSender } from "./mail.ts";
import { runWithRetries } from "./retry.ts";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const db = connect(env("DATABASE_URL"));
const mail = httpMailSender({ url: env("MAIL_API_URL"), token: env("MAIL_API_TOKEN") });

new Cron("*/10 * * * *", { protect: true }, () => runWithRetries("send-invoices", () => sendInvoices(db, mail)));
new Cron("0 6 * * *", { timezone: "Europe/Berlin", protect: true }, () =>
  runWithRetries("send-reminders", () => sendReminders(db, mail)),
);

console.log("worker started");
