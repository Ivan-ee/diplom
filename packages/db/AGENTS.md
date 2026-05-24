# packages/db AGENTS.md

Instructions for AI coding agents working in the database package.

## Scope

This file applies to `packages/db/**`. Follow the root `AGENTS.md` first, then these DB-specific rules.

## Schema and Migrations

- Drizzle schema files live in `src/schema`.
- SQL migrations live in `drizzle`.
- If you change a schema, generate and commit the corresponding migration unless the user explicitly asks for a prototype-only change.
- Use `pnpm --filter @bakery/db db:generate` to generate migrations.
- Use `pnpm --filter @bakery/db db:migrate` to apply pending migrations when a local database is available.
- Do not edit generated migration snapshots manually unless you are repairing a known Drizzle generation issue and can explain why.

## Data Modeling Rules

- Monetary values are integer kopecks.
- Product weight configuration fields are decimal kg in the database.
- Order item weight is persisted as decimal kg.
- Constructor price inputs use ingredient prices from constructor tables; keep product catalog tables separate from constructor ingredient tables.
- Constructor ingredients are:
  - `constructor_bases` — доменная `Основа торта`.
  - `constructor_fillings` — `Начинка`.
  - `constructor_coatings` — `Покрытие`.
  - `constructor_decorations` — `Декор`.
- Do not collapse constructor ingredients into `products`; constructor cakes are not catalog products.

## Seed Data and Assets

- Seed JSON files live in `seed-data`.
- Keep seed JSON aligned with Zod schemas in `seed-data/schemas.ts`.
- Product photos and constructor assets are uploaded to MinIO by scripts in `scripts`.
- Use `pnpm --filter @bakery/db seed` for DB seed data.
- Use `pnpm --filter @bakery/db assets:upload` for MinIO asset upload when assets change.
- Use `pnpm --filter @bakery/db seed:validate` before committing seed JSON changes when possible.
- Avoid committing local generated data from `docker-volumes`.

## Testing and Verification

- Run `pnpm --filter @bakery/db type-check` for TypeScript changes in this package.
- For seed data changes, run `pnpm --filter @bakery/db seed:validate` when the command is available in the current environment.
- For schema changes, include migration generation in the verification notes and state whether migration application was run locally.
