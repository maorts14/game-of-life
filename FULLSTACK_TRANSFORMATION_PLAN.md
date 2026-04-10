# Full-Stack Transformation Plan (Frontend + Node.js/TypeScript Backend + Supabase)

## 1) Vision and Objectives

Transform the current frontend-only application into a robust full-stack system with:

- **Backend in Node.js + TypeScript**.
- **Supabase as the managed platform** for database, auth, and related capabilities.
- **Abstracted backend services** so auth/database providers can be swapped with minimal impact.
- **Clear environment separation** across **local**, **integration**, and **production** for both frontend and backend.

Success means the app is production-ready, testable across all environments, and architected for provider flexibility.

---

## 2) Target Architecture (High-Level)

## 2.1 System Components

- **Frontend (existing app)**
  - Remains TypeScript-based.
  - Calls backend via REST (or REST + WebSocket if needed later).
  - Uses environment-specific API base URLs and public runtime configuration.

- **Backend API (new)**
  - Node.js + TypeScript service.
  - Layered architecture:
    - **API layer** (controllers/routes)
    - **Application layer** (use cases)
    - **Domain layer** (business entities/rules)
    - **Infrastructure layer** (Supabase adapters, external services)
  - Dependency inversion between use cases and infra adapters.

- **Supabase**
  - **Postgres** for data.
  - **Auth** for authentication and session/JWT flows.
  - Optional: storage/realtime/edge functions if needed.

## 2.2 Key Architectural Principles

- **Provider abstraction** via interfaces (ports) + concrete adapters.
- **Environment parity**: same architecture in local/integration/prod with config differences only.
- **Security by default**: least privilege keys, Row-Level Security (RLS), strict validation.
- **Observability-first**: structured logs + metrics + trace/correlation IDs.

---

## 3) Backend Technology and Structure

## 3.1 Recommended Stack

- Runtime: **Node.js LTS**
- Language: **TypeScript**
- Framework: **Fastify** (or Express if team preference; Fastify recommended for type safety/perf)
- Validation: **Zod** (request/response schemas)
- Testing: **Vitest/Jest** + **Supertest**
- Linting/formatting: **ESLint + Prettier**
- Package manager: npm/pnpm (team preference)

## 3.2 Backend Folder Design (Example)

```text
backend/
  src/
    api/
      routes/
      controllers/
      middlewares/
    application/
      use-cases/
      dto/
    domain/
      entities/
      services/
      repositories/   # interfaces/ports only
      auth/           # auth provider interfaces
    infrastructure/
      db/
        supabase/
          SupabaseDatabaseAdapter.ts
      auth/
        supabase/
          SupabaseAuthAdapter.ts
      config/
      logger/
    shared/
      errors/
      types/
  tests/
    unit/
    integration/
  package.json
  tsconfig.json
```

---

## 4) Service Abstraction Strategy (Critical Requirement)

To make backend services replaceable:

## 4.1 Define Provider-Agnostic Interfaces (Ports)

Examples:

- `AuthService` interface
  - `signUp`, `signIn`, `verifyToken`, `getUser`, `signOut`, `refreshSession`
- `UserRepository` interface
- `WorldRepository` / `GameStateRepository` interfaces
- `TransactionManager` interface (if needed)

## 4.2 Implement Adapters

- `SupabaseAuthAdapter implements AuthService`
- `SupabaseWorldRepository implements WorldRepository`
- `SupabaseUserRepository implements UserRepository`

Future replacements (Auth0, Cognito, Firebase, Prisma+Postgres, etc.) only require new adapter implementations.

## 4.3 Dependency Injection

- Use a lightweight DI/container composition root (manual DI is enough initially).
- Wire dependencies at startup based on environment/config.
- Keep domain/application layers unaware of Supabase SDK details.

## 4.4 Anti-Coupling Rules

- No Supabase types in domain models.
- No direct SDK calls in controllers/use cases.
- Infra-layer mapping only (DTO ↔ domain).

---

## 5) Supabase Design Plan

## 5.1 Data Modeling

Create core tables (example, adjust to app domain):

- `users` (if needed beyond auth metadata)
- `worlds`
- `patterns`
- `saved_games`
- `user_preferences`

Include:

- UUID primary keys
- `created_at`, `updated_at`
- ownership fields (`user_id`)
- indices for query paths

