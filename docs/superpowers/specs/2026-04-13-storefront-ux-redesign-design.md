# Storefront UX Redesign — Design Spec

**Дата:** 2026-04-13
**Статус:** Утверждён (brainstorming)
**Scope:** Все ключевые страницы (Header, Homepage, Catalog, PDP, Cart, Checkout)

## Контекст

Интернет-магазин кондитерской «Виктория Торт» (г. Арзамас). Дипломный проект. Текущий UI функционален и имеет хорошую дизайн-систему (токены цветов, типографика, spacing, shadows). Но ряд UX-паттернов отсутствует или недоработан, что снижает conversion rate, product discovery и perceived quality.

## Решения по стеку

| Вопрос | Решение |
|--------|---------|
| Компонентная библиотека | Остаёмся на **HeroUI** (без миграции на shadcn/ui) |
| Анимации | **framer-motion** (уже в проекте, = Motion for React) |
| Карусели | **Embla Carousel** (новая зависимость, заменяет custom + убираем Swiper) |
| Дизайн-система | Сохраняем текущие токены (caramel, champagne, milk-white и т.д.) |
| Глубина изменений | UX-полировка + новые паттерны (не visual redesign) |

## Стратегия: Горизонтальные слои

Реализация в 3 слоя. Каждый слой даёт видимый результат и не ломает остальное.

---

## Слой 1: Сквозные компоненты

Компоненты, видимые на всех страницах. Максимальный охват одним изменением.

### 1.1 SearchDialog

**Проблема:** Поиска нет вообще. Пользователи не могут найти конкретный товар.

**Решение:** Command palette (⌘K / Ctrl+K) с предиктивным поиском.

**Компонент:** `components/search/SearchDialog.tsx`

**Поведение:**
- Открытие: кнопка в Header (pill-style с placeholder «Поиск...» и hint ⌘K) + глобальный hotkey
- Input: debounced (300ms) → `GET /api/products?search=query&limit=6`
- Результаты: список с thumbnail (48×48), название (highlight совпадений через `<mark>`), цена, категория
- Keyboard: ↑↓ навигация, Enter → переход на PDP, Esc → закрыть
- Empty state: «Ничего не найдено по "запрос"»
- Mobile: полноэкранный режим (без pill в header — только иконка 🔍)

**UI-примитив:** HeroUI Modal (уже в проекте)

**Motion:**
- Открытие: scale(0.96) + opacity 0→1, 200ms ease-out
- Закрытие: opacity 1→0, 150ms ease-out
- Backdrop: bg-black/30, opacity transition

**Доступность:**
- `role="combobox"`, `aria-expanded`, `aria-activedescendant`
- Focus trap внутри диалога
- `prefers-reduced-motion`: без scale, только opacity

**Backend — Meilisearch:**
- Docker: `getmeili/meilisearch:v1.12` в docker-compose.yml, порт 7700, volume `meili_data`
- NestJS: `SearchModule` — сервис для индексации и поиска
- Индекс `products`: поля `id`, `name`, `description`, `category`, `price`, `imageUrl`, `slug`
- Синхронизация: при старте — полный reindex; при CRUD товара — обновление документа в индексе
- API: `GET /api/search?q=query&limit=6` → Meilisearch search → формат с highlights
- Конфигурация: `searchableAttributes: ['name', 'description']`, `filterableAttributes: ['category', 'price']`, `sortableAttributes: ['price']`
- Typo tolerance и русская морфология — из коробки, без доп. настройки
- Frontend: SearchDialog делает fetch на `/api/search?q=` (debounced 300ms), Meilisearch отдаёт `_formatted` с `<mark>` тегами для highlight

### 1.2 Cart Drawer

**Проблема:** При добавлении товара — только toast. Нет мгновенного просмотра корзины без перехода на /cart.

**Решение:** Sheet-drawer справа с мини-корзиной.

**Компонент:** `components/cart/CartDrawer.tsx`

**Поведение:**
- Открытие: клик на cart icon в Header + автооткрытие после addToCart (только для обычных товаров; конструктор-торты используют свой ConstructorSuccessModal — drawer НЕ открывается)
- Содержимое: список товаров (thumbnail 72×72, name, weight/qty, stepper, цена), итог, CTA «Оформить заказ», link «Перейти в корзину»
- Stepper: ±500г для per-kg, ±1 для per-unit (как на /cart)
- Удаление: swipe-left на mobile, кнопка × на desktop

