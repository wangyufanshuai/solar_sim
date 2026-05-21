/** NDJSON debug line to workspace `debug-a243dd.log` via Next route (session a243dd). */
export function debugSessionLog(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "a243dd",
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
}
