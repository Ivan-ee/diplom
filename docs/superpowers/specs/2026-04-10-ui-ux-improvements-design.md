# UI/UX Improvements Beyond Master Prompt — Design Spec

**Date:** 2026-04-10
**Scope:** UX/conversion/accessibility improvements not covered by the master redesign prompt
**Approach:** Full coverage (C) — all 23 improvements across 4 categories

---

## Context

Master prompt (`docs/design/2026-04-10-master-prompt-for-ui-redesign.md`) covers visual system (colors, typography, spacing, surfaces, motion) and page-level redesign directions. This spec covers **functional UX gaps** found during code audit — patterns that directly impact conversion, accessibility, and perceived quality.

Current state: warm premium palette (caramel/ivory/graphite) is consistent, Manrope + Cormorant typography works, animations are smooth. The gaps are in interaction feedback, conversion patterns, accessibility compliance, and edge case handling.

---

## 1. Conversion Flow

### 1.1 Toast feedback on add-to-cart

**Problem:** Button text changes to "Добавлено" for 1.5s — easy to miss, especially on PDP scroll position.

**Solution:** Sonner toast with product mini-preview on every add-to-cart action.

```
Toast layout:
┌─────────────────────────────────────┐
│ [48x48 img]  Product name, weight   │
│              Добавлен в корзину      │
│              [Перейти в корзину →]   │
└─────────────────────────────────────┘
```

- **Style:** bg-warm-ivory, border-champagne, text-graphite
- **Duration:** 4s, swipe-to-dismiss
- **Trigger:** Simultaneously bounce CartBadge in header
- **Files:** `ProductCard.tsx`, `ProductInfo.tsx`, `StepNavigation.tsx` — all add-to-cart handlers
- **Keep:** Existing inline button state change ("Добавлено") as immediate feedback

### 1.2 Constructor success modal

**Problem:** After "Добавить в корзину" in constructor, user stays on page with no confirmation.

**Solution:** Modal/drawer after successful add:

```
╔═══════════════════════════════════════╗
║  ✓ Торт добавлен в корзину!          ║
║                                       ║
║  [screenshot preview]                 ║
║  Shape · Tiers · Filling summary     ║
║  Price                                ║
║                                       ║
║  [Перейти в корзину]  [Собрать ещё]  ║
╚═══════════════════════════════════════╝
```

- "Собрать ещё" → reset constructor state
- "Перейти в корзину" → navigate to `/cart`
- **File:** `StepNavigation.tsx` — post-add flow
- **Style:** brand modal (rounded-2xl, shadow-2xl, warm-ivory bg)

### 1.3 Inline auth on checkout (no redirect)

**Problem:** Checkout → no auth → redirect to `/cart` → auth modal → login → click "Оформить" again → checkout. Loses 1 step = 10-30% users.

**Solution:** Remove redirect. Show auth modal inline on checkout page. After successful login, continue checkout without navigation.

- **Current:** `checkout/page.tsx` line ~20: `router.replace('/cart'); openAuth('login')`
- **Change:** Replace with `openAuth('login')` only. Add `onAuthSuccess` callback that re-checks auth state and renders checkout form.
- **File:** `checkout/page.tsx`, `AuthModal.tsx` (add callback prop)

### 1.4 Phone field in checkout

**Problem:** No phone field. Bakery cannot contact customer about order details/readiness.

**Solution:** Required phone field with mask `+7 (___) ___-__-__`.

- **Placement:** New "Контактная информация" section before address
- **Validation:** Zod schema, format: `+7XXXXXXXXXX`, required
- **Reuse:** `formatPhone()` from `RegisterForm.tsx`
- **File:** `CheckoutForm.tsx` — add section + field + validation
- **Backend:** Add `phone` field to create-order DTO and orders table (migration)

---

## 2. E-commerce Trust & Social Proof

### 2.1 Trust bar on PDP

**Problem:** Only pickup address at bottom of ProductInfo. No reassurance before buy decision.

**Solution:** Compact trust indicators under buy block:

