# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏛️ Core Engineering & Design Principles

This project strictly adheres to the following four pillars. Any code, architecture, or UI generated must pass these guidelines flawlessly.

### 1. 🎨 Taste (Aesthetic & Typography)
- **Vercel × Anthropic Minimalist Aesthetic:** The UI must feel premium, enterprise-grade, and extremely polished.
- **Color Palette:** Use sophisticated, muted monochromes and pastels. Never use cheap default browser colors (no raw `#FF0000` or `#00FF00`). Stick to tailored HSL values, sleek dark/light mode scales, and smooth gradients.
- **Typography:** Utilize high-contrast, elegant modern typography (e.g., Inter, Geist, or Outfit). Implement strict typographic hierarchies with proper line heights and letter spacing.
- **Spacing & Layout:** Clean, intentional whitespace. Do not use raw, unstyled CSS grids without an explicit design intent. Use a mathematical spacing scale (e.g., 4px, 8px, 12px, 16px, 24px, 32px).

### 2. ⚡ Emil Kowalski (Motion & Micro-interactions)
- **Fluid & Organic Animations:** Every state transition (hover, active, focus, disabled, page load) must have a smooth, organic animation. No abrupt or jarring visual changes.
- **Easing Curves:** Never use default `linear` or `ease`. Strictly use custom spring-like or smooth easing curves, such as:
  - `cubic-bezier(0.32, 0.72, 0, 1)` for general smooth transitions.
  - `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy, satisfying micro-interactions.
- **Performance:** All animations must hit a flawless 60 FPS, strictly utilizing GPU-accelerated properties (`transform`, `opacity`) instead of layout-triggering properties (`margin`, `padding`).

### 3. 💎 Impeccable (Engineering Rigor & UX)
- **Pixel-Perfection:** The layout must be mathematically flawless. No misaligned divs, clipped shadows, or overlapping text.
- **Edge-Case Mastery:** You must explicitly handle and design for every possible state:
  - ⏳ *Loading states:* Implement elegant Skeleton loaders or custom spinners. Never leave the user guessing if the app is frozen.
  - 📭 *Empty states:* Beautifully designed empty lists (e.g. "No reservations found yet", accompanied by a subtle illustration or icon).
  - 🛑 *Error rollbacks:* Graceful API failures, form validation feedback, network disconnects, and safe fallback UIs.
- **Robust Integrity:** Explicit handling of unsafe inputs, unauthenticated routes, and database constraints.

### 4. 🚫 Anti-slop (Code Quality & Intent)
- **Zero AI-Boilerplate:** Code must be highly intentional and razor-sharp. Do not generate generic wrapper functions, unnecessary context providers, or redundant variables.
- **Meaningful Comments Only:** Do not write useless comments like `// fetch data` or `// button click`. Only comment *why* a complex decision/workaround was made, never *what* the code does.
- **Concise & DRY:** Every single line of code must justify its existence. If a component, type, or utility function already exists, reuse it. Do not duplicate logic.
- **Native over Abstraction:** Use native CSS over massive utility classes if it becomes unreadable; use native DOM behavior where appropriate. Keep dependencies to an absolute minimum.

## Project

Otel Rezervasyon ve Konaklama Yönetim Sistemi — a hotel back-office admin panel (Turkish UI) for managing rooms, guests, reservations, payments, housekeeping and staff. Two independent apps in this repo:

- `frontend/` — Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4, calling the backend over HTTP.
- `backend/` — Laravel 11 JSON API (PHP 8.2, MySQL), Sanctum bearer-token auth.

They are separate deployables with no shared build step; run and test each independently.

## Commands

### Frontend (`cd frontend`)
```bash
npm install
npm run dev     # dev server, http://localhost:3000
npm run build   # production build
npm run start   # run a production build
npm run lint    # ESLint
```
No frontend test runner is configured. Type-check with `npx tsc --noEmit -p tsconfig.json`.

### Backend (`cd backend`)
```bash
composer install
cp .env.example .env && php artisan key:generate   # set DB_* for your MySQL instance
php artisan migrate --seed    # schema + realistic dev data (60 rooms, 200+ guests, reservations/payments history)
php artisan serve             # http://127.0.0.1:8000
```
Run tests:
```bash
php artisan test                                        # full suite
php artisan test --filter=ReservationConflictTest        # one test class
php artisan test tests/Feature/PaymentTest.php            # one file
```
Tests run against a separate DB (`hotel_reservation_test`, see `.env.testing` — note its `DB_PORT` may differ from your dev DB) and reset schema per test via `RefreshDatabase`. Format PHP with `./vendor/bin/pint`.

Seeded accounts: `admin@hotel.test` / `personel@hotel.test`, password `password` for both (see `backend/README.md` for the full endpoint list and API conventions).

## Architecture

