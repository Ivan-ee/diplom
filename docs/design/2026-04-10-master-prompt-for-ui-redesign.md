# Master Prompt for Coding AI

Use the prompt below as the main instruction set for Cursor, Codex, Claude Code, or another coding-oriented AI that will redesign the UI inside this repository.

## Prompt

```text
Ты redesign lead и senior frontend designer-engineer для реального e-commerce проекта. Твоя задача — перепроектировать клиентский UI интернет-магазина кондитерской, улучшив визуальную систему, UX и ощущение премиальности без ухода в шаблонный AI-стиль.

Контекст проекта:
- Это локальная кондитерская в Арзамасе: бренд «Торты на заказ Виктория».
- Основной продукт — готовые торты и десерты на заказ.
- Ключевая фича продукта — 3D-конструктор тортов.
- UI интерфейса на русском языке.
- Стек фронтенда: Next.js App Router, React, Tailwind CSS 4, HeroUI, Framer Motion.
- Нельзя превращать проект в SaaS, dashboard или generic startup landing.

Твоя миссия:
- сделать UI заметно сильнее визуально;
- поднять качество e-commerce UX;
- сохранить ясность, скорость и удобство принятия решения о покупке;
- сделать интерфейс премиальным, тёплым и современным;
- избежать типичных AI-шаблонов.

Твой визуальный north star:
- Apple-level clarity: строгая иерархия, чистая композиция, сдержанность;
- bakery warmth: молочные, сливочные, шампань и карамельные оттенки, мягкая тактильность;
- strong ecom behavior: фото товара, цена, выбор опций, доверие и CTA всегда важнее декоративных эффектов;
- editorial restraint: допускается лёгкая fashion/luxury интонация, но только точечно.

Что обязательно изучить перед изменениями:
- apps/web/src/app/globals.css
- apps/web/src/app/layout.tsx
- apps/web/src/components/layout/Header.tsx
- apps/web/src/components/landing/HeroSection.tsx
- apps/web/src/components/landing/CTASection.tsx
- apps/web/src/components/catalog/ProductCard.tsx
- apps/web/src/components/catalog/CatalogFilters.tsx
- apps/web/src/components/product/ProductGallery.tsx
- apps/web/src/components/product/ProductInfo.tsx
- apps/web/src/components/cart/CartSummary.tsx
- apps/web/src/components/checkout/CheckoutForm.tsx
- apps/web/src/components/constructor/ConstructorLayout.tsx

Маршруты, которые нужно рассматривать как единую клиентскую систему:
- /
- /catalog
- /catalog/[slug]
- /cart
- /checkout
- /constructor

Сначала проведи короткий аудит текущего UI по коду и текущим страницам.
Затем внедряй redesign.
Не переписывай всё хаотично. Сначала выстрой систему, потом страницы.

Дизайн-направление:

1. Общая система
- Создай более цельную warm premium design system.
- Используй спокойные warm neutral цвета: milk, ivory, champagne, oat, graphite, caramel.
- Сделай один основной accent для CTA, а не разноцветную систему.
- Продуктовые фото и 3D-визуализация должны быть главным источником визуального богатства.
- Упорядочь surface system: фон, карточки, secondary surfaces, borders, shadows, overlays.
- Уменьши ощущение “случайных rounded cards”, замени его на более дисциплинированную систему.

2. Типографика
- Усиль typographic hierarchy.
- Интерфейс должен выглядеть дороже текущего, но остаться очень читаемым на русском языке.
- Избегай generic пары в духе “просто нейтральный sans + ещё один нейтральный sans без характера”.
- Если меняешь шрифтовое направление, выбери один современный clean sans для UI/body и максимум один restrained editorial accent font для редких акцентных моментов.
- Не используй декоративный serif в формах, фильтрах и плотном utilitarian UI.

3. Композиция и spacing
- Убери большие пустые зоны, которые ничего не продают и ничего не объясняют.
- На mobile интерфейс должен становиться короче, плотнее и полезнее, а не просто складываться в длинную колонку воздуха.
- Секции должны ощущаться намеренно собранными, а не просто расставленными с большим gap.

4. Media-first подход
- Hero и крупные CTA-блоки не должны выглядеть как placeholder surfaces.
- Если в проекте пока нет идеальных assets, все равно спроектируй layout так, чтобы он был product-led, а не block-led.
- Галереи, product cards и constructor promo должны строиться вокруг desirability продукта.

5. Motion
- Используй motion сдержанно и осмысленно.
- Допустимы stagger, reveal, soft hover, smooth state transitions.
- Нельзя превращать UI в motion showcase.

Что нельзя делать:
- Не делай generic AI premium style.
- Не используй purple gradients, glossy dark UI, crypto/SaaS aesthetics.
- Не заполняй всё стеклянными карточками и blur-эффектами.
- Не делай все блоки одинаковыми по radius, shadow и структуре.
- Не делай лендинг из огромных пустых секций и декоративных подложек.
- Не жертвуй e-commerce ясностью ради “красивой атмосферы”.
- Не превращай конструктор в overloaded control dashboard.

Требования по страницам:

Главная /
- Перестрой как premium storefront.
- Hero должен сразу продавать качество продукта и путь действия.
- Должно быть ясно, что есть два основных сценария: выбрать готовый торт или собрать свой.
- Секция популярных товаров должна ощущаться как curated assortment.
- Блоки преимуществ, отзывов и constructor CTA должны быть встроены в единый narrative, а не выглядеть как отдельные шаблонные секции.
- На mobile уменьшай пустоту и усиливай hierarchy.

Каталог /catalog
- Сделай страницу сильнее как browsing surface.
- Усиль ощущение curated assortment.
- Фильтры и сортировка должны ощущаться premium, но не перегруженно.
- Исправь interaction hierarchy product cards: пользователю должно быть очевидно, где переход к карточке товара, а где быстрый add-to-cart.
- Улучши ритм карточек, фото, цен и категорий.

Карточка товара /catalog/[slug]
- Сделай PDP одним из strongest buying surfaces в продукте.
- Усиль визуальную подачу галереи.
- Buy block должен лучше продавать покупку: цена, вес, надпись, CTA, pickup/trust.
- Селекторы веса и CTA должны ощущаться более уверенно и премиально.
- Состав, детали и trust cues должны быть доступны, но не мешать основному решению.

Корзина /cart
- Сохрани простоту, но сделай композицию более уверенной и премиальной.
- Улучши визуальную ценность cart items и summary.
- Усиль ощущение, что пользователь движется к завершению заказа.
- Добавь больше reassurance без визуального шума.

Checkout /checkout
- Сохрани текущую структуру, если она рациональна, но сделай её менее “generic form UI”.
- Усиль ощущение guided completion flow.
- Порядок, summary и pickup details должны быть очень понятными.
- Если auth friction виден в текущем коде, не игнорируй его: UI должен хотя бы смягчать ощущение резкого прерывания потока.

Конструктор /constructor
- Это signature feature продукта.
- Сначала проверь текущее состояние маршрута. Если там runtime issue или broken shell, сначала восстанови рабочее состояние.
- После этого перепроектируй layout как premium configurator shell.
- 3D-сцена должна оставаться главным героем.
- Панель настроек должна быть визуально легче, чище и дороже.
- Step navigation, pricing и CTA должны быть очень понятными, но не кричащими.

Технические ограничения:
- Сохраняй текущий стек: Next.js, Tailwind, HeroUI, Framer Motion.
- Не вноси бессмысленные архитектурные перестройки.
- Избегай добавления тяжёлых зависимостей без реальной необходимости.
- Переиспользуй существующие сильные паттерны, если они уже удачны.
- Работай mobile-first, но доводи и desktop до сильного premium состояния.

Порядок работы:
- Сначала найди текущие сильные и слабые места.
- Затем определи общую visual system.
- Потом переработай shell и ключевые reusable components.
- Потом пройди по ключевым страницам.
- После изменений проведи self-review и проверь, что стиль цельный между homepage, catalog, PDP, cart, checkout и constructor.

Чеклист качества в конце работы:
- UI ощущается дороже и целостнее.
- Интерфейс не выглядит как AI-generated template.
- Главная сильнее продаёт ассортимент и конструктор.
- Каталог проще сканировать и использовать.
- PDP лучше помогает принять решение о покупке.
- Cart и checkout выглядят спокойнее, понятнее и надёжнее.
- Constructor вписан в единую систему, но остаётся особенной частью продукта.
- Mobile не проигрывает desktop.

Если придётся выбирать между “ещё красивее” и “ещё понятнее для покупки”, выбирай понятнее для покупки.
```

## How to use it

- If you want the AI to redesign directly in code, paste the prompt as the main task and point it to the repo root.
- If you want a first pass without edits, prepend: `Сначала сделай route-by-route audit и предложи redesign strategy без изменений кода.`
- If you want a constructor-only pass later, keep the same prompt and replace the route scope with `/constructor` plus its related components.
