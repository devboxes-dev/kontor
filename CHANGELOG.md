# Changelog

Changes that customers or support notice. Versions follow [semantic versioning](https://semver.org).

## Unreleased

- The billing API and the worker live in one repository.
- The back office can record a payment and list only the open invoices.
- Fixed: VAT is rounded once on the net total instead of per line, so the PDF total matches the accounting export.

## Earlier versions

1.3.2 and earlier were released from the separate `kontor-api` and `kontor-worker` repositories.
