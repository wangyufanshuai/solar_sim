import { describe, expect, it } from "vitest";
import {
  BROWSER_EVIDENCE_SESSION_SCHEMA_V639,
  BROWSER_EVIDENCE_SESSION_STORAGE_V639,
  appendBrowserEvidenceEventV639,
  browserEvidenceSessionStorageKeyV639,
  appendBrowserEvidenceObservationV639,
  browserEvidenceSessionBatchV639,
  browserEvidenceSessionBoundaryV639,
  browserEvidenceSessionIdentityV639,
  browserEvidenceSessionRecordsV639,
  compareBrowserEvidenceBuildV639,
  createBrowserEvidenceSessionV639,
  decodeBrowserEvidenceSessionV639,
  encodeBrowserEvidenceSessionV639,
  markBrowserEvidenceControlledFaultV639,
  markBrowserEvidencePanelLifecycleV639,
  persistBrowserEvidenceSessionV639,
  reconcileBrowserEvidenceSessionsV639,
  recordBrowserEvidenceTargetSelectionV639,
  restoreBrowserEvidenceFromStorageV639,
  sessionEventCountV639,
  sessionHasBlockedLatestV639,
  sessionIsResumableV639,
  sessionLatestRecordsV639,
  sessionOpenIssuesV639,
  sessionRawRecordDigestV639,
  sessionSummaryTextV639,
  summarizeBrowserEvidenceSessionV639,
  validateBrowserEvidenceSessionV639,
  type BrowserEvidenceStorageV639,
} from "./mainlineABrowserEvidenceSessionV639";
import type { MainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { copyMainlineAResourceSnapshotV633 } from "./mainlineAResourceObservationV633";

const build = { buildId: "mainline-a-ac4d35393e9637c0", branch: "codex/solar-sim-mainline-a", head: "1".repeat(40) } as const;
const viewport = { width: 1280, height: 720, devicePixelRatio: 1.5, device: "desktop" } as const;
const times = ["2026-09-28T14:00:00.000Z", "2026-09-28T14:00:01.000Z", "2026-09-28T14:00:02.000Z"];

function observation(id = "m42", status: "finished" | "aborted" = "finished"): MainlineAResourceObservationV633 {
  const baseline = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const release = acquireAtlasResource("texture", "inspect", `v639:${id}`, { owner: "v639-test", estimatedBytes: 4096 });
  const active = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  release();
  const returned = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const target = { kind: "nebula" as const, id, route: "mainline-a3-nebula-visual", assetHash: id === "m42" ? "35ce36bbff5099f2a6022bd47d5dfd78f2a55b09da98ffbdec7c98a6a85398e3" : "a".repeat(64) };
  const alpha = { kind: "star" as const, id: "alpha-centauri-a", route: "mainline-a-stellar-parametric", assetHash: null, loading: "ready" as const, error: null };
  return {
    schema: "mainline-a-resource-observation-v633", runId: `r65-registry-${id}-00000001`, build: { ...build },
    viewport: { ...viewport }, startedAt: times[0], endedAt: times[2],
    checkpoints: [
      { phase: "baseline", capturedAt: times[0], elapsedMs: 0, scene: "inspect", snapshot: baseline, canonical: { selection: alpha, revision: 1, publishedAt: "2026-09-28T13:59:59.000Z", cleanupErrors: [] } },
      { phase: "active", capturedAt: times[1], elapsedMs: 1000, scene: "inspect", snapshot: active, canonical: { selection: { ...target, loading: "ready", error: null }, revision: 2, publishedAt: times[1], cleanupErrors: [] } },
      { phase: "returned", capturedAt: times[2], elapsedMs: 2000, scene: "inspect", snapshot: returned, canonical: { selection: alpha, revision: 3, publishedAt: times[2], cleanupErrors: [] } },
    ],
    frameSummary: { sampleCount: 2, totalMs: 2000, minMs: 1000, p50Ms: 1000, p95Ms: 1000, maxMs: 1000 },
    memory: { source: "unavailable", beforeBytes: null, afterBytes: null }, visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
    session: { state: status, requestedDurationMs: 2000, durationSatisfied: status === "finished", issues: status === "finished" ? [] : ["user-stopped"], physicalMobile: "not-run", frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples", frameClock: { source: "document-timeline", sessionStartMs: 0, callbackCount: 3, acceptedCount: 3, firstCallbackMs: 0, firstAcceptedMs: 0, lastAcceptedMs: 2000, skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [] }, timeline: [{ elapsedMs: 0, event: "baseline", scene: "inspect" }, { elapsedMs: 1000, event: "active", scene: "inspect" }, { elapsedMs: 2000, event: "returned", scene: "inspect" }] },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    objectCycle: { mode: "canonical-object", target, manifestDigest: "1b710eda006fbdd1908b8c0cb070b546bdfd12d3fe96f9f315d3640f0a627377" },
  };
}

function memoryStorage(initial: string | null = null): BrowserEvidenceStorageV639 & { value: string | null } {
  const values = new Map<string, string>();
  if (initial !== null) values.set(BROWSER_EVIDENCE_SESSION_STORAGE_V639, initial);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, get value() { return values.get(BROWSER_EVIDENCE_SESSION_STORAGE_V639) ?? null; } };
}

describe("Mainline A browser evidence session v639", () => {
  it("creates a fail-closed resumable session with an explicit boundary", () => {
    const session = createBrowserEvidenceSessionV639({ build, viewport, at: times[0] });
    expect(session.schema).toBe(BROWSER_EVIDENCE_SESSION_SCHEMA_V639);
    expect(session.records).toHaveLength(0);
    expect(session.events[0].type).toBe("session-created");
    expect(browserEvidenceSessionBoundaryV639()).toEqual({ candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false });
    expect(validateBrowserEvidenceSessionV639(session)).toMatchObject({ valid: true, recordCount: 0, eventCount: 1 });
  });

  it("retains exact raw JSON bytes and recomputes a SHA-256 digest", () => {
    const run = observation();
    const raw = JSON.stringify(run, null, 2);
    const session = appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, raw, times[2]);
    expect(session.records[0].rawJson).toBe(raw);
    expect(session.records[0].rawSha256).toBe(sessionRawRecordDigestV639(raw));
    expect(session.records[0].bytes).toBe(new TextEncoder().encode(raw).byteLength);
    expect(browserEvidenceSessionRecordsV639(session)[0].runId).toBe(run.runId);
  });

  it("keeps blocked observations in the ledger and does not remove them", () => {
    const run = observation("m42", "aborted");
    const session = appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, JSON.stringify(run), times[2]);
    expect(session.records[0].status).toBe("blocked");
    expect(sessionHasBlockedLatestV639(session)).toBe(true);
    expect(sessionOpenIssuesV639(session)).toContain(`${run.runId}:session:incomplete-or-interrupted`);
    expect(sessionIsResumableV639(session)).toBe(true);
  });

  it("rejects records from another build before they can reach storage", () => {
    const run = observation();
    run.build = { ...build, buildId: "mainline-a-0000000000000000" };
    expect(() => appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, JSON.stringify(run))).toThrow("session:observation-build-mismatch");
  });

  it("records panel, target, fault and checkpoint events in chronological order", () => {
    let session = createBrowserEvidenceSessionV639({ build, viewport, at: times[0] });
    session = markBrowserEvidencePanelLifecycleV639(session, "opened", times[0]);
    session = recordBrowserEvidenceTargetSelectionV639(session, { kind: "nebula", id: "m42", route: "mainline-a3-nebula-visual", assetHash: "a".repeat(64) }, times[1]);
    session = markBrowserEvidenceControlledFaultV639(session, "missing-returned-checkpoint", times[2]);
    expect(sessionEventCountV639(session, "panel-opened")).toBe(1);
    expect(sessionEventCountV639(session, "target-selected")).toBe(1);
    expect(sessionEventCountV639(session, "controlled-fault-recorded")).toBe(1);
    expect(session.events.map((entry) => entry.at)).toEqual([times[0], times[0], times[1], times[2]]);
  });

  it("round-trips a valid session and rejects byte or boundary tampering", () => {
    const run = observation();
    const original = appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, JSON.stringify(run, null, 2), times[2]);
    const encoded = encodeBrowserEvidenceSessionV639(original);
    const restored = decodeBrowserEvidenceSessionV639(encoded, build);
    expect(restored).toEqual(original);
    const tampered = JSON.parse(encoded) as Record<string, unknown>;
    (tampered.records as Record<string, unknown>[])[0].rawJson += " ";
    expect(() => decodeBrowserEvidenceSessionV639(JSON.stringify(tampered), build)).toThrow(/record:bytes|record:sha256|record:evaluation-drift/);
    tampered.boundary = { candidateOnly: true, hold: false, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false };
    expect(validateBrowserEvidenceSessionV639(tampered).valid).toBe(false);
  });

  it("persists and restores only the current build", () => {
    const run = observation();
    const session = appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, JSON.stringify(run), times[2]);
    const store = memoryStorage();
    expect(persistBrowserEvidenceSessionV639(store, session)).toMatchObject({ ok: true });
    expect(store.getItem(BROWSER_EVIDENCE_SESSION_STORAGE_V639)).toBeNull();
    expect(store.getItem(browserEvidenceSessionStorageKeyV639(build))).toContain(BROWSER_EVIDENCE_SESSION_SCHEMA_V639);
    expect(restoreBrowserEvidenceFromStorageV639(store, build).status).toBe("restored");
    expect(restoreBrowserEvidenceFromStorageV639(store, { ...build, head: "2".repeat(40) }).status).toBe("wrong-build");
  });

  it("keeps retries in the ledger but exports the latest canonical attempt", () => {
    const first = observation("m42", "aborted");
    const second = { ...observation("m42"), runId: "r65-registry-m42-00000002" };
    let session = createBrowserEvidenceSessionV639({ build, viewport, at: times[0] });
    session = appendBrowserEvidenceObservationV639(session, first, JSON.stringify(first), times[1]);
    session = appendBrowserEvidenceObservationV639(session, second, JSON.stringify(second), times[2]);
    const exported = browserEvidenceSessionBatchV639(session);
    expect(session.records).toHaveLength(2);
    expect(exported.batch?.records).toHaveLength(1);
    expect(exported.batch?.records[0]?.runId).toBe(second.runId);
    expect(exported.evaluation?.verified).toBe(1);
  });

  it("detects same-origin tab races without overwriting the first tab", () => {
    const run = observation();
    const base = createBrowserEvidenceSessionV639({ build, viewport, at: times[0], sessionId: "r65-session-abcdef12" });
    const first = appendBrowserEvidenceObservationV639(base, run, JSON.stringify(run), times[1]);
    const second = appendBrowserEvidenceEventV639(base, { type: "panel-opened", at: times[2] });
    expect(reconcileBrowserEvidenceSessionsV639(first, second)).toBe("conflict");
    const store = memoryStorage();
    expect(persistBrowserEvidenceSessionV639(store, first).ok).toBe(true);
    expect(persistBrowserEvidenceSessionV639(store, second)).toMatchObject({ ok: false, error: "session:storage-concurrent-write" });
  });

  it("does not claim 36 coverage from a single local observation", () => {
    const run = observation();
    const session = appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, JSON.stringify(run), times[2]);
    const summary = summarizeBrowserEvidenceSessionV639(session, "available");
    expect(summary.observed).toBe(1);
    expect(summary.verified).toBe(1);
    expect(summary.missing.length).toBe(35);
    expect(summary.sourceAuthenticityProven).toBe(false);
    expect(sessionSummaryTextV639(summary)).toContain("1/36 verified");
    expect(browserEvidenceSessionBatchV639(session).evaluation.status).toBe("partial-local");
  });

  it("lets the latest retry replace an earlier blocked row while preserving history", () => {
    const first = observation("m42", "aborted");
    const second = { ...observation("m42"), runId: "r65-registry-m42-00000002" };
    let session = createBrowserEvidenceSessionV639({ build, viewport, at: times[0] });
    session = appendBrowserEvidenceObservationV639(session, first, JSON.stringify(first), times[1]);
    session = appendBrowserEvidenceObservationV639(session, second, JSON.stringify(second), times[2]);
    expect(session.records).toHaveLength(2);
    expect(sessionLatestRecordsV639(session)).toHaveLength(1);
    expect(sessionLatestRecordsV639(session)[0].runId).toBe(second.runId);
    expect(summarizeBrowserEvidenceSessionV639(session).duplicates).toContain("nebula:m42");
  });

  it("keeps session identity stable for the same session/build/manifest tuple", () => {
    const session = createBrowserEvidenceSessionV639({ build, viewport, at: times[0], sessionId: "r65-session-abcdef12" });
    expect(browserEvidenceSessionIdentityV639(session)).toBe(browserEvidenceSessionIdentityV639({ ...session, updatedAt: times[2] }));
    expect(compareBrowserEvidenceBuildV639(build, { ...build })).toBe(true);
    expect(compareBrowserEvidenceBuildV639(build, { ...build, head: "0".repeat(40) })).toBe(false);
  });

  it("fails closed when storage write throws", () => {
    const session = createBrowserEvidenceSessionV639({ build, viewport, at: times[0] });
    const failing: BrowserEvidenceStorageV639 = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
    expect(persistBrowserEvidenceSessionV639(failing, session)).toEqual({ ok: false, error: "quota" });
  });

  it("rejects synthetic or fixture markers in raw observation records through the existing evaluator", () => {
    const run = observation();
    run.runId = "fixture-browser-run";
    const session = appendBrowserEvidenceObservationV639(createBrowserEvidenceSessionV639({ build, viewport, at: times[0] }), run, JSON.stringify(run), times[2]);
    expect(session.records[0].status).toBe("blocked");
    expect(session.records[0].issues.some((issue) => /fixture|synthetic/u.test(issue))).toBe(true);
  });
});
