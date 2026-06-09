# Kontor

Invoicing and payment reminders for small businesses in Germany and Austria.

| Path | What it is |
| --- | --- |
| `apps/api` | HTTP API for customers, invoices and invoice PDFs (Hono) |
| `apps/worker` | Scheduled jobs: invoice emails every 10 minutes, payment reminders at 06:00 Leipzig time |
| `packages/db` | Database schema and migrations (Drizzle, PostgreSQL) |
| `packages/pdf` | Invoice and reminder PDFs (pdf-lib) |
| `docs` | How reminders work, and how we work |

## Getting started

You need Node 24 and pnpm 10.

```sh
pnpm install
pnpm typecheck
pnpm test
```

The tests run against an in-memory PostgreSQL ([PGlite](https://pglite.dev)), so there is nothing else to start.

## Running it locally

Start a PostgreSQL 17 and apply the migrations:

```sh
export DATABASE_URL=postgres://kontor:kontor@localhost:5432/kontor
pnpm --filter @kontor/db migrate
pnpm --filter @kontor/api dev    # http://localhost:3000
```

The worker also needs the mail API:

```sh
MAIL_API_URL=https://mail.example MAIL_API_TOKEN=... pnpm --filter @kontor/worker start
```

To change the database, edit `packages/db/src/schema.ts` and run `pnpm --filter @kontor/db generate`.

Read [docs/contributing.md](docs/contributing.md) before you open a pull request.
