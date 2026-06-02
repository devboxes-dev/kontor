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
  it("stores a customer", async () => {
    expect(await createCustomer()).toMatchObject({ name: customer.name, country: "DE" });
  });

  it("rejects a customer without a valid email address", async () => {
    const response = await api.customers.$post({ json: { ...customer, email: "buchhaltung" } });
    expect(response.status).toBe(400);
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
});
