# Contributing

How the billing team works on Kontor. Ask in #billing-eng if something here is unclear.

## Rules

1. Every bug fix comes with a test that fails without it.
2. Update the docs in the same change when behaviour changes.
3. Add a line to the Unreleased section of `CHANGELOG.md` for every change a customer or support would notice.
4. Change the database only through a generated migration. Never edit a migration that is on `main`.

## Pull requests

- Branch from `main` and name the branch `<your-name>/<topic>`.
- Keep a pull request to one change. A refactoring the change needs goes in its own pull request first.
- CI runs the typecheck, the unit tests and the PDF snapshot tests. All three must pass before you merge.
- One approval from the billing team, then merge with a merge commit.
- If a PDF snapshot changes on purpose, update it with `pnpm --filter @kontor/pdf test -u` and point it out in the pull request.

## Releases

Anna or Nina cut releases. Move the Unreleased lines into a new version in `CHANGELOG.md`, commit it as "Release x.y.z" and tag it `vx.y.z`. Deploys start from the tag.
