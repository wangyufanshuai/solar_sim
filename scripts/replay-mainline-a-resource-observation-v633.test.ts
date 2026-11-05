import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import { copyMainlineAResourceSnapshotV633 } from "../app/lib/mainlineAResourceObservationV633";
import {
  evaluateResourceReplayBytesV633,
  parseResourceReplayArgumentsV633,
  replayMainlineAResourceObservationV633,
  resolveResourceReplayPathV633,
  sha256ResourceBytesV633,
} from "./replay-mainline-a-resource-observation-v633";

const root = process.cwd();
const build = { buildId: "local-test", branch: "codex/test", head: "a".repeat(40) };
const malformedObservation = Buffer.from(JSON.stringify({ schema: "mainline-a-resource-observation-v633", runId: "negative-fixture", build }));

function longObservation() {
  const baseline = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const release = acquireAtlasResource("model", "atlas", "unit-long-run", { owner: "unit-test-not-browser", estimatedBytes: 1024 });
  const active = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  release();
  const returned = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  return {
    schema: "mainline-a-resource-observation-v633", runId: "unit-not-browser-30-minutes", build,
    viewport: { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" },
    startedAt: "2026-09-27T00:00:00.000Z", endedAt: "2026-09-27T00:30:00.000Z",
    checkpoints: [
      { phase: "baseline", capturedAt: "2026-09-27T00:00:00.000Z", elapsedMs: 0, scene: "atlas", snapshot: baseline },
      { phase: "active", capturedAt: "2026-09-27T00:15:00.000Z", elapsedMs: 900_000, scene: "inspect", snapshot: active },
      { phase: "returned", capturedAt: "2026-09-27T00:30:00.000Z", elapsedMs: 1_800_000, scene: "atlas", snapshot: returned },
    ],
    frameSummary: { sampleCount: 108000, totalMs: 1_800_000, minMs: 10, p50Ms: 16, p95Ms: 20, maxMs: 30 },
    memory: { source: "unavailable", beforeBytes: null, afterBytes: null },
    visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
    session: {
      state: "finished", requestedDurationMs: 1_800_000, durationSatisfied: true, issues: [], physicalMobile: "not-run",
      frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples",
      frameClock: { source: "document-timeline", sessionStartMs: 0, callbackCount: 108001, acceptedCount: 108001,
        firstCallbackMs: 0, firstAcceptedMs: 0, lastAcceptedMs: 1_800_000,
        skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [] },
      timeline: [
        { elapsedMs: 0, event: "baseline", scene: "atlas" },
        { elapsedMs: 900_000, event: "active", scene: "inspect" },
        { elapsedMs: 1_800_000, event: "returned", scene: "atlas" },
        { elapsedMs: 1_800_000, event: "finished", scene: "atlas" },
      ],
    },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
  };
}

test("raw SHA hashes exact original bytes, not reserialized JSON", () => {
  const spaced = Buffer.from('{ "one": 1 }\n');
  const compact = Buffer.from('{"one":1}');
  assert.notEqual(sha256ResourceBytesV633(spaced), sha256ResourceBytesV633(compact));
  assert.equal(sha256ResourceBytesV633(Buffer.from("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("verified raw replay preserves timing, session, visibility and device fields for repetition checks", () => {
  const value = longObservation();
  const bytes = Buffer.from(JSON.stringify(value));
  const replay = evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build);
  assert.equal(replay.status, "measured-local");
  assert.deepEqual(replay.observationSummary, {
    validated: true, startedAt: value.startedAt, endedAt: value.endedAt, durationMs: 1_800_000,
    requestedDurationMs: value.session.requestedDurationMs, device: "desktop", viewport: value.viewport,
    visibility: value.visibility, sessionState: "finished", durationSatisfied: true,
    frameSummarySource: value.session.frameSummarySource, frameSummaryMethod: value.session.frameSummaryMethod,
    frameSummary: value.frameSummary, timeline: value.session.timeline, sessionIssues: [],
    checkpoints: value.checkpoints.map(({ phase, capturedAt, elapsedMs, scene }) => ({ phase, capturedAt, elapsedMs, scene })),
  });
  assert.equal(replay.baselineRestored, true);
  assert.equal(replay.scientificPayloadWriteback, false);
});

test("modified raw bytes leave the summary explicitly unvalidated even when its timing looks complete", () => {
  const bytes = Buffer.from(JSON.stringify(longObservation()));
  const replay = evaluateResourceReplayBytesV633(bytes, "0".repeat(64), build);
  assert.equal(replay.observationSummary.durationMs, 1_800_000);
  assert.equal(replay.observationSummary.validated, false);
  assert.equal(replay.status, "blocked");
});

test("blocked summaries preserve interruptions and errors without substituting an uninterrupted session", () => {
  const value = longObservation();
  value.visibility.interruptions = 1;
  const bytes = Buffer.from(JSON.stringify(value));
  const replay = evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build);
  assert.equal(replay.observationSummary.validated, false);
  assert.deepEqual(replay.observationSummary.visibility, value.visibility);
  assert.deepEqual(replay.observationSummary.timeline, value.session.timeline);
  assert.ok(replay.issues.includes("visibility:interrupted-or-unobserved"));
});

test("unverified object cycles are not echoed as validated target evidence", () => {
  const value = { ...longObservation(), objectCycle: { mode: "canonical-object", target: { id: "unknown" } } };
  const bytes = Buffer.from(JSON.stringify(value));
  const replay = evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build);
  assert.equal(replay.status, "blocked");
  assert.equal("objectCycle" in replay.observationSummary, false);
});

test("invalid timestamps stay unavailable rather than becoming a zero-duration measurement", () => {
  const bytes = Buffer.from(JSON.stringify({ ...longObservation(), startedAt: "unknown" }));
  const replay = evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build);
  assert.equal(replay.observationSummary.durationMs, null);
  assert.equal(replay.observationSummary.validated, false);
});

