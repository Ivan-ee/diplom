
> **Версия:** 1.0  
> **Дата:** 2025-06-XX  
> **Связанные документы:** PRD v2.0, Архитектура v2.0  
> **Стек:** Next.js 16 · NestJS · Drizzle ORM · PostgreSQL · React Three Fiber

---

## 1. Введение

### 1.1. Назначение документа

Документ описывает детальные функциональные и нефункциональные требования к системе «Интернет-магазин кондитерской с 3D-конструктором тортов». Является основным техническим документом для разработки. Каждый use case содержит предусловия, основной поток, альтернативные потоки, постусловия и технические детали реализации.

### 1.2. Границы системы

Система состоит из четырёх подсистем:

|Подсистема|Описание|Технология|
|---|---|---|
|**Frontend**|Клиентское веб-приложение (витрина, 3D-конструктор, ЛК, админ-панель)|Next.js 16|
|**Backend API**|REST API сервер (бизнес-логика, авторизация, управление данными)|NestJS|
|**3D Engine**|Модуль 3D-визуализации и интерактивного конструирования торта|React Three Fiber|
|**Хранилище**|Базы данных и файловое хранилище|PostgreSQL + MinIO|

### 1.3. Акторы системы

|Актор|Описание|Авторизация|
|---|---|---|
|**Гость**|Неавторизованный пользователь. Может просматривать каталог и использовать конструктор|Нет|
|**Покупатель**|Авторизованный пользователь. Может оформлять заказы и просматривать историю|JWT (роль USER)|
|**Администратор**|Владелец кондитерской. Управляет заказами, товарами, настройками конструктора|JWT (роль ADMIN)|

### 1.4. Условные обозначения

- **[FE]** — реализуется на фронтенде (Next.js)
- **[BE]** — реализуется на бэкенде (NestJS)
- **[3D]** — реализуется в 3D-движке (R3F)
- **[DB]** — затрагивает базу данных
- **P0** — Must Have, **P1** — Should Have, **P2** — Could Have

---

## 2. Общие системные требования

### 2.1. Формат ответа API

Все API-эндпоинты возвращают JSON в едином формате:

```typescript
// Успешный ответ
{
  "success": true,
  "data": { ... },
  "meta"?: { "page": 1, "limit": 20, "total": 150 }
}

// Ответ с ошибкой
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Описание ошибки",
    "details"?: [ { "field": "email", "message": "Некорректный формат" } ]
  }
}
```

### 2.2. Коды ошибок

|HTTP-код|Код ошибки|Описание|
|---|---|---|
|400|VALIDATION_ERROR|Ошибка валидации входных данных|
|401|UNAUTHORIZED|Требуется авторизация|
|403|FORBIDDEN|Недостаточно прав|
|404|NOT_FOUND|Ресурс не найден|
|409|CONFLICT|Конфликт (email уже существует и т.д.)|
|422|BUSINESS_ERROR|Бизнес-ошибка (ингредиент недоступен и т.д.)|
|500|INTERNAL_ERROR|Внутренняя ошибка сервера|

### 2.3. Пагинация

Списковые эндпоинты поддерживают пагинацию через query-параметры:

```
GET /api/products?page=1&limit=20&sort=price&order=asc
```

### 2.4. Аутентификация

Все защищённые эндпоинты требуют JWT-токен в заголовке:

```
Authorization: Bearer <jwt_token>
```

Токен содержит: `{ userId: string, email: string, role: "USER" | "ADMIN", iat, exp }`. Время жизни: 7 дней. Хранение на клиенте: httpOnly cookie.

---

## 3. Use Cases — Аутентификация

### UC-01: Регистрация пользователя [P1]

**Актор:** Гость  
**Предусловия:** Пользователь не авторизован  
**Связь:** US-11

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Нажимает «Войти» в header|[FE] Открывает модальное окно авторизации с табами «Вход / Регистрация»|
|2|Переключается на таб «Регистрация»|[FE] Показывает форму: имя, телефон, email, пароль, подтверждение пароля|
|3|Заполняет все поля и нажимает «Зарегистрироваться»|[FE] Клиентская валидация (Zod). При ошибках — показ inline-сообщений под полями|
|4|—|[FE] `POST /api/auth/register` с данными формы|
|5|—|[BE] Валидация DTO (class-validator): email format, пароль ≥ 8 символов, телефон формат +7XXXXXXXXXX|
|6|—|[BE] Проверка: email не занят (запрос в БД)|
|7|—|[BE] Хеширование пароля (bcrypt, 10 rounds)|
|8|—|[DB] `INSERT INTO users (name, phone, email, password_hash, role)`|
|9|—|[BE] Генерация JWT. Установка httpOnly cookie|
|10|—|[FE] Закрытие модального окна. Обновление header (аватар/имя вместо кнопки «Войти»). Zustand auth-store обновлён|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Email уже существует|[BE] 409 CONFLICT. [FE] Показать «Пользователь с таким email уже зарегистрирован» под полем email|
|A2: Невалидный пароль|[FE] Inline-валидация: «Минимум 8 символов, минимум 1 цифра»|
|A3: Пароли не совпадают|[FE] Inline-валидация: «Пароли не совпадают»|
|A4: Ошибка сервера|[FE] Toast-уведомление «Ошибка сервера, попробуйте позже»|

**Постусловия:** Пользователь авторизован (роль USER). JWT установлен в cookie. Доступен ЛК.

**API-спецификация:**

