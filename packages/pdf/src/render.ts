import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib";
import { countries, formatDate, formatMoney, labels } from "./locale.ts";
import { invoiceTotals } from "./totals.ts";

export interface InvoiceDocument {
  number: string;
  issuedAt: Date;
  dueOn: string;
  vatRatePercent: number;
  customer: {
    name: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    locale: "de" | "en";
  };
  lines: { description: string; quantity: number; unitPriceCents: number }[];
  reminder?: { level: 1 | 2 | 3; lateFeeCents: number };
}

const seller = "Kontor GmbH · Beispielweg 4 · 04109 Leipzig";
const footer = [
  "Kontor GmbH · Beispielweg 4 · 04109 Leipzig · Amtsgericht Leipzig HRB 00000",
  "USt-IdNr. DE000000000 · IBAN DE89 3704 0044 0532 0130 00 · BIC COBADEFFXXX",
];

const left = 56;
const right = 539;
const columns = { position: left, description: left + 36, quantity: 360, unitPrice: 450, amount: right };

export async function renderInvoicePdf(invoice: InvoiceDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${labels.invoice} ${invoice.number}`);
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const text = (value: string, x: number, y: number, font = regular, size = 10) =>
    page.drawText(value, { x, y, font, size, color: rgb(0.1, 0.1, 0.1) });

  text(seller, left, 790, regular, 7);
  const { customer } = invoice;
  const address = [customer.name, customer.street, `${customer.postalCode} ${customer.city}`];
  if (customer.country !== "DE") address.push(countries[customer.country] ?? customer.country);
  address.forEach((line, index) => text(line, left, 760 - index * 14));

  const title = invoice.reminder ? labels.reminder[invoice.reminder.level] : `${labels.invoice} ${invoice.number}`;
  text(title, left, 660, bold, 16);
  text(`${labels.invoiceDate}: ${formatDate(invoice.issuedAt)}`, left, 636);

  let y = 600;
  text(labels.position, columns.position, y, bold);
  text(labels.description, columns.description, y, bold);
  textRight(page, labels.quantity, columns.quantity, y, bold);
  textRight(page, labels.unitPrice, columns.unitPrice, y, bold);
  textRight(page, labels.amount, columns.amount, y, bold);

  invoice.lines.forEach((line, index) => {
    y -= 18;
    text(String(index + 1), columns.position, y);
    text(line.description, columns.description, y);
    textRight(page, String(line.quantity), columns.quantity, y, regular);
    textRight(page, formatMoney(line.unitPriceCents), columns.unitPrice, y, regular);
    textRight(page, formatMoney(line.quantity * line.unitPriceCents), columns.amount, y, regular);
  });

  const totals = invoiceTotals(invoice);
  const sums: [string, number][] = [
    [labels.net, totals.netCents],
    [labels.vat(invoice.vatRatePercent), totals.vatCents],
  ];
  if (totals.lateFeeCents > 0) sums.push([labels.lateFee, totals.lateFeeCents]);
  y -= 12;
  for (const [label, cents] of sums) {
    y -= 18;
    textRight(page, label, columns.unitPrice, y, regular);
    textRight(page, formatMoney(cents), columns.amount, y, regular);
  }
  y -= 22;
  textRight(page, labels.total, columns.unitPrice, y, bold);
  textRight(page, formatMoney(totals.totalCents), columns.amount, y, bold);

  y -= 40;
  const dueDate = formatDate(new Date(invoice.dueOn));
  text(invoice.reminder ? labels.reminderText(invoice.number) : labels.paymentTerms(dueDate), left, y);

  footer.forEach((line, index) => text(line, left, 60 - index * 11, regular, 7));

  return pdf.save();
}

function textRight(page: PDFPage, value: string, x: number, y: number, font: PDFFont) {
  const size = 10;
  page.drawText(value, { x: x - font.widthOfTextAtSize(value, size), y, font, size, color: rgb(0.1, 0.1, 0.1) });
}
