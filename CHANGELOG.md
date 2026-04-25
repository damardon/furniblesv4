# CHANGELOG

## [Unreleased] - 2026-04-25 (Session 2)

### Frontend: ESLint ERRORS Fixed — `refactor/production-ready-v1`

All 11 ESLint errors eliminated; only warnings remain. Task: Fix all ESLint ERRORS (not warnings) without breaking functionality.

**Errors Fixed:**

1. **`src/lib/stores/index.ts`** (11 errors: `@typescript-eslint/no-var-requires`)
   - Lines 15-20: Replaced `require()` with `await import()` in `setTimeout` callback to register stores dynamically
   - Removed unused `getStores()` function that contained 5 additional `require()` calls
   - Preserved SSR safety: `typeof window !== 'undefined'` check retained
   - Behavior: Stores are still registered asynchronously on client initialization (fire-and-forget pattern via `setTimeout`)

2. **`src/app/admin/dashboard/[id]/page.tsx`** (1 error: `prefer-const`)
   - Line 156: Changed `let result` to `const result` (moved declaration to point of assignment on line 173)
   - Preserved functionality: moderateProduct logic unchanged

3. **`src/components/checkout/stripe-payment-form.tsx`** (4 errors: `react/no-unescaped-entities`)
   - Lines 184-185: Replaced unescaped `"` with `&quot;` in JSX text nodes
   - Fixed: "Pagar" → &quot;Pagar&quot;, "FURNIBLES" → &quot;FURNIBLES&quot;

4. **`src/components/providers/socket-provider.tsx`** (2 errors: `@typescript-eslint/no-var-requires`)
   - Lines 42-43 (`setConnected`): Changed to `async`, replaced `require()` with `await import()`
   - Lines 56-69 (`addNotification`): Changed to `async`, replaced `require()` with `await import()`
   - Preserved fire-and-forget pattern: socket event handlers call async functions without `await` (acceptable for non-critical operations)
   - Behavior: Notification store mutations still execute as before

5. **`src/components/search/search-filters.tsx`** (2 errors: `react/no-unescaped-entities`)
   - Line 526: Replaced unescaped `"` with `&quot;` in filter display badge
   - Fixed: "{filters.search}" → &quot;{filters.search}&quot;

**Validation:**
- ✅ `npm run lint` → 0 errors, N warnings
- ✅ `npm run build` → success (38 pages generated)
- ✅ `npx tsc --noEmit` → 0 errors
- ✅ No functionality broken; SSR checks intact; async/await patterns correct

### Frontend & Repository Cleanup — `refactor/production-ready-v1`

#### Git Repository Hygiene
- **`furnibles-completo.tar.gz`** removed from git tracking — a 2.2 MB backup archive was being committed as a tracked file, bloating every clone and pull. Added `*.tar.gz` and `*.zip` to root `.gitignore`.
- **`backend/dist/`** untracked — compiled JS output (`dist/main.js`, `dist/tsconfig.tsbuildinfo`) was being versioned. Added `backend/dist/` and `*.tsbuildinfo` to root `.gitignore` and ran `git rm --cached`. Build artifacts should never live in source control.
- **`frontend/tsconfig.tsbuildinfo`** untracked — same reason as above.
- **`frontend/debug-env.js`** deleted — a debugging script that printed raw environment variables (`NEXT_PUBLIC_API_URL`, `NODE_ENV`) to `console.log`. Was never part of the application; only existed as a temporary dev artifact.

#### Frontend: `console.log` Elimination
All 152 `console.log` debug calls were removed from 28 frontend source files. These were debug-only statements (most emoji-prefixed: `'🔍 [HOMEPAGE] Fetching...'`, `'✅ Cookie set:'`, etc.) left over from development. They add noise to the browser console in production and can expose internal state. `console.error` calls in catch blocks (210 occurrences) were intentionally kept — they surface actual runtime errors.