## 5.2 Auth Strategy

- Use Supabase Auth for sign-up/sign-in/session flows.
- Backend validates bearer tokens (JWT) and extracts user claims.
- Enforce role/ownership in app + database RLS.

## 5.3 Row-Level Security (RLS)

- Enable RLS on all user-scoped tables.
- Policies:
  - users can read/write only own resources.
  - admin/service role access restricted to backend-only operations.

## 5.4 Migrations and Seed Data

- Use migration tool (Supabase CLI SQL migrations).
- Version schema changes in repo.
- Add deterministic seeds for local/integration environments.

## 5.5 Key Management

- Frontend gets only public anon key.
- Backend uses service role key only in server environment.
- Rotate secrets via deployment platform secret manager.

---

## 6) Environment Strategy (local / integration / production)

## 6.1 Environment Matrix

Define explicit envs:

- **local**: developer machine + local Supabase stack (or shared dev project)
- **integration**: shared testing/staging environment for QA and API integration tests
- **production**: live customer environment

## 6.2 Config Files and Variables

- Frontend:
  - `.env.local`, `.env.integration`, `.env.production`
  - `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend:
  - `.env.local`, `.env.integration`, `.env.production`
  - `NODE_ENV`, `APP_ENV`, `PORT`, `CORS_ORIGINS`
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (if needed), `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_AUDIENCE`, `JWT_ISSUER` (if explicit verification config)

## 6.3 Environment Isolation Rules

- Separate Supabase projects per integration/prod (local can be local stack).
- Never share production keys with non-production envs.
- CI enforces required env vars per deployment target.

## 6.4 Runtime Config Validation

- Validate env vars on startup (e.g., Zod schema).
- Fail fast if config is invalid/missing.

---

## 7) API Plan

## 7.1 Initial API Surface (Proposed)

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `GET /worlds`
- `POST /worlds`
- `GET /worlds/:id`
- `PUT /worlds/:id`
- `DELETE /worlds/:id`
- `GET /patterns`
- `POST /patterns`

## 7.2 API Standards

- OpenAPI spec generation (source-of-truth).
- Consistent error format (`code`, `message`, `details`, `requestId`).
- Input/output schemas with runtime validation.
- Pagination/filter conventions.

## 7.3 AuthN/AuthZ Flow

- Frontend authenticates via backend or Supabase client flow (choose one and standardize).
- Backend protects private routes with JWT verification middleware.
- Authorization logic in use cases + RLS defense in depth.

---

## 8) Frontend Changes Required

- Add API client abstraction layer (`AuthApi`, `WorldsApi`, etc.).
- Centralized auth/session handling and route guards.
- Persist session safely and refresh tokens as needed.
- Replace direct local-only persistence with backend-backed persistence.
- Add environment-aware config loading and typed env validation.

---

## 8.1 Frontend State-Change Inventory (Current Code) and Backend Ownership

The frontend now persists core simulation state through Zustand + `localStorage` and mutates it through the actions below. In the full-stack target, all **durable/domain state** must be server-owned and synced through backend APIs.

| Frontend state/action today | Current behavior | Move to backend? | Backend contract to add |
|---|---|---|---|
| `createWorld({name,width,height})` | Creates world object + empty grid + timestamps + generation | Yes | `POST /worlds` |
| `updateGrid(worldId, grid)` | Replaces whole grid when user toggles/paints cells | Yes | `PATCH /worlds/:id/grid` (or cell-diff endpoint) |
| `stepWorld(worldId)` | Computes next generation client-side and increments generation | Yes (authoritative) | `POST /worlds/:id/step` |
| `randomizeWorld(worldId)` | Generates randomized board client-side | Yes | `POST /worlds/:id/randomize` |
| `clearWorld(worldId)` | Resets board and generation | Yes | `POST /worlds/:id/clear` |
| `insertPatternIntoWorld(worldId, patternId, x, y)` | Applies built-in/custom pattern to grid | Yes | `POST /worlds/:id/pattern-applications` |
| `addCustomPattern(pattern)` | Saves user-defined pattern in persisted store | Yes | `POST /patterns` |
| `deleteCustomPattern(patternId)` | Removes saved custom pattern | Yes | `DELETE /patterns/:id` |
| `speed` + `setSpeed()` | Persists simulation speed preference | Yes (as user pref) | `PUT /me/preferences` |
| `currentWorldId` + `selectWorld()` | Persists last selected world | Yes (as user pref) | `PUT /me/preferences` |
| `isRunning` + `setRunning()` | Runtime play/pause UI state | No (client session state) | N/A |
| Pattern modal draft (`pendingPatternSelection`, name/description input) | Unsaved draft in modal | No (until saved) | N/A |
| Canvas pan/zoom/hover/selection transient state | Pure interaction/UI state | No | N/A |

### 8.2 Missing Backend Flows Required by New Frontend Behavior

Because the app evolved after the first draft, the backend plan must explicitly cover these behaviors:

1. **High-frequency grid editing** (drag paint + toggle) without replacing full grid each pointer event.
   - Add a **cell-diff/batch patch** API (e.g., `PATCH /worlds/:id/cells`) and debounce/merge strategy on frontend.
2. **Simulation authority choice**.
   - Choose one model and document it: server-authoritative stepping vs. client speculative stepping with server reconciliation.
3. **Pattern capture-and-save flow**.
   - Support creating custom pattern from selected cells with metadata (`name`, `description`, `width`, `height`, `cells`).
4. **World registry freshness**.
   - Ensure `updatedAt` and `generation` are returned by list API so Worlds screen remains accurate.
5. **Preferences sync**.
   - Persist per-user `speed` and `last_opened_world_id` in backend profile/preferences table.
6. **Ownership and sharing model**.
   - At minimum, private-by-default ownership rules for worlds/patterns; sharing can be phase 2.

### 8.3 API Additions to Cover All Durable Frontend Mutations

Add/confirm endpoints so every durable frontend state change has a backend equivalent:

- `POST /worlds`
- `GET /worlds`
- `GET /worlds/:id`
- `PATCH /worlds/:id` (name/metadata)
- `PATCH /worlds/:id/grid` **or** `PATCH /worlds/:id/cells` (recommended for paint performance)
- `POST /worlds/:id/step`
- `POST /worlds/:id/randomize`
- `POST /worlds/:id/clear`
- `POST /worlds/:id/pattern-applications`
- `GET /patterns?scope=mine|builtin`
- `POST /patterns`
- `DELETE /patterns/:id`
- `GET /me/preferences`
- `PUT /me/preferences`

### 8.4 Data Model Updates Needed for Current Feature Set

In addition to existing proposed tables, include:

- `user_preferences`:
  - `user_id (pk/fk)`
  - `simulation_speed` (int)
  - `last_opened_world_id` (nullable fk)
  - `updated_at`
- `patterns` scope/ownership fields:
  - `owner_user_id` (nullable for built-ins)
  - `is_builtin` (boolean)
- `worlds` integrity fields:
  - `generation`
  - `updated_at` (server-managed)
  - optional `version` column for optimistic concurrency on rapid edits

### 8.5 Frontend Migration Rules (So Nothing Is Missed)

1. Replace Zustand persistence (`localStorage`) for `worlds`, `customPatterns`, `speed`, and `currentWorldId` with backend-backed caches.
2. Keep only ephemeral UI state in React/Zustand (`isRunning`, picker/modals, canvas pan/zoom/selection).
3. Introduce an offline/error strategy:
   - optimistic UI for edits,
   - retry queue for transient failures,
   - reconcile on next successful fetch.
4. Update UI copy that currently says data is stored locally.

### 8.6 Audit Scope (Where These Mutations Were Found)

Use this as a living checklist while implementing backend migration:

- `frontend/src/store/gameStore.ts`: all persistent domain mutations (`createWorld`, `updateGrid`, `stepWorld`, `randomizeWorld`, `clearWorld`, pattern CRUD, preferences).
- `frontend/src/screens/GameScreen.tsx`: UI triggers that call mutation actions (paint/toggle/step/play/randomize/clear/pattern insert/save/delete/speed).
- `frontend/src/screens/WorldsScreen.tsx`: world creation/open flow and current local-persistence messaging.
- `frontend/src/features/game/presets.ts`: custom pattern shape and capture semantics to preserve in backend DTOs.

---

## 9) Quality, Testing, and CI/CD

## 9.1 Testing Strategy

- **Unit tests** for domain + use cases.
- **Integration tests** for adapters/repositories with integration database.
- **API contract tests** for endpoint schemas.
- **E2E tests** (critical user flows: signup/login/save/retrieve).

## 9.2 CI Pipelines

For each PR:

- lint + typecheck
- unit tests
- integration tests (against integration env or ephemeral DB)
- OpenAPI schema diff checks
- migration checks

## 9.3 CD Pipelines

- Deploy backend per environment with gated promotions:
  - local/dev deploy (optional)
  - integration auto-deploy
  - production manual approval
- Frontend deployed with matching environment configuration.

---

## 10) Security and Compliance

- Threat model baseline (token leakage, privilege escalation, injection).
- Input validation at all boundaries.
- Rate limiting + CORS policy + secure headers.
- Secrets managed by vault/platform secret manager (not in git).
- Audit log for auth-sensitive operations.
- Backup and restore strategy for Postgres.

---

## 11) Observability and Operations

- Structured JSON logging with request IDs.
- Metrics: request latency, error rate, auth failures, DB query latency.
- Health endpoints:
  - `GET /health/live`
  - `GET /health/ready`
- Alerting for elevated error rates and auth anomalies.

---

## 12) Migration and Rollout Plan

## Phase 0 — Discovery & Design (1 week)

- Confirm domain model and API contracts.
- Finalize abstractions/interfaces.
- Define environment conventions and secret management.

## Phase 1 — Backend Foundation (1–2 weeks)

- Bootstrap Node+TS backend.
- Add lint/typecheck/tests and base CI.
- Implement config validation, logging, health checks.

## Phase 2 — Supabase Integration (1–2 weeks)

- Create schema + migrations + seeds.
- Implement Supabase adapters for auth/repositories.
- Configure RLS policies and validate them.

## Phase 3 — Frontend Integration (1–2 weeks)

- Implement API client layer and auth flows.
- Wire frontend to backend endpoints.
- Migrate persistence flows to server-backed data.

## Phase 4 — Hardening & Release (1 week)

- Add integration/E2E tests.
- Performance checks + security checks.
- Deploy integration then production with runbooks.

---

## 13) Deliverables Checklist

- [ ] Backend Node.js + TypeScript service scaffolded
- [ ] Port-and-adapter abstractions for auth + DB complete
- [ ] Supabase schema, migrations, seeds, and RLS policies
- [ ] Auth flows working end-to-end
- [ ] Frontend integrated with backend APIs
- [ ] local/integration/production envs configured for frontend + backend
- [ ] CI/CD pipelines with quality gates
- [ ] Observability dashboards and alerts
- [ ] Security baseline implemented
- [ ] Documentation + runbooks

---

## 14) Risks and Mitigations

- **Risk: tight coupling to Supabase SDK**
  - Mitigation: strict adapter boundaries + interface contracts.
- **Risk: RLS misconfiguration**
  - Mitigation: policy tests + security review checklist.
- **Risk: environment drift**
  - Mitigation: env templates + startup validation + deployment checks.
- **Risk: auth complexity across frontend/backend**
  - Mitigation: choose one canonical token/session flow and document it.

---

## 15) What You Asked For vs. What Was Missing

### Included from your request

- Node.js + TypeScript backend
- Supabase database and auth
- Abstract backend services for replaceability
- local/integration/production environments for frontend and backend

### Important items that were missing (now added in this plan)

1. **Architecture pattern choice** (ports/adapters, layered boundaries).
2. **RLS policy and security model** (critical when using Supabase).
3. **Migration/versioning strategy** for schema changes.
4. **Testing strategy** (unit/integration/contract/E2E).
5. **CI/CD promotion model** across environments.
6. **Observability** (logs/metrics/alerts/health checks).
7. **Secrets and key-rotation management**.
8. **Rollout and rollback strategy** with phased delivery.
9. **API standards/governance** (OpenAPI, error contract, pagination).
10. **Risk register and mitigations**.

---

## 16) Recommended Immediate Next Steps

1. Approve architecture decisions (Fastify vs Express, auth flow ownership, deployment targets).
2. Create backend scaffold and baseline CI in a new `backend/` directory.
3. Define first schema/migrations for `worlds`, `patterns`, and ownership model.
4. Implement `AuthService` + `WorldRepository` interfaces and Supabase adapters.
5. Connect frontend to `GET /worlds` + auth flow as first vertical slice.
