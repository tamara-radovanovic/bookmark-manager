# Bookmark Manager

A full-stack web application for saving, organizing, and searching bookmarks with tag support. Built as a monorepo with shared TypeScript types across frontend and backend.

For the development roadmap and task breakdown, see [`PHASES.md`](./PHASES.md).

---

## Tech Stack

| Layer           | Technology                                                     |
| --------------- | -------------------------------------------------------------- |
| Frontend        | React, TypeScript, Vite, Tailwind CSS                          |
| Backend         | NestJS, TypeScript                                             |
| Database        | PostgreSQL, TypeORM                                            |
| Shared          | TypeScript interfaces (pnpm workspaces)                        |
| Auth            | JWT (access token in memory, refresh token in httpOnly cookie) |
| Package manager | pnpm (monorepo workspaces)                                     |

---

## Folder Structure

```
bookmark-manager/
├── apps/
│   ├── frontend/                 # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Navbar.tsx
│   │   │   │   │   └── ProtectedRoute.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── bookmarks/
│   │   │   │   │   ├── BookmarkList.tsx
│   │   │   │   │   ├── BookmarkCard.tsx
│   │   │   │   │   ├── BookmarkCardSkeleton.tsx
│   │   │   │   │   ├── BookmarkForm.tsx
│   │   │   │   │   └── BookmarkSearch.tsx
│   │   │   │   ├── tags/
│   │   │   │   │   ├── TagList.tsx
│   │   │   │   │   └── TagBadge.tsx
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── ConfirmDialog.tsx
│   │   │   │       ├── Toast.tsx
│   │   │   │       ├── ToastContainer.tsx
│   │   │   │       └── Spinner.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── NewBookmarkPage.tsx
│   │   │   │   └── EditBookmarkPage.tsx
│   │   │   ├── services/          # API call functions
│   │   │   ├── context/           # AuthContext (access token in memory), ToastContext (toast notifications)
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── backend/                  # NestJS
│       ├── src/
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── guards/
│       │   │   │   └── jwt-auth.guard.ts
│       │   │   └── entities/
│       │   │       └── refresh-token.entity.ts
│       │   ├── bookmarks/
│       │   │   ├── bookmarks.module.ts
│       │   │   ├── bookmarks.controller.ts
│       │   │   ├── bookmarks.service.ts
│       │   │   └── entities/
│       │   │       └── bookmark.entity.ts
│       │   ├── tags/
│       │   │   ├── tags.module.ts
│       │   │   ├── tags.controller.ts
│       │   │   ├── tags.service.ts
│       │   │   └── entities/
│       │   │       └── tag.entity.ts
│       │   ├── users/
│       │   │   ├── users.module.ts
│       │   │   ├── users.service.ts
│       │   │   └── entities/
│       │   │       └── user.entity.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared TypeScript types
│       ├── src/
│       │   ├── types/
│       │   │   ├── bookmark.types.ts
│       │   │   ├── tag.types.ts
│       │   │   └── user.types.ts
│       │   └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json                  # Root — pnpm workspaces config
├── PHASES.md
└── README.md
```

---

## Database Schema

```
users
├── id           UUID        PK
├── email        VARCHAR     UNIQUE NOT NULL
├── password     VARCHAR     NOT NULL (bcrypt hashed)
├── created_at   TIMESTAMP
└── updated_at   TIMESTAMP

refresh_tokens
├── id           UUID        PK
├── token_hash   VARCHAR     NOT NULL      -- hashed, never store raw token
├── user_id      UUID        FK → users.id
├── expires_at   TIMESTAMP   NOT NULL
└── created_at   TIMESTAMP

bookmarks
├── id           UUID        PK
├── url          VARCHAR     NOT NULL
├── title        VARCHAR     NOT NULL      -- entered manually by the user
├── description  VARCHAR     NULLABLE
├── favicon_url  VARCHAR     NULLABLE      -- optional, entered manually
├── user_id      UUID        FK → users.id
├── created_at   TIMESTAMP
└── updated_at   TIMESTAMP

tags
├── id           UUID        PK
├── name         VARCHAR     NOT NULL
├── user_id      UUID        FK → users.id
└── UNIQUE(name, user_id)    -- same tag name can exist for different users

bookmark_tags (junction table)
├── bookmark_id  UUID        FK → bookmarks.id
├── tag_id       UUID        FK → tags.id
└── PRIMARY KEY (bookmark_id, tag_id)
```