```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "name": "Анна Иванова",
  "phone": "+79101234567",
  "email": "anna@example.com",
  "password": "securePass123"
}

Response 201:
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Анна Иванова", "email": "anna@example.com", "role": "USER" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### UC-02: Вход в систему [P1]

**Актор:** Гость  
**Предусловия:** Пользователь зарегистрирован, но не авторизован

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Нажимает «Войти» в header|[FE] Открывает модальное окно на табе «Вход»|
|2|Вводит email и пароль, нажимает «Войти»|[FE] Клиентская валидация (непустые поля)|
|3|—|[FE] `POST /api/auth/login`|
|4|—|[BE] Поиск пользователя по email|
|5|—|[BE] Сравнение пароля с хешем (bcrypt.compare)|
|6|—|[BE] Генерация JWT. Установка httpOnly cookie|
|7|—|[FE] Закрытие модального окна. Обновление auth-store|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Неверный email или пароль|[BE] 401 UNAUTHORIZED. [FE] «Неверный email или пароль» (не уточнять, что именно неверно)|
|A2: Пользователь заблокирован|[BE] 403 FORBIDDEN|

**API-спецификация:**

```
POST /api/auth/login
Request:  { "email": "anna@example.com", "password": "securePass123" }
Response 200: { "success": true, "data": { "user": {...}, "token": "..." } }
```

---

### UC-03: Выход из системы [P1]

**Актор:** Покупатель / Администратор

**Основной поток:**

|#|Действие|Действие системы|
|---|---|---|
|1|Нажимает на аватар → «Выйти»|[FE] Удаление JWT cookie. Очистка auth-store|
|2|—|[FE] Редирект на главную. Header обновлён (кнопка «Войти»)|

**Постусловия:** Корзина сохраняется (Zustand persist в localStorage). Авторизация сброшена.

---

## 4. Use Cases — Каталог и товары

### UC-04: Просмотр каталога [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-01

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Переходит на /catalog (из меню или ссылки)|[FE] Server Component: `fetch('http://api:4000/api/products')` с ISR|
|2|—|[BE] `GET /api/products` → Drizzle query с join categories|
|3|—|[FE] Рендер: сетка карточек (3 колонки desktop, 2 планшет, 1 мобильный). Фильтры в sidebar (desktop) или в dropdown (mobile)|
|4|Выбирает фильтр (тип: «Торты», повод: «День рождения»)|[FE] Обновление URL query params: `/catalog?type=cakes&occasion=birthday`|
|5|—|[FE] Повторный fetch с query-параметрами. Анимация fade перезагрузки карточек|
|6|Двигает ползунок цены (500₽ — 3000₽)|[FE] Debounce 300ms → обновление URL → fetch|
|7|Выбирает сортировку «По цене ↑»|[FE] Добавление `&sort=price&order=asc` в URL → fetch|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Нет товаров по фильтрам|[FE] «По вашим параметрам ничего не найдено» + кнопка «Сбросить фильтры»|
|A2: Ошибка загрузки|[FE] Skeleton-лоадер → сообщение «Не удалось загрузить каталог» + кнопка «Повторить»|

**API-спецификация:**

```
GET /api/products?type=cakes&occasion=birthday&priceMin=500&priceMax=3000&sort=price&order=asc&page=1&limit=20

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "shokoladnyj-tort",
      "name": "Шоколадный торт",
      "description": "Насыщенный шоколадный вкус...",
      "imageUrl": "https://minio/products/choco.webp",
      "images": ["url1", "url2"],
      "pricePerKg": 1200,
      "minWeight": 1,
      "category": { "id": "uuid", "name": "Торты", "slug": "cakes" },
      "occasions": [{ "id": "uuid", "name": "День рождения" }],
      "isAvailable": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 45 }
}
```

**Компонентная структура [FE]:**

```
CatalogPage (Server Component)
├── CatalogFilters (Client Component)
│   ├── FilterGroup (тип: radio)
│   ├── FilterGroup (повод: checkbox)
│   ├── PriceRangeSlider
│   └── SortSelect
├── ProductGrid
│   └── ProductCard (×N)
│       ├── ProductImage (next/image, lazy)
│       ├── ProductInfo (name, price)
│       └── AddToCartButton
└── Pagination
```

---

### UC-05: Просмотр карточки товара [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-02

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Кликает на карточку товара в каталоге|[FE] Переход на `/catalog/[slug]`. SSG + ISR (revalidate: 3600)|
|2|—|[FE] Server Component: `fetch('http://api:4000/api/products/${slug}')`|
|3|—|[FE] Рендер: галерея фото (главное + миниатюры), название, описание, выбор веса, цена, кнопка «В корзину»|
|4|Выбирает вес (1кг → 2кг)|[FE] Client Component пересчитывает цену: `pricePerKg × selectedWeight`. Анимация смены числа|
|5|Вводит текст в поле «Надпись на торте»|[FE] Сохранение в локальном state компонента. Ограничение 50 символов|
|6|Нажимает «В корзину»|[FE] Zustand cart-store: добавление `{ productId, weight, inscription, price }`. Toast «Товар добавлен в корзину». Badge на иконке корзины +1|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Товар недоступен|[FE] Кнопка «В корзину» заблокирована. Текст: «Временно недоступен»|
|A2: Товар уже в корзине (тот же вес)|[FE] Toast «Товар уже в корзине» + ссылка «Перейти в корзину»|

**API-спецификация:**

```
GET /api/products/:slug

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "shokoladnyj-tort",
    "name": "Шоколадный торт",
    "description": "...",
    "composition": "Шоколадный бисквит, сливочный крем, бельгийский шоколад",
    "imageUrl": "...",
    "images": ["url1", "url2", "url3"],
    "pricePerKg": 1200,
    "minWeight": 1,
    "maxWeight": 5,
    "weightStep": 0.5,
    "category": { "id": "uuid", "name": "Торты" },
    "occasions": [...],
    "isAvailable": true
  }
}
```

---

### UC-06: Добавление товара в корзину [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-03

**Технические детали:**

Корзина хранится в Zustand с persist-middleware (localStorage):

```typescript
// stores/cart-store.ts
interface CartItem {
  id: string;                        // Уникальный ID элемента корзины (nanoid)
  type: "product" | "constructor";   // Тип товара
  productId?: string;                // ID готового товара (для type=product)
  name: string;
  imageUrl: string;
  weight: number;                    // кг
  price: number;                     // Итоговая цена
  quantity: number;
  inscription?: string;              // Надпись на торте
  cakeConfig?: CakeConfig;           // Конфигурация (для type=constructor)
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}
```

**Постусловия:** Товар сохранён в localStorage. Доступен при перезагрузке страницы. Badge корзины в header обновлён.

---

## 5. Use Cases — 3D-Конструктор (ключевой модуль)

> **Приоритет: критический.** Конструктор — основа дипломной работы.  
> Все UC в этом разделе имеют приоритет P0, если не указано иное.

### UC-07: Загрузка конструктора [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-04, US-10  
**Предусловия:** Браузер поддерживает WebGL 2.0

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Переходит на /constructor (из CTA на главной или из меню)|[FE] Загрузка страницы. `next/dynamic` с `ssr: false` для R3F-компонентов|
|2|—|[FE] Показ экрана загрузки: прогресс-бар с процентом загруженных ассетов|
|3|—|[FE] `GET /api/constructor/ingredients` — загрузка данных ингредиентов|
|4|—|[3D] Параллельная загрузка: базовая 3D-модель торта (.glb), HDRI-окружение, текстуры бисквитов|
|5|—|[3D] useGLTF.preload() для всех форм. useTexture.preload() для текстур|
|6|—|[FE] Zustand constructor-store инициализируется дефолтной конфигурацией|
|7|—|[3D] Рендер начальной сцены: торт (круг, 1 ярус, ванильный, белый крем) на подставке|
|8|—|[3D] Анимация появления: scale 0.8→1.0, opacity 0→1 (600ms, spring easing)|
|9|—|[3D] Камера делает автоповорот на 15° за 1.5с|
|10|—|[FE] Панель шага 1 появляется с fade-in (300ms). Прогресс-бар шагов: ● ○ ○ ○ ○|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Нет WebGL 2.0|[FE] Показать fallback: статичное изображение торта + пошаговая форма без 3D. Баннер: «Для 3D-визуализации используйте современный браузер»|
|A2: Ошибка загрузки моделей|[FE] «Не удалось загрузить 3D-сцену» + кнопка «Повторить». Логирование ошибки|
|A3: Медленная сеть (>5с)|[FE] Прогресс-бар показывает «Загрузка моделей... 60%». Не блокировать UI|

**API-спецификация:**

```
GET /api/constructor/ingredients

