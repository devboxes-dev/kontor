export const labels = {
  invoice: "Rechnung",
  reminder: { 1: "Zahlungserinnerung", 2: "Mahnung", 3: "Letzte Mahnung" },
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
  reminderText: (number: string) =>
    `Zu Rechnung ${number} konnten wir noch keine Zahlung feststellen. Bitte überweisen Sie den offenen Betrag.`,
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