**UI-примитив:** HeroUI Drawer (уже используется для мобильного меню)

**Layout:**
- Desktop: 380px ширина, slide-in справа
- Mobile: fullscreen bottom sheet

**Motion:**
- Slide-in: translateX(100%) → 0, 250ms ease-out
- Backdrop: bg-black/30, opacity 200ms
- Layout animation на элементах (reorder, remove)
- Item remove: opacity 0 + height collapse, 200ms

**Состояние:** Zustand cart-store (уже есть, переиспользуем)

### 1.3 Breadcrumbs

**Проблема:** Нет контекста навигации на Catalog и PDP. Пользователь теряет ориентацию.

**Решение:** Breadcrumbs с SEO-разметкой (Schema.org BreadcrumbList).

**Компонент:** `components/ui/Breadcrumbs.tsx`

**Маршруты:**
- `/catalog` → Главная › Каталог
- `/catalog?category=classic` → Главная › Каталог › Классические
- `/catalog/[slug]` → Главная › Каталог › Категория › Название товара

**Mobile:** Truncation — показать первый + последний элемент, средние свернуть в «...»

**SEO:** JSON-LD `BreadcrumbList` schema в `<head>`.

### 1.4 Embla Carousel (shared)

**Проблема:** Нет carousel-библиотеки. Кастомные реализации без swipe. Swiper в dependencies но не используется.

**Решение:** 
- `npm install embla-carousel-react embla-carousel-autoplay`
- Удалить `swiper` из package.json
- Shared hook `useCarousel()` для переиспользования

**Компонент:** `components/ui/Carousel.tsx` — обёртка над Embla с:
- Стрелки навигации (ChevronLeft/Right)
- Dot pagination (bar-style, active шире)
- Responsive slidesToScroll
- Touch/drag native
- A11y: `aria-roledescription="carousel"`, `aria-label`

**Использование:** Hero, Popular Products, PDP Gallery, Reviews, Cross-sell.

### 1.5 Cleanup

- Удалить `swiper` из `apps/web/package.json`
- Убедиться что нигде нет import из swiper

---

## Слой 2: Discovery

Улучшаем первое впечатление, product discovery и путь от главной до PDP.

### 2.1 Hero Section

**Проблема:** Текст + 2 кнопки на пустом фоне. Нет визуала продукта. Слабое первое впечатление.

**Решение:** Split layout — текст слева, Embla carousel с фото тортов справа.

**Файл:** `components/landing/HeroSection.tsx` (рефакторинг)

**Desktop layout:** `grid-cols-2`
- Левая колонка: h1, subtitle, 2 CTA кнопки, trust chips под ними («Натуральные ингредиенты» · «Готовим от 1 дня»)
- Правая колонка: Embla carousel с фото популярных товаров (берём первые 3-5 изображений из `GET /api/products?sort=popular&limit=5`), rounded-radius-hero. Если у товара нет фото — пропускаем.

**Mobile layout:** Stack — изображение сверху (aspect 16:9), текст под ним

**Carousel:** autoplay 5s, loop: true, dragFree: false

**Floating card:** Поверх изображения — «от X ₽/кг · Бесплатная дегустация»

**Motion:** RevealOnScroll для текста (сохраняем), fade-in для изображения (300ms ease-out)

### 2.2 Popular Products → Embla Carousel

**Проблема:** Статичный grid ограничивает количество видимых товаров.

**Решение:** Горизонтальный Embla carousel с drag/swipe.

**Файл:** `components/landing/PopularProducts.tsx` (рефакторинг)

**Конфигурация:**
- Desktop: 3-4 видимых, стрелки по бокам
- Mobile: 1.3 видимых (peek эффект), swipe native
- slidesToScroll: 1, containScroll: 'trimSnaps', dragFree: true
- Pagination: bar dots (active шире), caramel цвет
- Без autoplay

### 2.3 Catalog Filters

**Проблема:** Только категории pills + sort dropdown. Нет фильтра по цене. Нет видимости активных фильтров.

**Решение:** Ценовой range + active filter chips.

**Файлы:**
- `components/catalog/CatalogFilters.tsx` (рефакторинг)
- `components/catalog/PriceRangeFilter.tsx` (новый)
- `components/catalog/ActiveFilterChips.tsx` (новый)

**Price range:** Два input min/max (в строке с sort dropdown). Debounce 500ms → URL params `priceMin`, `priceMax`.

**Active chips:** Под фильтрами. Removable с × кнопкой. «Сбросить всё» link. AnimatePresence на добавлении/удалении (scale 0.95→1, 150ms ease-out).

