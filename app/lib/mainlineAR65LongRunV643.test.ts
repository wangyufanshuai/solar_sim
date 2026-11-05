import { describe, expect, it } from "vitest";
import { acquireAtlasResource, getAtlasResourceSnapshot, type AtlasRuntimeResourceKind, type AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import {
  MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
  appendMainlineAR65LongRunObservationV643,
  classifyMainlineAR65LongRunEvidenceV643,
  createMainlineAR65LongRunBuildIdentityV643,
  createMainlineAR65LongRunObservationV643,
  createMainlineAR65LongRunResourceCheckpointV643,
  createMainlineAR65LongRunViewportV643,
  createPendingMainlineAR65LongRunReceiptV643,
  finalizeMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643,
  verifyMainlineAR65LongRunObservationV643,
  verifyMainlineAR65LongRunReceiptV643,
} from "./mainlineAR65LongRunV643";

const BUILD = createMainlineAR65LongRunBuildIdentityV643({
  buildId: "r65-test-build",
  runtimeBuildId: "mainline-a-r65-test-runtime",
  branch: "codex/solar-sim-mainline-a",
  head: "156ec7790a99be2f89f5d8f44831cb118c9437e1",
  route: "/",
  source: "runtime-marker",
});

function checkpoint(snapshot: AtlasRuntimeResourceSnapshot, phase: "baseline" | "active" | "final", atMs: number) {
  return createMainlineAR65LongRunResourceCheckpointV643(snapshot, phase, atMs, new Date(atMs).toISOString());
}

function observation(device: "desktop" | "mobile", sessionId: string, independenceKey: string, resourceKind: AtlasRuntimeResourceKind = "texture") {
  const startedAt = new Date(0).toISOString();
  const endedAt = new Date(MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643).toISOString();
  const baseline = getAtlasResourceSnapshot();
  const release = acquireAtlasResource(resourceKind, "atlas", "r65-v643-test-switch", { owner: "r65-v643-test", estimatedBytes: 1024 });
  const active = getAtlasResourceSnapshot();
  release();
  const final = getAtlasResourceSnapshot();
  const viewport = createMainlineAR65LongRunViewportV643({
    width: device === "desktop" ? 1280 : 390,
    height: device === "desktop" ? 720 : 844,
    devicePixelRatio: device === "desktop" ? 1 : 2,
    device,
    class: device === "desktop" ? "desktop-browser" : "mobile-viewport",
  });
  return createMainlineAR65LongRunObservationV643({
    sessionId,
    independenceKey,
    device,
    scenario: device === "desktop" ? "atlas" : "nebula-review",
    viewport,
    endedViewport: viewport,
    build: BUILD,
    endedBuild: BUILD,
    startedAt,
    endedAt,
    requestedDurationMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
    observedDurationMs: MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643,
    frameSamples: Array.from({ length: 451 }, (_, index) => ({ atMs: index * 4_000, deltaMs: index === 0 ? 0 : 4_000, longTaskMs: index === 120 ? 52 : 0 })),
    memorySamples: Array.from({ length: 181 }, (_, index) => ({ atMs: index * 10_000, usedBytes: 100_000_000 + index * 1000, totalBytes: 200_000_000, limitBytes: 1_000_000_000, source: "performance-memory" as const })),
    resources: {
      baseline: checkpoint(baseline, "baseline", 0),
      active: checkpoint(active, "active", 5_000),
      final: checkpoint(final, "final", MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643),
    },
    visibility: {
      startedVisible: true,
      endedVisible: true,
      interruptions: 0,
      canvasCount: 1,
      rootVisible: true,
      documentVisibility: "visible",
    },
    consoleErrors: 0,
    pageErrors: 0,
    notes: ["test-browser-observation"],
  });
}

describe("mainline A R65 V643 long-run contract", () => {
  it("keeps a pending receipt fail-closed and classifies evidence separately", () => {
    const receipt = createPendingMainlineAR65LongRunReceiptV643(BUILD, new Date(0).toISOString());
    const verified = verifyMainlineAR65LongRunReceiptV643(receipt);
    const classes = classifyMainlineAR65LongRunEvidenceV643(receipt);
    expect(verified.ok).toBe(false);
    expect(verified.status).toBe("pending");
    expect(classes.browser).toBe("not-run");
    expect(classes.performance).toBe("pending");
    expect(receipt.boundary.scientificPayloadWriteback).toBe(false);
    expect(receipt.boundary.candidateOnly).toBe(true);
  });

  it("accepts one complete browser observation with registry-backed restoration", () => {
    const row = observation("desktop", "session-desktop", "independent-desktop");
    const checked = verifyMainlineAR65LongRunObservationV643(row);
    expect(checked.ok, checked.issues.join(", ")).toBe(true);
    expect(row.resources.baseline.snapshot.identityDigest).toBe(row.resources.final.snapshot.identityDigest);
    expect(row.status).toBe("complete");
    expect(row.physicalDevice).toBe(false);
  });

  it("does not qualify a focus lock alone as a rendered scene lifecycle", () => {
    const row = observation("desktop", "session-focus-only", "independent-focus-only", "camera-lock");
    const checked = verifyMainlineAR65LongRunObservationV643(row);
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContain("observation:renderable-resource-activity-missing");
  });

  it("requires two distinct independence keys and both viewport classes", () => {
    const first = observation("desktop", "session-desktop", "independent-desktop");
    const second = observation("mobile", "session-mobile", "independent-mobile");
    let receipt = createPendingMainlineAR65LongRunReceiptV643(BUILD, new Date(0).toISOString());
    receipt = appendMainlineAR65LongRunObservationV643(receipt, first);
    receipt = appendMainlineAR65LongRunObservationV643(receipt, second);
    const finalized = finalizeMainlineAR65LongRunReceiptV643(receipt);
    const verified = verifyMainlineAR65LongRunReceiptV643(finalized);
    expect(verified.ok, verified.issues.join(", ")).toBe(true);
    expect(verified.completeLongRuns).toBe(2);
    expect(finalized.claims.twoIndependentLongRuns).toBe(true);
    expect(finalized.claims.desktopViewport).toBe(true);
    expect(finalized.claims.mobileViewport).toBe(true);
    expect(finalized.claims.physicalMobile).toBe(false);
  });

  it("retains failed attempts while two later independent valid runs qualify", () => {
    const failed = observation("desktop", "session-failed", "independent-failed");
    const noActivity = createMainlineAR65LongRunObservationV643({
      ...failed,
      resources: {
        ...failed.resources,
        active: checkpoint(failed.resources.baseline.snapshot, "active", 5_000),
      },
    });
    let receipt = createPendingMainlineAR65LongRunReceiptV643(BUILD, new Date(0).toISOString());
    receipt = appendMainlineAR65LongRunObservationV643(receipt, noActivity);
    receipt = appendMainlineAR65LongRunObservationV643(receipt, observation("desktop", "session-valid-desktop", "independent-valid-desktop"));
    receipt = appendMainlineAR65LongRunObservationV643(receipt, observation("mobile", "session-valid-mobile", "independent-valid-mobile"));
    const finalized = finalizeMainlineAR65LongRunReceiptV643(receipt);
    const verified = verifyMainlineAR65LongRunReceiptV643(finalized);
    expect(verified.ok, verified.issues.join(", ")).toBe(true);
    expect(verified.completeLongRuns).toBe(2);
    expect(verified.observationChecks.map((entry) => entry.status)).toEqual(["invalid", "valid", "valid"]);
    expect(verified.attemptIssues).toContain("observation-0:observation:resource-activity-missing");
    expect(finalized.observations).toHaveLength(3);
    expect(finalized.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("rejects a tampered observation digest and a fixture source", () => {
    const row = observation("desktop", "session-tamper", "independent-tamper");
    const tampered = { ...row, observedDurationMs: row.observedDurationMs + 1 };
    const digestCheck = verifyMainlineAR65LongRunObservationV643(tampered);
    expect(digestCheck.ok).toBe(false);
    expect(digestCheck.issues).toContain("observation:digest");
    const fixture = { ...row, source: "fixture" as const };
    const fixtureCheck = verifyMainlineAR65LongRunObservationV643(fixture);
    expect(fixtureCheck.ok).toBe(false);
    expect(fixtureCheck.issues).toContain("observation:source-not-browser");
  });

  it("rejects baseline restoration when the final registry digest changes", () => {
    const row = observation("desktop", "session-drift", "independent-drift");
    const drift = {
      ...row,
      resources: {
        ...row.resources,
        final: { ...row.resources.final, identityDigest: "drifted-resource-digest" },
      },
    };
    const checked = verifyMainlineAR65LongRunObservationV643(drift);
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContain("observation:resource-baseline-not-restored");
  });

  it("rejects forged elapsed time and sparse samples even when a duration field says thirty minutes", () => {
    const row = observation("desktop", "session-time", "independent-time");
    const shortWallClock = { ...row, endedAt: new Date(MAINLINE_A_R65_LONGRUN_MIN_DURATION_MS_V643 - 10_000).toISOString() };
    expect(verifyMainlineAR65LongRunObservationV643(shortWallClock).issues).toContain("observation:clock-disagreement");
    expect(verifyMainlineAR65LongRunObservationV643(shortWallClock).issues).toContain("observation:duration-not-satisfied");
    const sparseFrames = { ...row, frameSamples: [row.frameSamples[0], row.frameSamples[row.frameSamples.length - 1]] };
    expect(verifyMainlineAR65LongRunObservationV643(sparseFrames).issues).toContain("observation:frame-gap-1");
  });

  it("requires an actual registry change between baseline and restored final state", () => {
    const row = observation("desktop", "session-static", "independent-static");
    const sameActive = { ...row, resources: { ...row.resources, active: checkpoint(row.resources.baseline.snapshot, "active", 5_000) } };
    expect(verifyMainlineAR65LongRunObservationV643(sameActive).issues).toContain("observation:resource-activity-missing");
    const falsifiedCheckpoint = { ...row, resources: { ...row.resources, active: { ...row.resources.active, total: row.resources.active.total + 1 } } };
    expect(verifyMainlineAR65LongRunObservationV643(falsifiedCheckpoint).issues).toContain("observation:resource-checkpoint-1");
  });

  it("rejects a viewport or build change across an observation", () => {
    const row = observation("mobile", "session-identity", "independent-identity");
    expect(verifyMainlineAR65LongRunObservationV643({ ...row, endedViewport: { ...row.endedViewport, width: 400 } }).issues).toContain("observation:viewport-changed");
    expect(verifyMainlineAR65LongRunObservationV643({ ...row, endedBuild: { ...row.endedBuild, buildId: "other-build" } }).issues).toContain("observation:build-changed");
  });

  it("replays blocked receipts without manufacturing performance evidence", () => {
    const receipt = createPendingMainlineAR65LongRunReceiptV643(BUILD, new Date(0).toISOString());
    const replay = replayMainlineAR65LongRunReceiptV643(receipt);
    expect(replay.status).toBe("blocked");
    expect(replay.observations).toHaveLength(0);
    expect(replay.boundary?.scientificPayloadWriteback).toBe(false);
    expect(replay.failures).toContain("receipt:two-long-runs-required");
  });
});
