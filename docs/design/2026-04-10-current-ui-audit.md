# Current UI Audit for Victoria Tort

> Audit date: April 10, 2026  
> Reviewed artifacts: live pages at `http://127.0.0.1:3000`, current route components, global styles, and layout files

## Executive summary

The current UI is not bad by default. It already has a calm neutral direction and a partial Apple-inspired simplification. The problem is that it still feels like a collection of local redesigns rather than a coherent storefront system.

The biggest issues are:

- weak visual and information density on the homepage;
- placeholder-driven hero and CTA sections;
- interaction ambiguity inside product cards;
- limited merchandising strength on the catalog page;
- purchase flow friction around checkout auth;
- runtime instability on the constructor route.

## Priority map

### P0

- Restore a working constructor shell before polishing its UI.
- Replace placeholder-led homepage and CTA composition with real product-led merchandising.
- Remove ambiguous click behavior on product cards.

### P1

- Strengthen catalog browsing and assortment framing.
- Upgrade PDP trust and decision support.
- Reduce cart and checkout friction through clearer reassurance and purchase progression.

### P2

- Unify typography, spacing, and surface language across all storefront routes.
- Improve motion discipline and reduce decorative motion where it does not help decisions.

## Route-by-route findings

### 1. Global shell

Relevant files:

- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/Footer.tsx`
- `apps/web/src/lib/fonts.ts`

Current state:

- Warm neutral palette already exists.
- Header is calm and readable.
- Rounded surfaces and blur are present, but not systematized.
- Typography uses `Montserrat + Open Sans`, which is serviceable but not distinctive enough for a premium storefront.

Main gap:

- The UI has a style direction but not a strong system signature.
- Surfaces, spacing, and type ramps do not yet communicate a clear “premium confectionery retail” identity.

Direction:

- Keep the clean shell.
- Introduce a more intentional visual language through spacing rhythm, type scale, product-led media, and tighter component consistency.

### 2. Homepage `/`

Relevant files:

- `apps/web/src/app/page.tsx`
- `apps/web/src/components/landing/HeroSection.tsx`
- `apps/web/src/components/landing/PopularProducts.tsx`
- `apps/web/src/components/landing/Advantages.tsx`
- `apps/web/src/components/landing/ReviewsCarousel.tsx`
- `apps/web/src/components/landing/CTASection.tsx`

Current state:

- Structure is logical: hero, popular products, advantages, reviews, constructor CTA.
- The live page works, but premium perception is weakened by placeholder media.
- `HAS_HERO_IMAGE` and `HAS_CONSTRUCTOR_IMAGE` are both `false`, so two key sections render as soft empty blocks instead of persuasive content.
- On mobile, the page contains too much vertical air relative to information density.

Main gap:

- The homepage reads as visually calm but commercially underpowered.
- It does not yet sell the assortment and the constructor with enough confidence.
- Trust and navigation are present, but not staged as premium decision-making aids.

Direction:

- Make the homepage product-led.
- Reduce decorative emptiness.
- Add clearer pathing into `catalog`, `constructor`, and trust content.
- Give product imagery and confectionery craftsmanship more weight than abstract atmosphere.

### 3. Catalog `/catalog`

Relevant files:

- `apps/web/src/app/catalog/page.tsx`
- `apps/web/src/components/catalog/CatalogFilters.tsx`
- `apps/web/src/components/catalog/ProductGrid.tsx`
- `apps/web/src/components/catalog/ProductCard.tsx`

Current state:

- The page is clean and understandable.
- Category pills and sorting are simple and fast.
- Grid composition is readable.

Main gaps:

- The page header is visually thin for a premium retail category page.
- Filters feel technically functional, but not merchandised.
- Product cards combine a full-card link with an embedded “add to cart” CTA inside the same visual tile. That creates action ambiguity.

Direction:

- Treat the page as a browsing surface, not just a product dump.
- Strengthen category framing and assortment context.
- Clarify interaction hierarchy inside cards so the user always understands whether they are opening details or adding directly.

### 4. Product page `/catalog/[slug]`

Relevant files:

- `apps/web/src/app/catalog/[slug]/page.tsx`
- `apps/web/src/components/product/ProductGallery.tsx`
- `apps/web/src/components/product/ProductInfo.tsx`

Current state:

- This is one of the strongest routes in the current storefront.
- Gallery, weight selection, inscription field, and CTA already support a basic buying flow.
- Sticky gallery behavior helps desktop scanning.

Main gaps:

- The page can feel a bit flat and componentized rather than premium.
- Trust, pickup, and product craftsmanship cues are still too lightweight.
- The buy box can become more decisive.
- The gallery is clean but not yet luxurious or especially tactile.

Direction:

- Keep the current route architecture.
- Elevate the gallery, buy block, and trust cluster.
- Make weight selection and the main CTA feel more deliberate and more “purchase-ready”.

### 5. Cart `/cart`

Relevant files:

- `apps/web/src/app/cart/page.tsx`
- `apps/web/src/components/cart/CartItem.tsx`
- `apps/web/src/components/cart/CartSummary.tsx`

Current state:

- The flow is readable.
- The sticky summary pattern is correct for desktop.
- Empty state is clean.

Main gaps:

- The page does not yet feel premium or especially reassuring.
- Supporting copy and confidence cues are minimal.
- The transition from cart to checkout is clear, but not particularly persuasive.

Direction:

- Keep the simple layout.
- Add more purchase reassurance, cleaner merchandising of selected items, and a clearer feeling of progress toward order completion.

### 6. Checkout `/checkout`

Relevant files:

- `apps/web/src/app/checkout/page.tsx`
- `apps/web/src/components/checkout/CheckoutForm.tsx`

Current state:

- The form structure is sound.
- Address, date, time slot, comment, and order summary are organized well enough.
- Calendar and summary already contain usable UI logic.

Main gaps:

- Auth gating is abrupt: unauthenticated users are sent back to cart after the login modal opens.
- The page is competent but still visually close to a polished form UI, not a premium purchase confirmation flow.
- The right-column summary is useful, but could feel more reassuring and more final.

Direction:

- Preserve the good structure.
- Improve emotional clarity and perceived safety.
- Make the flow feel lighter, more guided, and less transactional in the generic sense.

### 7. Constructor `/constructor`

Relevant files:

- `apps/web/src/app/constructor/page.tsx`
- `apps/web/src/components/constructor/ConstructorLayout.tsx`
- `apps/web/src/components/constructor/panels/*`
- `apps/web/src/components/constructor/scene/*`

Current state:

- The intended shell is correct in principle: scene plus settings panel.
- The constructor is the brand-defining feature from the product perspective.
- In live review on April 10, 2026, the route rendered the error boundary instead of the constructor UI.

Main gap:

- A broken premium feature is worse than a plain one.
- No visual redesign of the constructor should start from decorative polish while the route is unstable.

Direction:

- First restore a reliable constructor shell.
- Then redesign the settings UI to feel quiet, premium, and secondary to the 3D scene.
- Keep the 3D object as the hero, not the controls.

## System-level observations

### What is already working

- Neutral palette direction is aligned with a premium bakery approach.
- Header and global shell avoid clutter.
- PDP, cart, and checkout already have a sensible information architecture.
- Existing motion is mostly modest.

### What is dragging the experience down

- Placeholder media in key conversion surfaces.
- Inconsistent merchandising strength across routes.
- Interaction ambiguity in cards.
- Too much “nice UI” and not enough “strong storefront”.
- No unified narrative between classic e-commerce routes and the premium constructor.

## Recommended redesign order

1. Stabilize constructor route.
2. Redesign the global visual system and homepage.
3. Redesign catalog card behavior and category merchandising.
4. Refine PDP around trust and decisiveness.
5. Polish cart and checkout into a more premium completion flow.
6. Apply the finalized system back to the constructor shell.