test("requires the expected SHA and detects modified source bytes", () => {
  assert.throws(() => evaluateResourceReplayBytesV633(malformedObservation, "", build), /expected-required/u);
  const report = evaluateResourceReplayBytesV633(malformedObservation, "0".repeat(64), build);
  assert.equal(report.status, "blocked");
  assert.ok(report.issues.includes("sha256:raw-byte-mismatch"));
  assert.equal(report.scientificPayloadWriteback, false);
  assert.equal(report.physicalGpuMemoryClaim, false);
});

test("binding cannot be established using a matching hash and a different build", () => {
  const report = evaluateResourceReplayBytesV633(malformedObservation, sha256ResourceBytesV633(malformedObservation), { ...build, buildId: "other" });
  assert.ok(report.issues.includes("build:receipt-mismatch"));
  assert.equal(report.status, "blocked");
});

test("failed build and unstable sources cannot bind even when identifiers match", () => {
  for (const source of [{ ...build, exitCode: 1 }, { ...build, sourceStable: false }]) {
    const report = evaluateResourceReplayBytesV633(malformedObservation, sha256ResourceBytesV633(malformedObservation), source);
    assert.ok(report.issues.includes("build:failed-or-unstable"));
  }
});

test("build receipt runtimeBuildId takes precedence over packaging buildId", () => {
  const report = evaluateResourceReplayBytesV633(malformedObservation, sha256ResourceBytesV633(malformedObservation), { ...build, buildId: "packaging", runtimeBuildId: build.buildId });
  assert.ok(!report.issues.includes("build:receipt-mismatch"));
  assert.equal(report.status, "blocked");
  assert.match(report.limits.authenticity, /do not independently authenticate/u);
});

test("no fixture or digest-only object can qualify without a full valid envelope", () => {
  for (const object of [{ fixture: true }, { checkpoints: [], identityDigest: "abcd1234" }, { status: "passed" }]) {
    const bytes = Buffer.from(JSON.stringify(object));
    assert.equal(evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build).status, "blocked");
  }
});