**Mobile:** Кнопка «Фильтры» → HeroUI Drawer снизу с полным набором фильтров.

**API:** `GET /api/products` уже поддерживает `priceMin`/`priceMax` params.

### 2.4 PDP Gallery → Embla

**Проблема:** Кастомная галерея без swipe на mobile. Нет touch-жестов.

**Решение:** Embla с main + thumbs sync.

**Файл:** `components/product/ProductGallery.tsx` (рефакторинг)

**Конфигурация:**
- Main: Embla с drag + swipe, одна slide
- Thumbs: Embla Thumbs plugin, синхронизация с main
- Desktop: Thumbnails горизонтальная полоса
- Mobile: Dot pagination вместо thumbnails
- Zoom: Клик на main → lightbox (сохраняем текущую реализацию)
- Keyboard: ← → стрелки (сохраняем)

### 2.5 Cross-sell секция на PDP

**Проблема:** Нет рекомендаций на PDP. Упущенные допродажи.

**Решение:** «С этим тортом покупают» — Embla carousel с compact ProductCard.

**Компонент:** `components/product/CrossSell.tsx` (новый)

**Данные:** `GET /api/products?category={currentCategory}&exclude={currentId}&limit=6`. Fallback: если в текущей категории < 3 товаров — дополнить товарами из других категорий до 6.

**Layout:** Embla carousel, 3-4 видимых desktop, swipe mobile. Compact карточки (thumbnail square, name, price, кнопка +).

**Позиция:** Под описанием товара, перед footer.

### 2.6 Micro-interactions

**Card hover:** translateY(-2px) + shadow-card-hover, 200ms ease-out. CSS transition (не framer-motion).

**Add to Cart feedback:** Кнопка «В корзину» → check icon + «Добавлено» (200ms) → открыть Cart Drawer.

**Image load:** opacity 0→1 + filter blur(8px)→blur(0), 300ms ease-out. CSS transition на `<Image onLoad>`.

**Filter chip:** AnimatePresence (framer-motion), scale 0.95→1 + opacity, 150ms ease-out.

**Grid update:** Мгновенно. Layout animation на карточках для smooth reposition.

---

## Слой 3: Purchase Flow

Снижаем трение на пути к покупке, повышаем доверие.

### 3.1 Cart Page улучшения

**Файл:** `app/cart/page.tsx` + `components/cart/CartSummary.tsx` (рефакторинг)

**Progress bar:** «До бесплатного декора осталось X ₽» — мотивационная полоска в верхней части. Gradient caramel→toffee. Порог: 4000 ₽ (константа `FREE_DECOR_THRESHOLD` в `lib/constants.ts`).

**Промокод:** Перенести из checkout в Cart Summary. Input + кнопка «OK». Feedback: зелёный чип с суммой скидки или red error.

**Upsell:** «Добавить к заказу?» — 1-2 compact row карточки под списком товаров. Кнопка + для быстрого добавления.

**Mobile sticky summary:** Bottom bar с итогом + CTA «Оформить заказ» (sticky, z-40, shadow-elevated).

### 3.2 Checkout Inline Validation

**Файл:** `components/checkout/CheckoutForm.tsx` (рефакторинг)

**react-hook-form config:** `mode: 'onBlur'` → показывать ошибки после потери фокуса. После первой ошибки — `trigger()` при каждом изменении (real-time).

**Visual states:**
- Default: `border-champagne`
- Valid: `border-success` + green ✓ icon справа
- Error: `border-error` + red ! icon + error message под полем

**Phone:** Форматирование (сохраняем) + green checkmark при 11 цифрах.

**Time slots:** Radio-группа с visual selected state: `border-2 border-caramel bg-caramel/10`.

**Error shake:** На invalid submit — shake animation (translateX ±4px, 200ms, 3 cycles). Только на первом невалидном поле.

**Order summary:** Desktop: компактная сводка справа (sticky). Mobile: collapsible сводка сверху.

### 3.3 Trust Signals

**Компонент:** `components/ui/TrustSignals.tsx` (новый)

**Варианты:**
- `variant="pdp"` — вертикальный список с иконками и описаниями (4 пункта: свежесть, состав, оплата, гарантия)
- `variant="cart"` — 2-3 строки под CTA (оплата при получении, самовывоз)
- `variant="checkout"` — горизонтальная strip с иконками (безопасно, самовывоз, оплата, гарантия)
- `variant="inline"` — compact для Footer

