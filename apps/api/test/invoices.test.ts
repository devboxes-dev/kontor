import type { Database } from "@kontor/db";
import { createTestDatabase } from "@kontor/db/testing";
import { testClient } from "hono/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.ts";

const clientFor = (db: Database) => testClient(createApp(db));
let api: ReturnType<typeof clientFor>;

beforeEach(async () => {
  api = clientFor(await createTestDatabase());
});

afterEach(() => {
  vi.useRealTimers();
});

const customer = {
  name: "Gärtnerei Lindenau GmbH",
  email: "buchhaltung@gaertnerei-lindenau.example",
  street: "Saalfelder Straße 9",
  postalCode: "04179",
  city: "Leipzig",
  country: "DE",
} as const;

async function createCustomer() {
  const response = await api.customers.$post({ json: customer });
  if (response.status !== 201) throw new Error(await response.text());
  return response.json();
}

async function createInvoice() {
  const { id: customerId } = await createCustomer();
  const response = await api.invoices.$post({
    json: { customerId, lines: [{ description: "Kontor Basis, April 2026", quantity: 1, unitPriceCents: 2900 }] },
  });
  if (response.status !== 201) throw new Error(await response.text());
  return response.json();
}

describe("customers", () => {
  it("stores German as the default language", async () => {
    expect(await createCustomer()).toMatchObject({ name: customer.name, locale: "de" });
  });

  it("stores the customer's language", async () => {
    const response = await api.customers.$post({ json: { ...customer, locale: "en" } });
    if (response.status !== 201) throw new Error(await response.text());
    expect(await response.json()).toMatchObject({ locale: "en" });
  });

  it("rejects a customer without a valid email address", async () => {
    const response = await api.customers.$post({ json: { ...customer, email: "buchhaltung" } });
    expect(response.status).toBe(400);
  });

  it("rejects a customer without a valid postal code", async () => {
    const response = await api.customers.$post({ json: { ...customer, postalCode: "Leipzig" } });
    expect(response.status).toBe(400);
  });

  it("rejects a German postal code with four digits", async () => {
    const response = await api.customers.$post({ json: { ...customer, postalCode: "4179" } });
    expect(response.status).toBe(400);
  });

  it("accepts an Austrian postal code with four digits", async () => {
    const viennese = { ...customer, postalCode: "1070", city: "Wien", country: "AT" } as const;
    expect((await api.customers.$post({ json: viennese })).status).toBe(201);
  });
});

describe("invoices", () => {
  it("numbers invoices and makes them due 14 days after the invoice date in Leipzig", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-31T22:15:00Z"));

    const first = await createInvoice();
    const second = await createInvoice();

    expect(first.number).toMatch(/^\d{4}-00001$/);
    expect(second.number).toMatch(/^\d{4}-00002$/);
    expect(first.dueOn).toBe("2026-04-15");
  });

  it("rejects an invoice without lines", async () => {
    const { id: customerId } = await createCustomer();
    const response = await api.invoices.$post({ json: { customerId, lines: [] } });
    expect(response.status).toBe(400);
  });

  it("serves the invoice as a PDF", async () => {
    const invoice = await createInvoice();
    const response = await api.invoices[":id"].pdf.$get({ param: { id: invoice.id } });
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(`inline; filename="Rechnung-${invoice.number}.pdf"`);
    expect(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-");
  });

  it("rejects a malformed invoice id", async () => {
    const response = await api.invoices[":id"].pdf.$get({ param: { id: "2026-00412" } });
    expect(response.status).toBe(400);
  });

  it("lists only unpaid invoices as open", async () => {
    const paid = await createInvoice();
    const open = await createInvoice();
    expect((await api.invoices[":id"].payment.$post({ param: { id: paid.id } })).status).toBe(200);

    const response = await api.invoices.$get({ query: { status: "open" } });
    if (response.status !== 200) throw new Error(await response.text());
    expect((await response.json()).map((invoice) => invoice.id)).toEqual([open.id]);
  });
});
