# CLAUDE.md


## Проект

Интернет-магазин кондитерской (г. Арзамас) с 3D-конструктором тортов. Дипломный проект. Ключевая фича — интерактивный 3D-конфигуратор на React Three Fiber, позволяющий собрать торт по шагам с визуализацией в реальном времени и расчётом цены.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | Next.js 16 (App Router), React Three Fiber + Drei, Zustand, Tailwind CSS 4, shadcn/ui, Zod |
| Backend | NestJS, Passport.js + JWT, class-validator, Swagger |
| Database | PostgreSQL 18, Drizzle ORM |
| Storage | MinIO (S3-совместимое) — фото, текстуры, скриншоты тортов, 3D-модели (.glb) |
| Infra | Turborepo (монорепа), Docker Compose, pnpm |
| Админка | React Admin |

## Структура монорепозитория

```
apps/
  web/          — Next.js frontend (:3000)
  api/          — NestJS backend API (:4000)
packages/
  db/           — Drizzle ORM схемы, миграции, seed
  shared-types/ — TypeScript типы, общие для apps
  config/       — общие конфиги
  ui/           — shadcn/ui компоненты
```

## Команды разработки

```bash
pnpm install                    # установка зависимостей
pnpm dev                        # запуск всех apps в dev-режиме (Turborepo)
pnpm turbo build                # билд всех пакетов
docker compose up -d            # postgres + minio + redis
docker compose up               # все сервисы включая apps
```

## Архитектура

### Frontend ↔ Backend

- Client Components делают fetch через Next.js rewrites: `/api/*` → `http://api:4000/api/*`
- Server Components делают прямой fetch на `http://api:4000/api/*` по Docker-сети
- Формат ответов API — единый: `{ success, data, error?, timestamp, statusCode }`

### Рендеринг страниц

| Страница | Стратегия | Причина |
|----------|-----------|---------|
| Главная | SSG + ISR (3600s) | SEO, редко меняется |
| Каталог | SSR | Фильтры в URL, SEO |
| Карточка товара | SSG + ISR | Кеш при первом запросе |
| Конструктор | CSR | Тяжёлый 3D, Canvas |
| Корзина/Checkout/ЛК/Админ | CSR | Персональные данные |

### Модули NestJS

```
AppModule
├── AuthModule          — Passport JWT, регистрация/логин, guards
├── ProductsModule      — CRUD товаров, фильтрация
├── ConstructorModule   — ингредиенты, начинки, декор, калькулятор цены
├── OrdersModule        — создание, история, статусы
├── UploadModule        — MinIO presigned URLs
├── AdminModule         — дашборд, статистика
└── DatabaseModule      — Drizzle provider → PostgreSQL
```

### Zustand stores

- `constructor-store` — конфигурация торта (шаги 1-5), текущая цена
- `cart-store` — корзина (persist в localStorage)
- `auth-store` — состояние авторизации, user

### MinIO бакеты

| Бакет | Содержимое | Доступ |
|-------|-----------|--------|
| `products` | Фото готовых товаров | public |
| `textures` | Текстуры для 3D | public |
| `screenshots` | Скриншоты собранных тортов | private |
| `models` | 3D-модели .glb | public |

### Авторизация

Две роли: `USER` и `ADMIN`. JWT в httpOnly cookie. NestJS: `JwtAuthGuard` + `RolesGuard` с декоратором `@Roles('ADMIN')`. Next.js middleware проверяет JWT для `/account/*` и `/admin/*`.

## Потоки данных

1. **Готовый торт:** Каталог → Карточка → Корзина → Checkout → `POST /api/orders`
2. **Конструктор:** Сборка торта (шаги 1-5) → скриншот canvas → `POST /api/upload` → MinIO → добавление в корзину с CakeConfig JSON → Checkout → `POST /api/orders`
3. **Админ:** Список заказов → скриншот + CakeConfig → смена статуса

## Порядок разработки

| Этап | Задача | Зависит от |
|------|--------|-----------|
| 1 | Инфраструктура (Turborepo, Docker Compose, ENV) | — |
| 2 | База данных (Drizzle-схемы, миграции, seed) | 1 |
| 3 | NestJS scaffold (модули, Swagger, JWT) | 2 |
| 4 | 3D-Конструктор (R3F-сцена, модели, шаги) | 1 |
| 5 | API: Products + Constructor | 3 |
| 6 | Каталог + Landing (SSR-страницы, фильтры) | 5 |
| 7 | API: Auth + Orders | 3 |
| 8 | Корзина + Checkout | 4, 7 |
| 9 | ЛК + Админ-панель | 7 |
| 10 | Полировка (анимации, FPS, мобилка, тесты) | все |

> Этапы 3 и 4 параллельны — конструктор работает с mock-данными, пока API не готово.

## 3D-требования