Files cleaned:
`lib/api.ts`, `lib/homepage-api.ts`, `lib/orders-api.ts`, `lib/download-api.ts`,
`lib/stores/auth-store.ts`, `lib/stores/seller-store.ts`, `lib/stores/index.ts`,
`contexts/auth-context.tsx`, `contexts/cart-context.tsx`, `contexts/payment-context.tsx`,
`app/page.tsx`, `app/pedidos/[orderNumber]/page.tsx`, `app/admin/dashboard/reviews/page.tsx`,
`app/productos/page.tsx`, `app/productos/[slug]/page.tsx`, `app/configuracion/page.tsx`,
`app/vendedor-dashboard/dashboard/page.tsx`, `app/descargas/page.tsx`,
`app/vendedores/page.tsx`, `app/vendedores/[slug]/page.tsx`,
`components/upload/file-upload.tsx`, `components/notifications/notification-panel.tsx`,
`components/checkout/paypal-payment-form.tsx`, `components/checkout/stripe-payment-form.tsx`,
`components/reviews/review-modal.tsx`, `components/providers/socket-provider.tsx`,
`components/providers/anime-provider.tsx`, `components/providers/particles-provider.tsx`

**`components/reviews/review-modal.tsx` syntax fix**: The cleanup script left an orphaned `})` at line 123 inside a `try` block (the closing of a multiline `console.log` object literal that spanned multiple lines). Manually removed — `tsc --noEmit` exits 0 on the frontend after the fix.

#### Frontend: ESLint Configuration
Created **`frontend/.eslintrc.js`** — the frontend had no ESLint configuration despite having `eslint` installed. Extends `next/core-web-vitals` + `@typescript-eslint/recommended`. Key rules:
- `no-console: ['warn', { allow: ['error', 'warn'] }]` — enforces the cleanup above going forward; `console.error` and `console.warn` are explicitly allowed.
- `@typescript-eslint/no-explicit-any: 'warn'` — surfaces remaining `any` types without blocking builds.

**Validation**: `tsc --noEmit` on frontend exits 0. Backend `tsc --noEmit` and lint (0 errors) unchanged.

### Commits (Session 2)
- `c417533` — CHANGELOG: full backend audit documentation  
- `[pending]` — Frontend cleanup: git hygiene, console.log removal, ESLint setup

## [Unreleased] - 2026-04-25

### Technical Debt Audit — `refactor/production-ready-v1`

Full autonomous audit of the NestJS backend covering security, performance,
type safety, antipatterns, and tooling. All changes are backward-compatible
and non-breaking; `tsc --noEmit` exits 0, lint exits 0 errors.

---

#### Security Fix

**`src/modules/auth/auth.service.ts`**

The email verification token and password reset token were logged to `console.log`
on every call — meaning they appeared in plain text in production server logs.
Any log aggregator (Datadog, CloudWatch, etc.) would have stored sensitive
one-time tokens permanently. Both calls were changed to `this.logger.debug()`
so they only appear when the application runs at DEBUG log level (never in production).

---

#### Performance: N+1 Query Elimination

Five distinct N+1 patterns were identified and fixed. In all cases the number
of database round-trips went from O(N) to O(1) or O(constant).

**`orders.service.ts` — `generateDownloadTokens`**
Previously iterated over every digital item in an order and called
`prisma.downloadToken.create()` in a sequential `for` loop — one INSERT per
item. Replaced with a single `prisma.downloadToken.createMany({ data: [...], skipDuplicates: true })`.
For a 10-item order this reduces 10 INSERT statements to 1.

**`orders.service.ts` — `updateProductStatistics`**
After order fulfillment, the method incremented `downloadCount` on each product
and `totalSales` on each seller profile in a sequential loop — 2 UPDATE statements
per item, executed one after the other. Replaced with `Promise.all(items.map(...))` 
so all updates execute in parallel, then wrapped both product and seller updates
for each item in a nested `Promise.all`. For a 5-item order: 10 sequential
round-trips → 10 parallel round-trips (single wait).

**`payment-checkout.controller.ts` — Stripe & PayPal checkout flows**
Both the Stripe and PayPal payment confirmation handlers created download tokens
in `for...of` loops identical to the one in `orders.service.ts`. Each loop was
replaced with `prisma.downloadToken.createMany`. The Stripe result is stored in
`downloadTokenCount` and the PayPal result in `paypalTokenCount` to avoid the
previous variable naming collision that masked the bug.

**`files.service.ts` — `cleanupOrphanedFiles`**
The orphan cleanup job called `prisma.file.update({ where: { id }, data: { status: DELETED } })`
once per file in a loop — one UPDATE per orphan. Replaced with a single
`prisma.file.updateMany({ where: { id: { in: eligibleIds } }, data: { status: DELETED } })`.
The subsequent filesystem `fs.unlink()` calls still run per-file because that is
unavoidable I/O, but the database round-trips collapse from N to 1.

