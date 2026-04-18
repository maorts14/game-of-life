import { getFrontendEnv } from "../../config/env";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

function buildApiUrl(path: string): string {
  const basePath = getFrontendEnv().apiBaseUrl;
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, headers, method = "GET", ...init } = options;
  const nextHeaders = new Headers(headers);

  if (json !== undefined && !nextHeaders.has("content-type")) {
    nextHeaders.set("content-type", "application/json");
  }

  if (MUTATING_METHODS.has(method.toUpperCase())) {
    const csrfToken = readCookie("gol_csrf");

    if (csrfToken) {
      nextHeaders.set("x-csrf-token", csrfToken);
    }
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    method,
    headers: nextHeaders,
    credentials: "include",
    body: json === undefined ? null : JSON.stringify(json),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorPayload =
      payload && typeof payload === "object"
        ? (payload as {
            code?: string;
            message?: string;
            details?: unknown;
            requestId?: string | null;
          })
        : null;

    throw new ApiError(
      response.status,
      errorPayload?.code ?? "API_ERROR",
      errorPayload?.message ?? response.statusText,
      errorPayload?.details,
      errorPayload?.requestId ?? null,
    );
  }

  return payload as T;
}
