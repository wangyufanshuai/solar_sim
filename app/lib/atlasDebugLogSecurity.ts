export type AtlasDebugLogRequestContext = {
  nodeEnv?: string;
  enabled?: string;
  requestUrl: string;
};

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function isAtlasDebugLogRequestAllowed(
  context: AtlasDebugLogRequestContext,
): boolean {
  if (context.nodeEnv !== "development" || context.enabled !== "1") return false;
  try {
    return LOOPBACK_HOSTS.has(new URL(context.requestUrl).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeAtlasDebugLogLine(value: string): string {
  return value.trim().replace(/[\r\n\u2028\u2029]+/g, " ");
}
