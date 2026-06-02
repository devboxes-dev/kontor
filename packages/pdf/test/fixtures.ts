import type { InvoiceDocument } from "../src/index.ts";

export const invoice: InvoiceDocument = {
  number: "2026-00412",
  // Issued just after midnight, so the invoice date is 1 April in Leipzig.
  issuedAt: new Date("2026-03-31T22:15:00Z"),
  dueOn: "2026-04-15",
  vatRatePercent: 19,
  customer: {
    name: "Gärtnerei Lindenau GmbH",
    street: "Saalfelder Straße 9",
    postalCode: "04179",
    city: "Leipzig",
    country: "DE",
  },
  lines: [
    { description: "Kontor Basis, April 2026", quantity: 1, unitPriceCents: 2900 },
    { description: "Zusätzliche Nutzer", quantity: 3, unitPriceCents: 450 },
    { description: "SMS-Erinnerungen", quantity: 120, unitPriceCents: 9 },
  ],
};
