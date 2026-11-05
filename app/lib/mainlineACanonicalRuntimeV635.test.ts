import fs from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import coverageJson from "../data/mainlineACanonicalCoverageV622.generated.json";
import type { CoveragePackV622 } from "./mainlineACanonicalCoverageV622";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { copyMainlineAResourceSnapshotV633, evaluateMainlineAResourceObservationV633, type MainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";
import {
  CANONICAL_COVERAGE_SHA256_V635, canonicalSelectionReadyV635, createCanonicalRuntimeRegistryV635,
  evaluateCanonicalObjectCycleV635, evaluateCanonicalRuntimeCoverageV635,
  sameCanonicalTargetV635, validateCanonicalTargetV635,
  type CanonicalReplayedObservationV635, type CanonicalRuntimeSelectionV635,
} from "./mainlineACanonicalRuntimeV635";

const coverage = coverageJson as CoveragePackV622;
const build = { buildId: "unit-contract-fixture", branch: "codex/test", head: "a".repeat(40) };
const timestamp = (ms: number) => new Date(Date.UTC(2026, 8, 27) + ms).toISOString();
function example(index = 0): CanonicalReplayedObservationV635 {
  const row = coverage.records[index];
  const target = { kind: row.kind, id: row.id, route: row.route.route, assetHash: row.route.assetHash };
  const baseline = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const release = acquireAtlasResource("texture", "atlas", `canonical-unit-${index}`, { owner: "canonical-unit-test", estimatedBytes: 512 });
  const active = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  release();
  const returned = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const observation: MainlineAResourceObservationV633 = {
    schema: "mainline-a-resource-observation-v633", runId: `unit-fixture-${index}`, build,
    viewport: { width: 1200, height: 800, devicePixelRatio: 1, device: "desktop" },
    startedAt: timestamp(0), endedAt: timestamp(1000),
    objectCycle: { mode: "canonical-object", target, manifestDigest: CANONICAL_COVERAGE_SHA256_V635 },
    checkpoints: [
      { phase: "baseline", capturedAt: timestamp(0), elapsedMs: 0, scene: "atlas", snapshot: baseline, canonical: { selection: null, revision: 1, publishedAt: timestamp(0), cleanupErrors: [] } },
      { phase: "active", capturedAt: timestamp(500), elapsedMs: 500, scene: "atlas", snapshot: active, canonical: { selection: { ...target, loading: "ready", error: null }, revision: 2, publishedAt: timestamp(500), cleanupErrors: [] } },
      { phase: "returned", capturedAt: timestamp(1000), elapsedMs: 1000, scene: "atlas", snapshot: returned, canonical: { selection: null, revision: 3, publishedAt: timestamp(1000), cleanupErrors: [] } },
    ],
    frameSummary: { sampleCount: 60, totalMs: 1000, minMs: 10, p50Ms: 16, p95Ms: 20, maxMs: 30 },
    memory: { source: "unavailable", beforeBytes: null, afterBytes: null },
    visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
    session: { state: "finished", requestedDurationMs: 1000, durationSatisfied: true, issues: [], physicalMobile: "not-run", frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples",
      frameClock: { source: "document-timeline", sessionStartMs: 0, callbackCount: 61, acceptedCount: 61,
        firstCallbackMs: 0, firstAcceptedMs: 0, lastAcceptedMs: 1000, skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [] } },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
  };
  // This constructs a positive schema branch only. It is never persisted as browser evidence.
  return { rawSha256: (index + 1).toString(16).padStart(64, "0"), observation, evidenceClass: "browser-export" };
}
const evaluate = (observations: CanonicalReplayedObservationV635[]) => evaluateCanonicalRuntimeCoverageV635({ coverage, observations, expectedBuild: build, expectedManifestDigest: CANONICAL_COVERAGE_SHA256_V635 });
const selected = (): CanonicalRuntimeSelectionV635 => ({ kind: "star", id: "vega", route: "mainline-a-stellar-parametric", assetHash: null, loading: "ready", error: null });

describe("canonical runtime observation registry", () => {
  it("starts unobserved and publishes immutable copies with increasing revisions", () => {
    const registry = createCanonicalRuntimeRegistryV635(() => timestamp(0));
    expect(registry.read()).toMatchObject({ selection: null, revision: 0 });
    const input = selected();
    const published = registry.publish(input);
    input.id = "changed";
    published.selection!.id = "also-changed";
    expect(registry.read().selection?.id).toBe("vega");
    expect(registry.publish(null).revision).toBe(2);
  });
  it("notifies independent listeners and supports idempotent unsubscribe", () => {
    const registry = createCanonicalRuntimeRegistryV635(() => timestamp(0));
    const listener = vi.fn();
    registry.subscribe(() => { throw new Error("observer-only-error"); });
    const stop = registry.subscribe(listener);
    registry.publish(selected());
    expect(listener).toHaveBeenCalledTimes(1);
    stop(); stop();
    registry.publish(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });
  it("keeps cleanup failure visible after subsequent ready or cleared selection", () => {
    const registry = createCanonicalRuntimeRegistryV635(() => timestamp(0));
    registry.publish(selected());
    registry.reportCleanupFailure("texture-dispose-failed");
    registry.publish(null);
    registry.publish(selected());
    expect(registry.read().cleanupErrors).toEqual(["texture-dispose-failed"]);
  });
  it.each(["loading", "failed", "unobserved"] as const)("never treats %s as loaded", (loading) => {
    expect(canonicalSelectionReadyV635({ ...selected(), loading })).toBe(false);
  });
  it("rejects malformed publications and ready selections with errors", () => {
    const registry = createCanonicalRuntimeRegistryV635(() => timestamp(0));
    expect(() => registry.publish({ ...selected(), assetHash: "not-a-hash" })).toThrow("selection-invalid");
    expect(canonicalSelectionReadyV635({ ...selected(), error: "material-failed" })).toBe(false);
  });
});

describe("same-scene object roundtrip", () => {
  it.each(["Ori", "UMa"])("preserves the IAU mixed-case identity %s", (id) => {
    const index = coverage.records.findIndex((row) => row.kind === "constellation" && row.id === id);
    expect(index).toBeGreaterThanOrEqual(0);
    const entry = example(index);
    expect(validateCanonicalTargetV635(entry.observation.objectCycle!.target)).toBe(true);
    expect(evaluate([entry]).rows[0].status).toBe("measured-local");
    const lower = { ...entry.observation.objectCycle!.target, id: id.toLowerCase() };
    expect(sameCanonicalTargetV635(entry.observation.objectCycle!.target, lower)).toBe(false);
    entry.observation.objectCycle!.target = lower;
    entry.observation.checkpoints[1].canonical!.selection!.id = lower.id;
    expect(evaluate([entry]).rows[0].issues).toContain("coverage:unknown-object");
  });
  it("requires actual published object changes while scene stays atlas", () => {
    const run = example().observation;
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toEqual([]);
    run.checkpoints[2].canonical!.selection = selected();
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:baseline-object-not-restored");
  });
  it.each(["loading", "failed", "unobserved"] as const)("blocks %s active checkpoints even with successful resource counters", (loading) => {
    const run = example().observation;
    run.checkpoints[1].canonical!.selection!.loading = loading;
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:selection-not-ready:1");
  });
  it("requires target route and hash identity without reducing to the object name", () => {
    const run = example().observation;
    run.checkpoints[1].canonical!.selection!.route = "wrong-route";
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:active-target-mismatch");
    run.checkpoints[1].canonical!.selection!.route = run.objectCycle!.target.route;
    run.checkpoints[1].canonical!.selection!.assetHash = "a".repeat(64);
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:active-target-mismatch");
  });
  it("rejects stale or future publication times and an unbound initial registry", () => {
    const run = example().observation;
    run.checkpoints[0].canonical!.revision = 0;
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:runtime-unobserved:0");
    run.checkpoints[0].canonical!.revision = 1;
    run.checkpoints[1].canonical!.publishedAt = timestamp(2000);
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:publication-time-invalid:1");
  });
  it("cannot hide a cleanup failure by restoring baseline resource totals", () => {
    const run = example().observation;
    run.checkpoints[2].canonical!.cleanupErrors = ["release-threw"];
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:cleanup-failed:2");
  });
  it.each([0, 1])("requires a fresh publication after preceding checkpoint %i", (checkpointIndex) => {
    const run = example().observation;
    run.checkpoints[checkpointIndex + 1].canonical!.publishedAt = timestamp(checkpointIndex === 0 ? 0 : 499);
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, run.checkpoints)).toContain("canonical:publication-not-fresh");
  });
  it("records reused resources without claiming an observed allocation or release", () => {
    const run = example().observation;
    const release = acquireAtlasResource("subscription", "atlas", "reused-canonical-resource", { owner: "canonical-unit-test", estimatedBytes: 32 });
    try {
      const snapshot = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
      for (const checkpoint of run.checkpoints) checkpoint.snapshot = structuredClone(snapshot);
      expect(evaluateMainlineAResourceObservationV633(run)).toMatchObject({
        status: "measured-local", acquiredCount: 0, releasedCount: 0, retainedCount: 0,
        baselineRestored: true, resourceBehavior: "reuse-without-allocation", resourceReleaseObserved: false,
      });
      expect(evaluate([{ ...example(), observation: run }]).counts.verified).toBe(1);
    } finally { release(); }
  });
  it("retains the acquisition and release classification for actual registry changes", () => {
    expect(evaluateMainlineAResourceObservationV633(example().observation)).toMatchObject({
      status: "measured-local", resourceBehavior: "acquire-release", resourceReleaseObserved: true,
      acquiredCount: 1, releasedCount: 1, retainedCount: 0,
    });
  });
  it("cannot infer no allocation from equal identities with changed revisions", () => {
    const run = example().observation;
    const snapshot = structuredClone(run.checkpoints[1].snapshot);
    for (const [index, checkpoint] of run.checkpoints.entries()) checkpoint.snapshot = { ...structuredClone(snapshot), revision: snapshot.revision + index };
    const result = evaluateMainlineAResourceObservationV633(run);
    expect(result.status).toBe("blocked");
    expect(result.resourceBehavior).toBe("unverified");
    expect(result.resourceReleaseObserved).toBe(false);
    expect(result.issues).toContain("lifecycle:no-observed-acquisition");
  });
  it.each(["active", "returned"])("rejects a partial registry revision change at %s", (phase) => {
    const run = example().observation;
    const snapshot = structuredClone(run.checkpoints[1].snapshot);
    for (const checkpoint of run.checkpoints) checkpoint.snapshot = structuredClone(snapshot);
    run.checkpoints.find((checkpoint) => checkpoint.phase === phase)!.snapshot.revision += 1;
    const result = evaluateMainlineAResourceObservationV633(run);
    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("lifecycle:no-registry-revisions");
  });
  it("never applies object reuse to the cross-scene lifecycle contract", () => {
    const run = example().observation;
    delete run.objectCycle;
    const snapshot = structuredClone(run.checkpoints[1].snapshot);
    for (const checkpoint of run.checkpoints) {
      delete checkpoint.canonical;
      checkpoint.snapshot = structuredClone(snapshot);
    }
    run.checkpoints[1].scene = "inspect";
    const result = evaluateMainlineAResourceObservationV633(run);
    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("lifecycle:no-observed-release");
    expect(result.resourceReleaseObserved).toBe(false);
  });
  it.each([null, [], 3, "raw", {}, { toString: null }])("blocks malformed checkpoint inputs without throwing: %j", (raw) => {
    const run = example().observation;
    const checkpoints = [run.checkpoints[0], raw, run.checkpoints[2]];
    expect(() => evaluateCanonicalObjectCycleV635(run.objectCycle, checkpoints)).not.toThrow();
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, checkpoints).length).toBeGreaterThan(0);
  });
  it.each(["capturedAt", "canonical"])("rejects hostile JSON coercion shapes in %s", (field) => {
    const run = example().observation;
    const checkpoints = structuredClone(run.checkpoints) as unknown as Record<string, unknown>[];
    checkpoints[1][field] = { toString: null, valueOf: null };
    expect(() => evaluateCanonicalObjectCycleV635(run.objectCycle, checkpoints)).not.toThrow();
    expect(evaluateCanonicalObjectCycleV635(run.objectCycle, checkpoints).length).toBeGreaterThan(0);
  });
});

