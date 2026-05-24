# apps/web AGENTS.md

Instructions for AI coding agents working in the Next.js web application.

## Scope

This file applies to `apps/web/**`. Follow the root `AGENTS.md` first, then these web-specific rules.

## App Conventions

- This app uses Next.js App Router, React 19, Tailwind CSS, HeroUI styles, Zustand stores, React Hook Form, Zod, and React Three Fiber.
- Keep route behavior aligned with `next.config.ts` rewrites:
  - Public constructor URL is `/constructor`.
  - Actual page implementation is `/cake-constructor`.
  - Admin constructor URL is `/admin/constructor`, implemented by `/admin/cake-constructor`.
- Use `fetchClient` from `src/lib/api.ts` in client components. It sends credentials, CSRF header, and expects the API response envelope.
- Use `fetchServer` from `src/lib/api.ts` in server components. Do not hand-roll API URLs unless the helper cannot support the case.
- Do not access `window`, `document`, local storage, or WebGL APIs from server components.
- Keep protected route expectations aligned with `src/proxy.ts`: account and admin pages are guarded for UX, while real authorization is enforced by the API.

## UI Rules

- Reuse existing components and tokens before adding new primitives.
- Prefer `Button` from `src/components/ui/button.tsx` for standard buttons.
- Use existing CSS variables from `src/app/globals.css`: brand colors, radii, surfaces, shadows, and font variables.
- Use `lucide-react` icons when an icon is needed.
- Keep store-backed UI deterministic across hydration. If a persisted Zustand store is involved, check existing hydration patterns before changing render logic.
- For meaningful visual or layout changes, verify in a browser when practical and check both desktop and mobile-sized layouts.

## Constructor Rules

- The constructor page is client-only by design. Keep heavy Three.js/R3F components dynamically loaded where existing code does so.
- `useConstructorStore` is the central constructor state. Do not duplicate constructor state in local component state unless it is transient UI-only state.
- Preserve the distinction between:
  - `activeDecorations` as visual/model variant IDs.
  - `selectedDecorations` as business ingredient selections used for pricing/order DTOs.
- Keep `cakeConfigToOrderDto` conversions correct:
  - cart weights are grams;
  - API constructor tier weights are integer tenths of kg.
- Do not treat `totalPrice` in the web store as trusted order price. It is an interface estimate; API recalculates on order creation.
- Screenshot upload uses `glRef` and MinIO. A failed screenshot upload must not block adding a constructor item to cart unless the product requirement explicitly changes.

## Testing

- Run web tests with `pnpm --filter @bakery/web test`.
- Run web type-check with `pnpm --filter @bakery/web type-check`.
- For API client/helper changes, include or update tests under `src/__tests__` or the relevant `__tests__` directory.
- For constructor store/order adapter changes, update `src/__tests__/constructor-store.test.ts` or `src/lib/constructor/__tests__/order-adapter.test.ts` as appropriate.