**Иконки:** lucide-react (Shield, FileText, CreditCard, RefreshCw)

**Размещение:**
- PDP: под кнопкой «В корзину» (расширяем существующие 3 строки)
- Cart Summary: под CTA
- Checkout: над submit кнопкой
- Footer: inline вариант (опционально)

### 3.4 Success Page

**Файл:** `app/checkout/success/page.tsx` (рефакторинг)

**Улучшения:**
- Иконка 🎉 + «Заказ #N оформлен!»
- Полная информация: дата, время, адрес самовывоза
- CTA: «Мои заказы» (primary) + «На главную» (outline)
- Без confetti (не добавляет ценности, отвлекает)
- Motion: fade-in + scale(0.96→1), 300ms spring

---

## Новые зависимости

| Пакет | Версия | Размер | Зачем |
|-------|--------|--------|-------|
| `embla-carousel-react` | ^8.x | ~8kb gzip | Карусели (Hero, Products, Gallery, Cross-sell) |
| `embla-carousel-autoplay` | ^8.x | ~1kb gzip | Autoplay для Hero carousel |
| `meilisearch` (JS SDK) | ^0.44 | ~5kb gzip | Клиент для NestJS SearchModule |

**Удалить:** `swiper` (~40kb gzip) — не используется.

**Новая инфра:** Meilisearch Docker container (`getmeili/meilisearch:v1.12`, ~100MB image).

## Новые файлы

```
components/
├── search/
│   └── SearchDialog.tsx
├── cart/
│   └── CartDrawer.tsx
├── catalog/
│   ├── PriceRangeFilter.tsx
│   └── ActiveFilterChips.tsx
├── product/
│   └── CrossSell.tsx
└── ui/
    ├── Breadcrumbs.tsx
    ├── Carousel.tsx
    └── TrustSignals.tsx
```

## Модифицируемые файлы

```
components/layout/Header.tsx          — кнопка поиска, cart drawer trigger, ⌘K listener
components/landing/HeroSection.tsx    — split layout + Embla carousel
components/landing/PopularProducts.tsx — grid → Embla carousel
components/catalog/CatalogFilters.tsx — price range, active chips, mobile drawer
components/product/ProductGallery.tsx — custom → Embla + thumbs
components/product/ProductInfo.tsx    — trust signals block
components/cart/CartSummary.tsx       — промокод, progress bar, trust cues
components/checkout/CheckoutForm.tsx  — inline validation, trust strip
app/cart/page.tsx                     — upsell, mobile sticky, cart drawer integration
app/checkout/success/page.tsx         — redesign
app/catalog/[slug]/page.tsx           — breadcrumbs, cross-sell
app/catalog/page.tsx                  — breadcrumbs
```

## Не затрагиваемые области

- 3D Конструктор — не трогаем (уже хорошо работает)
- Админ-панель — отдельный scope
- Auth модальное окно — уже отполировано
- Дизайн-токены (globals.css) — сохраняем полностью
- Zustand stores — переиспользуем (cart-store, auth-store)
- Backend API — минимальные изменения (кроме SearchModule для Meilisearch)

## Motion System Summary

| Элемент | Тип | Timing | Easing |
|---------|-----|--------|--------|
| SearchDialog open | framer-motion | 200ms | ease-out |
| Cart Drawer slide | framer-motion | 250ms | ease-out |
| Card hover lift | CSS transition | 200ms | ease-out |
| Button press | CSS | instant | — |
| Filter chip appear | framer-motion | 150ms | ease-out |
| Image blur-in | CSS transition | 300ms | ease-out |
| Grid reposition | framer-motion layout | 200ms | ease-out |
| Error shake | CSS keyframe | 200ms | ease-in-out |
| Carousel slide | Embla physics | spring | — |

## Accessibility Checklist

- [ ] SearchDialog: combobox pattern, focus trap, ⌘K + Esc
- [ ] Cart Drawer: focus trap, Esc close, aria-label
- [ ] Breadcrumbs: nav landmark, aria-current="page"
- [ ] Carousel: aria-roledescription, slide labels
- [ ] Filter chips: aria-label on remove buttons
- [ ] Checkout validation: aria-invalid, aria-describedby for errors
- [ ] Trust signals: semantic list, icons decorative (aria-hidden)
- [ ] All motion: prefers-reduced-motion respected
- [ ] Touch targets: min 44×44px on mobile
- [ ] Focus visible: ring-caramel on all interactive elements