Response 200:
{
  "success": true,
  "data": {
    "bases": [
      {
        "id": "vanilla",
        "name": "Ванильный",
        "description": "Классический ванильный бисквит",
        "pricePerKg": 800,
        "textureUrl": "https://minio/textures/vanilla.webp",
        "color": "#F5E6C8",
        "isAvailable": true
      },
      {
        "id": "chocolate",
        "name": "Шоколадный",
        "pricePerKg": 900,
        "textureUrl": "https://minio/textures/chocolate.webp",
        "color": "#4A2C17",
        "isAvailable": true
      },
      {
        "id": "red_velvet",
        "name": "Красный бархат",
        "pricePerKg": 1000,
        "textureUrl": "https://minio/textures/red_velvet.webp",
        "color": "#8B1A1A",
        "isAvailable": true
      }
    ],
    "fillings": [
      {
        "id": "strawberry_cream",
        "name": "Клубника-сливки",
        "description": "Нежный сливочный крем с натуральной клубникой",
        "pricePerKg": 400,
        "imageUrl": "https://minio/fillings/strawberry.webp",
        "isAvailable": true
      }
    ],
    "coatings": [
      {
        "id": "cream",
        "name": "Крем",
        "type": "cream",
        "pricePerKg": 200,
        "roughness": 0.4,
        "isAvailable": true
      },
      {
        "id": "fondant",
        "name": "Мастика",
        "type": "fondant",
        "pricePerKg": 350,
        "roughness": 0.8,
        "isAvailable": true
      }
    ],
    "decorations": [
      {
        "id": "strawberry",
        "name": "Клубника",
        "category": "berries",
        "pricePerUnit": 50,
        "modelUrl": "https://minio/models/strawberry.glb",
        "thumbnailUrl": "https://minio/decorations/strawberry_thumb.webp",
        "isAvailable": true
      }
    ],
    "shapes": [
      { "id": "circle", "name": "Круг", "surcharge": 0 },
      { "id": "square", "name": "Квадрат", "surcharge": 0.10 },
      { "id": "heart", "name": "Сердце", "surcharge": 0.15 }
    ],
    "tierSurcharges": [
      { "tiers": 1, "surcharge": 0 },
      { "tiers": 2, "surcharge": 300 },
      { "tiers": 3, "surcharge": 600 }
    ],
    "config": {
      "minWeight": 1,
      "maxWeight": 10,
      "maxDecorations": 20,
      "maxInscriptionLength": 50
    }
  }
}
```

**Zustand constructor-store:**

```typescript
// stores/constructor-store.ts
interface ConstructorState {
  // Текущий шаг (1-5)
  currentStep: number;

  // Конфигурация торта
  shape: "circle" | "square" | "heart";
  tiers: number;
  layers: Array<{
    tier: number;
    baseId: string;
    fillingId: string;
    weight: number;
  }>;
  coating: {
    type: "cream" | "fondant";
    color: string;
    gradient: { colorFrom: string; colorTo: string; direction: string } | null;
    drips: { color: string; intensity: number } | null;
  };
  decorations: Array<{
    id: string;          // nanoid — уникальный ID размещённого экземпляра
    decorId: string;     // ID типа декора (strawberry, topper...)
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
  }>;
  inscription: string;

  // Данные ингредиентов (загружены из API)
  ingredients: IngredientsData | null;

  // Вычисляемая цена
  totalPrice: number;

  // Actions
  setStep: (step: number) => void;
  setShape: (shape: string) => void;
  setTiers: (tiers: number) => void;
  setLayerBase: (tier: number, baseId: string) => void;
  setLayerFilling: (tier: number, fillingId: string) => void;
  setLayerWeight: (tier: number, weight: number) => void;
  setCoatingType: (type: string) => void;
  setCoatingColor: (color: string) => void;
  setGradient: (gradient: object | null) => void;
  setDrips: (drips: object | null) => void;
  addDecoration: (decorId: string, position: [number, number, number]) => void;
  removeDecoration: (id: string) => void;
  moveDecoration: (id: string, position: [number, number, number]) => void;
  setInscription: (text: string) => void;
  recalculatePrice: () => void;
  reset: () => void;
  getConfig: () => CakeConfig;
}
```

**Компонентная структура [FE + 3D]:**

```
ConstructorPage (Client Component)
├── ConstructorLayout
│   ├── CakeViewport (60% / 100%)
│   │   ├── Canvas (R3F)
│   │   │   ├── SceneSetup
│   │   │   │   ├── CameraController (OrbitControls + auto-rotate)
│   │   │   │   ├── LightingRig (3-point + HDRI)
│   │   │   │   └── CakeStand (подставка + ContactShadows)
│   │   │   ├── CakeModel
│   │   │   │   ├── TierMesh (×N, динамическое кол-во)
│   │   │   │   │   ├── BaseMaterial (текстура бисквита)
│   │   │   │   │   └── CoatingMaterial (цвет/gradient + roughness)
│   │   │   │   ├── DripsMesh (если включены подтёки)
│   │   │   │   └── DecorationInstances (размещённый декор)
│   │   │   │       └── DecorationMesh (×N, с позиционированием)
│   │   │   └── DragDropOverlay (призрак декора при перетаскивании)
│   │   └── LoadingOverlay (прогресс-бар при загрузке)
│   │
│   └── SettingsPanel (40% / 100%)
│       ├── StepProgressBar (● ● ○ ○ ○)
│       ├── StepShape (шаг 1)
│       ├── StepBase (шаг 2)
│       ├── StepFilling (шаг 3)
│       ├── StepCoating (шаг 4)
│       ├── StepDecor (шаг 5)
│       ├── PriceCalculator (плавающий)
│       └── StepNavigation (Назад / Далее / В корзину)
```

---

### UC-08: Шаг 1 — Выбор формы и размера [P0]

**Актор:** Гость / Покупатель  
**Предусловия:** Конструктор загружен (UC-07)

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Видит панель с выбором формы: три карточки с иконками (Круг, Квадрат, Сердце). Круг выбран по умолчанию|[FE] Карточки с визуальным превью формы. Выбранная карточка — border акцентным цветом|
|2|Кликает на «Сердце»|[FE] constructor-store: `setShape("heart")`. Пересчёт цены|
|3|—|[3D] Анимация morph: текущая геометрия плавно трансформируется в форму сердца (400ms ease-out). Если morph невозможен — crossfade (opacity out 200ms + opacity in 200ms)|
|4|—|[FE] Калькулятор: цена обновляется с count-up анимацией (надбавка +15%)|
|5|Выбирает количество ярусов: переключатель 1 / 2 / 3. По умолчанию 1|[FE] Стилизованные radio-кнопки|
|6|Выбирает 2 яруса|[FE] constructor-store: `setTiers(2)`. Добавление второго layer в массив|
|7|—|[3D] Анимация: второй ярус «вырастает» сверху (scale Y: 0→1, translateY: вниз→вверх, 500ms spring)|
|8|—|[3D] Камера автоматически отъезжает (увеличение distance) чтобы вместить оба яруса|
|9|—|[FE] Калькулятор: +300₽ за ярусность, пересчёт веса (каждому ярусу — дефолтный вес)|
|10|Нажимает «Далее →»|[FE] `setStep(2)`. Панель шага 1 slide-out, панель шага 2 slide-in|

**Технические детали [3D]:**

```typescript
// components/constructor/scene/CakeModel.tsx
// Для каждой формы — отдельная .glb модель (предзагруженная):
// - /models/cake_circle_1tier.glb
// - /models/cake_circle_2tier.glb
// - /models/cake_circle_3tier.glb
// - /models/cake_square_1tier.glb
// ... (9 комбинаций: 3 формы × 3 яруса)

