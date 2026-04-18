interface FrontendEnv {
  apiBaseUrl: string;
}

let cachedEnv: FrontendEnv | null = null;

function normalizeApiBaseUrl(rawValue: string | undefined): string {
  const value = rawValue?.trim() ?? "";

  if (value === "") {
    return "";
  }

  if (value.startsWith("/")) {
    return value.replace(/\/+$/, "");
  }

  try {
    const parsed = new URL(value);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("VITE_API_BASE_URL must use http or https.");
    }

    return parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "VITE_API_BASE_URL must be a valid URL or path.",
    );
  }
}

export function getFrontendEnv(): FrontendEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = {
    apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  };

  return cachedEnv;
}
