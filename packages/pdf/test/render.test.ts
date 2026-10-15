import { describe, expect, it } from "vitest";
import { renderInvoicePdf } from "../src/index.ts";
import { invoice } from "./fixtures.ts";
import { pdfText } from "./pdf-text.ts";

describe("renderInvoicePdf", () => {
  it("renders an invoice", async () => {
    expect(await pdfText(await renderInvoicePdf(invoice))).toMatchSnapshot();
  });

  it("asks for payment within 14 days of the invoice date", async () => {
    const due = new Date(invoice.issuedAt);
    due.setDate(due.getDate() + 14);
    const dueDate = due.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    expect(await pdfText(await renderInvoicePdf(invoice))).toContain(`Zahlbar bis ${dueDate} ohne Abzug.`);
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
