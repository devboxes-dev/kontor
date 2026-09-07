# Invoices

## Numbers and dates

- Invoice numbers have the form `2026-00412`: the year in Leipzig, then a number from one sequence that never restarts.
- The invoice date is the day in Leipzig when the invoice was created. Payment is due 14 days later.
- VAT is 19 %, rounded once on the net total.

## Sending

The worker emails new invoices every 10 minutes, with the PDF attached. Each email carries the idempotency key `invoice-<id>`, so the mail API delivers it only once, even when the job runs again after a failure.

## Language

Each customer has a language, German or English, chosen in the customer form. Invoices, reminders and their emails use the customer's language.

## PDF

`packages/pdf` renders invoices and reminders. Its tests compare the text of the PDF with snapshots in `packages/pdf/test/__snapshots__`. To look at the PDF itself, run `pnpm --filter @kontor/pdf render-fixture invoice.pdf`.
