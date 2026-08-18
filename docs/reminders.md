# Payment reminders

The worker reminds customers of invoices that were sent and are not paid.

## When

The reminder job runs every day at 06:00 Leipzig time. For each overdue invoice it sends at most the next reminder:

| Level | Sent | Title | Late fee |
| --- | --- | --- | --- |
| 1 | 7 days after the due date | Zahlungserinnerung | none |
| 2 | 14 days after the due date | Mahnung | 5,00 € |
| 3 | 21 days after the due date | Letzte Mahnung | 5,00 € |

## What the customer gets

An email to the customer's address with the reminder as a PDF attachment. The subject names the reminder and the invoice number, for example "Mahnung zu Rechnung 2026-00412". The PDF lists the invoice lines and, from level 2, the late fee.

## Failures

The worker gives up on a mail API call after 10 seconds. When the job fails, the worker runs it again 15 minutes later, up to three attempts in total. Reminders that the job already recorded are not sent again.
