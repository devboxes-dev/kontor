interface OpenInvoice {
  id: string;
  number: string;
  customer: string;
  issuedAt: string;
  dueOn: string;
}

const leipzigDay = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const invoiceRows = document.querySelector<HTMLTableSectionElement>("#invoices")!;
const customerForm = document.querySelector<HTMLFormElement>("#customer")!;

async function showOpenInvoices() {
  const response = await fetch("/api/invoices?status=open");
  const invoices: OpenInvoice[] = await response.json();
  invoiceRows.replaceChildren(
    ...invoices.map((invoice) => {
      const row = document.createElement("tr");
      const pdf = document.createElement("a");
      pdf.href = `/api/invoices/${invoice.id}/pdf`;
      pdf.textContent = "PDF";
      const issuedOn = leipzigDay.format(new Date(invoice.issuedAt));
      const dueOn = invoice.dueOn.split("-").reverse().join(".");
      for (const value of [invoice.number, invoice.customer, issuedOn, dueOn]) {
        row.insertCell().textContent = value;
      }
      row.insertCell().append(pdf);
      return row;
    }),
  );
}

customerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch("/api/customers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(customerForm))),
  });
  customerForm.querySelector("output")!.textContent = response.ok ? "Kunde angelegt." : "Bitte die Eingaben prüfen.";
  if (response.ok) customerForm.reset();
});

await showOpenInvoices();
