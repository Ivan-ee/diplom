# E2E Scenario: Полное тестирование интернет-магазина кондитерской

**Дата:** 2026-04-09
**Профиль:** Validation/QA (full E2E + security)
**Окружение:** postgres+minio docker, api+web pnpm dev
**Источник правды:** этот файл; перечитывать перед каждым шагом, переживает компактизацию.

---

## Этап 0. Окружение

- [x] postgres healthy на :5433 (`bakery`/`postgres`/`postgres`)
- [x] minio healthy на :9000/:9001 (4 бакета)
- [x] миграции применены (drizzle)
- [x] seed выполнен (test/admin/products/ingredients)
- [x] api отвечает на `GET http://localhost:4000/api/health` ✅ 200
- [x] web отвечает на `GET http://localhost:3000` ✅ 200
- [x] Swagger `http://localhost:4000/api/docs` доступен ✅ 200

---

## Этап 1. Smoke

- [x] `GET /api/health` → 200, success: true ✅ (+выставляет XSRF-TOKEN cookie)
- [x] `GET /api/products?page=1&limit=12` → 200 ⚠️ **FINDING**: `data` возвращается как массив без `total/page/limit/hasMore` — нет meta для пагинации
- [x] `GET /api/products/medovik` → 200 ✅
- [x] `GET /api/constructor/ingredients` → 200 ✅ (bases/fillings/coatings/decorations)
- [x] `POST /api/constructor/calculate` → 200, totalPrice=225000 ✅ (1.5kg, 1 ярус, крем, 3× клубника)
- [x] `GET /` (web) → 200 ✅
- [x] `GET /catalog` (web) → 200 ✅
- [x] `GET /catalog/medovik` (web) → 200 ✅
- [x] `GET /about` (web) → 200 ✅
- [x] `GET /fillings` (web) → 200 ✅
- [x] `GET /constructor` (web) → 200 ✅
- [x] `GET /cart` (web) → 200 ✅
- [x] `GET /account/orders` (web) → 307 редирект (middleware) ✅
- [x] `GET /admin` (web) → 307 редирект (middleware) ✅

---

## Этап 2. API контракт-тесты

### 2.1 Auth flow
- [x] GET `/api/health` устанавливает XSRF-TOKEN cookie ✅
- [x] POST `/api/auth/register` (новый юзер) → 201, bakery_token cookie (HttpOnly) ✅
- [x] POST `/api/auth/register` тем же email → 409 `{success:false,error:{code:CONFLICT}}` ✅
- [x] POST `/api/auth/login` (test@bakery.ru) → 200, новый bakery_token ✅
- [x] GET `/api/auth/profile` (с cookie) → 200, данные юзера ✅
- [x] POST `/api/auth/logout` → 200, bakery_token удалён ✅
- [x] GET `/api/auth/profile` после logout → 401 ✅

### 2.2 Validation
- [x] POST `/api/auth/register` пустое тело → 400 (class-validator: 6 details) ✅
- [x] POST `/api/auth/register` с лишним `isAdmin/role` → 400 `property X should not exist` ✅ + юзер НЕ создан в БД ✅
- [x] POST `/api/constructor/calculate` невалидный shape `triangle` → 400 ✅

### 2.3 Products / public
- [x] фильтрация по categorySlug=torty → 4 items ✅ (⚠️ category slug = `torty` не `tort` — FYI для документации)
- [x] диапазон priceMin=100000&priceMax=200000 → 4 items (цены в копейках) ✅
- [x] пагинация page=2&limit=2 → 2 items ✅ ⚠️ **FINDING**: ответ без meta (total/page/limit/hasMore)
- [x] сортировка sort=pricePerKg&order=asc → цены по возрастанию ✅ (поле `pricePerKg`, не `price`)

### 2.4 Constructor
- [x] calculate многоярусный (2 яруса circle, 2kg+1kg, крем, 3× клубника) → 735000 ✅ (subtotal=435000 + tierSurcharge=300000 за 2-й ярус)
- [x] calculate heart 1.5kg → 241500 = 210000×1.15 (shapeSurcharge=31500) ✅
- [x] calculate с несуществующим decoration UUID → 404 "Decoration not found" ✅
- [x] **CSRF**: POST /api/constructor/calculate без X-XSRF-TOKEN → 403 `CSRF_VALIDATION_FAILED` ✅

