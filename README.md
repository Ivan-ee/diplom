# Bakery

Локальный Docker-only запуск интернет-магазина кондитерской.

## Что нужно установить

- Docker Desktop или Docker Engine с Docker Compose.

## Быстрый старт после клонирования

```bash
cp .env.example .env
docker compose up -d postgres minio minio-init meilisearch
docker compose --profile seed run --rm --build seed
docker compose up -d --build
```

После этого открыть:

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health
- Swagger: http://localhost:4000/api/docs

## Дефолтный админ

Почта: admin@bakery.ru
Пароль: admin123

## Остановка

Остановить контейнеры:

```bash
docker compose down
```

Остановить и удалить локальные данные магазина:

```bash
docker compose down --remove-orphans
rm -rf docker-volumes/pgdata docker-volumes/minio docker-volumes/meili_data
```

После удаления данных нужно снова выполнить:

```bash
docker compose up -d postgres minio minio-init meilisearch
docker compose --profile seed run --rm --build seed
docker compose up -d --build
```