PNPM          := pnpm
COMPOSE_FILE  := docker-compose.dev.yml
COMPOSE       := docker compose -f $(COMPOSE_FILE)

.PHONY: help install \
        dev dev-web dev-api \
        build build-web build-api \
        test test-web test-api \
        lint format type-check \
        docker-up docker-down docker-restart docker-logs \
        db-generate db-migrate db-push db-seed db-studio db-reset \
        clean

.DEFAULT_GOAL := help

# ─── HELP ─────────────────────────────────────────────────────────────────────

help: ## Показать список доступных команд
	@awk 'BEGIN {FS = ":.*##"; printf "\nИспользование:\n  make \033[36m<target>\033[0m\n\nДоступные команды:\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } \
		/^# ───/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 3) }' $(MAKEFILE_LIST)

# ─── УСТАНОВКА ────────────────────────────────────────────────────────────────

install: ## Установить все зависимости монорепозитория
	@$(PNPM) install

# ─── РАЗРАБОТКА ───────────────────────────────────────────────────────────────

dev: docker-up ## Поднять инфру и запустить все приложения в dev-режиме
	@$(PNPM) dev

dev-web: ## Запустить только веб-приложение (Next.js) в dev-режиме
	@$(PNPM) --filter @bakery/web dev

dev-api: ## Запустить только API (NestJS) в dev-режиме
	@$(PNPM) --filter @bakery/api dev

# ─── СБОРКА ───────────────────────────────────────────────────────────────────

build: ## Собрать все пакеты монорепозитория
	@$(PNPM) build

build-web: ## Собрать только веб-приложение (Next.js)
	@$(PNPM) --filter @bakery/web build

build-api: ## Собрать только API (NestJS)
	@$(PNPM) --filter @bakery/api build

# ─── ТЕСТЫ ────────────────────────────────────────────────────────────────────

test: ## Запустить тесты web и api
	@$(PNPM) --filter @bakery/web test
	@$(PNPM) --filter @bakery/api test

test-web: ## Запустить тесты только для веб-приложения
	@$(PNPM) --filter @bakery/web test

test-api: ## Запустить тесты только для API
	@$(PNPM) --filter @bakery/api test

# ─── ЛИНТИНГ И ФОРМАТИРОВАНИЕ ─────────────────────────────────────────────────

lint: ## Проверить код линтером во всех пакетах
	@$(PNPM) lint

format: ## Отформатировать код во всех пакетах
	@$(PNPM) format

type-check: ## Проверить типы TypeScript во всех пакетах
	@$(PNPM) type-check

# ─── DOCKER ───────────────────────────────────────────────────────────────────

docker-up: ## Запустить инфраструктуру (postgres, minio, redis) в фоне
	@$(COMPOSE) up -d

docker-down: ## Остановить и удалить контейнеры инфраструктуры
	@$(COMPOSE) down

docker-restart: docker-down docker-up ## Перезапустить контейнеры инфраструктуры

docker-logs: ## Показать логи всех контейнеров в реальном времени
	@$(COMPOSE) logs -f

# ─── БАЗА ДАННЫХ ──────────────────────────────────────────────────────────────

db-generate: ## Сгенерировать SQL-миграции из Drizzle-схем
	@$(PNPM) --filter @bakery/db db:generate

db-migrate: ## Применить все pending-миграции к базе данных
	@$(PNPM) --filter @bakery/db db:migrate

db-push: ## Синхронизировать схему с БД без генерации миграций (dev-only)
	@$(PNPM) --filter @bakery/db drizzle-kit push

db-seed: ## Наполнить базу данных тестовыми данными (seed)
	@$(PNPM) --filter @bakery/db seed

db-studio: ## Открыть Drizzle Studio для просмотра и редактирования данных
	@$(PNPM) --filter @bakery/db db:studio

db-reset: ## Полный сброс БД: дропнуть, пересоздать, мигрировать, засидить
	@echo "Удаляем базу данных..."
	@$(COMPOSE) exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS bakery;"
	@$(COMPOSE) exec -T postgres psql -U postgres -c "CREATE DATABASE bakery;"
	@echo "Применяем миграции..."
	@$(PNPM) --filter @bakery/db db:migrate
	@echo "Заполняем базу тестовыми данными..."
	@$(PNPM) --filter @bakery/db seed
	@echo "БД пересоздана."

# ─── ОЧИСТКА ──────────────────────────────────────────────────────────────────

clean: ## Удалить node_modules, dist, .next и .turbo артефакты сборки
	@echo "Удаление node_modules..."
	@find . -name node_modules -type d -maxdepth 3 -exec rm -rf {} + 2>/dev/null || true
	@echo "Удаление dist..."
	@find . -name dist -type d -maxdepth 4 -exec rm -rf {} + 2>/dev/null || true
	@echo "Удаление .next..."
	@find . -name .next -type d -maxdepth 4 -exec rm -rf {} + 2>/dev/null || true
	@echo "Удаление .turbo..."
	@find . -name .turbo -type d -maxdepth 4 -exec rm -rf {} + 2>/dev/null || true
	@echo "Очистка завершена."
