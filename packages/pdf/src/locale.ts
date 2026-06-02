export const labels = {
  invoice: "Rechnung",
  invoiceDate: "Rechnungsdatum",
  position: "Pos.",
  description: "Beschreibung",
  quantity: "Menge",
  unitPrice: "Einzelpreis",
  amount: "Betrag",
  net: "Zwischensumme",
  vat: (ratePercent: number) => `USt. ${ratePercent} %`,
  total: "Gesamtbetrag",
  paymentTerms: "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
};

const money = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const day = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatMoney(cents: number): string {
  return money.format(cents / 100);
}

export function formatDate(date: Date): string {
  return day.format(date);
}