### 2.5 Orders (USER)
- [x] POST `/api/orders` без cookie → 403 CSRF ⚠️ **FINDING**: CSRF отрабатывает раньше JWT guard, возвращается 403 вместо 401 (защитно, но семантически неверно)
- [x] POST `/api/orders` валидное тело → 201, в БД появилось, orderNumber=1 ✅
- [x] GET `/api/orders` → только мои (count=1) ✅
- [x] GET `/api/orders/<id>` чужого юзера → **404** (skрытие существования, не 403) ✅
- [x] POST `/api/orders` без X-XSRF-TOKEN → 403 CSRF_VALIDATION_FAILED ✅

### 2.6 Upload
- [x] POST `/api/upload/presign` `{filename,bucket}` → 200 `{uploadUrl, fileUrl, objectName, bucket:screenshots, expiresIn:900}` ✅
- [x] PUT по presigned URL с PNG → 200, файл в MinIO (`mc ls local/screenshots/` — 25B) ✅

### 2.7 Admin
- [x] login admin@bakery.ru/admin123 → JWT payload role=admin ✅
- [x] GET `/api/admin/stats` → 200, `{newOrdersToday, ordersInProgress, totalRevenue, recentOrders}` ✅
- [x] GET `/api/admin/orders` → 200, 2 заказа видны ✅
- [x] PUT `/api/admin/orders/:id/status`: created→accepted→preparing→ready→picked_up ✅ ⚠️ **FINDING**: план ожидал `completed`, но в state machine терминальные статусы `picked_up`/`cancelled`. `ready→completed` → 400
- [x] revenue обновился после `picked_up`: totalRevenue=225000, ordersInProgress=1 ✅
- [x] POST `/api/admin/products` → 201, новый продукт ✅
- [x] PUT `/api/admin/products/:id` → 200, name/price обновлены ✅
- [x] DELETE `/api/admin/products/:id` → 200, `is_deleted=t` в БД, продукт скрыт из `/api/products` ✅
- [x] PUT `/api/admin/constructor/ingredients/:id` (`{type,pricePerKg,isAvailable}`) → 200 ✅
- [x] **RBAC**: USER → `/api/admin/stats` → 403 `FORBIDDEN: Access denied. Required role(s): admin` ✅

---

## Этап 3. Web E2E (Playwright MCP — Chrome MCP недоступен)

### 3.1 Аноним
- [x] http://localhost:3000 — главная грузится ✅ (screenshot `01-home.png`) — hero, 4 популярных, преимущества, отзывы, футер
- [x] console на главной — 3 ошибки: ⚠️ `asChild`→DOM, `/favicon.ico` 404, `/api/auth/profile` 401 (ожидаемо для анонима)
- [x] /catalog — 6 товаров отображаются ✅ (screenshot `02-catalog.png`)
- [x] фильтр по категории клик «Торты» → URL `?categorySlug=torty&type=cake` → **CRITICAL**: API возвращает 400 `property type should not exist`, каталог ломается
- [x] карточка товара /catalog/medovik — грузится (screenshot `03-product.png`) ⚠️ **CRITICAL**: веса показаны как `0.001 кг, 0.0015 кг` (ProductInfo.tsx:126 делит на 1000 значение, которое уже в кг)
- [x] /about ✅, /fillings ✅
- [x] /account/orders (аноним) → `/?auth=login&from=%2Faccount%2Forders` ✅ (middleware работает)
- [x] /admin (аноним) → `/?auth=login&from=%2Fadmin` ✅

### 3.2 Регистрация/логин
- [x] Модалка открывается автоматически при `?auth=login` (screenshot `06-login-modal.png`) ✅
- [x] Submit `test@bakery.ru / test123` → **CRITICAL**: после успешного POST /api/auth/login UserMenu падает с `TypeError: Cannot read properties of undefined (reading 'charAt')` — LoginForm передаёт `res.data` (= `{user:{...}}`) в `setUser` вместо `res.data.user`. Баг симметрично в RegisterForm.tsx:69 и AuthProvider.tsx:44
- [ ] Logout (заблокировано критическим багом UserMenu)
- [ ] Login с неправильным паролем → ошибка (заблокировано)

### 3.3 Конструктор (ключевая фича диплома)
- [x] /constructor — **CRITICAL**: страница падает в ErrorBoundary «Что-то пошло не так» (screenshot `04-constructor.png`). Ошибка: `TypeError: Cannot read properties of undefined (reading 'length') at applyDefaultSelections`. Причина: `constructor-store.ts:311` сохраняет в `ingredients` всю обёртку `{success, data:{...}}` вместо `data` — `ingredients.coatings` становится undefined
- [ ] Все шаги Shape/Base/Filling/Coating/Decor — заблокировано critical-багом store
- [ ] FPS / Canvas — не дошли
- [ ] Add to cart + screenshot upload — не дошли

