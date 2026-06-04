import { connect } from "@kontor/db";
import { Cron } from "croner";
import { sendInvoices } from "./jobs/send-invoices.ts";
import { httpMailSender } from "./mail.ts";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const db = connect(env("DATABASE_URL"));
const mail = httpMailSender({ url: env("MAIL_API_URL"), token: env("MAIL_API_TOKEN") });

new Cron("*/10 * * * *", { protect: true }, () =>
  sendInvoices(db, mail).then(
    (result) => console.log("send-invoices: done", result),
    (error) => console.error("send-invoices: failed", error),
  ),
);

console.log("worker started");
