import type { InvoiceDocument } from "./render.ts";

export function invoiceTotals({ lines, vatRatePercent, reminder }: Omit<InvoiceDocument, "customer">) {
  const netCents = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  const vatCents = Math.round((netCents * vatRatePercent) / 100);
  const lateFeeCents = reminder?.lateFeeCents ?? 0;
  return { netCents, vatCents, lateFeeCents, totalCents: netCents + vatCents };
}
