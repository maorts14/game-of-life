export function logInfo(message: string, details?: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      level: "info",
      message,
      ...details,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logError(message: string, details?: Record<string, unknown>) {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      ...details,
      timestamp: new Date().toISOString(),
    }),
  );
}
