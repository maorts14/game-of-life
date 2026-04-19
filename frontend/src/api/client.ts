import type {
  CellBatchPatch,
  CloudPattern,
  CloudWorld,
  PatternDefinition,
  UserPreferences,
  WorldSummary,
} from "../features/game/types";
import { frontendEnv } from "../shared/env";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiRequestOptions extends RequestInit {
  token: string;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  if (!frontendEnv.isApiConfigured) {
    throw new ApiError(500, "Backend API is not configured.");
  }

  const response = await fetch(`${frontendEnv.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? "Request failed.",
      payload?.code,
      payload?.details,
    );
  }

  return payload as T;
}

export const worldApi = {
  list(token: string) {
    return apiRequest<WorldSummary[]>("/worlds", {
      method: "GET",
      token,
    });
  },
  get(token: string, worldId: string) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}`, {
      method: "GET",
      token,
    });
  },
  create(
    token: string,
    input: {
      name: string;
      width: number;
      height: number;
      grid?: CloudWorld["grid"];
      generation?: number;
    },
  ) {
    return apiRequest<CloudWorld>("/worlds", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
  rename(token: string, worldId: string, name: string) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name }),
    });
  },
  delete(token: string, worldId: string) {
    return apiRequest<void>(`/worlds/${worldId}`, {
      method: "DELETE",
      token,
    });
  },
  patchCells(token: string, worldId: string, input: CellBatchPatch) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}/cells`, {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    });
  },
  step(token: string, worldId: string, expectedVersion: number) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}/step`, {
      method: "POST",
      token,
      body: JSON.stringify({ expectedVersion }),
    });
  },
  randomize(token: string, worldId: string, expectedVersion: number) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}/randomize`, {
      method: "POST",
      token,
      body: JSON.stringify({ expectedVersion }),
    });
  },
  clear(token: string, worldId: string, expectedVersion: number) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}/clear`, {
      method: "POST",
      token,
      body: JSON.stringify({ expectedVersion }),
    });
  },
  applyPattern(
    token: string,
    worldId: string,
    input: {
      patternId: string;
      anchorX: number;
      anchorY: number;
      expectedVersion: number;
    },
  ) {
    return apiRequest<CloudWorld>(`/worlds/${worldId}/pattern-applications`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
};

export const patternApi = {
  list(token: string, scope: "builtin" | "mine") {
    const query = new URLSearchParams({ scope });
    return apiRequest<Array<PatternDefinition | CloudPattern>>(`/patterns?${query.toString()}`, {
      method: "GET",
      token,
    });
  },
  create(
    token: string,
    input: {
      name: string;
      description: string;
      width: number;
      height: number;
      cells: Array<[number, number]>;
    },
  ) {
    return apiRequest<CloudPattern>("/patterns", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
  delete(token: string, patternId: string) {
    return apiRequest<void>(`/patterns/${patternId}`, {
      method: "DELETE",
      token,
    });
  },
};

export const preferencesApi = {
  get(token: string) {
    return apiRequest<UserPreferences>("/me/preferences", {
      method: "GET",
      token,
    });
  },
  update(
    token: string,
    input: {
      simulationSpeed?: number;
      lastOpenedCloudWorldId?: string | null;
    },
  ) {
    return apiRequest<UserPreferences>("/me/preferences", {
      method: "PUT",
      token,
      body: JSON.stringify(input),
    });
  },
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}
