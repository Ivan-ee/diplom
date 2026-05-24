# Bakery

Интернет-магазин кондитерской с каталогом, корзиной, оформлением заказа и ключевой функцией проекта: интерактивным 3D-конструктором тортов.

Проект сделан как TypeScript-монорепозиторий:

- `apps/web` — Next.js web-приложение.
- `apps/api` — NestJS API.
- `packages/db` — Drizzle-схема, миграции и seed-данные.
- `packages/shared-types` — общие типы для web и API.

Подробнее об устройстве проекта: [docs/PROJECT.md](docs/PROJECT.md). Доменный словарь: [CONTEXT.md](CONTEXT.md).

## Что нужно установить

- Docker Desktop или Docker Engine с Docker Compose.
- Node.js и pnpm нужны для локальной разработки без полного Docker-стека.

Версия pnpm зафиксирована в `package.json`: `pnpm@10.28.2`.

## Быстрый старт в Docker

```bash
cp .env.example .env
docker compose up -d postgres minio minio-init meilisearch
docker compose --profile seed run --rm --build seed
docker compose up -d --build
```

После запуска:

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health
- Swagger: http://localhost:4000/api/docs
- MinIO console: http://localhost:9001
- Meilisearch: http://localhost:7700

## Дефолтный админ

- Почта: `admin@bakery.ru`
- Пароль: `admin123`

Значения берутся из `.env.example`; для локальной разработки они подходят, для production их нужно заменить.

## Основные команды

```bash
make help
make install
make dev
make docker-up
make docker-down
make db-seed-full
make test
make type-check
```

Прямые pnpm-команды:

```bash
pnpm dev
pnpm build
pnpm type-check
pnpm --filter @bakery/web test
pnpm --filter @bakery/api test
pnpm --filter @bakery/db db:migrate
pnpm --filter @bakery/db seed
```

## Ключевые web-маршруты

- `/` — главная страница.
- `/catalog` — каталог товаров.
- `/constructor` — публичный URL 3D-конструктора, переписывается на `/cake-constructor`.
- `/cart` — корзина.
- `/checkout` — оформление заявки на самовывоз.
- `/account/orders` — история заказов пользователя.
- `/admin/*` — административные разделы.

## Ключевые API-маршруты

- `GET /api/products` — список товаров.
- `GET /api/products/:slug` — карточка товара.
- `GET /api/constructor/ingredients` — доступные данные конструктора.
- `POST /api/constructor/calculate` — расчет цены конфигурации торта.
- `POST /api/orders` — создание заказа.
- `GET /api/orders` — заказы текущего пользователя.
- `POST /api/upload/presign` — presigned URL для загрузки файлов в MinIO.
- `/api/admin/*` — административные операции.

## Остановка и сброс данных

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить локальные данные:

```bash
docker compose down --remove-orphans
rm -rf docker-volumes/pgdata docker-volumes/minio docker-volumes/meili_data
```

После удаления данных нужно снова выполнить seed:

```bash
docker compose up -d postgres minio minio-init meilisearch
docker compose --profile seed run --rm --build seed
docker compose up -d --build
```
