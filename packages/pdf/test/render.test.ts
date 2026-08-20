import { describe, expect, it } from "vitest";
import { renderInvoicePdf } from "../src/index.ts";
import { invoice } from "./fixtures.ts";
import { pdfText } from "./pdf-text.ts";

describe("renderInvoicePdf", () => {
  it("renders an invoice", async () => {
    expect(await pdfText(await renderInvoicePdf(invoice))).toMatchSnapshot();
  });

  it("prints the country for addresses outside Germany", async () => {
    const austrian = { ...invoice, customer: { ...invoice.customer, postalCode: "1070", city: "Wien", country: "AT" } };
    expect(await pdfText(await renderInvoicePdf(austrian))).toContain("Österreich");
  });

  it("renders a reminder with the late fee", async () => {
    const reminder = { ...invoice, reminder: { level: 2 as const, lateFeeCents: 500 } };
    expect(await pdfText(await renderInvoicePdf(reminder))).toMatchSnapshot();
  });
});