test("replay blocks missing and forged RAF provenance even with matching raw hash and build", () => {
  for (const source of [undefined, null, "renderer", "raf", true]) {
    const bytes = Buffer.from(JSON.stringify({
      schema: "mainline-a-resource-observation-v633",
      runId: "negative-source-fixture",
      build,
      session: { frameSummarySource: source },
    }));
    const report = evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build);
    assert.equal(report.status, "blocked");
    assert.ok(report.issues.includes("session:frame-summary-source"));
    assert.ok(!report.issues.includes("sha256:raw-byte-mismatch"));
    assert.ok(!report.issues.includes("build:receipt-mismatch"));
  }
});

test("replay states that RAF intervals cannot prove renderer frame time", () => {
  const report = evaluateResourceReplayBytesV633(malformedObservation, sha256ResourceBytesV633(malformedObservation), build);
  assert.match(report.limits.frameSummary, /requestAnimationFrame \(RAF\) intervals/u);
  assert.match(report.limits.frameSummary, /not renderer frame time/u);
  assert.match(report.limits.frameSummary, /not renderer frame time or proof that a canvas rendered/u);
});

test("rejects malformed JSON and non-object roots", () => {
  for (const raw of ["[1]", "null", "true", "{"]) {
    const bytes = Buffer.from(raw);
    assert.throws(() => evaluateResourceReplayBytesV633(bytes, sha256ResourceBytesV633(bytes), build));
  }
});

test("paths stay inside workspace for relative and absolute inputs", () => {
  assert.equal(resolveResourceReplayPathV633(root, "docs/probe.json"), path.join(root, "docs/probe.json"));
  for (const input of ["", "..", "../outside.json", root, path.resolve(root, "..", "outside.json"), "bad\0name"]) {
    assert.throws(() => resolveResourceReplayPathV633(root, input), /path:/u);
  }
});

test("CLI parser fails missing, duplicate, unknown and dangling arguments", () => {
  const required = ["--input", "docs/input.json", "--expected-sha256", "a".repeat(64), "--build-receipt", "docs/build.json"];
  assert.equal(parseResourceReplayArgumentsV633(required, root).input, "docs/input.json");
  for (const args of [[], ["--input"], [...required, "--force", "true"], [...required, "--input", "again.json"], [...required, "--output", "--input"]]) {
    assert.throws(() => parseResourceReplayArgumentsV633(args, root), /argument:/u);
  }
});

test("file replay reads original bytes, writes once, and prevents input overwrite", async () => {
  const directory = await mkdtemp(path.join(root, "tmp/v633-resource-replay-test-"));
  const input = path.join(directory, "observation.json");
  const buildReceipt = path.join(directory, "build.json");
  const output = path.join(directory, "replay.json");
  await writeFile(input, malformedObservation, { flag: "wx" });
  await writeFile(buildReceipt, JSON.stringify(build), { flag: "wx" });
  const options = { root, input, expectedSha256: sha256ResourceBytesV633(malformedObservation), buildReceipt, output };
  const report = await replayMainlineAResourceObservationV633(options);
  assert.equal(report.status, "blocked");
  assert.deepEqual(JSON.parse(await readFile(output, "utf8")), report);
  await assert.rejects(replayMainlineAResourceObservationV633(options), /EEXIST/u);
  await assert.rejects(replayMainlineAResourceObservationV633({ ...options, output: input }), /input-collision/u);
  assert.deepEqual(await readFile(input), malformedObservation);
});

test("file replay rejects directories and missing files", async () => {
  await assert.rejects(replayMainlineAResourceObservationV633({ root, input: "docs", expectedSha256: "a".repeat(64), buildReceipt: "package.json" }), /regular-bounded/u);
  await assert.rejects(replayMainlineAResourceObservationV633({ root, input: "docs/does-not-exist-v633.json", expectedSha256: "a".repeat(64), buildReceipt: "package.json" }), /ENOENT/u);
});
