# Development Phases

This project is built in phases, not all at once. Each phase is developed on its own branch (`feature/<phase-name>`), merged into `main` via a Pull Request once it's complete and tested, and results in **one commit on `main`** (squash merge). This keeps the commit history on `main` readable — one meaningful commit per phase — while the feature branch itself can have as many small commits as needed during development.

A phase is not "done" until:

1. The code works manually (tested by hand).
2. Relevant tests are written and passing (see Testing Strategy in `README.md`).
3. The corresponding sections of `README.md` are updated to match what was actually built (not just what was planned).

---

## Phase 0 — Project Setup

- [x] Initialize monorepo with `pnpm-workspace.yaml`
- [x] Set up `apps/frontend` (Vite + React + TypeScript + Tailwind)
- [x] Set up `apps/backend` (NestJS + TypeScript)
- [x] Set up `packages/shared` for shared TypeScript types
- [x] Configure ESLint + Prettier (shared config across workspaces)
- [x] Set up PostgreSQL via Docker locally, connect via TypeORM
- [x] `.env.example` files for both apps

## Phase 1 — Database & Auth Backend

- [x] `users` entity + migration
- [x] `refresh_tokens` entity + migration
- [x] Password hashing (bcrypt)
- [x] `POST /auth/register`, `POST /auth/login`
- [x] Access token generation (JWT, short-lived)
- [x] Refresh token generation + hash stored in DB + httpOnly cookie
- [x] `POST /auth/refresh`, `POST /auth/logout`
- [x] `JwtAuthGuard` for protected routes
- [x] Edge cases: expired refresh token, reused/revoked refresh token, wrong password, duplicate email on register

## Phase 2 — Auth Frontend

- [x] `AuthContext` (holds access token in memory, exposes login/logout/refresh)
- [x] `LoginForm`, `RegisterForm` with validation
- [x] `ProtectedRoute` wrapper
- [x] Axios/fetch instance with interceptor: on 401, try `/auth/refresh` once, then retry original request or redirect to `/login`
- [x] On app load, silently attempt `/auth/refresh` to restore session

## Phase 3 — Bookmarks CRUD (Backend)

- [x] `bookmark` entity + migration
- [x] `GET /bookmarks` (with `search` query param — `tag` param added in Phase 5, once tag tables existed)
- [x] `GET /bookmarks/:id`, `POST /bookmarks`, `PATCH /bookmarks/:id`, `DELETE /bookmarks/:id`
- [x] Ownership check: a user can only read/edit/delete their own bookmarks
- [x] Input validation (URL format, required `title`)
- [x] Edge cases: accessing another user's bookmark (should 404, not 403 — don't leak existence), malformed URL, empty title

## Phase 4 — Bookmarks CRUD (Frontend)

- [x] `BookmarkList`, `BookmarkCard`
- [x] `BookmarkForm` (shared between create/edit)
- [x] `DashboardPage` wiring it all together
- [x] Loading and error states for every request
- [x] Optimistic UI or at least clear pending/success/error feedback on create/edit/delete

## Phase 5 — Tags & Filtering/Search

- [x] `tag` entity + migration, `bookmark_tags` junction table with composite PK
- [x] `GET /tags`, `POST /tags`, `DELETE /tags/:id`
- [x] `TagList`, `TagBadge`
- [x] Wire up `search` and `tag` filters on the frontend (debounced search input)
- [x] Edge case: deleting a tag that's still attached to bookmarks

## Phase 6 — UI Polish

- [x] Empty states (no bookmarks yet, no search results)
- [x] Consistent loading skeletons/spinners
- [x] Toasts/notifications for success and error actions
- [x] Responsive layout check (mobile/tablet/desktop)
- [x] Basic accessibility pass (labels, keyboard navigation, focus states)

## Phase 7 — i18n & Theme Switching

- [x] `react-i18next` setup, `en.json` / `sr.json` translation files
- [x] All UI strings routed through `t()`, no hardcoded text
- [x] Backend error responses use `error_code`, frontend maps codes to translated messages
- [x] Language switcher (persisted in `localStorage`)
- [x] Light/dark theme via Tailwind `dark:` class strategy, respects `prefers-color-scheme` as default, persisted in `localStorage`

## Phase 8 — Testing

- [x] Backend unit tests (services): auth logic, bookmarks logic, tags logic
- [x] Backend integration tests (controllers, against a test database)
- [x] Frontend unit tests (Vitest + React Testing Library): forms, protected route behavior, key components
- [x] E2E happy path: register → login → create bookmark → search/filter → edit → delete → logout
- [x] Edge cases from each phase above are covered, not just happy paths

---

## Notes

- Phases are sequential but not strictly rigid — if something in Phase 5 reveals a gap in Phase 3, go back and fix it before moving on. Don't ship on top of a known bug just to stay "on schedule."
- This file should be updated as the project evolves — if a phase's scope changes, edit it here rather than letting the plan silently drift from reality.
