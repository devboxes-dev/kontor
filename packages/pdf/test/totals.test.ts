import { expect, it } from "vitest";
import { invoiceTotals } from "../src/totals.ts";
import { invoice } from "./fixtures.ts";

it("rounds VAT once on the net total, not per line", () => {
  const lines = Array.from({ length: 5 }, () => ({ description: "SMS-Erinnerung", quantity: 1, unitPriceCents: 7 }));
  expect(invoiceTotals({ ...invoice, lines })).toEqual({ netCents: 35, vatCents: 7, totalCents: 42 });
});