**Notes:**

- `refresh_tokens.token_hash` is stored as a hash (e.g. SHA-256), never the raw token — same principle as password hashing, in case the database is ever compromised.
- Deleting a row from `refresh_tokens` (on logout) immediately invalidates that session, even though the JWT itself hasn't technically expired yet.

---

## Authentication Flow

- **Access token** — short-lived JWT, returned in the response body on login/register/refresh. Stored **in memory only** (React context/state), never in `localStorage` or a regular cookie. Lost on page refresh by design — recovered automatically via the refresh flow below.
- **Refresh token** — long-lived JWT, set by the backend as an **`httpOnly`, `Secure`, `SameSite=Strict`** cookie. Never exposed to JavaScript. Its hash is also stored in the `refresh_tokens` table so it can be revoked server-side.
- On app load, the frontend calls `POST /auth/refresh` (cookie sent automatically by the browser) to obtain a fresh access token without requiring the user to log in again.
- On logout, the backend deletes the matching row in `refresh_tokens` and clears the cookie — the refresh token becomes unusable immediately, not just removed client-side.

This trades a bit of setup complexity (CORS with `credentials: true`, cookie config) for meaningfully better security than storing tokens in `localStorage`.

---

## API Documentation

Base URL: `http://localhost:3000`

Protected routes require a valid access token, sent as `Authorization: Bearer <access_token>`. The refresh token is never sent manually — it travels automatically as an `httpOnly` cookie.

---

### Auth

#### Register

```
POST /auth/register

Body:
{
  "email": "user@example.com",
  "password": "strongpassword"
}

Response 201:
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict
{
  "access_token": "jwt..."
}
```

#### Login

```
POST /auth/login

Body:
{
  "email": "user@example.com",
  "password": "strongpassword"
}

Response 200:
Set-Cookie: refresh_token=<jwt>; HttpOnly; Secure; SameSite=Strict
{
  "access_token": "jwt..."
}

Response 401 (wrong credentials):
{
  "error_code": "AUTH_INVALID_CREDENTIALS"
}
```

#### Logout

```
POST /auth/logout
🔒 Protected

Effect: deletes the matching row in refresh_tokens, clears the refresh_token cookie.

Response 200:
{
  "message": "Logged out successfully"
}
```

#### Refresh Token

```
POST /auth/refresh

Reads: refresh_token httpOnly cookie (sent automatically by the browser).

Response 200:
Set-Cookie: refresh_token=<new jwt>; HttpOnly; Secure; SameSite=Strict
{
  "access_token": "jwt..."
}

Response 401 (missing/expired/revoked token):
{
  "error_code": "AUTH_REFRESH_INVALID"
}
```

> **Note on error responses:** errors use a stable `error_code` instead of a hardcoded English message, so the frontend can translate them (see Phase 7 in `PHASES.md`).

---

### Bookmarks

#### Get all bookmarks

```
GET /bookmarks
🔒 Protected

Query params (all optional):
  search=react                    -- filters by title or URL
  tags=tutorial&tags=react        -- filters by tag name; repeat the param for
                                      more than one — a bookmark must have
                                      ALL of them (AND, not OR)

Response 200:
[
  {
    "id": "uuid",
    "url": "https://example.com",
    "title": "Example Site",
    "description": "Optional description",
    "favicon_url": "https://example.com/favicon.ico",
    "tags": [{ "id": "uuid", "name": "react" }],
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Get one bookmark

```
GET /bookmarks/:id
🔒 Protected