### Frontend ↔ backend wiring
- `frontend/src/lib/api.ts` is the single axios instance (`baseURL: http://localhost:8000`, hardcoded). Its request/response interceptors deep-walk every payload converting `camelCase` (JS) ⇄ `snake_case` (PHP/JSON) automatically — write frontend code entirely in camelCase and never manually convert keys.
- `frontend/src/lib/auth.tsx` (`AuthProvider`/`useAuth`) owns the Sanctum token (`localStorage`, key from `TOKEN_STORAGE_KEY` in `api.ts`) and the current user/permissions, verified via `GET /api/me` on mount.
- `frontend/src/lib/store.tsx` (`StoreProvider`/`useStore`) is the single global data store: one `useReducer`, hydrated once via a `Promise.all` of all list endpoints in `loadData()`, plus every mutation (create/update reservation, payment, housekeeping status, etc.) as methods on the same context. There is no per-page fetching — all pages read from this one in-memory store.
- List endpoints are paginated server-side; `frontend/src/lib/fetchAllPages.ts` walks all pages (first page sequentially, remaining pages in parallel) since the store always wants the full collection, not one page. The backend clamps `per_page` (see `Controller::perPage()`) — don't raise the frontend's requested `per_page` far past what `fetchAllPages` already sends without checking that clamp.
- `AppShell.tsx` mounts `StoreProvider` as soon as a token exists in storage (not gated on `/api/me` resolving), to run auth verification and data hydration in parallel. It reads `localStorage` in a `useEffect` (not during render) specifically to keep server/client render output identical and avoid a hydration mismatch — follow that pattern for any other client-only-state-during-SSR case.

### Frontend structure
- `app/(app)/*` — one route per sidebar page (dashboard, reservations, rooms, guests, payments, housekeeping, room-service, employees, roles, calendar, settings); `app/login/`  outside the group is unauthenticated.
- `components/<feature>/` mirrors the routes; `components/ui/` holds shared primitives (`Skeleton`, `EmptyState`, `DataTable`, etc.) per the loading/empty/error-state conventions below.
- `lib/nav.ts` (`NAV_CATEGORIES`) is the single source of truth for the sidebar's pages, their icons, and the permission key each requires — also drives `getFirstAccessibleRoute()`, which bounces a role off a page it can't see. Add a new page's nav entry here.
- `lib/selectors.ts` / `lib/availability.ts` hold client-side derived stats and the reservation date-conflict check; `lib/types.ts` mirrors the backend's API resource shapes (already camelCase, post-interceptor).
- Heavy, page-specific dependencies (the world-map chart's `d3-geo`/`topojson-client`/`world-atlas`, `jspdf`/`jspdf-autotable` for invoice PDFs) are loaded via `next/dynamic`/dynamic `import()` at the point of use, not imported statically — keep new heavy, rarely-used deps out of a route's initial bundle the same way.

### Backend layering
Standard thin-controller layering — follow the existing pattern for new endpoints:
- `Http/Controllers` — request in, call a service or query, return via `ApiResponder` trait (`success()`/`paginated()`/`error()` — every response uses this envelope: `{success, message, data}`, paginated lists nest `{items, meta}`).
- `Http/Requests/<Feature>/*` — form validation.
- `Services/` (`ReservationService`, `PaymentService`, `DashboardService`) — business logic and multi-step writes live here, not in controllers.
- `Policies/` — authorization, registered in `AppServiceProvider::boot()` (some newer models rely on Laravel's policy auto-discovery instead of explicit `Gate::policy()` — check both when tracing authorization for a model).
- `Http/Resources/` — response shaping.
- Domain-rule violations that aren't plain field validation (e.g. an invalid reservation status transition) throw `App\Exceptions\DomainActionException`, rendered as a 422 through the same envelope in `bootstrap/app.php`'s `withExceptions()` — throw this instead of a raw exception for business-rule failures.

### Authorization model (spans both apps, and isn't symmetric — read carefully)
Two layers:
1. `User.role` (`App\Enums\UserRole`: Admin/Personel) — admins bypass all permission checks (`User::hasPermission()` returns true unconditionally).
2. Fine-grained `Role` ↔ `Permission` (many-to-many), assigned per non-admin user via `User.role_id`.

Most backend policies (`RoomPolicy`, `ReservationPolicy`, `GuestPolicy`, `PaymentPolicy`) only distinguish admin vs. any authenticated personel — they don't check granular permissions at all. Only `EmployeePolicy`/`RolePolicy` call `$user->hasPermission()`, which requires an assigned `Role` (a personel user with no role gets `false` from every granular check, no fallback).

The frontend, by contrast, treats a personel user with **no role assigned yet** as unrestricted — showing every nav item/dashboard widget — until a role is actually picked for them (`Sidebar.tsx`, `dashboard/page.tsx`: `unrestricted = isAdmin || permissions.length === 0`). So today the granular `Permission` catalog (e.g. `dashboard.widget_revenue`, `rooms.view`) is mostly a **frontend-only** visibility/nav-gating mechanism, not a backend-enforced one — don't assume a nav-hidden page is also API-blocked for that role.

Permission keys are free-form strings defined by seeded `Permission` rows and referenced by string in both `nav.ts` and the two policies above — there's no shared enum, so a renamed key must be updated in both places it's used.

### Key domain rules (backend-enforced, see `backend/README.md` for the full list)
- Reservation date-conflict check allows same-day turnover (a checkout and a new check-in on the same date, same room) but blocks any other overlap among active (pending/confirmed/checked_in) reservations.
- Reservation status only moves `pending → confirmed → checked_in → completed`, or `pending|confirmed → cancelled`; check-in/out also flips the room's `status`.
- Payment totals for a reservation can never exceed its `total_amount`; `total_amount` itself is always server-computed (`nightly_rate * nights`), never trusted from the client.
- Reservations are never deleted, only transition status (history is kept); an occupied room cannot be deactivated.
