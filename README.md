# Game of Life Full-Stack Workspace

This repository now contains a split Local + Cloud version of the Game of Life app.

- `Local` mode keeps worlds and custom patterns in browser storage, just like the original app.
- `Cloud` mode adds account-backed worlds, custom patterns, and synced playback preferences through a Node.js API and Supabase.
- Local and Cloud data are intentionally separate in phase 1. There is no automatic sync or import between them.

## App Flow

### 1. Landing

- `/` is the marketing/home screen.
- From there, the user can enter the worlds registry, sign in to Cloud mode, or read the About page.

### 2. Worlds Registry

- `/worlds` is the main registry screen.
- The registry has two modes:
  - `Local`: uses browser persistence only.
  - `Cloud`: uses the backend API and requires authentication.
- The mode is selected through the `mode` query string:
  - `/worlds?mode=local`
  - `/worlds?mode=cloud`

### 3. Authentication

- `/login` signs an existing user into Cloud mode.
- `/signup` creates a new Cloud account.
- Authentication is backend-led:
  - the frontend talks only to the backend
  - the backend talks to Supabase Auth
  - the browser session is stored in secure HTTP-only cookies

### 4. Local Gameplay

- `/game/local/:worldId`
- Uses Zustand + `localStorage`.
- Keeps the original local experience for offline/device-only play.
- Local worlds and local custom patterns remain on the device.

### 5. Cloud Gameplay

- `/game/cloud/:worldId`
- Requires a valid authenticated session.
- The simulation still runs client-side for responsiveness.
- Durable changes are synced through the backend:
  - cell edits are batched and patched
  - world snapshots are autosaved during playback
  - preferences such as simulation speed and last-opened world are stored per user

## Repository Layout

- `frontend/`
  - Vite + React app
  - route-level Local/Cloud UX
  - API client layer
- `backend/`
  - Fastify + TypeScript API
  - auth/session handling
  - Supabase adapters
- `packages/shared-game/`
  - shared types
  - Game of Life engine
  - built-in patterns
  - validation constants
  - cell-diff helpers
- `supabase/migrations/`
  - SQL schema and RLS policies

## How To Run

### Prerequisites

- Node.js 22+ recommended
- npm
- A Supabase project for Cloud mode

### 1. Install dependencies

From the repo root:

```bash
npm install
```

This installs the workspace dependencies for:

- `frontend`
- `backend`
- `packages/shared-game`

### 2. Configure environment files

Create local env files from the examples:

```bash
copy frontend\.env.example frontend\.env.local
copy backend\.env.example backend\.env.local
```

On macOS/Linux:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env.local
```

### 3. Fill backend env values

Set real values in `backend/.env.local`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COOKIE_SECRET`
- `SESSION_ENCRYPTION_KEY`

For local development, these defaults are expected:

- `PORT=3001`
- `CORS_ORIGINS=http://localhost:5173`
- `APP_ENV=local`

### 4. Frontend env for local development

For local development, `frontend/.env.local` can stay empty:

```env
VITE_API_BASE_URL=
```

That is intentional. Vite proxies `/api` to `http://localhost:3001` during local dev.

If you want the frontend to hit a remote backend directly, set:

```env
VITE_API_BASE_URL=https://your-api-host
```

### 5. Start the backend

```bash
cd backend
npm run dev
```

The API runs on `http://localhost:3001`.

### 6. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

The app runs on `http://localhost:5173`.

## Build, Typecheck, and Verification

From the repo root:

```bash
npm run typecheck
npm run build
npm run test
```

Workspace behavior:

- root `typecheck` runs workspace typechecks
- root `build` runs workspace builds
- root `test` runs workspace tests

Current backend test verification is a smoke-test script that validates:

- env parsing
- shared simulation helpers
- auth cookie flow
- authenticated `/api/me` access

## Backend API Surface

All backend routes are served under `/api`.

### Auth and session

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

### Worlds

- `GET /api/worlds`
- `POST /api/worlds`
- `GET /api/worlds/:worldId`
- `PATCH /api/worlds/:worldId`
- `DELETE /api/worlds/:worldId`
- `PATCH /api/worlds/:worldId/cells`
- `PUT /api/worlds/:worldId/state`

### Patterns