```
💳 Оплата при получении  ·  🕐 Готовность от 1 дня  ·  🌿 Натуральные ингредиенты
```

- **Style:** text-xs, Lucide icons, graphite-light color, inline with dot separators
- **No background** — transparent, minimal footprint
- **File:** `ProductInfo.tsx` — insert between CTA and Disclosure

### 2.2 "Already in cart" indicator

**Problem:** User can add same product multiple times without awareness. Cart creates new item each time via unique ID.

**Solution:**
- **ProductCard:** Badge "В корзине" on image + button text "Ещё в корзину"
- **PDP:** Text under CTA: "Уже в корзине (1 шт.) → Перейти в корзину"
- **Check:** `useCartStore` → find items with matching productId (verify cart store dedup logic during implementation — may already group by productId)
- **Files:** `ProductCard.tsx`, `ProductInfo.tsx`

### 2.3 Checkout progress indicator

**Problem:** No visual orientation on checkout page.

**Solution:** Mini breadcrumb in checkout header:

```
Корзина  ──●──  Оформление  ──○──  Готово
           (active)
```

- 3 dots + connecting lines
- Caramel: completed/active, champagne: future
- Height: ~40px, compact
- **File:** `checkout/page.tsx` — add above h1

### 2.4 Cross-sell in cart

**Problem:** Cart has no upsell. Missing opportunity to increase average order value.

**Solution:** "Добавить к заказу" block under cart items list:

- 3 products from same categories as cart items
- Compact horizontal ProductCard (image left, info right)
- Skip block if catalog has < 4 products
- **Files:** `cart/page.tsx` — add section, new `CartCrossSell.tsx` component
- **API:** Use existing `/api/products` with category filter

### 2.5 Image lightbox/zoom on PDP

**Problem:** Product photos cannot be enlarged. For bakery products, detail matters.

**Solution:**
- Click on main image → fullscreen lightbox
- Desktop: zoom cursor indicator on hover
- Lightbox: dark overlay, swipe navigation, pinch-to-zoom on mobile
- **Library:** `yet-another-react-lightbox` (~5KB gzip) or custom modal
- **File:** `ProductGallery.tsx`

---

## 3. Accessibility & Visual Polish

### 3.1 Focus trap in AuthModal

**Problem:** Tab navigation escapes modal overlay.

**Solution:** Wrap modal content in focus trap (custom or `@radix-ui/react-focus-scope`). Autofocus first input on open. Return focus to trigger on close.

- **File:** `AuthModal.tsx`

### 3.2 Skip-to-content link

**Problem:** No skip link. Keyboard/screen reader users traverse full header on every page.

**Solution:** First element in body:
```tsx
<a href="#main-content"
   className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
              focus:z-[100] focus:bg-white focus:px-4 focus:py-2
              focus:rounded-lg focus:shadow-lg focus:text-graphite">
  Перейти к содержимому
</a>
```
+ `id="main-content"` on `<main>`.

- **File:** `layout.tsx`

### 3.3 Color contrast fixes

**Problem:** `text-[var(--color-graphite-light)]/60` drops below WCAG AA 4.5:1 ratio.

