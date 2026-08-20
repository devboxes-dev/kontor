# Changelog

Changes that customers or support notice. Versions follow [semantic versioning](https://semver.org).

## Unreleased

- PDF downloads are named after the invoice, for example `Rechnung-2026-00412.pdf`.
- The worker gives up on a mail API call after 10 seconds instead of waiting for it indefinitely. The job then runs again 15 minutes later.
- Reminder emails name the invoice number in the subject.
- Invoices to German addresses leave out the country. Addresses in Austria end with "Österreich" instead of "AT".

## 1.4.0 (2026-08-05)

- The billing API and the worker live in one repository.
- The back office can record a payment and list only the open invoices.
- Failed worker jobs run again after 15 minutes, up to three attempts. Before, a failed reminder run waited until the next morning.
- Customers have a language, German or English, for their invoices and reminders.
- A back-office page lists the open invoices with a link to each PDF, and has a form for new customers, including their language.
- The second and third reminder add a late fee of 5,00 €.
- Fixed: VAT is rounded once on the net total instead of per line, so the PDF total matches the accounting export.

## Earlier versions

1.3.2 and earlier were released from the separate `kontor-api` and `kontor-worker` repositories.
