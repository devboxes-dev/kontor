import { sql } from "drizzle-orm";
import { date, integer, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull(),
  street: text().notNull(),
  postalCode: text().notNull(),
  city: text().notNull(),
  country: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const invoiceNumbers = pgSequence("invoice_numbers");

export const invoices = pgTable("invoices", {
  id: uuid().primaryKey().defaultRandom(),
  number: text()
    .notNull()
    .unique()
    .default(sql`to_char(now() at time zone 'Europe/Berlin', 'YYYY') || '-' || lpad(nextval('invoice_numbers')::text, 5, '0')`),
  customerId: uuid()
    .notNull()
    .references(() => customers.id),
  issuedAt: timestamp({ withTimezone: true }).notNull(),
  dueOn: date().notNull(),
  vatRatePercent: integer().notNull().default(19),
  sentAt: timestamp({ withTimezone: true }),
  paidAt: timestamp({ withTimezone: true }),
});

export const lineItems = pgTable("line_items", {
  id: uuid().primaryKey().defaultRandom(),
  invoiceId: uuid()
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  position: integer().notNull(),
  description: text().notNull(),
  quantity: integer().notNull(),
  unitPriceCents: integer().notNull(),
});