### 3.4 Заказ
- [x] Корзина `/cart` (пустая) — грузится ✅ (screenshot `05-cart-empty.png`)
- [ ] Готовый товар в корзину — заблокировано багом weight в ProductInfo
- [ ] Конструкторный в корзину — заблокировано критическим багом конструктора
- [ ] Checkout flow — заблокировано (требует логин, auth UI сломан)
- [ ] Submit заказа — заблокировано (см. выше)

### 3.5 Админка
- [ ] Login admin → /admin — заблокировано critical-багом UserMenu (см. 3.2). API admin работает (проверено в 2.7)

---

## Этап 4. Security аудит

- [x] **CSRF**: POST /api/orders, /api/constructor/calculate без X-XSRF-TOKEN → 403 (см. 2.4, 2.5) ✅
- [x] **JWT cookie**: `HttpOnly; SameSite=Lax; Max-Age=604800` (7 days), нет Secure (OK для dev, ⚠️ должен быть `secure:true` в prod) ✅
- [x] **JWT_SECRET**: ⚠️ **FINDING**: в `.env.example` дефолтный `super-secret-dev-key-change-in-production` — должен быть алерт/provision guard в prod-деплое
- [x] **RBAC**: USER → /api/admin/stats → 403 (см. 2.7.8) ✅
- [x] **IDOR**: USER → чужой заказ → 404 (см. 2.5.4) ✅
- [x] **Rate limit** login (POST /api/auth/login): 4×401 → 11×429 подряд — throttler работает (лимит 5/мин) ✅
- [x] **Whitelist** (forbidNonWhitelisted): лишние поля → 400 (см. 2.2.2, поэтому и `type=cake` ломает каталог) ✅
- [x] **Password hash**: bcrypt `$2b$10$...` в БД ✅
- [x] **MinIO buckets**: `screenshots` → 403 (private) ✅, `products` → 200 (public) ✅
- [x] **SQL injection**: `/api/products?categorySlug=%27%20OR%201%3D1%20--` → success, count=0, нет утечки ✅ (Drizzle параметризует)
- [x] **XSS** в комментарии заказа: API сохраняет `<script>` как строку — React в админке будет экранировать (при условии корректного рендера), нативно безопасно ⚠️ (UI не проверен из-за сломанной админки)
- [x] **CORS**: `Access-Control-Allow-Origin: http://localhost:3000` не эхирует произвольные origin ✅
- [x] **XSRF-TOKEN cookie**: `SameSite=Strict` ✅
- [x] **Cookies**: bakery_token `SameSite=Lax` (правильно для SSR auth), XSRF-TOKEN `SameSite=Strict` (правильно для защиты от CSRF) ✅

---

## Этап 5. Документация

- [x] **docs/PRD user stories** — mapping к находкам:
  - US-01 (каталог с фильтрами, P0) ❌ **сломан** — фильтр `type=cake` не совместим с API `categorySlug=torty`
  - US-02 (карточка с выбором веса, P0) ❌ **сломан** — отображение `0.001 кг`
  - US-03 (добавить готовый в корзину, P0) ⚠️ работает с неверным весом
  - US-04 (3D-конструктор, P0) ❌ **полностью сломан** — crash в applyDefaultSelections (envelope не распакован)
  - US-05..US-10 (все под US-04, P0) ❌ недоступны
  - US-11 (регистрация/логин, P1) ❌ UI падает в UserMenu charAt
  - US-12 (статус в ЛК, P1) ⚠️ API работает, UI заблокирован auth-багом
  - US-14 (комментарий к заказу, P1) ✅ API
  - US-A01..A07 (admin, P0-P2) ⚠️ API 100% работает, UI заблокирован auth-багом
- [x] **docs/SRS** — API endpoints покрыты в Этапе 2 (100% endpoints прошли контракт-тесты)
- [x] **docs/Архитектура** — расхождения: frontend catalog filter использует hardcoded `cake/cupcake/macaron` вместо актуальных slug из БД `torty/kapkejki/makarons`; frontend сорт `priceMin:asc` не соответствует API полю `pricePerKg`; frontend constructor-store и auth-store не распаковывают envelope `{success, data}` (несовместимость контрактов UI↔API)

---

## Этап 6. Сводный отчёт

- [x] swarm-report/full-app-test-2026-04-09.md создан
- [x] критические/мажорные/минорные находки приоритезированы
- [x] таблица покрытия
- [x] рекомендации