// Переключение формы:
// 1. useSpring (из @react-spring/three) для анимации opacity/scale
// 2. Текущая модель: scale → 0.95, opacity → 0 (200ms)
// 3. Новая модель: scale 0.95 → 1.0, opacity 0 → 1 (200ms)
// 4. crossfade overlap 100ms для плавности

// Анимация добавления яруса:
// 1. Загрузить модель с N+1 ярусами
// 2. Новый ярус: начальное состояние scaleY=0, positionY = позиция_верхнего_яруса
// 3. Анимация scaleY 0→1 (400ms spring, tension:180, friction:12)
// 4. Камера: плавный transition distance (useSpring)
```

**Дефолтные веса ярусов:**

|Ярусы|Ярус 1 (нижний)|Ярус 2 (средний)|Ярус 3 (верхний)|
|---|---|---|---|
|1|2 кг|—|—|
|2|2 кг|1.5 кг|—|
|3|3 кг|2 кг|1 кг|

Пользователь может изменить вес на следующих шагах (поле в шаге «Начинка»).

---

### UC-09: Шаг 2 — Выбор бисквита [P0]

**Актор:** Гость / Покупатель  
**Предусловия:** Шаг 1 завершён

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Видит панель с карточками бисквитов: каждая с названием, цветной полоской (цвет бисквита) и ценой за кг|[FE] Карточки фильтруются: показываются только `isAvailable: true`|
|2|Если ярусов > 1: видит переключатель «Ярус 1 / Ярус 2 / Все ярусы»|[FE] Таб-переключатель сверху списка|
|3|Выбирает «Шоколадный» для яруса 1|[FE] constructor-store: `setLayerBase(1, "chocolate")`|
|4|—|[3D] Текстура нижнего яруса плавно сменяется (crossfade uniform mix, 300ms). Старая текстура → opacity 0, новая → opacity 1 через ShaderMaterial с двумя текстурами и uniform mixFactor|
|5|—|[FE] Калькулятор: пересчёт (900₽/кг вместо 800₽/кг для яруса 1)|
|6|Переключает на «Ярус 2», выбирает «Красный бархат»|[FE] `setLayerBase(2, "red_velvet")`. [3D] Текстура верхнего яруса меняется аналогично|
|7|Нажимает «Далее →»|[FE] `setStep(3)`|

**Технические детали [3D]:**

```typescript
// Crossfade текстур через custom ShaderMaterial:
// uniform sampler2D texOld;
// uniform sampler2D texNew;
// uniform float mixFactor; // 0.0 → 1.0 за 300ms
// gl_FragColor = mix(texture2D(texOld, vUv), texture2D(texNew, vUv), mixFactor);

// Или через Drei <MeshStandardMaterial> с useSpring:
// materialRef.current.map = newTexture;
// Анимация opacity: 1 → 0 → 1 (но это мигание)
// Лучше: два меша (текущий + новый), opacity crossfade, удаление старого после анимации
```

---

### UC-10: Шаг 3 — Выбор начинки [P0]

**Актор:** Гость / Покупатель  
**Предусловия:** Шаг 2 завершён

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Видит список начинок: карточки с названием, описанием, ценой за кг и фото|[FE] Карточки с фото начинки. Только `isAvailable: true`|
|2|Если ярусов > 1: переключатель ярусов (аналогично шагу 2)|[FE] Таб-переключатель|
|3|Выбирает начинку|[FE] `setLayerFilling(tier, "strawberry_cream")`. Пересчёт цены|
|4|Может изменить вес яруса (input number с шагом 0.5 кг, min 1 кг)|[FE] `setLayerWeight(tier, 2.5)`. Пересчёт цены|
|5|Нажимает «Далее →»|[FE] `setStep(4)`|

**Примечание:** Начинка не влияет на 3D-модель (она внутри торта). Изменения только в калькуляторе.

---

### UC-11: Шаг 4 — Выбор покрытия [P0]

**Актор:** Гость / Покупатель  
**Предусловия:** Шаг 3 завершён

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Видит переключатель «Крем / Мастика»|[FE] Визуальный toggle с иконками|
|2|Выбирает «Мастика»|[FE] `setCoatingType("fondant")`. [3D] Материал меняется: roughness 0.4→0.8 (анимация 200ms). Поверхность становится матовой|
|3|Видит палитру цветов: 8 предустановленных + color picker|[FE] Круглые свотчи (24×24px). Выбранный — border + checkmark|
|4|Кликает на розовый (#F4C2C2)|[FE] `setCoatingColor("#F4C2C2")`. [3D] Мгновенная смена цвета (< 50ms, изменение uniform color)|
|5|Открывает color picker для точного выбора|[FE] Нативный `<input type="color">` или кастомный HSL-пикер|
|6|Перемещает ползунок по палитре|[FE] onChange каждый кадр → `setCoatingColor(hex)`. [3D] Цвет обновляется непрерывно в реальном времени|
|7|Включает «Градиент» (toggle)|[FE] Появляются два цветовых пикера + переключатель направления|
|8|Выбирает два цвета градиента|[3D] Шейдер смешивает два цвета по UV-координатам. Анимация появления градиента (300ms)|
|9|Включает «Подтёки» (toggle)|[FE] Появляется пикер цвета подтёков + ползунок интенсивности (0-100%)|
|10|Выбирает шоколадный цвет подтёков, интенсивность 70%|[3D] Mesh подтёков появляется с анимацией «стекания» сверху вниз (600ms). Количество и длина подтёков зависят от intensity|
|11|Нажимает «Далее →»|[FE] `setStep(5)`. [3D] Камера слегка переходит на вид сверху-сбоку (для лучшего обзора декора)|

**Технические детали [3D] — покрытие:**

```typescript
// Изменение цвета покрытия:
// meshRef.current.material.color.set(newColor) — мгновенно, без анимации
// Для uniform-подхода (если используется ShaderMaterial):
// material.uniforms.uColor.value.set(newColor)