describe("canonical 12/12/12 replay coverage", () => {
  it("binds the UI constant to exact V622 file bytes", () => {
    const digest = createHash("sha256").update(fs.readFileSync("app/data/mainlineACanonicalCoverageV622.generated.json")).digest("hex");
    expect(digest).toBe(CANONICAL_COVERAGE_SHA256_V635);
  });
  it("computes all 36 independent contract roundtrips without claiming rights or science", () => {
    const result = evaluate(coverage.records.map((_, index) => example(index)));
    expect(result.status).toBe("measured-local");
    expect(result.counts).toEqual({ expected: 36, observed: 36, verified: 36, stars: 12, nebulae: 12, constellations: 12 });
    expect(result.scientificPayloadWriteback).toBe(false);
    expect(result.rightsApproval).toBe(false);
  });
  it("does not accept one observed object as evidence of all canonical objects", () => {
    const result = evaluate([example()]);
    expect(result.status).toBe("blocked");
    expect(result.missing).toHaveLength(35);
    expect(result.counts.verified).toBe(1);
  });
  it("blocks explicit fixtures even when their contract data is internally consistent", () => {
    const entry = example();
    entry.evidenceClass = "fixture";
    expect(evaluate([entry]).rows[0].issues).toContain("coverage:fixture-not-runtime-evidence");
    expect(evaluate([entry]).counts.verified).toBe(0);
  });
  it("detects repeated object identities, run IDs and raw artifact hashes", () => {
    const entry = example();
    const result = evaluate([entry, structuredClone(entry)]);
    expect(result.duplicates).toEqual([`${coverage.records[0].kind}:${coverage.records[0].id}`]);
    expect(result.rows[1].issues).toEqual(expect.arrayContaining(["coverage:duplicate-run-id", "coverage:duplicate-raw-artifact", "coverage:duplicate-object-observation"]));
  });
  it("binds every object to the expected production build and raw manifest hash", () => {
    const entry = example();
    entry.observation.build = { ...build, buildId: "another-build" };
    entry.observation.objectCycle!.manifestDigest = "b".repeat(64);
    const result = evaluate([entry]);
    expect(result.rows[0].issues).toEqual(expect.arrayContaining(["coverage:observation-build-mismatch", "coverage:observation-manifest-mismatch"]));
  });
  it("does not substitute a different texture hash for the same canonical nebula", () => {
    const index = coverage.records.findIndex((row) => row.kind === "nebula");
    const entry = example(index);
    entry.observation.objectCycle!.target.assetHash = "b".repeat(64);
    entry.observation.checkpoints[1].canonical!.selection!.assetHash = "b".repeat(64);
    expect(evaluate([entry]).rows[0].issues).toContain("coverage:target-route-or-hash-mismatch");
  });
  it("recomputes lifecycle release and does not trust a successful object selection alone", () => {
    const entry = example();
    entry.observation.checkpoints[2].snapshot = structuredClone(entry.observation.checkpoints[1].snapshot);
    expect(evaluate([entry]).rows[0].issues).toContain("lifecycle:baseline-not-restored");
    expect(evaluate([entry]).counts.verified).toBe(0);
  });
  it.each([undefined, null, [], {}, { observations: [null] }, { observations: [{ observation: null }] }])("blocks unknown coverage input shapes without throwing: %j", (value) => {
    expect(() => evaluateCanonicalRuntimeCoverageV635(value)).not.toThrow();
    expect(evaluateCanonicalRuntimeCoverageV635(value).status).toBe("blocked");
  });
  it("does not let a full set of fixture exports close coverage", () => {
    const entries = coverage.records.map((_, index) => ({ ...example(index), evidenceClass: "fixture" as const }));
    const result = evaluate(entries);
    expect(result.status).toBe("blocked");
    expect(result.counts.verified).toBe(0);
    expect(result.rows.every((row) => row.issues.includes("coverage:fixture-not-runtime-evidence"))).toBe(true);
  });
  it("blocks invalid raw digests and duplicate IDs in an otherwise complete set", () => {
    const entries = coverage.records.map((_, index) => example(index));
    entries[1].rawSha256 = "not-a-sha256";
    entries[2].observation.runId = entries[3].observation.runId;
    const result = evaluate(entries);
    expect(result.status).toBe("blocked");
    expect(result.counts.verified).toBe(34);
    expect(result.rows[1].issues).toContain("coverage:raw-digest-invalid");
    expect(result.rows[3].issues).toContain("coverage:duplicate-run-id");
  });
  it("blocks roster and safety-policy mutations even with 36 rows", () => {
    const altered = structuredClone(coverage);
    altered.records[0].id = altered.records[1].id;
    const result = evaluateCanonicalRuntimeCoverageV635({ coverage: altered, observations: coverage.records.map((_, index) => example(index)), expectedBuild: build, expectedManifestDigest: CANONICAL_COVERAGE_SHA256_V635 });
    expect(result.status).toBe("blocked");
    expect(result.issues.join("|")).toContain("coverage:duplicate-manifest");
  });
});
