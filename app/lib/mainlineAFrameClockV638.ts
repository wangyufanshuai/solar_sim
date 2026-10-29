export type MainlineAFrameClockV638 = {
  source: "document-timeline";
  sessionStartMs: number;
  callbackCount: number;
  acceptedCount: number;
  firstCallbackMs: number | null;
  firstAcceptedMs: number | null;
  lastAcceptedMs: number | null;
  skippedBeforeStartCount: number;
  rejectedCount: number;
  rejections: {
    timestampMs: number | null;
    receivedMs: number | null;
    previousAcceptedMs: number | null;
    reason: "non-finite" | "negative" | "before-start" | "non-increasing" | "receipt-clock-invalid" | "future";
  }[];
};

const MAX_REJECTIONS = 8;

export function createMainlineAFrameClockV638(sessionStartMs: number) {
  if (!Number.isFinite(sessionStartMs) || sessionStartMs < 0) throw new Error("frame-clock:invalid-session-start");
  const state: MainlineAFrameClockV638 = {
    source: "document-timeline", sessionStartMs, callbackCount: 0, acceptedCount: 0,
    firstCallbackMs: null, firstAcceptedMs: null, lastAcceptedMs: null,
    skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [],
  };
  return {
    accept(timestampMs: number, receivedMs: number): "accepted" | "before-window" | "rejected" {
      const first = state.callbackCount++ === 0;
      if (first) state.firstCallbackMs = Number.isFinite(timestampMs) ? timestampMs : null;
      let reason: MainlineAFrameClockV638["rejections"][number]["reason"] | null = null;
      if (!Number.isFinite(timestampMs)) reason = "non-finite";
      else if (timestampMs < 0) reason = "negative";
      else if (!Number.isFinite(receivedMs) || receivedMs < sessionStartMs) reason = "receipt-clock-invalid";
      else if (timestampMs > receivedMs) reason = "future";
      // A callback shares its frame's timestamp, which can precede the start action.
      // Exclude that first partial frame; never invent an interval across the boundary.
      else if (first && timestampMs < sessionStartMs) {
        state.skippedBeforeStartCount = 1;
        return "before-window";
      } else if (timestampMs < sessionStartMs) reason = "before-start";
      else if (state.lastAcceptedMs !== null && timestampMs <= state.lastAcceptedMs) reason = "non-increasing";
      if (reason) {
        state.rejectedCount += 1;
        if (state.rejections.length < MAX_REJECTIONS) state.rejections.push({
          timestampMs: Number.isFinite(timestampMs) ? timestampMs : null,
          receivedMs: Number.isFinite(receivedMs) ? receivedMs : null,
          previousAcceptedMs: state.lastAcceptedMs, reason,
        });
        return "rejected";
      }
      state.firstAcceptedMs ??= timestampMs;
      state.lastAcceptedMs = timestampMs;
      state.acceptedCount += 1;
      return "accepted";
    },
    snapshot: (): MainlineAFrameClockV638 => structuredClone(state),
  };
}

export function validateMainlineAFrameClockV638(value: unknown, summary: unknown, durationMs: unknown): string[] {
  const issues: string[] = [];
  const row = value as Partial<MainlineAFrameClockV638> | null;
  const frames = summary as { sampleCount?: unknown; totalMs?: unknown } | null;
  const finite = (number: unknown): number is number => typeof number === "number" && Number.isFinite(number) && number >= 0;
  const integer = (number: unknown): number is number => finite(number) && Number.isSafeInteger(number);
  if (!row || typeof row !== "object" || Array.isArray(row) || row.source !== "document-timeline"
    || !finite(row.sessionStartMs) || !integer(row.callbackCount) || !integer(row.acceptedCount)
    || !integer(row.skippedBeforeStartCount) || row.skippedBeforeStartCount > 1
    || !integer(row.rejectedCount) || !Array.isArray(row.rejections)
    || row.rejections.length !== Math.min(MAX_REJECTIONS, row.rejectedCount)) return ["frame-clock:shape"];
  if (row.callbackCount !== row.acceptedCount + row.skippedBeforeStartCount + row.rejectedCount) issues.push("frame-clock:callback-accounting");
  if (!finite(durationMs)) issues.push("frame-clock:session-window");
  if (row.rejectedCount > 0) issues.push("frame-clock:rejected-callbacks");
  if (row.callbackCount === 0 ? row.firstCallbackMs !== null : row.rejectedCount === 0 && !finite(row.firstCallbackMs)) issues.push("frame-clock:first-callback");
  if (row.skippedBeforeStartCount && (!finite(row.firstCallbackMs) || row.firstCallbackMs >= row.sessionStartMs)) issues.push("frame-clock:skipped-window");
  if (row.acceptedCount === 0) {
    if (row.firstAcceptedMs !== null || row.lastAcceptedMs !== null) issues.push("frame-clock:empty-anchors");
  } else if (!finite(row.firstAcceptedMs) || !finite(row.lastAcceptedMs)
    || row.firstAcceptedMs < row.sessionStartMs || row.lastAcceptedMs < row.firstAcceptedMs
    || (row.acceptedCount === 1 && row.lastAcceptedMs !== row.firstAcceptedMs)
    || (row.acceptedCount > 1 && row.lastAcceptedMs === row.firstAcceptedMs)) issues.push("frame-clock:anchors");
  // Compare endpoints, not just their difference: translating a whole callback
  // stream must not preserve validity after it leaves the observed session.
  if (finite(durationMs) && finite(row.lastAcceptedMs)
    && row.lastAcceptedMs - row.sessionStartMs > durationMs + 250) issues.push("frame-clock:outside-session");
  if (row.acceptedCount > 0 && row.rejectedCount === 0 && row.skippedBeforeStartCount === 0
    && row.firstCallbackMs !== row.firstAcceptedMs) issues.push("frame-clock:first-accepted");
  if (!frames || !integer(frames.sampleCount) || frames.sampleCount !== Math.max(0, row.acceptedCount - 1)) issues.push("frame-clock:sample-accounting");
  if (row.acceptedCount > 0 && finite(row.firstAcceptedMs) && finite(row.lastAcceptedMs)
    && (!finite(frames?.totalMs) || Math.abs(frames.totalMs - (row.lastAcceptedMs - row.firstAcceptedMs)) > 0.001)) issues.push("frame-clock:interval-accounting");
  if (row.acceptedCount === 0 && frames?.totalMs !== 0) issues.push("frame-clock:empty-interval");
  return issues;
}