Response 200:
{
  "id": "uuid",
  "url": "https://example.com",
  "title": "Example Site",
  "description": "Optional description",
  "favicon_url": "https://example.com/favicon.ico",
  "tags": [{ "id": "uuid", "name": "react" }],
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}

Response 404:
{ "error_code": "BOOKMARK_NOT_FOUND" }
```

#### Create bookmark

```
POST /bookmarks
🔒 Protected

Body:
{
  "url": "https://example.com",
  "title": "Example Site",         -- required, entered manually
  "description": "Optional",       -- optional
  "favicon_url": "https://...",    -- optional, entered manually
  "tag_ids": ["uuid", "uuid"]      -- optional
}

Response 201: created bookmark object

Response 400 (invalid URL / missing title):
{ "error_code": "VALIDATION_FAILED", "fields": ["url"] }
```

> `VALIDATION_FAILED` is the generic shape used for every endpoint's request-body
> validation failures (not just bookmarks) — one consistent error_code + a
> `fields` array naming what failed, rather than a different code per resource.

#### Update bookmark

```
PATCH /bookmarks/:id
🔒 Protected

Body (all fields optional):
{
  "title": "Updated title",
  "description": "Updated description",
  "favicon_url": "https://...",
  "tag_ids": ["uuid"]
}

Response 200: updated bookmark object
```

#### Delete bookmark

```
DELETE /bookmarks/:id
🔒 Protected

Response 204: No content
```

---

### Tags

#### Get all tags

```
GET /tags
🔒 Protected

Response 200:
[
  { "id": "uuid", "name": "react" },
  { "id": "uuid", "name": "tutorial" }
]
```

#### Create tag

```
POST /tags
🔒 Protected

Body:
{
  "name": "react"
}

Response 201:
{
  "id": "uuid",
  "name": "react"
}

Response 409 (duplicate tag name for this user):
{ "error_code": "TAG_ALREADY_EXISTS" }
```

#### Delete tag

```
DELETE /tags/:id
🔒 Protected

