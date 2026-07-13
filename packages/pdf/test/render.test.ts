import { describe, expect, it } from "vitest";
import { renderInvoicePdf } from "../src/index.ts";
import { invoice } from "./fixtures.ts";
import { pdfText } from "./pdf-text.ts";

describe("renderInvoicePdf", () => {
  it("renders an invoice", async () => {
    expect(await pdfText(await renderInvoicePdf(invoice))).toMatchSnapshot();
  });

  it("renders a reminder with the late fee", async () => {
    const reminder = { ...invoice, reminder: { level: 2 as const, lateFeeCents: 500 } };
    expect(await pdfText(await renderInvoicePdf(reminder))).toMatchSnapshot();
  });
});
