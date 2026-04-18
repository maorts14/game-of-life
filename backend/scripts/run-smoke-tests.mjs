import assert from "node:assert/strict";
import { createApp } from "../dist/api/createApp.js";
import { createRequireAuth } from "../dist/api/middlewares/requireAuth.js";
import { SessionCookieManager } from "../dist/infrastructure/auth/SessionCookieManager.js";
import { loadEnv } from "../dist/infrastructure/config/env.js";
import {
  applyCellDiff,
  computeNextGeneration,
  createCellDiffFromGrids,
} from "../../packages/shared-game/dist/index.js";

const env = loadEnv({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  COOKIE_SECRET: "1234567890abcdef",
  SESSION_ENCRYPTION_KEY: "abcdef1234567890",
  CORS_ORIGINS: "http://localhost:5173, https://app.example.com",
  NODE_ENV: "test",
  APP_ENV: "local",
});

assert.deepEqual(env.corsOrigins, ["http://localhost:5173", "https://app.example.com"]);

const initialGrid = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 0],
];
const steppedGrid = computeNextGeneration(initialGrid.map((row) => [...row]));
assert.deepEqual(steppedGrid, [
  [0, 0, 0],
  [1, 1, 1],
  [0, 0, 0],
]);

const previousGrid = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
];
const nextGrid = [
  [1, 0, 0],
  [0, 0, 0],
  [0, 0, 1],
];
assert.deepEqual(applyCellDiff(previousGrid, createCellDiffFromGrids(previousGrid, nextGrid)), nextGrid);

const authSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: null,
  user: {
    id: "user-1",
    email: "pilot@example.com",
  },
};

const sessionCookieManager = new SessionCookieManager(env.SESSION_ENCRYPTION_KEY);
const authService = {
  async signUp() {
    return {
      user: authSession.user,
      session: authSession,
      requiresEmailConfirmation: false,
    };
  },
  async signIn() {
    return authSession;
  },
  async getUser(accessToken) {
    return accessToken === authSession.accessToken ? authSession.user : null;
  },
  async refreshSession() {
    return authSession;
  },
  async signOut() {},
};

const noopWorldRepository = {
  async listWorlds() {
    return [];
  },
  async createWorld() {
    throw new Error("not used");
  },
  async getWorld() {
    return null;
  },
  async updateWorldMetadata() {
    throw new Error("not used");
  },
  async deleteWorld() {},
  async patchWorldCells() {
    throw new Error("not used");
  },
  async replaceWorldState() {
    throw new Error("not used");
  },
};
const noopPatternRepository = {
  async listPatterns() {
    return [];
  },
  async createPattern() {
    throw new Error("not used");
  },
  async deletePattern() {},
};
const noopPreferencesRepository = {
  async getPreferences() {
    return {
      simulationSpeed: 8,
      lastOpenedWorldId: null,
      updatedAt: new Date().toISOString(),
    };
  },
  async savePreferences() {
    return {
      simulationSpeed: 8,
      lastOpenedWorldId: null,
      updatedAt: new Date().toISOString(),
    };
  },
};

const app = await createApp({
  env,
  authService,
  worldRepository: noopWorldRepository,
  patternRepository: noopPatternRepository,
  preferencesRepository: noopPreferencesRepository,
  sessionCookieManager,
  requireAuth: createRequireAuth(authService, sessionCookieManager, env),
});

try {
  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email: "pilot@example.com",
      password: "supersecret",
    },
  });
  assert.equal(loginResponse.statusCode, 200);
  assert.equal(loginResponse.cookies.some((cookie) => cookie.name === "gol_session"), true);
  assert.equal(loginResponse.cookies.some((cookie) => cookie.name === "gol_csrf"), true);

  const unauthorizedResponse = await app.inject({
    method: "GET",
    url: "/api/me",
  });
  assert.equal(unauthorizedResponse.statusCode, 401);

  const cookieHeader = loginResponse.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const meResponse = await app.inject({
    method: "GET",
    url: "/api/me",
    headers: {
      cookie: cookieHeader,
    },
  });
  assert.equal(meResponse.statusCode, 200);
  assert.deepEqual(meResponse.json().user, authSession.user);

  console.log("Smoke tests passed.");
} finally {
  await app.close();
}