**Solution:** Remove `/60` opacity on text elements. Use full `graphite-light` (#6B6360).

**Locations:**
- `CartSummary.tsx` — auth hint text
- `ProductInfo.tsx` — pickup info
- `Footer.tsx` — copyright text
- `CheckoutForm.tsx` — helper labels

### 3.4 Keyboard navigation in gallery

**Problem:** No arrow key support for photo switching.

**Solution:** `onKeyDown` handler on gallery container: ArrowLeft/ArrowRight cycle activeIndex. Add `aria-roledescription="carousel"` on wrapper, `aria-label` on each thumbnail.

- **File:** `ProductGallery.tsx`

### 3.5 Brand-styled toasts (Sonner)

**Problem:** Default Sonner styles don't match brand palette.

**Solution:** Configure `toastOptions` in layout.tsx Toaster:
```tsx
<Toaster
  position="top-right"
  toastOptions={{
    className: 'bg-[var(--color-warm-ivory)] border border-[var(--color-champagne)] text-[var(--color-graphite)] shadow-lg',
    descriptionClassName: 'text-[var(--color-graphite-light)]',
  }}
/>
```

- **File:** `layout.tsx`

### 3.6 Custom 404 page

**Problem:** Default Next.js 404 completely breaks brand.

**Solution:** `/app/not-found.tsx` with brand design:
- Themed illustration/emoji
- "Страница не найдена" heading
- Two CTAs: "На главную" + "В каталог"
- Brand colors, fonts, layout

### 3.7 Loading states on filter change

**Problem:** No visual feedback when switching categories in catalog.

**Solution:** `useTransition` + `isPending` → opacity-50 + shimmer on ProductGrid during transition. Or NProgress bar in header (caramel color).

- **File:** `CatalogFilters.tsx`, `ProductGrid.tsx` or catalog `page.tsx`

### 3.8 Scroll to grid on category change

**Problem:** `scroll: false` on category change — user stays at bottom of page.

**Solution:** On category change → `scrollIntoView({ behavior: 'smooth', block: 'start' })` to ProductGrid container.

- **File:** `CatalogFilters.tsx`

---

## 4. Empty States, Flows & Edge Cases

### 4.1 Improved empty states with dual CTA

**Problem:** Empty cart → single "В каталог" button. Constructor not mentioned.

**Solution:**
- **Cart:** "Корзина пуста" → [В каталог] + [Собрать торт в конструкторе]
- **Orders:** "Нет заказов" → [Посмотреть каталог] + [Создать торт в 3D]
- Replace ShoppingBag icon with themed cake illustration/emoji
- **Files:** `cart/page.tsx`, `account/orders/page.tsx`

### 4.2 Constructor leave confirmation

**Problem:** Leaving constructor with unsaved config shows no warning.

**Solution:** `beforeunload` event + Next.js route interception:
- If config is modified and not added to cart → confirm "Уверены? Несохранённый торт будет потерян"
- Skip if cake was already added to cart
- **File:** `constructor/page.tsx` or `ConstructorLayout.tsx`

### 4.3 Cart item availability validation

**Problem:** Cart in localStorage; products may become unavailable between sessions.

**Solution:** On cart page load → validate items via API. If unavailable:
- Grey overlay + "Нет в наличии" badge
- Excluded from total price
- CTA disabled while unavailable items exist
- "Удалить недоступные" quick action
- **Files:** `cart/page.tsx`, `CartItem.tsx`, `CartSummary.tsx`

### 4.4 Reorder from order history

**Problem:** No "Заказать снова" in order history.

**Solution:** Button on OrderCard → adds all items from order back to cart. Toast confirmation.

- **File:** `account/orders/OrderCard.tsx`
- **Caveat:** Constructor items (isConstructor=true) → skip reorder for these items and show tooltip "Соберите торт заново в конструкторе". Only reorder standard catalog products.

### 4.5 Mobile ProductCard: 2-column grid

**Problem:** `grid-cols-1` on mobile — single card fills viewport.

**Solution:** `grid-cols-2` on mobile (sm breakpoint) with compact card:
- Smaller aspect ratio (square instead of 3/4)
- Compact text (text-xs name, text-sm price)
- CTA button → cart icon only
- Fallback to 1 col on very small screens (<375px)
- **File:** `ProductGrid.tsx`, `ProductCard.tsx` (compact variant prop)

### 4.6 Quantity stepper: safe behavior at qty=1

**Problem:** "-" button at qty=1 calls removeItem — unexpected for user.

**Solution:** At qty=1, "-" button → disabled (dimmed, cursor-not-allowed). Delete only via Trash icon with existing 2-step confirmation.

- **File:** `CartItem.tsx`

---

## Priority Matrix

| # | Item | Impact | Effort | Priority |
|---|------|--------|--------|----------|
| 1 | 1.4 Phone in checkout | High | Simple | P0 |
| 2 | 1.1 Toast on add-to-cart | High | Simple | P0 |
| 3 | 1.2 Constructor success modal | High | Simple | P0 |
| 4 | 1.3 Inline auth on checkout | High | Moderate | P1 |
| 5 | 2.5 Image lightbox/zoom | High | Moderate | P1 |
| 6 | 2.2 "Already in cart" indicator | High | Moderate | P1 |
| 7 | 2.4 Cross-sell in cart | High | Moderate | P1 |
| 8 | 3.6 Custom 404 page | Medium | Simple | P1 |
| 9 | 3.2 Skip-to-content link | Medium | Simple | P1 |
| 10 | 3.1 Focus trap in AuthModal | Medium | Simple | P1 |
| 11 | 3.5 Brand-styled toasts | Medium | Simple | P1 |
| 12 | 2.3 Checkout progress indicator | Medium | Simple | P1 |
| 13 | 3.8 Scroll on category change | Medium | Simple | P1 |
| 14 | 3.3 Color contrast fixes | Medium | Simple | P1 |
| 15 | 2.1 Trust bar on PDP | Medium | Simple | P1 |
| 16 | 3.7 Loading states on filter | Medium | Moderate | P2 |
| 17 | 4.5 Mobile 2-column grid | Medium | Moderate | P2 |
| 18 | 4.1 Improved empty states | Low | Simple | P2 |
| 19 | 4.3 Cart availability validation | Medium | Moderate | P2 |
| 20 | 4.2 Constructor leave confirmation | Medium | Simple | P2 |
| 21 | 4.6 Safe qty stepper | Low | Simple | P2 |
| 22 | 3.4 Keyboard nav in gallery | Low | Simple | P2 |
| 23 | 4.4 Reorder from history | Medium | Moderate | P3 |

---

## Files to Modify (Primary)

| File | Changes |
|------|---------|
| `apps/web/src/app/layout.tsx` | Toast styling, skip link |
| `apps/web/src/app/not-found.tsx` | NEW — custom 404 |
| `apps/web/src/app/checkout/page.tsx` | Inline auth, progress indicator |
| `apps/web/src/app/cart/page.tsx` | Cross-sell, empty state, availability check |
| `apps/web/src/components/checkout/CheckoutForm.tsx` | Phone field, validation |
| `apps/web/src/components/product/ProductGallery.tsx` | Lightbox, keyboard nav |
| `apps/web/src/components/product/ProductInfo.tsx` | Trust bar, "in cart" indicator |
| `apps/web/src/components/catalog/ProductCard.tsx` | "In cart" badge, compact variant, toast |
| `apps/web/src/components/catalog/ProductGrid.tsx` | 2-col mobile grid |
| `apps/web/src/components/catalog/CatalogFilters.tsx` | Scroll behavior, loading states |
| `apps/web/src/components/cart/CartItem.tsx` | Safe stepper, availability overlay |
| `apps/web/src/components/cart/CartSummary.tsx` | Contrast fix |
| `apps/web/src/components/constructor/panels/StepNavigation.tsx` | Success modal, toast |
| `apps/web/src/components/auth/AuthModal.tsx` | Focus trap, callback prop |
| `apps/web/src/components/layout/Footer.tsx` | Contrast fix |

---

## Verification Plan

1. **Build:** `pnpm turbo build` — no errors
2. **Unit tests:** `pnpm test` — all 112+ tests pass
3. **Visual check:** Open each route (/, /catalog, /catalog/[slug], /cart, /checkout, /constructor) in browser
4. **Conversion flow:** Add to cart → verify toast → go to cart → verify summary → checkout → verify auth flow → submit
5. **Constructor flow:** Build cake → add to cart → verify success modal → verify cart item
6. **Accessibility:** Tab through pages, verify focus trap, skip link, contrast
7. **Mobile:** Resize to 375px, verify 2-col grid, touch targets, responsive
8. **404:** Navigate to /nonexistent → verify custom page
