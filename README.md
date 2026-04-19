# Game of Life Full-Stack App

This repository now contains a full-stack version of the Game of Life app:

- `frontend/`: React + Vite + Zustand UI
- `backend/`: Fastify + TypeScript API
- `shared/`: shared game types and logic used by both sides
- `supabase/`: SQL migration for database schema and RLS

## What Changed

The app is no longer frontend-only.

It now supports:

- local worlds for guest usage
- cloud worlds for signed-in users
- Supabase Auth for sign-in/sign-up
- manual sync of local worlds and local custom patterns into the cloud
- server-authoritative cloud mutations for cell edits, stepping, randomize, clear, and pattern placement
- per-user cloud preferences for simulation speed and last opened cloud world

## App Flow

### 1. Guest flow

When a user opens the app without signing in:

- they can browse the landing page, about page, and world registry
- they can create `local` worlds
- local worlds and local custom patterns are stored in browser local storage
- simulation speed for local usage is also stored locally

### 2. Auth flow

When Supabase environment variables are configured, the Worlds screen shows a sign-in entry point.

Signed-in users can:

- authenticate with email/password via Supabase Auth
- load cloud worlds, cloud patterns, and cloud preferences
- create new worlds as either `Local` or `Sync`
- sign out without losing local data

### 3. Local to cloud sync flow

If the app finds unsynced local worlds or patterns after sign-in:

- it opens the Sync Manager
- the user can sync each local world or pattern manually
- the local copy remains local after sync
- the synced copy is created in Supabase-backed cloud storage

The sync prompt can be closed and reopened later from the Worlds screen.

### 4. World editing flow

For local worlds:

- all mutations happen in the frontend store
- state is persisted to local storage

For cloud worlds:

- the frontend updates optimistically
- cell painting is batched and sent to `PATCH /worlds/:id/cells`
- step, randomize, clear, and pattern apply go through backend endpoints
- the backend enforces version checks and returns `409` conflicts when client state is stale

### 5. Preferences flow

- local worlds use local simulation speed
- cloud worlds use backend-backed preferences from `GET/PUT /me/preferences`

## Routes

Frontend routes:

- `/`
- `/about`
- `/worlds`
- `/game/local/:worldId`
- `/game/cloud/:worldId`

Backend routes:

- `GET /health/live`
- `GET /health/ready`
- `GET /me`
- `GET /me/preferences`
- `PUT /me/preferences`
- `GET /worlds`
- `POST /worlds`
- `GET /worlds/:id`
- `PATCH /worlds/:id`
- `DELETE /worlds/:id`
- `PATCH /worlds/:id/cells`
- `POST /worlds/:id/step`
- `POST /worlds/:id/randomize`
- `POST /worlds/:id/clear`
- `POST /worlds/:id/pattern-applications`
- `GET /patterns?scope=builtin|mine`
- `POST /patterns`
- `DELETE /patterns/:id`

## Run Locally

### Prerequisites

- Node.js LTS
- npm
- a Supabase project

### 1. Install dependencies

Open two terminals and install per app:

```powershell
cd frontend
npm install
```

```powershell
cd backend
npm install
```

### 2. Create local environment files

Frontend:

```powershell
Copy-Item frontend/.env.local.example frontend/.env.local
```

Backend:

```powershell
Copy-Item backend/.env.local.example backend/.env.local
```

Then replace the placeholder values with your real Supabase and local API values.

### 3. Apply the database migration

The schema and RLS live in:

- `supabase/migrations/202604190001_initial_fullstack_schema.sql`

Apply this SQL to your Supabase project before running cloud features.

You can do this by:

- pasting the SQL into the Supabase SQL Editor and running it
- or wiring the Supabase CLI in your own setup and applying the migration there

### 4. Start the backend

```powershell
cd backend
npm run dev
```

The backend reads:

- `.env`
- `.env.local` by default because `APP_ENV` defaults to `local`

It serves on `http://localhost:4000` unless you change `PORT`.

### 5. Start the frontend

```powershell
cd frontend
npm run dev
```

The frontend serves on the default Vite dev port unless changed by Vite.

### 6. Open the app

Open the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Migration Guide

### Database migration

For a fresh Supabase project:

1. Create the project.
2. Add frontend and backend env values.
3. Apply `supabase/migrations/202604190001_initial_fullstack_schema.sql`.
4. Start backend and frontend.

### Existing frontend-only browser data migration

The old frontend-only app stored data under the legacy local storage key:

- `game-of-life-state`

The new app now stores data under:

- `game-of-life-state-v2`

On first load, the new frontend bootstraps legacy local worlds and local patterns into the new local store shape.

That means:

- old local worlds become `local` worlds in the new app
- old custom patterns become `local` patterns
- old local speed becomes the new local simulation speed
- the old selected world becomes the new local last-opened world

### Local to cloud migration

After sign-in:

1. the app detects unsynced local items
2. the Sync Manager opens
3. the user chooses which worlds and patterns to sync
4. each synced item is copied into cloud storage
5. the original local item stays available locally

## Environment Management

### Frontend env files

Examples included:

- `frontend/.env.example`
- `frontend/.env.local.example`
- `frontend/.env.integration.example`
- `frontend/.env.production.example`

Frontend variables:

- `VITE_API_BASE_URL`: backend base URL
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: public anon key for Supabase Auth and frontend client access

Vite uses the standard mode-based env loading behavior. For example:

- local dev uses `.env.local`
- integration builds should use `.env.integration`
- production builds should use `.env.production`

### Backend env files

Examples included:

- `backend/.env.example`
- `backend/.env.local.example`
- `backend/.env.integration.example`
- `backend/.env.production.example`

Backend variables:

- `NODE_ENV`: Node runtime mode
- `APP_ENV`: app environment selector: `local`, `integration`, or `production`
- `PORT`: backend port
- `API_HOST`: bind host
- `CORS_ORIGINS`: comma-separated allowed frontend origins
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: anon key used for user-scoped backend clients
- `SUPABASE_SERVICE_ROLE_KEY`: reserved for server-only privileged work
- `JWT_AUDIENCE`: JWT audience, usually `authenticated`
- `JWT_ISSUER`: Supabase Auth issuer URL

Backend env loading behavior:

- it loads `.env`
- then it loads `.env.<APP_ENV>`
- if `APP_ENV` is not set, it defaults to `local`

Examples:

```powershell
cd backend
$env:APP_ENV="integration"
npm run dev
```

```powershell
cd backend
$env:APP_ENV="production"
npm run start
```

### Recommended environment policy

- use one Supabase project for `local` or dev work
- use a separate Supabase project for `integration`
- use a separate Supabase project for `production`
- never share production keys with non-production environments
- never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend

## Build And Verification

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
cd backend
npm run build
npm test
```

## Repository Layout

```text
frontend/   React app, auth UI, local/cloud store, screens, Vite config
backend/    Fastify API, env validation, Supabase adapters, smoke checks
shared/     shared types, world/pattern/engine logic
supabase/   SQL migration for schema and RLS
```

## Notes

- Cloud features require valid Supabase values and an applied migration.
- Local-only usage still works without signing in.
- The backend currently contains a smoke-check style test script instead of a full test runner suite because the local sandbox environment blocks worker-based runners.
