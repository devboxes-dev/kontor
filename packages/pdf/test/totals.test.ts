import { expect, it } from "vitest";
import { invoiceTotals } from "../src/totals.ts";
import { invoice } from "./fixtures.ts";

it("rounds VAT once on the net total, not per line", () => {
  const lines = Array.from({ length: 5 }, () => ({ description: "SMS-Erinnerung", quantity: 1, unitPriceCents: 7 }));
  expect(invoiceTotals({ ...invoice, lines })).toMatchObject({ netCents: 35, vatCents: 7, totalCents: 42 });
});

it("adds the late fee of a reminder to the total", () => {
  expect(invoiceTotals({ ...invoice, reminder: { level: 2, lateFeeCents: 500 } })).toEqual({
    netCents: 5330,
    vatCents: 1013,
    lateFeeCents: 500,
    totalCents: 6843,
  });
});