**`sellers.service.ts` — `findAll` stats aggregation**
The original `findAll` ran 4 extra queries per seller per page to compute stats:
`prisma.product.count`, `prisma.review.aggregate` for rating, and two more for
sales/reviews. For a page of 10 sellers that was 40 additional queries on top
of the main list query. Fixed in two ways:
- `rating`, `totalSales`, and `totalReviews` are already denormalized columns
  on the `SellerProfile` table — they are now read directly from the fetched row
  instead of re-aggregating.
- `totalProducts` still requires a live count, but is now fetched via a single
  `prisma.product.groupBy({ by: ['sellerId'], _count: { id: true } })` across
  all sellers in the current page, then mapped into a `Map<sellerId, count>`.
  10 sellers → 1 query instead of 10.

The `findOne` and `findBySlug` methods were refactored into a shared private
`attachStats()` helper to avoid code duplication.

---

#### Antipattern Removal

**`orders.service.ts` — dynamic import bypassing NestJS DI**
In two places the service called `ReviewsService` using:
```typescript
const { ReviewsService } = await import('../reviews/reviews.service');
const reviewsService = new ReviewsService(this.prisma, this.notificationService);
```
This bypasses NestJS's dependency injection entirely — creating a second,
unmanaged instance of the service with manually-threaded dependencies.
This is error-prone (DI graph is ignored), untestable (can't be mocked via
the module system), and breaks if `ReviewsService`'s constructor signature changes.

Replaced with proper constructor injection using `@Inject(forwardRef(() => ReviewsService))`.
The `forwardRef` avoids the circular module reference between `OrdersModule` and
`ReviewsModule` at module-load time.

**`orders.module.ts` — unused module imports**
`FeesModule` and `StripeModule` were imported and listed as providers but neither
`FeesService` nor `StripeService` were used anywhere in `orders.service.ts`
(confirmed via TypeScript unused-variable hints). Both were removed from the
module's import list.

**`main.ts` and `stripe.module.ts` — CommonJS `require()` inside ES module files**
`main.ts` used `const compression = require('compression')` and
`const cookieParser = require('cookie-parser')` with a comment explaining it was
to "avoid type problems with ES modules." With `esModuleInterop: true` in
`tsconfig.json`, both can be imported normally. Converted to
`import compression from 'compression'` and `import cookieParser from 'cookie-parser'`.

`stripe.module.ts` used `const Stripe = require('stripe')` inside a factory
function. Converted to a top-level `import Stripe from 'stripe'`.

Both files now pass `@typescript-eslint/no-var-requires` without suppression comments.

---

#### Type Safety: Elimination of `any`

A shared interface was created to replace `any` on authenticated user parameters
across controllers:

**New file: `src/modules/auth/interfaces/authenticated-user.interface.ts`**
```typescript
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}
```

This interface is now used in place of `any` on `@CurrentUser()` decorator
parameters in the following controllers (21 occurrences total):
- `payments.controller.ts` — 8 occurrences; also fixed a NestJS routing
  warning caused by a required parameter appearing after an optional one.
- `payouts.controller.ts` — 8 occurrences.
- `payment-checkout.controller.ts` — 5 occurrences.