// Градиент:
// Custom ShaderMaterial с двумя uniform color:
// uniform vec3 colorTop;
// uniform vec3 colorBottom;
// uniform float direction; // 0 = vertical, 1 = horizontal
// varying vec2 vUv;
// void main() {
//   float t = direction < 0.5 ? vUv.y : vUv.x;
//   vec3 color = mix(colorBottom, colorTop, t);
//   ...
// }

// Подтёки:
// Отдельный меш (предзагруженный .glb с формой подтёков)
// Параметр intensity управляет:
// - scaleY подтёков (длина): intensity * maxDripLength
// - количество видимых подтёков (через clip/discard по angle)
// Анимация появления: scaleY 0→target за 600ms с ease-out
```

**Предустановленные цвета палитры:**

|Цвет|HEX|Название|
|---|---|---|
|Белый|#FFFFFF|Классика|
|Розовый|#F4C2C2|Нежный розовый|
|Голубой|#B5D8EB|Небесный|
|Мятный|#B2DFDB|Мятный|
|Лавандовый|#D1C4E9|Лавандовый|
|Персиковый|#FFDAB9|Персиковый|
|Кремовый|#FFF8DC|Кремовый|
|Чёрный|#2C2C2C|Элегантный чёрный|

---

### UC-12: Шаг 5 — Декорирование [P0]

**Актор:** Гость / Покупатель  
**Предусловия:** Шаг 4 завершён  
**Связь:** US-06

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Видит панель с категориями декора: «Ягоды», «Шоколад», «Топперы», «Цветы», «Фигурки»|[FE] Горизонтальные табы категорий. Каждый элемент — миниатюра + название + цена|
|2|Выбирает категорию «Ягоды»|[FE] Показ элементов категории: клубника (50₽), голубика (40₽), малина (60₽)...|
|3|**Desktop:** Перетаскивает клубнику из панели на 3D-сцену|[3D] При начале drag: создаётся полупрозрачный «призрак» (opacity 0.5) клубники, привязанный к курсору. Призрак привязан к поверхности торта через raycasting|
|4|Двигает курсор по поверхности торта|[3D] Призрак скользит по поверхности, ориентируясь по нормали (всегда стоит «ровно» на торте). Raycaster обновляется каждый кадр|
|5|Отпускает кнопку мыши|[3D] Призрак становится непрозрачным. Bounce-анимация (scale 1.2→1.0, 200ms spring). [FE] `addDecoration(decorId, position)`. Калькулятор: +50₽|
|6|Наводит курсор на размещённую клубнику|[3D] Outline-эффект (или glow) вокруг объекта. Появление иконки удаления (×)|
|7|Нажимает ×|[3D] Декор исчезает с анимацией (scale 1→0, opacity 1→0, 200ms). [FE] `removeDecoration(id)`. Калькулятор: -50₽|
|8|Перетаскивает уже размещённый элемент на новое место|[3D] Элемент следует за курсором по поверхности (raycasting). При отпускании — фиксируется. [FE] `moveDecoration(id, newPosition)`|
|9|Вводит текст в поле «Надпись на торте» (макс. 50 символов)|[FE] `setInscription(text)`. Counter символов: «25 / 50»|
|10|**Mobile:** Долгое нажатие (300ms) на элемент декора в панели|[FE] Haptic feedback (если поддерживается). Элемент «поднимается» визуально. Переключение в drag-mode|
|11|Перетаскивает палец на 3D-сцену|[3D] Аналогично desktop: raycasting, призрак, привязка к поверхности|

**Технические детали [3D] — Drag-and-drop + Raycasting:**

```typescript
// Raycasting для размещения декора:
// 1. useRaycast() hook из @react-three/drei
// 2. Луч из камеры через позицию курсора (pointer events)
// 3. Пересечение с mesh торта → point + normal
// 4. Позиция декора = point + normal * offset (чтобы не утопало)
// 5. Ориентация декора: lookAt(point + normal) — стоит перпендикулярно поверхности

// DragControls:
// Не использовать DragControls из drei (конфликт с OrbitControls)
// Реализация через onPointerDown/Move/Up:
//
// onPointerDown на декор-элемент:
//   - Отключить OrbitControls (controls.enabled = false)
//   - Начать drag-режим
//
// onPointerMove (когда drag активен):
//   - Raycaster.intersectObject(cakeMesh)
//   - Обновить позицию декора = intersect.point
//   - Обновить ориентацию по нормали
//
// onPointerUp:
//   - Зафиксировать позицию в store
//   - Включить OrbitControls обратно
//   - Bounce-анимация

// Ограничения:
// - Максимум 20 элементов декора (производительность)
// - Декор размещается только на верхней и боковых поверхностях
// - Нельзя разместить на дне торта
// - Минимальное расстояние между элементами: radius * 1.5 (не накладываются)
```

**Категории декора и элементы:**

|Категория|Элементы|Цена за шт|3D-модель|
|---|---|---|---|
|Ягоды|Клубника, голубика, малина, ежевика, вишня|40-60 ₽|.glb, < 500 полигонов каждая|
|Шоколад|Шоколадные шарики, стружка, трюфель|50-100 ₽|.glb, < 300 полигонов|
|Топперы|«С днём рождения!», «С любовью», цифры 0-9|150-200 ₽|.glb, < 1000 полигонов (тонкая геометрия)|
|Цветы|Роза, пион, лаванда (стилизованные)|80-120 ₽|.glb, < 800 полигонов|
|Фигурки|Сердце, звезда, бабочка|100-150 ₽|.glb, < 600 полигонов|

---

### UC-13: Вращение и зум 3D-модели [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-05  
**Предусловия:** Конструктор загружен. Действует на всех шагах

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|**Desktop:** Зажимает ЛКМ и двигает мышь по Canvas|[3D] OrbitControls: вращение торта. Инерция при отпускании (enableDamping: true, dampingFactor: 0.05). 60 FPS|
|2|**Desktop:** Крутит колёсико|[3D] Зум (изменение distance камеры). Min distance: 3, max distance: 12. Плавно (enableDamping)|
|3|**Mobile:** Один палец — swipe|[3D] Вращение (аналогично мыши)|
|4|**Mobile:** Pinch (два пальца)|[3D] Зум|
|5|**Во время drag-and-drop декора:** пользователь пытается вращать|[3D] OrbitControls временно отключен (controls.enabled = false). Возвращается после отпускания декора|

**Технические детали [3D]:**

```typescript
// components/constructor/scene/CameraController.tsx
<OrbitControls
  ref={controlsRef}
  enablePan={false}                    // Без панорамирования — только вращение и зум
  enableDamping={true}
  dampingFactor={0.05}
  minDistance={3}
  maxDistance={12}
  minPolarAngle={Math.PI * 0.1}       // Не дать заглянуть снизу
  maxPolarAngle={Math.PI * 0.85}      // Не дать перевернуть
  target={[0, cakeHeight / 2, 0]}     // Центр вращения = середина торта по высоте
  autoRotate={isAutoRotating}          // Авто-поворот при первом входе
  autoRotateSpeed={1.0}