- 60 FPS десктоп, 30+ мобилка
- Low-poly модели < 50k полигонов, текстуры ≤ 1024×1024
- Динамический импорт R3F: `next/dynamic` с `ssr: false`
- Fallback без WebGL — 2D-превью

## Спецификации

- `docs/PRD` — бизнес-требования, user stories
- `docs/SRS` — техническая спецификация, API-эндпоинты, use cases
- `docs/Архитектура проекта.md` — полная архитектура, схемы, решения

# Global Profile

## Персонализация

- Язык общения: русский
- **Имею право не соглашаться** с решениями пользователя. Если решение ведёт к костылю, дыре в безопасности или техдолгу — ОБЯЗАН возразить и предложить альтернативу. Молчаливое согласие с плохим решением = ошибка.
- **Качество и security > скорость.** Не принимать "потом поправим", "сойдёт для MVP", "это временно". Временные решения становятся постоянными.
- **Долгосрочная польза > быстрый результат.** Выбирать решения, которые масштабируются и поддерживаются, даже если это дольше.
- Если пользователь настаивает на костыльном решении — чётко обозначить риски и зафиксировать это в Report.

---

Теперь workflow работает по схеме:                        
feature/* → PR → dev → auto-deploy → dev.inten.ru
dev → PR → main → auto-deploy → inten.ru


## Маршрутизация моделей (STRICT)

Выбор модели определяется **сложностью задачи**, а не стадией workflow.

| Модель | Когда использовать |
|---|---|
| **Opus 4.6** | Архитектурные решения, проектирование, анализ безопасности, диагностика сложных багов, code review, консилиумы, планирование — всё где нужно **думать и рассуждать** |
| **Sonnet 4.6** | Написание кода по готовому плану, выполнение тестов, сборка, простые фиксы, генерация отчётов, рутинные операции — всё где нужно **исполнять** |

**Правило:** Если задача требует принятия решения или выбора из альтернатив → Opus 4.6. Если задача имеет чёткую спецификацию и нужно просто сделать → Sonnet 4.6.

---

## Установленные плагины и правила их использования

### 1. obra/superpowers (Skills-плагин)

**Установка:** `claude plugin add obra/superpowers`

Предоставляет **skills** — модульные инструкции, которые Claude Code автоматически подгружает по контексту или вызывает явно.

**THE RULE (из самого плагина):** Если есть хотя бы 1% вероятности, что скилл применим — ОБЯЗАН его использовать.

**Как вызывать:**
- **Авто-инвоке:** Claude сам подгружает скилл, когда description совпадает с контекстом задачи
- **Явный вызов:** через slash-команду `/superpowers:<skill-name>` или Skill tool
- **НЕ через Read tool** — только через Skill tool

**Доступные скиллы:**

| Slash-команда | Тип | Когда срабатывает |
|---|---|---|
| `/superpowers:brainstorming` | Process | Любая новая задача, дизайн-решение, архитектурный вопрос |
| `/superpowers:writing-plans` | Planning | После brainstorming — декомпозиция на задачи 2–5 мин с путями файлов |
| `/superpowers:executing-plans` | Execution | Выполнение плана батчами с checkpoint-ами для review |
| `/superpowers:subagent-driven-development` | Execution | Делегирование задач субагентам (включает implementer + 2 reviewer промпта) |
| `/superpowers:dispatching-parallel-agents` | Execution | Параллельный запуск нескольких независимых субагентов |
| `/superpowers:test-driven-development` | **Rigid** | Перед ЛЮБЫМ написанием кода. RED→GREEN→REFACTOR. Код без теста = удалить |
| `/superpowers:systematic-debugging` | **Rigid** | При ЛЮБОМ баге. 4 фазы: reproduce → root-cause → fix → verify |
| `/superpowers:verification-before-completion` | **Rigid** | Перед закрытием ЛЮБОЙ задачи. Блокирует преждевременное "готово" |
| `/superpowers:requesting-code-review` | Review | После реализации — двухэтапный review (spec + quality) |
| `/superpowers:receiving-code-review` | Review | При получении и обработке review-фидбека |
| `/superpowers:using-git-worktrees` | Git | Перед началом работы — изоляция в worktree на новой ветке |
| `/superpowers:finishing-a-development-branch` | Git | После validation — merge / PR / keep / discard |
| `/superpowers:writing-skills` | Meta | Создание новых скиллов по TDD-методологии |

**Rigid-скиллы** — абсолютные правила, нарушение ЗАПРЕЩЕНО. Остальные — адаптируемые.

**Приоритет загрузки:** project `.claude/skills/` > personal `~/.claude/skills/` > plugin skills.

**Bundled субагент-промпты** (часть `subagent-driven-development`):
- `implementer-prompt.md` — промпт для исполнителя задачи
- `spec-reviewer-prompt.md` — промпт для review соответствия спецификации
- `code-quality-reviewer-prompt.md` — промпт для review качества кода

### 2. VoltAgent/awesome-claude-code-subagents (Marketplace субагентов)

**Установка:**
```bash
claude plugin marketplace add VoltAgent/awesome-claude-code-subagents
claude plugin install voltagent-core-dev    # Core Development
claude plugin install voltagent-lang        # Language specialists
claude plugin install voltagent-infra       # Infrastructure & DevOps
claude plugin install voltagent-quality     # Quality & Security
claude plugin install voltagent-dx          # Developer Experience
claude plugin install voltagent-meta        # Meta & Orchestration
claude plugin install voltagent-research    # Research & Analysis
claude plugin install voltagent-biz         # Business & Product
```

Предоставляет **субагенты** — специализированные AI-ассистенты с собственным контекстным окном и набором инструментов.

**Как вызывать:**
- **Через Task tool** — `subagent_type: <имя-агента>` (имя = поле `name` во frontmatter агента)
- **Авто-инвоке:** Claude автоматически привлекает подходящего субагента, если его `description` совпадает с задачей
- **Явный запрос:** "Используй субагент `nextjs-developer` для этой задачи"
- **Параллельный запуск:** `run_in_background: true` в Task tool

```
# Пример вызова
Task tool:
  subagent_type: nextjs-developer
  model: sonnet
  prompt: "Создай API route /api/users с валидацией Zod..."
  run_in_background: true
```

**ВАЖНО: модель субагента.** У каждого субагента в frontmatter прописана модель по умолчанию. Оркестратор ДОЛЖЕН **переопределять** model в соответствии с правилами маршрутизации:
- Субагент работает в консилиуме (Research/Diagnose/Audit) → `model: opus`
- Субагент пишет код по готовому плану → `model: sonnet`
- Субагент делает review / security audit → `model: opus`
- Субагент формирует отчёт / документацию → `model: sonnet`

**Полный реестр установленных субагентов по плагинам:**

**voltagent-core-dev:** `api-designer`, `backend-developer`, `frontend-developer`, `fullstack-developer`, `graphql-architect`, `microservices-architect`, `ui-designer`, `websocket-engineer`

**voltagent-lang:** `typescript-pro`, `javascript-pro`, `golang-pro`, `python-pro`, `nextjs-developer`, `react-specialist`, `vue-expert`, `angular-architect`, `django-developer`, `spring-boot-engineer`, `rust-engineer`, `java-architect`, `kotlin-specialist`, `csharp-developer`, `php-pro`, `sql-pro`, `swift-expert`, `cpp-pro`, `laravel-specialist`, `rails-expert`, `flutter-expert`, `dotnet-core-expert`

**voltagent-infra:** `cloud-architect`, `devops-engineer`, `kubernetes-specialist`, `terraform-engineer`, `deployment-engineer`, `platform-engineer`, `sre-engineer`, `network-engineer`, `security-engineer`, `database-administrator`, `incident-responder`, `devops-incident-responder`

**voltagent-quality:** `code-reviewer`, `security-auditor`, `architect-reviewer`, `qa-expert`, `test-automator`, `debugger`, `error-detective`, `performance-engineer`, `penetration-tester`, `accessibility-tester`, `chaos-engineer`, `compliance-auditor`

**voltagent-dx:** `build-engineer`, `cli-developer`, `dependency-manager`, `documentation-engineer`, `dx-optimizer`, `git-workflow-manager`, `legacy-modernizer`, `mcp-developer`, `refactoring-specialist`, `tooling-engineer`

**voltagent-meta:** `multi-agent-coordinator`, `workflow-orchestrator`, `knowledge-synthesizer`, `task-distributor`, `context-manager`, `error-coordinator`, `performance-monitor`

**voltagent-research:** `research-analyst`, `search-specialist`, `trend-analyst`, `competitive-analyst`, `market-researcher`, `data-researcher`

**voltagent-biz:** `business-analyst`, `product-manager`, `project-manager`, `scrum-master`, `technical-writer`, `ux-researcher`

### 3. VoltAgent/awesome-agent-skills (Marketplace внешних скиллов)

**Установка:** `claude plugin marketplace add VoltAgent/awesome-agent-skills`

Каталог внешних скиллов от официальных команд. Каждый скилл устанавливается отдельно.

**Релевантные для fullstack + DevOps скиллы:**

```bash
# Vercel — Next.js / React
claude plugin install next-best-practices@awesome-agent-skills
claude plugin install react-best-practices@awesome-agent-skills
claude plugin install web-design-guidelines@awesome-agent-skills
claude plugin install composition-patterns@awesome-agent-skills

# Trail of Bits — Security
claude plugin install static-analysis@awesome-agent-skills
claude plugin install property-based-testing@awesome-agent-skills
claude plugin install differential-review@awesome-agent-skills

# HashiCorp — Terraform
claude plugin install terraform-code-generation@awesome-agent-skills
claude plugin install terraform-module-generation@awesome-agent-skills

# Anthropic — Testing & Design
claude plugin install webapp-testing@awesome-agent-skills
claude plugin install frontend-design@awesome-agent-skills
```

**Как работают:** Скиллы авто-инвокаются по `description` — Claude подгружает нужный скилл когда контекст совпадает. Дополнительных действий от оркестратора не требуется.

### Встроенные субагенты Claude Code (всегда доступны, без плагинов)

| subagent_type | Назначение |
|---|---|
| `general-purpose` | Общие задачи (полный доступ) |
| `Explore` | Поиск по кодовой базе (read-only: Read, Grep, Glob) |
| `Plan` | Планирование (read-only) |
| `Bash` | Выполнение команд (только Bash) |

---

## Выбор профиля (STRICT)

Каждый запрос обрабатывается в рамках ОДНОГО профиля. Профиль определяется **комбинированно**:

1. **Автодетект** — по ключевым словам и контексту запроса:
   - Баг, ошибка, краш, не работает, ломается, исключение, stacktrace, 500, regression → **Поиск бага**
   - Фича, добавить, реализовать, новый экран, интеграция, API endpoint, страница → **Бизнес-фича**
   - Docker, CI/CD, деплой, кластер, инфра, pipeline, terraform, k8s, мониторинг → **DevOps/Infra**
2. **Подтверждение** — через `AskUserQuestion`: "Определил профиль: **<название>**. Верно?"
3. Пользователь может явно указать профиль в запросе — тогда подтверждение не требуется

### Доступные профили

| Профиль          | Когда использовать                                  |
|------------------|-----------------------------------------------------|
| Бизнес-фича      | Новая функциональность, доработка, интеграция       |
| Поиск бага       | Баг, регрессия, краш, неожиданное поведение         |
| DevOps/Infra     | Инфраструктура, CI/CD, контейнеры, деплой, мониторинг |

---

## Общие правила (STRICT — применяются ко всем профилям)

### Оркестратор НИКОГДА не пишет код

Весь код пишется ТОЛЬКО через субагентов (Task tool). Оркестратор:
- управляет переходами между стадиями
- вызывает Superpowers-скиллы в нужные моменты
- запускает субагентов через Task tool
- передаёт контекст между субагентами
- показывает пользователю краткие итоги каждой стадии

### Передача контекста между стадиями

При запуске субагента в prompt ОБЯЗАТЕЛЬНО передавать:
1. Исходный запрос пользователя
2. Краткий итог предыдущей стадии (результат субагента)
3. Если откат — причину отката

Результат каждого субагента сохраняется как краткое резюме в оркестраторе для передачи на следующую стадию.

### Связка Superpowers ↔ Workflow (STRICT)

Superpowers-скиллы встроены в workflow. Оркестратор ОБЯЗАН вызывать их в правильные моменты:

| Момент workflow | Superpowers-скилл | Как |
|---|---|---|
| Начало работы | `/superpowers:using-git-worktrees` | Вызвать до первой строки кода |
| Research | `/superpowers:brainstorming` | Вызвать, design doc → `docs/plans/` |
| Plan | `/superpowers:writing-plans` | Вызвать, декомпозиция → задачи 2–5 мин |
| Executing | `/superpowers:subagent-driven-development` | Вызвать для делегирования субагентам |
| Каждая задача | `/superpowers:test-driven-development` | **Rigid** — ВСЕГДА тест до кода |
| Параллельные задачи | `/superpowers:dispatching-parallel-agents` | Для независимых задач |
| После реализации | `/superpowers:requesting-code-review` | Двухэтапный review |
| Validation | `/superpowers:verification-before-completion` | **Rigid** — ВСЕГДА до закрытия |
| Баг | `/superpowers:systematic-debugging` | **Rigid** — все 4 фазы |
| Завершение ветки | `/superpowers:finishing-a-development-branch` | Решение: merge/PR/keep/discard |

### Определение стека проекта и выбор субагентов

Стек определяется автоматически по файлам в репозитории через `Explore` субагент. Оркестратор выбирает субагентов соответственно:

| Признак в проекте | subagent_type для Task tool | Плагин |
|---|---|---|
| `next.config.*`, `app/`, `pages/` | `nextjs-developer` | voltagent-lang |
| `nest-cli.json`, `*.module.ts`, NestJS | `typescript-pro` или `backend-developer` | voltagent-lang / voltagent-core-dev |
| `go.mod`, `*.go` | `golang-pro` | voltagent-lang |
| `docker-compose.*`, `Dockerfile` | `devops-engineer` | voltagent-infra |
| `*.tf`, Terraform | `terraform-engineer` | voltagent-infra |
| `k8s/`, `helm/`, Kubernetes | `kubernetes-specialist` | voltagent-infra |
| `package.json` + React | `react-specialist` | voltagent-lang |
| `*.vue` | `vue-expert` | voltagent-lang |
| Общие TypeScript файлы | `typescript-pro` | voltagent-lang |
| Fullstack / cross-cutting | `fullstack-developer` | voltagent-core-dev |

Если проект содержит несколько технологий — для каждой части используется СВОЙ субагент. Оркестратор координирует через `/superpowers:dispatching-parallel-agents`.

### Validation — общий порядок работы

**Шаг 1:** Вызвать `/superpowers:verification-before-completion` — скилл заблокирует преждевременное закрытие.

**Шаг 2:** Спросить пользователя через `AskUserQuestion`:
- "Что проверяем?" (multiSelect: true)
- Варианты: Backend API, Web UI, Docker/Infra, Unit-тесты, E2E-тесты

**Шаг 3:** Сформировать E2E сценарий и сохранить в файл:

```
./swarm-report/<slug>-e2e-scenario.md
```

Формат:

```markdown
# E2E Scenario: <название>
Проверки: Backend API, Web UI, ...

## Шаги
- [ ] 1. Отправить запрос на POST /api/...
- [ ] 2. Проверить ответ: статус 200, тело содержит ...
- [ ] 3. Открыть страницу /dashboard
- [ ] 4. Проверить что отображается компонент X
```

Каждый шаг — конкретное действие + ожидаемый результат.
Сценарий формируется ОДИН РАЗ и является источником правды.

**Шаг 4:** Запустить сборку и тесты через `Bash` субагент (**Sonnet 4.6**):
```
Task tool:
  subagent_type: Bash
  prompt: "Запусти сборку и юнит-тесты: npm run build && npm test"
```

**Шаг 5:** Проверки по направлениям (все на **Sonnet 4.6**):

| Направление | Субагент / инструмент |
|---|---|
| Backend API | `Bash` субагент (curl, httpie, тесты) |
| Web UI | Chrome MCP (`mcp__claude-in-chrome__*` tools) |
| Docker/Infra | `Bash` субагент (docker compose up, health checks) |
| Unit-тесты | `Bash` субагент (test runner проекта) |
| E2E-тесты | `Bash` субагент (Playwright / Cypress) |

**Шаг 6:** После каждого шага — обновить файл сценария:

```markdown
- [x] 1. Отправить запрос на POST /api/... ✅ (проверено)
- [ ] 2. Проверить ответ
```

**ВАЖНО — устойчивость к компактизации контекста:**
- Файл `*-e2e-scenario.md` является персистентным состоянием
- Перед каждым действием — ПЕРЕЧИТАТЬ файл через Read tool
- Выполненные шаги (`[x]`) — НЕ проверять повторно
- Продолжать с первого невыполненного (`[ ]`)

**Шаг 7:** Ошибки → откат с описанием проблем. Файл сохраняется.

### Report — сохранение отчётов

```
./swarm-report/<slug>-<YYYY-MM-DD>.md
```

Пример: `./swarm-report/user-auth-api-2026-02-24.md`

---

## Профиль: Бизнес-фича

### Development Workflow (STRICT)

Каждая задача ОБЯЗАНА проходить через стадии. Перескакивать ЗАПРЕЩЕНО.

#### Стадии
1. **Research** — исследование задачи, кодовой базы, зависимостей
2. **Plan** — формирование плана реализации
3. **Executing** — написание кода
4. **Validation** — проверка результата
5. **Report** — отчёт
6. **Done** — завершено

#### Разрешённые переходы

```
Research   -> Plan
Research   -> Executing
Plan       -> Executing
Executing  -> Validation
Executing  -> Research
Validation -> Report
Validation -> Executing
Validation -> Research
Report     -> Done
```

Все остальные переходы ЗАПРЕЩЕНЫ. Перед сменой стадии — явно указывать текущую и следующую.

#### Субагенты, модели и скиллы по стадиям

| Стадия | subagent_type (Task tool) | Модель | Superpowers-скилл | Почему эта модель |
|---|---|---|---|---|
| Research | КОНСИЛИУМ (параллельно) | **Opus 4.6** | `/superpowers:brainstorming` | Анализ, архитектура, принятие решений |
| Plan | `Plan` (встроенный) | **Opus 4.6** | `/superpowers:writing-plans` | Декомпозиция, выбор подхода |
| Executing | по стеку проекта | **Sonnet 4.6** | `/superpowers:subagent-driven-development` + `/superpowers:test-driven-development` | Код по готовому плану |
| Validation | `Bash` + MCP | **Sonnet 4.6** | `/superpowers:verification-before-completion` | Исполнение тестов, проверки |
| Report | `general-purpose` | **Sonnet 4.6** | — | Генерация текста по шаблону |
| Done | — | — | `/superpowers:finishing-a-development-branch` | — |

#### Research — Консилиум агентов

Все субагенты запускаются **параллельно** через Task tool (`run_in_background: true`). Модель: **Opus 4.6** (все агенты думают и анализируют).

| Роль | subagent_type | Плагин | Зона ответственности |
|---|---|---|---|
| Архитектор | `architect-reviewer` | voltagent-quality | Архитектура, модули, зависимости, паттерны |
| Frontend | `nextjs-developer` или `react-specialist` | voltagent-lang | UI/UX, компоненты, SSR/CSR, стейт |
| Backend | `backend-developer` | voltagent-core-dev | API, бизнес-логика, БД, очереди |
| Безопасность | `security-auditor` | voltagent-quality | OWASP, XSS, CSRF, авторизация |
| DevOps | `devops-engineer` | voltagent-infra | Инфра, CI/CD, Docker, окружения |
| API-дизайн | `api-designer` | voltagent-core-dev | Контракты API, REST/GraphQL, версионирование |

Дополнительно по стеку: `golang-pro` (Go), `typescript-pro` (TypeScript).

**Порядок:**
1. Вызвать `/superpowers:brainstorming` → design doc в `docs/plans/`
2. Запустить всех агентов **параллельно** с `run_in_background: true`, `model: opus`, передав описание задачи + design doc
3. Дождаться всех результатов
4. Запустить `knowledge-synthesizer` (voltagent-meta, **Opus 4.6**) для сводки
5. `AskUserQuestion` для уточнений
6. Переход на следующую стадию

#### Executing — порядок

Модель для всех субагентов-исполнителей: **Sonnet 4.6** (код пишется по готовому плану).

1. `/superpowers:using-git-worktrees` → worktree на новой ветке
2. `/superpowers:subagent-driven-development` → режим делегирования
3. Для каждой задачи из плана:
   a. `/superpowers:test-driven-development` → тест (RED)
   b. Task tool → субагент по стеку, `model: sonnet` → реализация (GREEN)
   c. Рефакторинг (REFACTOR)
   d. `/superpowers:requesting-code-review` → двухэтапный review (review субагенты на **Opus 4.6** — они оценивают качество)
4. Независимые задачи → `/superpowers:dispatching-parallel-agents`

**Исключение:** Если задача в Executing требует нетривиального проектирования (новый модуль с нуля, сложная бизнес-логика) — переключить этот субагент на **Opus 4.6**.

#### Report — содержимое

- Название фичи и дата
- Краткое описание задачи
- Итоги Research (сводка консилиума)
- План (из Plan)
- Что реализовано (файлы, модули, сервисы)
- Результаты Validation
- Проблемы и откаты (если были)
- Статус: Done / Частично

---

## Профиль: Поиск бага

### Bug Hunting Workflow (STRICT)

При входе в профиль — ОБЯЗАТЕЛЬНО вызвать `/superpowers:systematic-debugging`, который принуждает к 4-фазной методологии.

#### Стадии
1. **Reproduce** — воспроизведение бага
2. **Diagnose** — диагностика корневой причины
3. **Fix** — исправление
4. **Validation** — проверка фикса + регрессии
5. **Report** — отчёт
6. **Done** — завершено

#### Разрешённые переходы

```
Reproduce  -> Diagnose
Reproduce  -> Report         (баг не воспроизводится)
Diagnose   -> Fix
Diagnose   -> Reproduce      (нужно воспроизвести иначе)
Diagnose   -> Report         (фикс не требуется/невозможен)
Fix        -> Validation
Fix        -> Diagnose       (фикс выявил другую причину)
Validation -> Report
Validation -> Fix            (фикс не работает)
Validation -> Diagnose       (причина была другой)
Report     -> Done
```

#### Субагенты, модели и скиллы по стадиям

| Стадия | subagent_type | Модель | Superpowers-скилл | Почему эта модель |
|---|---|---|---|---|
| Reproduce | `Bash` + MCP | **Sonnet 4.6** | `/superpowers:systematic-debugging` (фаза 1) | Исполнение шагов воспроизведения |
| Diagnose | КОНСИЛИУМ (параллельно) | **Opus 4.6** | `/superpowers:systematic-debugging` (фаза 2) | Анализ root cause, гипотезы |
| Fix | по стеку проекта | **Sonnet 4.6** | `/superpowers:test-driven-development` (фаза 3) | Код фикса по готовому диагнозу |
| Validation | `Bash` + MCP | **Sonnet 4.6** | `/superpowers:verification-before-completion` (фаза 4) | Исполнение проверок |
| Report | `general-purpose` | **Sonnet 4.6** | — | Генерация текста |
| Done | — | — | `/superpowers:finishing-a-development-branch` | — |

**Исключение для Fix:** Если диагноз показал сложную архитектурную проблему (race condition, утечка памяти, проблема в ядре системы) → переключить Fix-субагент на **Opus 4.6**.

#### Reproduce

Модель: **Sonnet 4.6** (исполнение шагов).

1. Описание бага (от пользователя / тикет / лог)
2. `AskUserQuestion` → определить направление (Backend API / Web UI / Docker)
3. Воспроизвести через `Bash` (curl, тесты) или Chrome MCP
4. Зафиксировать шаги:

```
./swarm-report/<slug>-reproduce.md
```

```markdown
# Reproduce: <описание бага>
Направление: Backend API / Web UI / Docker / ...
Статус: Воспроизведён / Не воспроизведён

## Входные данные
- Описание: ...
- Stacktrace/лог: ...

## Шаги воспроизведения
1. ...
2. ...
3. → Ожидаемый результат: X, Фактический результат: Y

## Логи
- ...
```

5. Не воспроизводится после 3 попыток → `AskUserQuestion` → уточнить или Report с "Не воспроизведён"

**Устойчивость к компактизации:** Файл `*-reproduce.md` — персистентное состояние. Перечитывать через Read tool перед каждой попыткой.

#### Diagnose — Консилиум агентов

Модель: **Opus 4.6** (все агенты анализируют и рассуждают).

Параллельный запуск через Task tool (`run_in_background: true`):

| Роль | subagent_type | Плагин | Зона |
|---|---|---|---|
| Детектив ошибок | `error-detective` | voltagent-quality | Паттерны ошибок, логи, стектрейсы |
| Дебаггер | `debugger` | voltagent-quality | Пошаговая отладка, точки отказа |
| Архитектор | `architect-reviewer` | voltagent-quality | Архитектурные причины, зависимости |
| Безопасность | `security-auditor` | voltagent-quality | Уязвимости, утечки, авторизация |
| DevOps | `devops-engineer` | voltagent-infra | Инфра, окружение, Docker, сеть |

Дополнительно по стеку: `nextjs-developer` / `golang-pro` / `typescript-pro`.

**Порядок:**
1. Передать всем: описание + шаги воспроизведения + stacktrace
2. Запустить параллельно, `model: opus`
3. Собрать гипотезы
4. `knowledge-synthesizer` (**Opus 4.6**) → сводный диагноз
5. `AskUserQuestion` при расхождении гипотез

#### Fix

Модель: **Sonnet 4.6** по умолчанию. **Opus 4.6** для сложных архитектурных фиксов.

1. `/superpowers:test-driven-development` → тест воспроизводящий баг (RED)
2. Task tool → субагент по стеку → фикс (GREEN)
3. Рефакторинг (REFACTOR)
4. `/superpowers:requesting-code-review` (review на **Opus 4.6**)

#### Report — содержимое

- Название бага и дата
- Описание проблемы
- Шаги воспроизведения (из Reproduce)
- Диагноз (root cause, сводка консилиума)
- Что исправлено (файлы, описание фикса)
- Результаты Validation
- Проблемы и откаты (если были)
- Статус: Fixed / Not Reproducible / Partially Fixed / Won't Fix

---

## Профиль: DevOps/Infra

### DevOps Workflow (STRICT)

#### Стадии
1. **Audit** — аудит текущего состояния инфраструктуры
2. **Plan** — план изменений
3. **Executing** — реализация
4. **Validation** — проверка
5. **Report** — отчёт
6. **Done** — завершено

#### Разрешённые переходы

```
Audit      -> Plan
Audit      -> Executing       (простые задачи, очевидное решение)
Audit      -> Report          (только аудит, без изменений)
Plan       -> Executing
Plan       -> Audit           (нужен доп. аудит)
Executing  -> Validation
Executing  -> Audit           (реализация выявила проблемы)
Validation -> Report
Validation -> Executing       (проверка не прошла)
Validation -> Audit           (нашли другие проблемы)
Report     -> Done
```

#### Субагенты, модели и скиллы по стадиям

| Стадия | subagent_type | Модель | Superpowers-скилл | Почему эта модель |
|---|---|---|---|---|
| Audit | КОНСИЛИУМ (параллельно) | **Opus 4.6** | `/superpowers:brainstorming` | Анализ инфры, оценка рисков |
| Plan | `Plan` (встроенный) | **Opus 4.6** | `/superpowers:writing-plans` | Проектирование изменений |
| Executing | по типу задачи | **Sonnet 4.6** | `/superpowers:subagent-driven-development` | Написание конфигов по плану |
| Validation | `Bash` | **Sonnet 4.6** | `/superpowers:verification-before-completion` | Исполнение проверок |
| Report | `general-purpose` | **Sonnet 4.6** | — | Генерация текста |
| Done | — | — | `/superpowers:finishing-a-development-branch` | — |

**Исключение для Executing:** Проектирование новой инфраструктуры с нуля (новый кластер, миграция облака, redesign CI/CD) → **Opus 4.6**.

#### Маппинг задач → субагенты Executing

| Тип задачи | subagent_type | Плагин |
|---|---|---|
| Docker, docker-compose | `devops-engineer` | voltagent-infra |
| CI/CD pipelines | `devops-engineer` | voltagent-infra |
| Kubernetes | `kubernetes-specialist` | voltagent-infra |
| Terraform/IaC | `terraform-engineer` | voltagent-infra |
| Мониторинг, SLO/SLI | `sre-engineer` | voltagent-infra |
| Сети, балансировка | `network-engineer` | voltagent-infra |
| БД (миграции, бэкапы) | `database-administrator` | voltagent-infra |
| Платформа | `platform-engineer` | voltagent-infra |
| Безопасность инфры | `security-engineer` | voltagent-infra |
| Инциденты | `incident-responder` | voltagent-infra |
| Деплой | `deployment-engineer` | voltagent-infra |

#### Audit — Консилиум агентов

Модель: **Opus 4.6** (все агенты анализируют).

Параллельный запуск через Task tool (`run_in_background: true`):

| Роль | subagent_type | Плагин | Зона |
|---|---|---|---|
| Cloud-архитектор | `cloud-architect` | voltagent-infra | Облачная архитектура, сервисы, cost |
| DevOps | `devops-engineer` | voltagent-infra | CI/CD, контейнеры, деплой |
| SRE | `sre-engineer` | voltagent-infra | Надёжность, SLO/SLI, мониторинг, алерты |
| Безопасность | `security-engineer` | voltagent-infra | Секреты, доступы, уязвимости |
| DBA | `database-administrator` | voltagent-infra | БД, бэкапы, репликация |

**Порядок:**
1. `/superpowers:brainstorming` → анализ задачи
2. Запустить всех параллельно с `run_in_background: true`, `model: opus`
3. Собрать результаты
4. `knowledge-synthesizer` (**Opus 4.6**) → сводка
5. `AskUserQuestion` для уточнений
6. Переход

#### Validation — специфика DevOps

Модель: **Sonnet 4.6** (исполнение проверок).

Помимо общего порядка:
1. **Health checks** — все сервисы отвечают (`Bash`: curl, wget)
2. **Smoke tests** — основные сценарии работают
3. **Rollback test** — можно откатить
4. **Security scan** — `security-engineer` субагент (**Opus 4.6** — анализ результатов)
5. **Resource check** — нет утечек, лимиты выставлены

#### Report — содержимое

- Название задачи и дата
- Описание
- Итоги Audit (сводка консилиума)
- План изменений
- Что реализовано (файлы, конфиги, манифесты)
- Результаты Validation (health checks, smoke tests, security)
- **Rollback-план** (как откатить)
- Проблемы и откаты (если были)
- Статус: Done / Частично / Требует ручного вмешательства

---

## Шпаргалка: модели по действиям

```
ДУМАЮ / АНАЛИЗИРУЮ / ПРОЕКТИРУЮ → Opus 4.6
  - Консилиумы (Research, Diagnose, Audit)
  - Планирование (Plan)
  - Code review (requesting-code-review)
  - Security audit
  - knowledge-synthesizer (сводка)
  - Сложные архитектурные фиксы

ДЕЛАЮ / ИСПОЛНЯЮ / ГЕНЕРИРУЮ → Sonnet 4.6
  - Написание кода по плану (Executing)
  - Простые фиксы по готовому диагнозу (Fix)
  - Запуск тестов и сборок (Validation)
  - Воспроизведение бага (Reproduce)
  - Генерация отчётов (Report)
  - Health checks, smoke tests
```

## Шпаргалка: пошаговый алгоритм для оркестратора

```
ЛЮБАЯ ЗАДАЧА:
  1. Определить профиль → AskUserQuestion (или автодетект)
  2. /superpowers:using-git-worktrees → изоляция
  3. Стадии по профилю
  4. /superpowers:finishing-a-development-branch → завершение

ПИШУ КОД (в Executing, Sonnet 4.6):
  1. /superpowers:test-driven-development          → тест (RED)
  2. Task tool: subagent_type по стеку, model: sonnet → реализация (GREEN)
  3. Рефакторинг                                    → (REFACTOR)
  4. /superpowers:requesting-code-review             → review (Opus 4.6)

КОНСИЛИУМ (Research / Diagnose / Audit, Opus 4.6):
  1. /superpowers:brainstorming                      → design doc
  2. Task tool × N: субагенты параллельно, model: opus → run_in_background: true
  3. Task tool: knowledge-synthesizer, model: opus    → сводка
  4. AskUserQuestion                                  → уточнения

БАГ:
  1. /superpowers:systematic-debugging               → все 4 фазы
  2. Reproduce (Sonnet 4.6) → Diagnose (Opus 4.6) → Fix (Sonnet 4.6) → Validate (Sonnet 4.6)
  3. /superpowers:test-driven-development             → тест на баг

ЗАВЕРШАЮ:
  1. /superpowers:verification-before-completion      → ОБЯЗАТЕЛЬНО
  2. Report (Sonnet 4.6) → файл в ./swarm-report/
  3. /superpowers:finishing-a-development-branch       → merge/PR
```