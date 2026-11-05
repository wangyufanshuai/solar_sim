import { describe, expect, it } from "vitest";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  copyMainlineAResourceSnapshotV633,
  evaluateMainlineAResourceObservationV633,
  recomputeMainlineAResourceDigestV633,
  validateMainlineAResourceSnapshotV633,
  type MainlineAResourceObservationV633,
} from "./mainlineAResourceObservationV633";

function observation(): MainlineAResourceObservationV633 {
  const baseline = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const release = acquireAtlasResource("texture", "atlas", "v633-test-texture", { owner: "v633-test", estimatedBytes: 4096 });
  const active = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  release();
  const returned = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  return {
    schema: "mainline-a-resource-observation-v633", runId: "fixture-unit-test-no-browser-claim",
    build: { buildId: "fixture-static", branch: "codex/test", head: "a".repeat(40) },
    viewport: { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" },
    startedAt: "2026-09-27T00:00:00.000Z", endedAt: "2026-09-27T00:00:01.000Z",
    checkpoints: [
      { phase: "baseline", capturedAt: "2026-09-27T00:00:00.000Z", elapsedMs: 0, scene: "milky-way", snapshot: baseline },
      { phase: "active", capturedAt: "2026-09-27T00:00:00.500Z", elapsedMs: 500, scene: "solar", snapshot: active },
      { phase: "returned", capturedAt: "2026-09-27T00:00:01.000Z", elapsedMs: 1000, scene: "milky-way", snapshot: returned },
    ],
    frameSummary: { sampleCount: 60, totalMs: 1000, minMs: 10, p50Ms: 16, p95Ms: 20, maxMs: 30 },
    memory: { source: "unavailable", beforeBytes: null, afterBytes: null },
    visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
    session: { state: "finished", requestedDurationMs: 1000, durationSatisfied: true, issues: [], physicalMobile: "not-run", frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples",
      frameClock: { source: "document-timeline", sessionStartMs: 0, callbackCount: 61, acceptedCount: 61,
        firstCallbackMs: 0, firstAcceptedMs: 0, lastAcceptedMs: 1000, skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [] } },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
  };
}

describe("V633 full registry observation contract", () => {
  it.each(["fixed-histogram-upper-bound", "exact-samples"] as const)("keeps legacy records readable but blocks missing clock diagnostics under %s", (method) => {
    const raw = observation();
    raw.session.frameSummaryMethod = method;
    raw.session.histogramBinWidthMs = 0.25;
    delete raw.session.frameClock;
    const bytes = JSON.stringify(raw);
    const parsed: unknown = JSON.parse(bytes);
    expect(evaluateMainlineAResourceObservationV633(parsed)).toMatchObject({ status: "blocked", issues: ["frame-clock:legacy-unverified"] });
    expect(JSON.stringify(parsed)).toBe(bytes);
  });

  it.each([undefined, null, {}, false, "legacy"])("blocks absent or malformed diagnostics %s without a method downgrade", (frameClock) => {
    const raw = observation();
    const altered = { ...raw, session: { ...raw.session, frameClock } };
    expect(evaluateMainlineAResourceObservationV633(altered)).toMatchObject({
      status: "blocked", issues: [frameClock === undefined ? "frame-clock:legacy-unverified" : "frame-clock:shape"],
    });
  });

  it.each([-60_000, 60_000])("blocks a whole stream shifted by %sms while counts and interval totals remain unchanged", (offset) => {
    const raw = observation();
    const clock = raw.session.frameClock!;
    clock.firstCallbackMs! += offset;
    clock.firstAcceptedMs! += offset;
    clock.lastAcceptedMs! += offset;
    const evaluated = evaluateMainlineAResourceObservationV633(raw);
    expect(evaluated.status).toBe("blocked");
    expect(evaluated.issues).toContain(offset > 0 ? "frame-clock:outside-session" : "frame-clock:anchors");
  });

  it("recomputes real registry digest and copies nested identities independently", () => {
    const run = observation();
    const snapshot = run.checkpoints[1].snapshot;
    expect(validateMainlineAResourceSnapshotV633(snapshot)).toEqual({ valid: true, issues: [] });
    expect(recomputeMainlineAResourceDigestV633(snapshot.byIdentity)).toBe(snapshot.identityDigest);
    const copy = copyMainlineAResourceSnapshotV633(snapshot);
    const identity = Object.keys(copy.byIdentity)[0];
    copy.byIdentity[identity].estimatedBytes += 32;
    expect(copy.byIdentity[identity].estimatedBytes).not.toBe(snapshot.byIdentity[identity].estimatedBytes);
  });

  it("counts a real acquire and release in the registry without promoting a scientific or physical-memory claim", () => {
    const result = evaluateMainlineAResourceObservationV633(observation());
    expect(result).toMatchObject({ status: "measured-local", acquiredCount: 1, releasedCount: 1, retainedCount: 0, baselineRestored: true, resourceBehavior: "acquire-release", resourceReleaseObserved: true });
    expect(result.physicalGpuMemoryClaim).toBe(false);
    expect(result.scientificPayloadWriteback).toBe(false);
  });

  it.each(["total", "estimatedBytes", "estimatedGpuBytes", "textures"] as const)("rejects forged top-level %s", (field) => {
    const run = observation();
    run.checkpoints[1].snapshot[field] += 1;
    expect(evaluateMainlineAResourceObservationV633(run).status).toBe("blocked");
  });

  it.each(["byOwner", "byKind"] as const)("recomputes %s rather than trusting it", (field) => {
    const run = observation();
    const map = run.checkpoints[1].snapshot[field];
    Object.values(map)[0].count += 1;
    expect(evaluateMainlineAResourceObservationV633(run).issues.join("|")).toContain("aggregate");
  });

  it("rejects a forged identity key even if a new FNV digest is supplied", () => {
    const run = observation();
    const snapshot = run.checkpoints[1].snapshot;
    snapshot.byIdentity = { fake: Object.values(snapshot.byIdentity)[0] };
    snapshot.identityDigest = recomputeMainlineAResourceDigestV633(snapshot.byIdentity);
    expect(evaluateMainlineAResourceObservationV633(run).issues.join("|")).toContain("identity-key");
  });

  it("rejects stale identity digest and invalid provenance hash", () => {
    const run = observation();
    const snapshot = run.checkpoints[1].snapshot;
    snapshot.identityDigest = "00000000";
    Object.values(snapshot.byIdentity)[0].contentSha256 = "fixture-sha";
    expect(validateMainlineAResourceSnapshotV633(snapshot).valid).toBe(false);
    expect(() => copyMainlineAResourceSnapshotV633(snapshot)).toThrow();
  });

  it("rejects empty unchanged registries even with manufactured advancing revisions", () => {
    const run = observation();
    run.checkpoints[1].snapshot = structuredClone(run.checkpoints[0].snapshot);
    run.checkpoints[1].snapshot.revision += 1;
    const result = evaluateMainlineAResourceObservationV633(run);
    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("lifecycle:no-observed-acquisition");
    expect(result.issues).toContain("lifecycle:no-observed-release");
  });

  it("does not call retained active resources released", () => {
    const run = observation();
    run.checkpoints[2].snapshot = structuredClone(run.checkpoints[1].snapshot);
    run.checkpoints[2].snapshot.revision += 1;
    const result = evaluateMainlineAResourceObservationV633(run);
    expect(result.retainedCount).toBe(1);
    expect(result.releasedCount).toBe(0);
    expect(result.baselineRestored).toBe(false);
    expect(result.status).toBe("blocked");
  });

  it("requires a scene roundtrip and ordered full checkpoints", () => {
    const run = observation();
    run.checkpoints[1].scene = run.checkpoints[0].scene;
    run.checkpoints[2].elapsedMs = 5;
    expect(evaluateMainlineAResourceObservationV633(run).issues).toContain("lifecycle:scene-roundtrip-required");
    expect(evaluateMainlineAResourceObservationV633(run).issues).toContain("checkpoint:2:time");
    run.checkpoints.pop();
    expect(evaluateMainlineAResourceObservationV633(run).issues).toContain("checkpoints:three-required");
  });

  it.each([null, {}, { byIdentity: [] }, { byIdentity: null }])("handles malformed snapshots fail-closed", (snapshot) => {
    expect(validateMainlineAResourceSnapshotV633(snapshot).valid).toBe(false);
  });

  it("rejects unsafe count overflow", () => {
    const snapshot = observation().checkpoints[1].snapshot;
    Object.values(snapshot.byIdentity)[0].count = Number.MAX_SAFE_INTEGER + 1;
    expect(validateMainlineAResourceSnapshotV633(snapshot).issues).toContain("snapshot:identity-fields");
  });

  it.each(["minMs", "p50Ms", "p95Ms", "maxMs", "sampleCount", "totalMs"] as const)("blocks a missing frame %s", (field) => {
    const run = observation();
    run.frameSummary[field] = NaN;
    expect(evaluateMainlineAResourceObservationV633(run).status).toBe("blocked");
  });

  it("rejects fabricated frame totals, reversed quantiles and inadequate coverage", () => {
    const run = observation();
    run.frameSummary.p50Ms = 99;
    run.frameSummary.totalMs = 10;
    const issues = evaluateMainlineAResourceObservationV633(run).issues;
    expect(issues).toContain("frames:quantile-order");
    expect(issues).toContain("frames:total-inconsistent");
    expect(issues).toContain("frames:duration-coverage");
  });

  it.each([undefined, null, "renderer", "requestVideoFrameCallback", "raf", true])("rejects missing or forged frame source %s", (source) => {
    const run = observation();
    const altered = { ...run, session: { ...run.session, frameSummarySource: source } };
    const result = evaluateMainlineAResourceObservationV633(altered);
    expect(result.status).toBe("blocked");
    expect(result.issues).toEqual(["session:frame-summary-source"]);
  });

  it("does not infer the sample source from a valid histogram method", () => {
    const run = observation();
    run.session.frameSummaryMethod = "fixed-histogram-upper-bound";
    run.session.histogramBinWidthMs = 0.25;
    const session = { ...run.session } as Partial<MainlineAResourceObservationV633["session"]>;
    delete session.frameSummarySource;
    const result = evaluateMainlineAResourceObservationV633({ ...run, session });
    expect(result.status).toBe("blocked");
    expect(result.issues).toEqual(["session:frame-summary-source"]);
  });

  it("blocks background interruptions, manufactured unavailable heap, and public promotion", () => {
    const run = observation();
    run.visibility.interruptions = 1;
    run.memory.beforeBytes = 0;
    const malicious = { ...run, boundary: { ...run.boundary, scientificPayloadWriteback: true } };
    const issues = evaluateMainlineAResourceObservationV633(malicious).issues;
    expect(issues).toContain("visibility:interrupted-or-unobserved");
    expect(issues).toContain("memory:unavailable-must-be-null");
    expect(issues).toContain("boundary:closed-required");
  });

  it("rejects aborted sessions and short runs even when checkpoints look complete", () => {
    const run = observation();
    run.session.state = "aborted";
    expect(evaluateMainlineAResourceObservationV633(run).issues).toContain("session:incomplete-or-interrupted");
    run.session.state = "finished";
    run.session.requestedDurationMs = 1_800_000;
    expect(evaluateMainlineAResourceObservationV633(run).status).toBe("blocked");
  });

  it("keeps missing optional hardware observations unavailable", () => {
    const run = observation();
    expect(run.session.physicalMobile).toBe("not-run");
    expect(run.memory.source).toBe("unavailable");
    expect(evaluateMainlineAResourceObservationV633(run).status).toBe("measured-local");
  });

  it("accepts session histogram bounds with baseline elapsed zero", () => {
    const run = observation();
    run.session.frameSummaryMethod = "fixed-histogram-upper-bound";
    run.session.histogramBinWidthMs = 0.25;
    run.session.timeline = [{ elapsedMs: 0, event: "baseline", scene: "milky-way" }, { elapsedMs: 1000, event: "finished", scene: "milky-way" }];
    expect(evaluateMainlineAResourceObservationV633(run).issues).toEqual([]);
    run.session.timeline[1].elapsedMs = -1;
    expect(evaluateMainlineAResourceObservationV633(run).issues).toContain("session:timeline-event");
  });

  it("rejects unverified physical-device labels and extraneous admission claims", () => {
    const run = observation();
    run.viewport.device = "physical-mobile";
    const result = evaluateMainlineAResourceObservationV633({ ...run, admitted: true });
    expect(result.issues).toContain("viewport:physical-device-attestation-not-supported");
    expect(result.issues).toContain("observation:keys");
    expect(result.status).toBe("blocked");
  });
  it.each([null, [], true, "observation", 0, { toString: null, valueOf: null }])("blocks unknown raw JSON values without throwing: %j", (value) => {
    expect(() => evaluateMainlineAResourceObservationV633(value)).not.toThrow();
    expect(evaluateMainlineAResourceObservationV633(value).status).toBe("blocked");
  });
  it.each([
    ["viewport", "device"], ["memory", "source"], ["session", "physicalMobile"], ["session", "frameSummaryMethod"],
  ])("does not coerce hostile JSON in %s.%s", (parent, field) => {
    const run = observation() as unknown as Record<string, Record<string, unknown>>;
    run[parent][field] = { toString: null, valueOf: null };
    expect(() => evaluateMainlineAResourceObservationV633(run)).not.toThrow();
    expect(evaluateMainlineAResourceObservationV633(run).status).toBe("blocked");
  });
  it("does not coerce malformed checkpoint or timeline elapsed values", () => {
    const run = observation();
    const malformed = { toString: null, valueOf: null };
    const checkpoint = { ...run.checkpoints[1], elapsedMs: malformed };
    const altered = { ...run, checkpoints: [run.checkpoints[0], checkpoint, run.checkpoints[2]], session: { ...run.session, timeline: [{ elapsedMs: malformed, event: "active", scene: "atlas" }] } };
    expect(() => evaluateMainlineAResourceObservationV633(altered)).not.toThrow();
    expect(evaluateMainlineAResourceObservationV633(altered).issues).toEqual(expect.arrayContaining(["checkpoint:1:time", "session:timeline-event"]));
  });
});