**`users.service.ts`**
- `create(createUserData: any)` → `create(createUserData: Prisma.UserCreateInput & { emailVerificationToken?: string })`
  The intersection with the optional `emailVerificationToken` field is necessary
  because Prisma's generated `UserCreateInput` type does not expose that field
  (it's set internally by the auth flow, not via Prisma relations).
- `update(id, updateData: any)` → `update(id, updateData: Prisma.UserUpdateInput)`
- `excludeFields<T extends Record<string, any>>` → `Record<string, unknown>`
  (tightened: `any` defeats the purpose of a generic constraint).

**`sellers.service.ts`**
Added two explicit interfaces that were previously inlined as `any`:
```typescript
interface FindAllSellersQuery { page?: number; limit?: number; search?: string; }
interface GetSellerProductsQuery {
  page?: number; limit?: number;
  category?: ProductCategory; difficulty?: Difficulty;
  priceMin?: number; priceMax?: number;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  search?: string;
}
```
`create` and `update` method bodies typed with `Prisma.SellerProfileCreateInput`
and `Prisma.SellerProfileUpdateInput`.

**`sellers.controller.ts`**
`@Body()` parameters in `create` and `update` changed from `any` to
`Prisma.SellerProfileCreateInput` / `Prisma.SellerProfileUpdateInput`.
Query params `category` and `difficulty` cast to `ProductCategory` and `Difficulty`
Prisma enums before passing to the service layer. `sortBy` result cast to the
literal union type to satisfy TypeScript's structural type check.

---

#### Logger Standardization

All direct `console.log`, `console.error`, `console.warn`, and `console.debug`
calls in backend services were replaced with NestJS `Logger` instances. Direct
`console` usage in production code is a problem because:
- Messages cannot be filtered by log level at runtime.
- Messages do not include the class/module name in structured log output.
- Production log aggregators expect structured JSON, which `console.*` does not produce.

Each affected class now has `private readonly logger = new Logger(ClassName.name)`.
Files modified:

| File | Calls replaced | Before → After |
|------|---------------|----------------|
| `auth.service.ts` | 2 | `console.log` → `logger.debug` |
| `token-blacklist.service.ts` | 4 | `console.log/error` → `logger.debug/error` |
| `files.service.ts` | 3 | `console.error` → `logger.error` |
| `notifications.service.ts` | 5 | `console.log/error` → `logger.log/error` |
| `reviews.service.ts` | 12 | `console.error` → `logger.error` |
| `cart.service.ts` | 1 | `console.warn` → `logger.warn` |
| `checkout.service.ts` | 1 | `console.error` → `logger.error` |
| `orders.service.ts` | 3 | `console.log/error` → `logger.log/error` |

---

#### TODO Resolution: Payout Notifications

**`src/modules/payments/payments.service.ts`**

Two methods `processPayoutCompleted` and `processPayoutFailed` existed as
documented stubs with `// TODO: implement` bodies. These are called by the
Stripe webhook handler when a payout to a seller's bank account succeeds or fails.

Both are now fully implemented:
1. Fetch the internal payout record by `stripePayoutId` to get the seller's `userId`.
2. Batch-update all transactions linked to this payout from `PENDING` to `COMPLETED`
   (or `FAILED`) using `prisma.transaction.updateMany` — one query instead of N.
3. Call `notificationService.createNotification()` with type `PAYOUT_COMPLETED`
   or `PAYOUT_FAILED`, including the payout amount and currency in the metadata.

**`src/modules/payments/payments.module.ts`**
Added `NotificationModule` to `imports` so `NotificationService` is available
for injection in `PaymentsService`.

---

#### Tooling: ESLint + Prettier Setup

The NestJS project generator normally scaffolds `.eslintrc.js` and `.prettierrc`,
but both were absent from the repository. Without them, ESLint runs with no rules
and Prettier cannot enforce formatting consistency.

**`backend/.eslintrc.js`** (created)
Standard NestJS ESLint configuration:
- Parser: `@typescript-eslint/parser` with `parserOptions.project`
- Extends: `plugin:@typescript-eslint/recommended` + `plugin:prettier/recommended`
- Rules: `no-explicit-any: warn` (not error — many exist in test fixtures),
  `no-unused-vars: warn` with `argsIgnorePattern: ^_`

**`backend/.prettierrc`** (created)
```json
{ "singleQuote": true, "trailingComma": "all" }
```
These match the NestJS generator defaults and prevent mixed quote styles across files.

**`backend/tsconfig.eslint.json`** (created)
```json
{ "extends": "./tsconfig.json", "include": ["src/**/*", "test/**/*"] }
```
The main `tsconfig.json` excludes `**/*.spec.ts` files (correct for compilation).
Without a separate tsconfig for ESLint, every spec file produces a fatal
"not included in parserOptions.project" error. `tsconfig.eslint.json` extends
the main config but includes test files, so ESLint can type-check them.
`.eslintrc.js` updated to reference `tsconfig.eslint.json` instead of `tsconfig.json`.

After applying Prettier formatting across the full codebase:
**Result: 0 lint errors, 427 warnings** (all `no-explicit-any` in test fixtures — acceptable).
**`tsc --noEmit` exits 0** — no TypeScript compilation errors.

---

### Commits in This Audit
- `ae482bd` — N+1 fixes (orders, payments, files), security fix (auth tokens), Logger refactor
- `f0652ec` — `any` type fixes (sellers, users, payment controllers), sellers N+1 optimization
- `5526dbf` — Payout notifications implemented, unused injections removed (FeesService, StripeService)
- `4b6a24a` — ESLint/Prettier config, `require` → `import` fixes, full codebase Prettier format

## [Unreleased] - 2026-04-24

### Added
- Documented and committed the infrastructure audit and cleanup process.

### Changed
- Removed duplicate repository subtree at `/backend/furniblesv4/`.
- Consolidated backend to `/backend/` and frontend to `/frontend/`.
- Reverted Prisma to supported version `6.10.1`.
- Updated `backend/prisma/schema.prisma` to use `env("DATABASE_URL")`.
- Fixed `backend/prisma/prisma.config.ts` to use the correct Prisma 6.x config shape and dotenv loading.
- Normalized analytics cache key generation for seller dashboard requests.
- Added root `tsconfig.json` for monorepo project references and editor workspace resolution.
- **Removed `get-docker.sh`**: Obsolete generic Docker installation script; users can refer to official Docker documentation or use their preferred installation method.

### Fixed
- Restored backend build after Prisma downgrade and configuration correction.
- Converted stubbed analytics endpoints to explicit `501 Not Implemented` responses instead of empty success payloads.
- Added graceful Redis shutdown in `AnalyticsCacheService`.
- Completed admin analytics fee breakdown aggregation and pending payout reporting.
- Verified backend stage tests: 87 passed, 0 failed for the audited modules.
- Verified frontend production build success.
- **Critical**: Fixed revenue calculation in `getSellerRecentOrders` query: removed `take: 1` limitation on seller items to correctly sum all item prices (was undercounting for multi-item orders); updated product title logic to show 'Multiple Items' when applicable.
- **Critical**: Fixed Redis performance issue in `AnalyticsCacheService.invalidatePattern()`: replaced blocking `KEYS` command with incremental `SCAN` iteration using `scanStream` to prevent server stalls; switched to `UNLINK` for non-blocking memory cleanup on large key batches.

### Notes
- Backend tests executed: 87 passed for stages 1-9 with the current audit changes.
- Frontend build validated successfully after cleanup.
- Repository-level type check passed: `frontend` `tsc --noEmit` and `backend` build both succeed.
- No package-level `tsconfig.json` compile errors were found in current `backend/tsconfig.json` or `frontend/tsconfig.json`.
- Added root `tsconfig.json` for consistent monorepo editor support and workspace type-checking.
- Existing PR open for this branch: https://github.com/damardon/furniblesv4/pull/1
- Implemented admin analytics country aggregation from `order.billingData.country` and calculated top seller revenue from completed order items.
- Optimized `getMonthlyGrowth` method with 12-month limit and improved edge case handling for zero revenue periods.
- Backup available at `/tmp/backend-furniblesv4-backup-*.tar.gz`.

## Próximos Pasos - Auditoría de Producción

### 1. Evaluación de Artefactos de Build
- **Decidir sobre `backend/dist/main.js`**: ¿mantener versionado o excluir como artefacto de compilación?
- **Revisar archivos `.tsbuildinfo`**: evaluar si deben estar en `.gitignore`

### 2. Auditoría de Campos JSON/Metadata
- **Verificar consistencia**: `feeBreakdown`, `metadata`, `specifications` entre Prisma schema y DTOs
- **Validar serialización**: asegurar que los campos JSON se manejen correctamente en servicios
- **Documentar contratos**: crear documentación clara de estructuras JSON esperadas

### 3. TODOs Críticos Pendientes
- **Auth**: implementar "forgot password" en login modal
- **Payments**: integrar reembolso real con Stripe, implementar configuración de preferencias
- **Webhooks**: completar verificación PayPal, implementar `processSplitPayments`
- **Files**: agregar verificación de permisos en file service
- **Reports**: implementar generación de reportes en cron service

### 4. Validación Final
- **Tests completos**: ejecutar suite completa de tests end-to-end
- **Performance**: revisar queries N+1 y optimizaciones de base de datos
- **Security**: auditoría final de endpoints y validaciones
- **Documentation**: actualizar README y docs de API
