# apps/api AGENTS.md

Instructions for AI coding agents working in the NestJS API.

## Scope

This file applies to `apps/api/**`. Follow the root `AGENTS.md` first, then these API-specific rules.

## API Conventions

- This service uses NestJS modules, controllers, services, DTOs, guards, interceptors, and filters.
- Keep controllers thin. Put business rules in services and validation shape in DTOs.
- Add Swagger decorators for new public endpoints and DTO fields.
- Keep `ValidationPipe` expectations: DTOs should use `class-validator` and `class-transformer` where transformation is required.
- Throw Nest exceptions (`BadRequestException`, `NotFoundException`, `ConflictException`, `UnauthorizedException`) instead of returning ad-hoc error objects.
- Successful responses are wrapped by `ResponseInterceptor`; do not manually wrap normal controller returns in `{ success, data }`.
- For paginated service returns, keep the existing `{ data, meta }` shape so the interceptor can preserve metadata.

## Data Access

- Use the injected `DRIZZLE` database dependency and Drizzle query APIs.
- Import schema from `@bakery/db/schema`.
- Keep DB writes that must stay consistent inside transactions.
- Do not bypass availability checks for products or constructor ingredients.
- Use server-side recalculation for all order prices. Client-supplied prices are not trusted.

## Auth, Security, and Uploads

- User endpoints that require authentication must use `JwtAuthGuard`.
- Admin endpoints must use both `JwtAuthGuard` and `RolesGuard` with `@Roles('admin')`.
- Preserve CSRF behavior for state-changing requests. Do not add broad middleware exemptions without a clear reason.
- Keep throttling on sensitive/high-cost endpoints where present.
- Upload flow should remain presigned PUT to MinIO. The API returns upload metadata; the web app uploads bytes directly to MinIO.
- Never log secrets, JWTs, passwords, raw upload signatures, or full cookie headers.

## Constructor and Orders

- `ConstructorService.calculatePrice` is the server source of truth for constructor pricing.
- Constructor tier weights in DTOs are integer tenths of kg, not grams.
- Shape surcharge, tier surcharge, coating cost, decoration cost, inscription limits, and availability checks must remain server-enforced.
- `OrdersService.create` must recalculate both product and constructor item prices before writing the order.
- Preserve the current order model as a pickup request: pickup date, pickup time slot, phone, comment, and optional promo code. Do not introduce delivery or payment behavior incidentally.

## Testing

- Run API tests with `pnpm --filter @bakery/api test`.
- Run API type-check with `pnpm --filter @bakery/api type-check`.
- For DTO/service behavior changes, add or update tests under `src/__tests__`.
- For auth/guard/interceptor/filter changes, include direct unit tests for success and failure cases.
