# Payment reminders

The worker reminds customers of invoices that were sent and are not paid.

## When

The reminder job runs every day at 06:00 Leipzig time. For each overdue invoice it sends at most the next reminder:

| Level | Sent | Title |
| --- | --- | --- |
| 1 | 7 days after the due date | Zahlungserinnerung |
| 2 | 14 days after the due date | Mahnung |
| 3 | 21 days after the due date | Letzte Mahnung |

## What the customer gets

An email to the customer's address with the reminder as a PDF attachment. The subject is the reminder's title. The PDF lists the invoice lines.

## Failures

When the job fails, the next morning's run sends what is missing. Reminders that the job already recorded are not sent again.