/>

// Начальная позиция камеры:
// position={[0, cakeHeight * 0.8, 6]}   — лёгкий угол сверху
// При смене количества ярусов:
// useSpring для анимации camera.position.y и controls.target.y
```

---

### UC-14: Расчёт цены в реальном времени [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-07  
**Предусловия:** Конструктор загружен. Действует на всех шагах

**Основной поток:**

|#|Триггер|Действие системы|
|---|---|---|
|1|Любое изменение в constructor-store|[FE] `recalculatePrice()` вызывается автоматически (Zustand subscribe)|
|2|—|[FE] Формула (клиентский расчёт): см. ниже|
|3|—|[FE] UI: плавающий блок «Итого: 2 450 ₽» с анимацией count-up/down (200ms)|
|4|—|[FE] Под итого — разбивка: «Бисквит: 1 800₽, Начинка: 800₽, Покрытие: 400₽, Декор: 250₽, Форма: +15%» (collapsible)|

**Формула расчёта [FE]:**

```typescript
function calculatePrice(state: ConstructorState): number {
  const { layers, coating, decorations, shape, tiers, ingredients } = state;
  if (!ingredients) return 0;

  // 1. Стоимость бисквитов и начинок
  let layersCost = 0;
  for (const layer of layers) {
    const base = ingredients.bases.find(b => b.id === layer.baseId);
    const filling = ingredients.fillings.find(f => f.id === layer.fillingId);
    layersCost += (base?.pricePerKg ?? 0) * layer.weight;
    layersCost += (filling?.pricePerKg ?? 0) * layer.weight;
  }

  // 2. Стоимость покрытия
  const coatingData = ingredients.coatings.find(c => c.type === coating.type);
  const totalWeight = layers.reduce((sum, l) => sum + l.weight, 0);
  const coatingCost = (coatingData?.pricePerKg ?? 0) * totalWeight;

  // 3. Стоимость декора
  const decorCost = decorations.reduce((sum, d) => {
    const decor = ingredients.decorations.find(dec => dec.id === d.decorId);
    return sum + (decor?.pricePerUnit ?? 0);
  }, 0);

  // 4. Базовая сумма
  let total = layersCost + coatingCost + decorCost;

  // 5. Надбавка за форму (процент от базовой суммы)
  const shapeData = ingredients.shapes.find(s => s.id === shape);
  total *= (1 + (shapeData?.surcharge ?? 0));

  // 6. Надбавка за ярусность (фиксированная)
  const tierData = ingredients.tierSurcharges.find(t => t.tiers === tiers);
  total += tierData?.surcharge ?? 0;

  return Math.round(total);
}
```

**Серверная верификация [BE]:**

При оформлении заказа бэкенд пересчитывает цену независимо (защита от манипуляций на клиенте):

```
POST /api/constructor/calculate
Request: { config: CakeConfig }
Response: { "success": true, "data": { "price": 2450, "breakdown": {...} } }
```

Если клиентская и серверная цена расходятся более чем на 1₽ — показать пользователю актуальную цену с уведомлением.

---

### UC-15: Добавление торта из конструктора в корзину [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-08  
**Предусловия:** Все 5 шагов пройдены (минимум: выбраны форма, бисквит, начинка, покрытие)

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Нажимает «Добавить в корзину» на шаге 5 (или на любом шаге через плавающую кнопку)|[FE] Валидация: все обязательные поля заполнены|
|2|—|[3D] Генерация скриншота: `gl.toDataURL('image/png')` с devicePixelRatio 2x. Камера автоматически выставляется в оптимальный ракурс (front-top, 30°)|
|3|—|[FE] Скриншот конвертируется в Blob|
|4|—|[FE] `POST /api/upload/presign` → получение presigned URL|
|5|—|[FE] `PUT presignedUrl` → загрузка скриншота в MinIO|
|6|—|[FE] Формирование CakeConfig JSON с screenshotUrl|
|7|—|[FE] Zustand cart-store: `addItem({ type: "constructor", name: "Торт по вашему дизайну", imageUrl: screenshotUrl, weight, price, cakeConfig })`|
|8|—|[FE] Анимация: «пуф»-эффект на кнопке, toast «Торт добавлен в корзину!» со ссылкой «Перейти в корзину»|
|9|—|[FE] Показать кнопки: «Оформить заказ» / «Собрать ещё один торт» (reset constructor-store)|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Не все шаги пройдены|[FE] Валидация: «Выберите начинку для яруса 2». Подсветить незаполненный шаг в прогресс-баре. Не блокировать добавление — у каждого шага есть дефолт|
|A2: Ошибка загрузки скриншота|[FE] Retry (3 попытки). Если не удалось — добавить в корзину без скриншота (placeholder-изображение). Скриншот будет загружен позже|
|A3: Ингредиент стал недоступен (другой пользователь/админ отключил)|[BE] При верификации цены вернуть ошибку 422 с указанием недоступного ингредиента. [FE] «Клубника больше не доступна. Пожалуйста, замените»|

---

## 6. Use Cases — Корзина и оформление заказа

### UC-16: Просмотр и редактирование корзины [P0]

**Актор:** Гость / Покупатель  
**Связь:** US-03, US-08

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Нажимает иконку корзины в header|[FE] Переход на /cart. Данные из Zustand cart-store (localStorage)|
|2|Видит список товаров|[FE] Для каждого item: изображение, название, вес, цена, количество (±), кнопка удаления|
|3|Для конструкторного товара — видит скриншот торта|[FE] Под скриншотом — краткая расшифровка: «2 яруса, шоколадный бисквит, клубника-сливки, розовый крем»|
|4|Нажимает «Редактировать» на конструкторном товаре|[FE] Переход на /constructor. constructor-store загружается из cakeConfig товара. Все шаги заполнены|
|5|Меняет количество (+ или -)|[FE] Обновление quantity в cart-store. Пересчёт суммы|
|6|Удаляет товар (×)|[FE] Подтверждение (только для конструкторных — потеря конфигурации). Удаление из cart-store|
|7|Видит итоговую сумму|[FE] Сумма всех товаров|
|8|Нажимает «Оформить заказ»|[FE] Проверка авторизации. Если не авторизован — модальное окно логина (UC-02). После логина — переход на /checkout|

**Альтернативные потоки:**

|Условие|Действие|
|---|---|
|A1: Корзина пуста|[FE] «Корзина пуста» + CTA «Перейти в каталог» / «Собрать торт»|

---

### UC-17: Оформление заказа (самовывоз) [P0]

**Актор:** Покупатель  
**Связь:** US-09  
**Предусловия:** Корзина не пуста. Пользователь авторизован

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Открывает /checkout|[FE] Форма оформления: адрес самовывоза (статичный текст + карта), дата, время, комментарий|
|2|Видит адрес самовывоза|[FE] Статичный блок: «г. Арзамас, ул. Ленина, д. 15» (из конфигурации). Карта (статичная картинка или Yandex Maps embed)|
|3|Выбирает дату|[FE] Календарь. Минимум: сегодня + 1 день. Недоступные даты (воскресенья, праздники) заблокированы. Данные о недоступных датах — из конфига или от API|
|4|Выбирает временной слот|[FE] Radio: «Утро (10:00-12:00)» / «День (12:00-16:00)» / «Вечер (16:00-19:00)»|
|5|Заполняет комментарий (необязательно)|[FE] Textarea, max 500 символов|
|6|Видит итог: список товаров + сумма|[FE] Краткая сводка корзины|
|7|Нажимает «Оформить заказ»|[FE] Дисейбл кнопки (предотвращение двойного клика). Спиннер|
|8|—|[FE] `POST /api/orders` с данными|
|9|—|[BE] Валидация DTO. Верификация цен (пересчёт на сервере). Проверка доступности ингредиентов|
|10|—|[DB] Транзакция: INSERT order + INSERT order_items (для каждого товара). Статус = «Создан»|
|11|—|[FE] Redirect на /checkout/success. Очистка cart-store|
|12|Видит страницу подтверждения|[FE] «Заказ №1234 оформлен! Ожидайте подтверждения. Дата самовывоза: 15.07.2025, 12:00-16:00. Адрес: ул. Ленина, д. 15»|

**API-спецификация:**

```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "pickupDate": "2025-07-15",
  "pickupTimeSlot": "day",
  "comment": "Позвоните за час до",
  "items": [
    {
      "type": "product",
      "productId": "uuid",
      "weight": 2,
      "quantity": 1,
      "inscription": "С днём рождения, Маша!",
      "price": 2400
    },
    {
      "type": "constructor",
      "cakeConfig": { ... },
      "weight": 3.5,
      "quantity": 1,
      "price": 4200,
      "screenshotUrl": "https://minio/screenshots/abc123.png"
    }
  ]
}