- `GET /api/patterns`
- `POST /api/patterns`
- `DELETE /api/patterns/:patternId`

### Preferences

- `GET /api/me/preferences`
- `PUT /api/me/preferences`

### Health

- `GET /api/health/live`
- `GET /api/health/ready`

## How To Migrate

There are two different kinds of migration in this app.

### 1. Product migration from the old frontend-only app

The previous app stored all durable state locally in the browser.

In the new app:

- Local mode still uses browser storage.
- Cloud mode is a new, separate data space.
- Existing local worlds are not automatically moved to Cloud.
- Existing local custom patterns are not automatically moved to Cloud.

Current behavior is deliberate:

- no destructive migration
- no silent data move
- no auto-import on sign-in

If a user already has local data, it should still remain in the original browser storage key:

- `game-of-life-state`

### 2. Database migration for Cloud mode

Cloud mode requires the Supabase SQL migration in:

- `supabase/migrations/202604170001_initial_schema.sql`

This migration creates:

- `worlds`
- `patterns`
- `user_preferences`
- `updated_at` trigger function
- RLS policies for per-user access

### Recommended migration process

1. Create a dedicated Supabase project for the target environment.
2. Apply the SQL migration in `supabase/migrations/`.
3. Verify that RLS is enabled on all three tables.
4. Verify signup/login works through the backend.
5. Create a cloud world and confirm save/load works.

### Applying the SQL

You can apply the migration in either of these ways:

1. Supabase Dashboard SQL editor
   - paste the migration and run it
2. Supabase CLI
   - link to the target project
   - run the migration command for that environment

Example CLI flow:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

If your team uses a different Supabase workflow, keep the repo SQL file as the source of truth.

## Environment Management

The app is designed around three environments:

- `local`
- `integration`
- `production`

### Frontend environment strategy

Use environment-specific files such as:

- `frontend/.env.local`
- `frontend/.env.integration`
- `frontend/.env.production`

Key frontend variable:

- `VITE_API_BASE_URL`

Recommended values:

- local: empty string or omitted, so Vite proxy handles `/api`
- integration: integration backend URL
- production: production backend URL

### Backend environment strategy

Use environment-specific files such as:

- `backend/.env.local`
- `backend/.env.integration`
- `backend/.env.production`

Key backend variables:

- `NODE_ENV`
- `APP_ENV`
- `PORT`
- `CORS_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COOKIE_SECRET`
- `SESSION_ENCRYPTION_KEY`

### Recommended environment rules

- Use a separate Supabase project for `integration` and `production`.
- Do not reuse production secrets outside production.
- Rotate `COOKIE_SECRET` and `SESSION_ENCRYPTION_KEY` through your secret manager, not through git.
- Keep frontend `VITE_API_BASE_URL` aligned with backend `CORS_ORIGINS`.
- Treat `SUPABASE_SERVICE_ROLE_KEY` as backend-only.

### Local

- `APP_ENV=local`
- frontend runs on `localhost:5173`
- backend runs on `localhost:3001`
- Vite proxy forwards `/api`

### Integration

- `APP_ENV=integration`
- use a dedicated Supabase integration project
- use integration API and frontend hosts
- run the same SQL migration against the integration database

### Production

- `APP_ENV=production`
- use a dedicated production Supabase project
- production frontend should talk only to the production API
- store all secrets in the hosting platform secret manager

## Security Notes

- Browser sessions are stored in encrypted HTTP-only cookies.
- Mutating backend requests require a CSRF token.
- Row Level Security is enabled on Cloud tables.
- The backend is the only layer that talks directly to Supabase Auth.

## Current Phase 1 Constraints

- Cloud mode is private single-user only.
- There is no sharing or collaboration yet.
- Local and Cloud libraries are separate by design.
- There is no automatic import from old local data into Cloud.

## Suggested First Run Checklist

1. Install the workspace with `npm install`.
2. Create `frontend/.env.local` and `backend/.env.local`.
3. Fill real Supabase values into `backend/.env.local`.
4. Apply the SQL migration to your Supabase project.
5. Run `backend` and `frontend` dev servers in separate terminals.
6. Open `/worlds?mode=local` and confirm Local mode works.
7. Open `/signup`, create a user, then open `/worlds?mode=cloud`.
8. Create a Cloud world and verify it survives refresh.
