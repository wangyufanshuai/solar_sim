import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import coverageJson from "../app/data/mainlineACanonicalCoverageV622.generated.json";
import type { CoveragePackV622 } from "../app/lib/mainlineACanonicalCoverageV622";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import { copyMainlineAResourceSnapshotV633, type MainlineAResourceObservationV633 } from "../app/lib/mainlineAResourceObservationV633";
import { CANONICAL_COVERAGE_SHA256_V635 } from "../app/lib/mainlineACanonicalRuntimeV635";
import { createCanonicalBrowserBatchV638, type CanonicalBrowserBatchV638 } from "../app/lib/mainlineACanonicalBatchV638";
import { importCanonicalBatchV638, parseCanonicalBatchArgumentsV638 } from "./import-mainline-a-canonical-batch-v638";
import { replayCanonicalRuntimeV635 } from "./replay-mainline-a-canonical-runtime-v635";

const root = process.cwd();
const coveragePath = "app/data/mainlineACanonicalCoverageV622.generated.json";
const coverage = coverageJson as CoveragePackV622;
const build = { buildId: "mainline-a-1111111111111111", branch: "codex/test", head: "a".repeat(40) };
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const timestamp = (milliseconds: number) => new Date(Date.UTC(2026, 8, 27) + milliseconds).toISOString();
let resourceSequence = 0;

