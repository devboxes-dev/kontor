import type { InvoiceDocument } from "./render.ts";

export function invoiceTotals({ lines, vatRatePercent }: Pick<InvoiceDocument, "lines" | "vatRatePercent">) {
  const netCents = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  const vatCents = Math.round((netCents * vatRatePercent) / 100);
  return { netCents, vatCents, totalCents: netCents + vatCents };
}
