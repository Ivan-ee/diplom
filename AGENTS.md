# AGENTS.md

Instructions for AI coding agents working in this repository.

Codex loads `AGENTS.md` files hierarchically. This root file applies to the whole repository; nested files in `apps/web`, `apps/api`, and `packages/db` add more specific rules for those subtrees.

## Project Context

- This is `Bakery`: a TypeScript monorepo for a confectionery e-commerce site with a 3D cake constructor as the core feature.
- Read [README.md](README.md) for startup commands, [docs/PROJECT.md](docs/PROJECT.md) for the technical map, and [CONTEXT.md](CONTEXT.md) for domain language before making domain or architecture changes.
- Use the glossary terms from `CONTEXT.md`: `Пользователь`, `Администратор`, `Товар каталога`, `Позиция заказа`, `Конфигурация торта`, `Основа торта`, `Начинка`, `Покрытие`, `Декор`, `Заказ`, `Заявка на самовывоз`.
- Do not describe a constructor cake as a `Product`. A constructor cake is an `OrderItem` of type `constructor` with a `CakeConfig`.

## Repository Layout

- `apps/web` — Next.js web app, UI, cart, checkout, account pages, admin pages, and 3D constructor.
- `apps/api` — NestJS REST API for products, constructor, orders, auth, upload, promo codes, search, and admin operations.
- `packages/db` — Drizzle schema, migrations, seed data, and MinIO asset upload scripts.
- `packages/shared-types` — shared TypeScript types for web and API.
- `apps/web/public/models` and `Cakes` — GLB model assets for constructor rendering.

## Commands

- Install dependencies: `pnpm install` or `make install`.
- Full Docker startup: `cp .env.example .env`, then `docker compose up -d postgres minio minio-init meilisearch`, `docker compose --profile seed run --rm --build seed`, `docker compose up -d --build`.
- Dev mode: `make dev` or `pnpm dev`.
- Build all packages: `pnpm build`.
- Type-check all packages: `pnpm type-check` or `make type-check`.
- Tests: `make test`, `pnpm --filter @bakery/web test`, `pnpm --filter @bakery/api test`.
- DB migration commands: `pnpm --filter @bakery/db db:generate`, `pnpm --filter @bakery/db db:migrate`, `pnpm --filter @bakery/db seed`.
- Docs-only changes require at least `git diff --check`; do not run unrelated test suites unless the docs change affects executable examples or commands.

## Cross-Cutting Rules

- Use `pnpm`; do not introduce npm/yarn lockfiles.
- Prefer existing package patterns over new abstractions. Search with `rg` before adding new helpers, DTOs, stores, schemas, or components.
- Keep runtime API, database schema, and shared type changes synchronized. If a DTO/schema/type shape changes, update all consumers and relevant tests in the same change.
- Keep monetary values as integer kopecks unless an existing schema field explicitly uses another representation.
- Be explicit about weight units:
  - Web cart item weight is stored in grams.
  - Constructor order DTO weight is integer tenths of kg.
  - API order item weight is accepted as integer tenths of kg and persisted as decimal kg.
  - Product minimum weight checks use tenths of kg on the API side.
- Server-side price recalculation is the source of truth. Never trust client-supplied item prices or constructor totals.
- Preserve the existing response envelope: successful API responses are exposed as `{ success: true, data, meta? }`; client helpers expect that shape.
- Preserve auth and security controls: httpOnly JWT cookie, role guards, CSRF middleware for state-changing requests, validation pipes, throttling where present.
- Do not put secrets in committed files. Use `.env.example` only for safe local defaults.
- Avoid editing generated or vendored files under `node_modules`, `.next`, `dist`, `.turbo`, `docker-volumes`, and MinIO data.

## Constructor Rules

- The 3D constructor has both visual state and business state. Keep them aligned:
  - Visual variants live around `apps/web/src/lib/constructor/model-registry.ts` and GLB assets.
  - Business ingredients live in DB schema/seed data and API constructor endpoints.
  - Cart/order conversion lives in `apps/web/src/lib/constructor/order-adapter.ts`.
- When changing constructor choices, check the full path: UI step, Zustand store, model registry, API DTO/service, seed data, order adapter, cart/checkout display, tests.
- Do not make screenshot upload required for ordering. It is a helpful order preview, not the business source of truth.
- If API ingredient loading fails, the web constructor currently falls back to mock data for development. Do not remove that behavior without replacing the development path.

## Documentation Rules

- Keep `CONTEXT.md` as a domain glossary only. Do not add implementation notes, file paths, commands, or architecture decisions there.
- Put technical project guidance in `docs/PROJECT.md` or a focused docs file.
- Create ADRs only for hard-to-reverse, non-obvious trade-off decisions.
- If you introduce a new domain term or change a domain boundary, update `CONTEXT.md` in the same change.

## Verification Expectations

- For focused code changes, run the narrowest relevant test first, then broader checks if shared behavior changed.
- For frontend behavior changes, run `pnpm --filter @bakery/web test` and type-check when types/routes/stores change.
- For API behavior changes, run `pnpm --filter @bakery/api test` and type-check when DTOs/services/guards change.
- For DB/schema/seed changes, run validation/migration commands relevant to the edited files and document any command that cannot run locally.
- Before finishing, run `git diff --check` and report exactly what verification was run.