// Positive inputs below are static test fixtures, never browser, user, scientific, or production-performance evidence.
function staticObservation(targetIndex = 0, sequence = targetIndex): MainlineAResourceObservationV633 {
  const row = coverage.records[targetIndex];
  const target = { kind: row.kind, id: row.id, route: row.route.route, assetHash: row.route.assetHash };
  const baseline = copyMainlineAResourceSnapshotV633(getAtlasResourceSnapshot());
  const release = acquireAtlasResource("texture", "atlas", `batch-intake-static-${resourceSequence++}`, {
    owner: "batch-intake-static-test", estimatedBytes: 512,
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

const makeBatch = (history = [staticObservation()]) => createCanonicalBrowserBatchV638(history, build, timestamp(120000));
type StoredRecord = { path: string; sha256: string; bytes: number; runId: string; status: string; sourceRecordIndex: number };
type Intake = {
  status: string; records: StoredRecord[]; selectedRawRecords: string[];
  evaluation: { sourceAuthenticityProven: boolean; verified: number; rejectedRuns: number; missing: string[] };
  replay: { index: { path: string; bytes: number; sha256: string }; replay: { status: string; rawObservations: unknown[]; scientificPayloadWriteback: boolean } } | null;
  boundary: { candidateOnly: boolean; hold: boolean; notAdmitted: boolean; scientificPayloadWriteback: boolean; rightsApproval: boolean };
};

async function staticFiles(batch: CanonicalBrowserBatchV638 = makeBatch()) {
  await mkdir(path.join(root, "tmp"), { recursive: true });
  const directory = await mkdtemp(path.join(root, "tmp", "v638-batch-static-test-"));
  await writeFile(path.join(directory, "STATIC-TEST-FIXTURE.json"), JSON.stringify({
    evidenceClass: "static-test-fixture", browserAuthenticity: false, scientificEvidence: false,
    productionPerformance: false, retainedWithoutDeletion: true,
  }), { flag: "wx" });
  const input = path.join(directory, "bundle.json");
  const body = Buffer.from(JSON.stringify(batch, null, 2) + "\n");
  await writeFile(input, body, { flag: "wx" });
  const buildReceipt = path.join(directory, "build.json");
  await writeFile(buildReceipt, JSON.stringify({ status: "passed", exitCode: 0, sourceStable: true,
    buildId: "static-test-package", runtimeBuildId: build.buildId, branch: build.branch, head: build.head }), { flag: "wx" });
  return { directory, body, batch, options: { root, input, expectedSha256: sha(body), buildReceipt,
    outputDirectory: path.join(directory, "imported"), coverage: coveragePath } };
}

async function readIntake(receipt: { path: string }): Promise<Intake> {
  return JSON.parse(await readFile(path.resolve(root, receipt.path), "utf8")) as Intake;
}

test("static fixtures import all 36 raw strings through the actual V635 index and replay", async () => {
  const bundle = makeBatch(coverage.records.map((_, index) => staticObservation(index)));
  const raw = JSON.parse(bundle.records[0].rawJson) as Record<string, unknown>;
  bundle.records[0].rawJson = `\n${JSON.stringify(raw, null, "\t")}\n`;
  const files = await staticFiles(bundle);
  const result = await importCanonicalBatchV638(files.options);
  assert.equal(result.status, "measured-local");
  assert.equal(result.verified, 36);
  assert.equal(result.retainedRuns, 36);
  const report = await readIntake(result.receipt);
  assert.equal(report.evaluation.sourceAuthenticityProven, false);
  assert.deepEqual(report.boundary, { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false });
  for (const record of report.records) {
    const bytes = await readFile(path.resolve(root, record.path));
    assert.deepEqual(bytes, Buffer.from(bundle.records[record.sourceRecordIndex].rawJson, "utf8"));
    assert.equal(sha(bytes), record.sha256);
    assert.equal(bytes.length, record.bytes);
  }
  assert.deepEqual(await readFile(files.options.input), files.body);
  assert.ok(report.replay?.index, "intake must preserve the V635 index artifact reference");
  const indexed = await readFile(path.resolve(root, report.replay.index.path));
  assert.equal(sha(indexed), report.replay.index.sha256);
  assert.equal(report.replay.replay.status, "measured-local");
  assert.equal(report.replay.replay.rawObservations.length, 36);
  assert.equal(report.replay.replay.scientificPayloadWriteback, false);
});

test("static partial coverage remains incomplete after actual byte extraction and replay", async () => {
  const files = await staticFiles();
  const result = await importCanonicalBatchV638(files.options);
  assert.equal(result.status, "incomplete-local");
  const report = await readIntake(result.receipt);
  assert.equal(report.evaluation.verified, 1);
  assert.equal(report.evaluation.missing.length, 35);
  assert.equal(report.selectedRawRecords.length, 1);
  assert.ok(report.replay);
  assert.notEqual(report.replay.replay.status, "measured-local");
});

test("legacy clock-free raw is retained byte-for-byte but cannot be selected as canonical evidence", async () => {
  const legacy = staticObservation();
  delete legacy.session.frameClock;
  const bundle = makeBatch([legacy]);
  const files = await staticFiles(bundle);
  const result = await importCanonicalBatchV638(files.options);
  assert.equal(result.status, "incomplete-local");
  assert.equal(result.verified, 0);
  const report = await readIntake(result.receipt);
  assert.equal(report.evaluation.rejectedRuns, 1);
  assert.deepEqual(report.selectedRawRecords, []);
  assert.equal(report.records[0].status, "blocked");
  assert.equal(report.replay, null);
  assert.deepEqual(await readFile(path.resolve(root, report.records[0].path)), Buffer.from(bundle.records[0].rawJson));
  assert.deepEqual(await readFile(files.options.input), files.body);
});

test("a later failed retry is retained and reopens a previously complete target", async () => {
  const history = coverage.records.map((_, index) => staticObservation(index));
  const retry = staticObservation(0, 40);
  retry.session.state = "aborted";
  retry.session.issues = ["user-abort"];
  const files = await staticFiles(makeBatch([...history, retry]));
  const result = await importCanonicalBatchV638(files.options);
  const report = await readIntake(result.receipt);
  assert.equal(result.status, "incomplete-local");
  assert.equal(result.retainedRuns, 37);
  assert.equal(result.verified, 35);
  assert.equal(report.evaluation.rejectedRuns, 1);
  assert.equal(report.records[36].status, "blocked");
  assert.equal(report.selectedRawRecords.length, 35);
  assert.ok(!report.selectedRawRecords.includes(report.records[0].path));
  assert.ok(!report.selectedRawRecords.includes(report.records[36].path));
  assert.equal((await readFile(path.resolve(root, report.records[36].path), "utf8")), files.batch.records[36].rawJson);
});

test("an all-aborted batch retains its raw ledger without fabricating a V635 replay", async () => {
  const aborted = staticObservation();
  aborted.session.state = "aborted";
  const files = await staticFiles(makeBatch([aborted]));
  const result = await importCanonicalBatchV638(files.options);
  const report = await readIntake(result.receipt);
  assert.equal(result.status, "incomplete-local");
  assert.equal(report.records.length, 1);
  assert.equal(report.selectedRawRecords.length, 0);
  assert.equal(report.replay, null);
  assert.ok(!(await readdir(files.options.outputDirectory)).includes("index.json"));
});

test("wrong input SHA and replay raw-byte pins are independently rejected", async () => {
  const files = await staticFiles();
  await assert.rejects(importCanonicalBatchV638({ ...files.options, expectedSha256: "0".repeat(64) }), /byte-mismatch/u);
  await assert.rejects(importCanonicalBatchV638({ ...files.options, expectedSha256: "bad" }), /expected-sha-required/u);
  await importCanonicalBatchV638(files.options);
  const indexPath = path.join(files.options.outputDirectory, "index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8")) as { rawObservations: { path: string; sha256: string }[] };
  index.rawObservations[0].sha256 = "f".repeat(64);
  const invalid = Buffer.from(JSON.stringify(index));
  const invalidPath = path.join(files.directory, "wrong-raw-pin.json");
  await writeFile(invalidPath, invalid, { flag: "wx" });
  await assert.rejects(replayCanonicalRuntimeV635({ root, input: invalidPath, expectedSha256: sha(invalid),
    buildReceipt: files.options.buildReceipt, coverage: coveragePath, coverageSha256: CANONICAL_COVERAGE_SHA256_V635 }), /raw-byte/u);
});

test("duplicate IDs and conflicting embedded IDs fail before creating the output directory", async () => {
  for (const duplicate of [true, false]) {
    const bundle = makeBatch([staticObservation(0), staticObservation(1)]);
    bundle.records[1].runId = duplicate ? bundle.records[0].runId : "conflicting-envelope-id";
    const files = await staticFiles(bundle);
    await assert.rejects(importCanonicalBatchV638(files.options), duplicate ? /duplicate-run/u : /run-id-mismatch/u);
    assert.ok(!(await readdir(files.directory)).includes("imported"));
  }
});

test("explicit fixture and synthetic promotions are refused before extraction", async () => {
  for (const metadata of [{ fixture: true }, { synthetic: true }, { origin: "synthetic" }]) {
    const raw = Object.assign(staticObservation(), metadata);
    const files = await staticFiles(makeBatch([raw]));
    await assert.rejects(importCanonicalBatchV638(files.options), /fixture-not-admitted/u);
    assert.ok(!(await readdir(files.directory)).includes("imported"));
  }
});

test("source build mismatch, outside-root paths and existing output are refused without replacement", async () => {
  const bundle = makeBatch();
  bundle.build.head = "b".repeat(40);
  const mismatch = await staticFiles(bundle);
  await assert.rejects(importCanonicalBatchV638(mismatch.options), /build-mismatch/u);
  const files = await staticFiles();
  for (const key of ["input", "buildReceipt", "outputDirectory", "coverage"] as const) {
    await assert.rejects(importCanonicalBatchV638({ ...files.options, [key]: "../outside-batch-test" }), /outside-workspace/u);
  }
  const existing = path.join(files.directory, "existing");
  await mkdir(existing);
  const sentinel = path.join(existing, "sentinel.txt");
  await writeFile(sentinel, "preserve-existing-output", { flag: "wx" });
  await assert.rejects(importCanonicalBatchV638({ ...files.options, outputDirectory: existing }), /EEXIST/u);
  assert.equal(await readFile(sentinel, "utf8"), "preserve-existing-output");
  assert.deepEqual(await readdir(existing), ["sentinel.txt"]);
});

test("CLI requires every binding and rejects repeated, unknown, and valueless options", () => {
  const args = ["--input", "batch.json", "--expected-sha256", "a".repeat(64), "--build-receipt", "build.json",
    "--output-directory", "tmp/import", "--coverage", coveragePath];
  assert.equal(parseCanonicalBatchArgumentsV638(args, root).coverage, coveragePath);
  for (const values of [[], args.slice(0, -2), [...args, "--input", "again"], [...args, "--force", "true"], [...args, "--input"]]) {
    assert.throws(() => parseCanonicalBatchArgumentsV638(values, root));
  }
});
