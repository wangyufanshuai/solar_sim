import { describe, expect, it } from "vitest";
import coverageJson from "../data/mainlineACanonicalCoverageV622.generated.json";
import type { CoveragePackV622 } from "./mainlineACanonicalCoverageV622";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { copyMainlineAResourceSnapshotV633, type MainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";
import { CANONICAL_COVERAGE_SHA256_V635 } from "./mainlineACanonicalRuntimeV635";
import {
  CANONICAL_BATCH_MAX_RUNS_V638,
  createCanonicalBrowserBatchV638,
  evaluateCanonicalBrowserBatchV638,
  type CanonicalBrowserBatchV638,
} from "./mainlineACanonicalBatchV638";

const coverage = coverageJson as CoveragePackV622;
const build = { buildId: "mainline-a-1111111111111111", branch: "codex/test", head: "a".repeat(40) };
const timestamp = (milliseconds: number) => new Date(Date.UTC(2026, 8, 27) + milliseconds).toISOString();
type StaticObservation = MainlineAResourceObservationV633 & {
  fixture?: boolean; synthetic?: boolean; origin?: string; evidenceClass?: string;
};
let resourceSequence = 0;

// These are static contract fixtures. Passing the schema never authenticates browser or scientific evidence.
function staticObservation(targetIndex = 0, sequence = targetIndex): StaticObservation {
  const row = coverage.records[targetIndex];
  const target = { kind: row.kind, id: row.id, route: row.route.route, assetHash: row.route.assetHash };
  const baseline = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const release = acquireAtlasResource("texture", "atlas", `batch-static-test-${resourceSequence++}`, {
    owner: "batch-static-test", estimatedBytes: 512,
  });
  const active = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  release();
  const returned = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const start = sequence * 2000;
  return {
    schema: "mainline-a-resource-observation-v633", runId: `sample-${targetIndex}-${sequence}`, build: { ...build },
    viewport: { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" },
    startedAt: timestamp(start), endedAt: timestamp(start + 1000),
    objectCycle: { mode: "canonical-object", target, manifestDigest: CANONICAL_COVERAGE_SHA256_V635 },
    checkpoints: [
      { phase: "baseline", capturedAt: timestamp(start), elapsedMs: 0, scene: "atlas", snapshot: baseline,
        canonical: { selection: null, revision: 1, publishedAt: timestamp(start), cleanupErrors: [] } },
      { phase: "active", capturedAt: timestamp(start + 500), elapsedMs: 500, scene: "atlas", snapshot: active,
        canonical: { selection: { ...target, loading: "ready", error: null }, revision: 2, publishedAt: timestamp(start + 500), cleanupErrors: [] } },
      { phase: "returned", capturedAt: timestamp(start + 1000), elapsedMs: 1000, scene: "atlas", snapshot: returned,
        canonical: { selection: null, revision: 3, publishedAt: timestamp(start + 1000), cleanupErrors: [] } },
    ],
    frameSummary: { sampleCount: 100, totalMs: 1000, minMs: 10, p50Ms: 10, p95Ms: 10, maxMs: 10 },
    memory: { source: "unavailable", beforeBytes: null, afterBytes: null },
    visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
    session: { state: "finished", requestedDurationMs: 1000, durationSatisfied: true, issues: [],
      physicalMobile: "not-run", frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples",
      frameClock: { source: "document-timeline", sessionStartMs: start, callbackCount: 101, acceptedCount: 101,
        firstCallbackMs: start, firstAcceptedMs: start, lastAcceptedMs: start + 1000,
        skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [] } },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
  };
}

function batch(observations: StaticObservation[] = [staticObservation()]): CanonicalBrowserBatchV638 {
  return createCanonicalBrowserBatchV638(observations, build, timestamp(120000));
}
const completeHistory = () => coverage.records.map((_, index) => staticObservation(index));
const evaluate = (value: unknown) => evaluateCanonicalBrowserBatchV638(value, build);
const targetKey = (index: number) => `${coverage.records[index].kind}:${coverage.records[index].id}`;

describe("V638 static batch contract fixtures, never browser authenticity evidence", () => {
  it("retains all legacy raw records without letting clock-free history close any canonical target", () => {
    const history = completeHistory();
    for (const raw of history) delete raw.session.frameClock;
    const output = batch(history);
    const original = JSON.stringify(output);
    const result = evaluate(output);
    expect(result).toMatchObject({ status: "partial-local", verified: 0, rejectedRuns: 36 });
    expect(result.missing).toHaveLength(36);
    expect(result.rows.every((row) => row.status === "blocked" && row.issues.includes("frame-clock:legacy-unverified"))).toBe(true);
    expect(JSON.stringify(output)).toBe(original);
  });

  it("reopens a target when a later clock-free retry tries to downgrade an already accepted run", () => {
    const previous = staticObservation();
    const legacy = staticObservation(0, 1);
    delete legacy.session.frameClock;
    const result = evaluate(batch([previous, legacy]));
    expect(result).toMatchObject({ verified: 0, rejectedRuns: 1 });
    expect(result.latest[0]).toMatchObject({ runId: legacy.runId, status: "blocked" });
  });

  it("distinguishes complete 36-target coverage from a one-target partial batch", () => {
    const complete = evaluate(batch(completeHistory()));
    expect(complete).toMatchObject({ status: "complete-local", verified: 36, rejectedRuns: 0, missing: [], issues: [],
      sourceAuthenticityProven: false, scientificPayloadWriteback: false });
    expect(new Set(complete.latest.map((row) => row.key)).size).toBe(36);
    const partial = evaluate(batch());
    expect(partial.status).toBe("partial-local");
    expect(partial.verified).toBe(1);
    expect(partial.missing).toHaveLength(35);
    expect(partial.missing).not.toContain(targetKey(0));
  });

  it("exports detached build and exact observation strings with closed boundaries", () => {
    const raw = staticObservation();
    const identity = { ...build };
    const output = createCanonicalBrowserBatchV638([raw], identity, timestamp(120000));
    const original = JSON.stringify(raw, null, 2);
    identity.head = "b".repeat(40);
    raw.checkpoints[1].canonical!.selection!.id = "later-change";
    expect(output.build).toEqual(build);
    expect(output.records[0].rawJson).toBe(original);
    expect(output.boundary).toEqual({ candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
  });

  it.each(["buildId", "branch", "head"] as const)("binds batch and each raw %s to the expected build", (field) => {
    const outer = batch();
    outer.build[field] = "different";
    expect(evaluate(outer).issues).toContain("batch:build-mismatch");
    const raw = staticObservation();
    raw.build[field] = "different";
    expect(evaluate(batch([raw])).issues).toContain("batch:raw-build-mismatch");
  });

  it("reopens a completed target after a later failed retry and retains both attempts", () => {
    const history = completeHistory();
    const retry = staticObservation(0, 40);
    retry.checkpoints[1].canonical!.selection!.loading = "failed";
    retry.checkpoints[1].canonical!.selection!.error = "texture-decode-failed";
    const result = evaluate(batch([...history, retry]));
    expect(result).toMatchObject({ status: "partial-local", verified: 35, rejectedRuns: 1, missing: [targetKey(0)], issues: [] });
    expect(result.rows).toHaveLength(37);
    expect(result.rows[0].status).toBe("measured-local");
    expect(result.latest.find((row) => row.key === targetKey(0))).toMatchObject({ runId: retry.runId, index: 36, status: "blocked" });
  });

  it("retains an aborted run and permits only its later successful retry to close the target", () => {
    const aborted = staticObservation();
    aborted.session.state = "aborted";
    aborted.session.issues = ["user-abort"];
    const failed = evaluate(batch([aborted]));
    expect(failed).toMatchObject({ status: "partial-local", verified: 0, rejectedRuns: 1, issues: [] });
    expect(failed.rows[0].issues).toContain("session:incomplete-or-interrupted");
    const retry = staticObservation(0, 1);
    const recovered = evaluate(batch([aborted, retry]));
    expect(recovered).toMatchObject({ status: "partial-local", verified: 1, rejectedRuns: 1 });
    expect(recovered.rows).toHaveLength(2);
    expect(recovered.latest[0].runId).toBe(retry.runId);
  });

  it.each([0, 1])("rejects retry chronology that ends before or at its previous attempt (%i)", (sequence) => {
    const first = staticObservation(0, 1);
    const retry = staticObservation(0, sequence);
    retry.runId = "distinct-retry-id";
    const result = evaluate(batch([first, retry]));
    expect(result.status).toBe("blocked");
    expect(result.issues).toContain("batch:retry-order");
  });

  it("rejects duplicate record IDs and separate record versus embedded raw ID conflicts", () => {
    const duplicate = batch([staticObservation(0), staticObservation(1)]);
    duplicate.records[1].runId = duplicate.records[0].runId;
    expect(evaluate(duplicate).issues).toContain("batch:duplicate-run");
    const conflict = batch();
    conflict.records[0].runId = "different-envelope-id";
    expect(evaluate(conflict).issues).toContain("batch:run-id-mismatch");
  });

  it.each([
    { fixture: true }, { synthetic: true }, { origin: "fixture" }, { origin: "synthetic" }, { evidenceClass: "fixture" },
    { origin: "STATIC-TEST-FIXTURE" }, { origin: " synthetic " },
  ])("refuses explicit promotion metadata on the bundle and embedded raw: %j", (metadata) => {
    expect(evaluate({ ...batch(), ...metadata }).issues).toContain("batch:origin");
    const raw = Object.assign(staticObservation(), metadata);
    expect(evaluate(batch([raw])).issues).toContain("batch:fixture-not-admitted");
    const wrapped = batch();
    Object.assign(wrapped.records[0], metadata);
    expect(evaluate(wrapped).issues).toContain("batch:fixture-not-admitted");
  });

  it.each(["fixture-capture-1", "SYNTHETIC-capture-1"])("refuses a promoted run marker %s", (runId) => {
    const raw = staticObservation();
    raw.runId = runId;
    expect(evaluate(batch([raw])).issues).toContain("batch:fixture-not-admitted");
  });

  it("binds the frozen manifest and complete target route and asset hash", () => {
    const output = batch();
    output.manifestDigest = "0".repeat(64);
    expect(evaluate(output).issues).toContain("batch:manifest-mismatch");
    for (const field of ["route", "assetHash"] as const) {
      const raw = staticObservation();
      raw.objectCycle!.target[field] = field === "route" ? "other-route" : "f".repeat(64);
      expect(evaluate(batch([raw])).issues).toContain("batch:canonical-target-mismatch");
    }
  });

  it("does not accept observation success reported after the bundle export time", () => {
    const output = batch();
    output.exportedAt = timestamp(500);
    const result = evaluate(output);
    expect(result.verified).toBe(0);
    expect(result.rows[0].issues).toContain("batch:record-after-export");
  });

  it.each(["candidateOnly", "hold", "notAdmitted", "scientificPayloadWriteback"] as const)("rejects opening boundary %s", (field) => {
    const output = batch();
    const boundary = { ...output.boundary, [field]: !output.boundary[field] };
    expect(evaluate({ ...output, boundary }).issues).toContain("batch:boundary");
  });

  it.each(["{", "null", "[]", "17"])("retains malformed raw as rejected without throwing: %s", (rawJson) => {
    const output = batch();
    output.records[0].rawJson = rawJson;
    expect(() => evaluate(output)).not.toThrow();
    const result = evaluate(output);
    expect(result.status).toBe("blocked");
    expect(result.rejectedRuns).toBe(1);
    expect(result.issues).toContain("batch:record-invalid:0");
  });

  it("limits empty and excessive histories and checks expected build identity", () => {
    expect(() => batch([])).toThrow("batch:export-count");
    const raw = staticObservation();
    expect(() => batch(Array(CANONICAL_BATCH_MAX_RUNS_V638 + 1).fill(raw))).toThrow("batch:export-count");
    expect(evaluate({ ...batch(), records: [] }).issues).toContain("batch:record-count");
    expect(evaluateCanonicalBrowserBatchV638(batch(), { ...build, head: "invalid" }).issues).toContain("batch:expected-build-invalid");
  });

  it("bounds each raw record by UTF-8 byte length instead of character count", () => {
    const output = batch();
    output.records[0].rawJson = `"${"测".repeat(750000)}"`;
    const result = evaluate(output);
    expect(result.status).toBe("blocked");
    expect(result.rows[0].issues).toContain("batch:record-shape");
  });
});