Response 201:
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": 1234,
    "status": "created",
    "totalPrice": 6600,
    "pickupDate": "2025-07-15",
    "pickupTimeSlot": "day",
    "createdAt": "2025-07-14T10:30:00Z"
  }
}
```

---

## 7. Use Cases — Личный кабинет

### UC-18: Просмотр истории заказов [P1]

**Актор:** Покупатель  
**Связь:** US-12

**Основной поток:**

|#|Действие пользователя|Действие системы|
|---|---|---|
|1|Переходит в /account/orders|[FE] `GET /api/orders` (с JWT)|
|2|Видит список заказов|[FE] Карточки: №заказа, дата, сумма, статус (badge с цветом), количество позиций|
|3|Кликает на заказ|[FE] Раскрытие деталей (accordion) или переход на отдельную страницу|
|4|Видит детали|[FE] Список товаров. Для конструкторных — скриншот + расшифровка CakeConfig в читаемом виде|

**Цвета badge-статусов:**

|Статус|Цвет|Badge|
|---|---|---|
|Создан|Серый|outline|
|Принят|Синий|solid|
|Готовится|Оранжевый|solid|
|Готов к выдаче|Зелёный|solid|
|Забран|Зелёный (тёмный)|solid|
|Завершён|Серый|solid|
|Отменён|Красный|solid|

---

## 8. Use Cases — Админ-панель

### UC-19: Просмотр и управление заказами [P0]

**Актор:** Администратор  
**Связь:** US-A01, US-A02, US-A03  
**Предусловия:** Авторизован с ролью ADMIN

**Основной поток:**

|#|Действие|Действие системы|
|---|---|---|
|1|Переходит в /admin/orders|[FE] `GET /api/admin/orders`|
|2|Видит таблицу заказов|[FE] Колонки: №, дата, клиент, сумма, статус, действия. Фильтр по статусу, сортировка по дате|
|3|Кликает на заказ|[FE] Модальное окно или боковая панель с деталями|
|4|Видит детали заказа|[FE] Информация о клиенте (имя, телефон, email). Список товаров. **Для конструкторных: скриншот 3D-торта + развёрнутая конфигурация:** форма, ярусы, бисквиты, начинки, покрытие (тип, цвет), декор (список), надпись|
|5|Меняет статус (dropdown: Принят → Готовится)|[FE] `PUT /api/admin/orders/:id/status`|
|6|—|[BE] Обновление статуса в БД. Валидация перехода (нельзя из «Забран» в «Готовится»)|
|7|—|[FE] Обновление badge в таблице|

**Допустимые переходы статусов:**

```
Создан     → Принят, Отменён
Принят     → Готовится, Отменён
Готовится  → Готов к выдаче, Отменён
Готов к выдаче → Забран, Отменён
Забран     → Завершён
Завершён   → (конечный статус)
Отменён    → (конечный статус)
```

---

### UC-20: Управление каталогом товаров [P1]

**Актор:** Администратор  
**Связь:** US-A04

**Основной поток:**

|#|Действие|Действие системы|
|---|---|---|
|1|Переходит в /admin/products|[FE] Таблица товаров с toggle «Доступен»|
|2|Нажимает «Добавить товар»|[FE] Модальная форма: название, slug (авто-генерация из названия), описание, состав, фото (drag-and-drop загрузка), цена за кг, категория, поводы, min/max вес|
|3|Загружает фото|[FE] `POST /api/upload/presign` → presigned URL → PUT файл в MinIO|
|4|Заполняет форму и нажимает «Сохранить»|[FE] `POST /api/admin/products`|
|5|—|[BE] Валидация. INSERT в БД. Возврат созданного товара|

---

### UC-21: Управление ингредиентами конструктора [P1]

**Актор:** Администратор  
**Связь:** US-A05, US-A06

**Основной поток:**

|#|Действие|Действие системы|
|---|---|---|
|1|Переходит в /admin/constructor|[FE] Табы: «Бисквиты», «Начинки», «Покрытия», «Декор»|
|2|Видит таблицу бисквитов|[FE] Колонки: название, цена/кг, текстура (миниатюра), доступность (toggle)|
|3|Переключает toggle «Доступность» у шоколадного бисквита (выкл)|[FE] `PUT /api/admin/constructor/ingredients/:id` с `{ isAvailable: false }`|
|4|—|[BE] Обновление. Этот бисквит больше не отображается в конструкторе для покупателей|
|5|Меняет цену: 900₽ → 950₽|[FE] Inline-редактирование. `PUT /api/admin/constructor/ingredients/:id` с `{ pricePerKg: 950 }`|

---

## 9. Нефункциональные требования (детализация)

### 9.1. Производительность 3D-конструктора

|Требование|Метрика|Метод проверки|
|---|---|---|
|NFR-01: Плавность рендера|60 FPS (desktop), 30+ FPS (mobile)|Chrome DevTools Performance, stats.js|
|NFR-02: Время загрузки сцены|< 3с на 4G (12 Mbps)|Lighthouse, Network throttling|
|NFR-03: Время реакции на действие|< 100ms от клика до визуального изменения в 3D|Performance.now() замеры|
|NFR-04: Размер бандла 3D|< 300 KB (gzip, JS)|Webpack Bundle Analyzer|
|NFR-05: Размер ассетов|< 5 MB суммарно (модели + текстуры + HDRI)|Файловая система|
|NFR-06: Память GPU|< 256 MB VRAM|Chrome Task Manager|
|NFR-07: Генерация скриншота|< 500ms|Performance.now()|

### 9.2. Производительность API

|Требование|Метрика|
|---|---|
|NFR-08: Время ответа GET-запросов|< 200ms (p95)|
|NFR-09: Время ответа POST-запросов|< 500ms (p95)|
|NFR-10: Время загрузки файла в MinIO|< 2с для файла 2MB|

### 9.3. Безопасность

|Требование|Описание|
|---|---|
|NFR-11: Хеширование|bcrypt с cost factor 10|
|NFR-12: JWT|Подпись HS256, время жизни 7 дней, httpOnly cookie|
|NFR-13: Rate limiting|Auth-эндпоинты: 5 запросов / минута с одного IP|
|NFR-14: Валидация|Все входные данные валидируются через DTO (NestJS) + Zod (фронт)|
|NFR-15: Sanitization|HTML-теги в текстовых полях экранируются|
|NFR-16: CORS|Разрешён только origin фронтенда (http://localhost:3000)|
|NFR-17: Presigned URLs|Время жизни: 15 минут, одноразовые|

### 9.4. Совместимость

|Требование|Описание|
|---|---|
|NFR-18: Браузеры|Chrome 90+, Safari 15+, Firefox 90+, Edge 90+|
|NFR-19: WebGL|Требуется WebGL 2.0. Fallback без 3D для остальных|
|NFR-20: Устройства|Desktop 1280px+, Tablet 768px+, Mobile 360px+|
|NFR-21: Touch|Полная поддержка touch-событий в конструкторе|

---

## 10. Модель данных (обзор сущностей)

> Полная схема БД будет потом

| Сущность                    | Описание                           | Ключевые поля                                                                                           |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **users**                   | Пользователи                       | id, name, email, phone, passwordHash, role                                                              |
| **products**                | Готовые товары каталога            | id, slug, name, description, pricePerKg, categoryId, imageUrl, isAvailable                              |
| **categories**              | Категории товаров                  | id, name, slug                                                                                          |
| **occasions**               | Поводы (день рождения, свадьба...) | id, name                                                                                                |
| **product_occasions**       | M2M: товар ↔ повод                 | productId, occasionId                                                                                   |
| **constructor_bases**       | Бисквиты конструктора              | id, name, pricePerKg, textureUrl, color, isAvailable                                                    |
| **constructor_fillings**    | Начинки конструктора               | id, name, description, pricePerKg, imageUrl, isAvailable                                                |
| **constructor_coatings**    | Покрытия конструктора              | id, name, type, pricePerKg, roughness, isAvailable                                                      |
| **constructor_decorations** | Декор конструктора                 | id, name, category, pricePerUnit, modelUrl, thumbnailUrl, isAvailable                                   |
| **orders**                  | Заказы                             | id, orderNumber, userId, status, totalPrice, pickupDate, pickupTimeSlot, comment, createdAt             |
| **order_items**             | Позиции заказа                     | id, orderId, type, productId?, cakeConfig?(JSON), weight, quantity, price, inscription?, screenshotUrl? |
| **favorites**               | Избранное                          | userId, productId                                                                                       |
| **reviews**                 | Отзывы                             | id, authorName, text, rating, createdAt                                                                 |

---

## 11. Трассировка требований

Матрица связей User Stories → Use Cases → API-эндпоинты:

|User Story|Use Case|API-эндпоинт|Приоритет|
|---|---|---|---|
|US-01|UC-04|GET /api/products|P0|
|US-02|UC-05|GET /api/products/:slug|P0|
|US-03|UC-06|— (клиентский Zustand)|P0|
|US-04|UC-07, UC-08, UC-09, UC-10, UC-11, UC-12|GET /api/constructor/ingredients|P0|
|US-05|UC-13|— (клиентский R3F)|P0|
|US-06|UC-12|— (клиентский R3F)|P0|
|US-07|UC-14|POST /api/constructor/calculate|P0|
|US-08|UC-15|POST /api/upload/presign|P0|
|US-09|UC-17|POST /api/orders|P0|
|US-10|UC-07, UC-08, UC-09, UC-11|— (клиентский R3F)|P0|
|US-11|UC-01, UC-02|POST /api/auth/*|P1|
|US-12|UC-18|GET /api/orders|P1|
|US-13|—|PUT /api/favorites/*|P2|
|US-14|UC-17|POST /api/orders (поле comment)|P1|
|US-A01|UC-19|GET /api/admin/orders|P0|
|US-A02|UC-19|GET /api/admin/orders/:id|P0|
|US-A03|UC-19|PUT /api/admin/orders/:id/status|P0|
|US-A04|UC-20|POST/PUT/DELETE /api/admin/products|P1|
|US-A05|UC-21|PUT /api/admin/constructor/ingredients/:id|P1|
|US-A06|UC-21|PUT /api/admin/constructor/ingredients/:id|P1|
|US-A07|UC-21|POST /api/upload/presign + PUT /api/admin/constructor/...|P2|