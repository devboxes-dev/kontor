interface OpenInvoice {
  id: string;
  number: string;
  customer: string;
  dueOn: string;
}

const invoiceRows = document.querySelector<HTMLTableSectionElement>("#invoices")!;

async function showOpenInvoices() {
  const response = await fetch("/api/invoices?status=open");
  const invoices: OpenInvoice[] = await response.json();
  invoiceRows.replaceChildren(
    ...invoices.map((invoice) => {
      const row = document.createElement("tr");
      const pdf = document.createElement("a");
      pdf.href = `/api/invoices/${invoice.id}/pdf`;
      pdf.textContent = "PDF";
      for (const value of [invoice.number, invoice.customer, invoice.dueOn]) {
        row.insertCell().textContent = value;
      }
      row.insertCell().append(pdf);
      return row;
    }),
  );
}

await showOpenInvoices();