Response 204: No content
```

---

## Frontend Routes

| Route                 | Component     | Protected | Description                           |
| --------------------- | ------------- | --------- | ------------------------------------- |
| `/`                   | —             | No        | Redirects to `/dashboard` or `/login` |
| `/login`              | LoginPage     | No        | Login form                            |
| `/register`           | RegisterPage  | No        | Register form                         |
| `/dashboard`          | DashboardPage | Yes       | Bookmark list, search, tag filters    |
| `/bookmarks/new`      | BookmarkForm  | Yes       | Create new bookmark                   |
| `/bookmarks/:id/edit` | BookmarkForm  | Yes       | Edit existing bookmark                |

---

## Frontend Components

### Layout

| Component        | Description                                                          |
| ---------------- | ---------------------------------------------------------------------|
| `Navbar`         | Sticky top navigation bar (dashboard link + logout button)           |
| `ProtectedRoute` | Wrapper that redirects unauthenticated users to `/login`             |

### Auth

| Component      | Description                  |
| -------------- | ---------------------------- |
| `LoginForm`    | Email + password login form  |
| `RegisterForm` | Email + password signup form |

### Bookmarks

| Component             | Description                                                                   |
| --------------------- | ------------------------------------------------------------------------------ |
| `BookmarkList`        | Renders list of `BookmarkCard`s, or an empty state (no bookmarks / no matches) |
| `BookmarkCard`        | Displays single bookmark with tags, edit/delete (delete asks for confirmation) |
| `BookmarkCardSkeleton`| Pulsing placeholder shown while the list is loading                            |
| `BookmarkForm`        | Shared form for creating and editing bookmarks                                 |
| `BookmarkSearch`      | Search input that filters bookmarks by title / URL                             |

### Tags

| Component  | Description                                                                        |
| ---------- | ---------------------------------------------------------------------------------- |
| `TagList`  | Clickable tag filters on the dashboard, plus create/delete a tag                   |
| `TagBadge` | Small pill badge — read-only on `BookmarkCard`, clickable + removable in `TagList` |

### UI (Reusable)

| Component                  | Description                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `Button`                   | Styled button with variants                                                                     |
| `Input`                    | Styled text input with error state                                                              |
| `Modal`                    | Generic accessible modal wrapper (focus trap, Escape/backdrop close, focus restored on close)   |
| `ConfirmDialog`            | `Modal`-based Yes/No confirmation, replaces `window.confirm()` for deletes                      |
| `Toast` / `ToastContainer` | Success/error notifications (auto-dismiss, pause on hover, manual close) — see `ToastContext`   |
| `Spinner`                  | Loading indicator                                                                                |

---

## Testing Strategy

_Details to be filled in during Phase 8 (see `PHASES.md`) — this is the agreed baseline:_

| Layer    | Tool                           | Scope                                                                                                    |
| -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Backend  | Jest (NestJS default)          | Unit tests for services (business logic), integration tests for controllers (using an in-memory/test DB) |
| Frontend | Vitest + React Testing Library | Unit tests for components/hooks, focus on user-visible behavior, not implementation details              |
| E2E      | _TBD (e.g. Playwright)_        | Critical flows only: register → login → create bookmark → logout                                         |

Minimum bar before a phase is considered "done": auth flow and bookmark CRUD have both unit and integration coverage, including at least one test per known edge case (expired token, duplicate tag, invalid URL, unauthorized access to another user's bookmark).

Implemented so far: `apps/backend/src/auth/auth.service.spec.ts` (unit, mocked dependencies) and `apps/backend/test/auth.e2e-spec.ts` (integration — real HTTP requests through a throwaway `bookmark_manager_test` Postgres database on the same local Docker instance). See "Backend Tests" under Local Setup for how to run them.

---

## Local Setup

### Prerequisites

- Node.js v20+
- Docker Desktop (runs PostgreSQL locally — no native Postgres install needed)
- pnpm v9+

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/bookmark-manager.git
cd bookmark-manager

# Install all dependencies (root + all workspaces)
pnpm install
```

### Environment Variables

Copy each `.env.example` to `.env` in the same folder and adjust if needed. `.env` files are git-ignored — never commit real secrets, even local dev ones.

**root `.env`** (read by `docker-compose.yml` to configure the Postgres container)

```
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=bookmark_manager
POSTGRES_PORT=5433
```

Port `5433` (not Postgres's default `5432`) avoids clashing with a native Postgres install some machines already have running on `5432`.

**`apps/backend/.env`** — `DATABASE_URL` must use the same user/password/db/port as the root `.env` above.

```
DATABASE_URL=postgresql://user:password@localhost:5433/bookmark_manager
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_signing_secret_here
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**`apps/frontend/.env`**

```
VITE_API_URL=http://localhost:3000
```

### Database (Docker)

```bash
# Start Postgres in the background
docker compose up -d

# Check it's running and healthy
docker compose ps
```

Data persists in a named Docker volume (`pgdata`) across restarts. `docker compose down` stops and removes the container but keeps the volume; add `-v` to also wipe the data.

### Running the App

```bash
# Run backend
pnpm --filter backend dev

# Run frontend (in a separate terminal)
pnpm --filter frontend dev
```

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:3000`

### Linting & Formatting

```bash
pnpm lint           # ESLint across all workspaces (one shared root config)
pnpm format         # Prettier — rewrites files to match the project style
pnpm format:check   # Prettier — reports mismatches without writing (used in CI)
```

### Backend Tests

```bash
pnpm --filter backend test        # Unit tests (mocked dependencies, no DB)
pnpm --filter backend test:e2e    # Integration tests — needs Docker Postgres running
```

`test:e2e` connects to the same local Postgres container as normal dev, but uses a separate `bookmark_manager_test` database (created automatically on first run) so it never touches your real dev data.

---
