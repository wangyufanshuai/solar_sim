import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile, mkdir, symlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import {
  BOUNDARY, buildBinding, captureCurrentInputs, createAlignmentReport, loadEvidenceInput,
  parseArguments, relativePath, sha256, verifyBuildSnapshot, verifyEvidenceIndex,
  verifyR65LongRunBindingV645, writeExclusiveJson,
} from "./mainline-a-release-evidence.mjs";
import { makeFixture } from "./mainline-a-release.test-support.mjs";

async function writeLongRunUnitObservations(f) {
  const registryUrl = pathToFileURL(path.resolve(import.meta.dirname, "../app/lib/atlasResourceLifecycle.ts")).href;
  const source = `const module=await import(${JSON.stringify(registryUrl)});
    const {acquireAtlasResource,getAtlasResourceSnapshot}=module.default??module;
    const baseline=structuredClone(getAtlasResourceSnapshot());
    const release=acquireAtlasResource('model','atlas','unit-only-resource',{owner:'unit-not-browser',estimatedBytes:128});
    const active=structuredClone(getAtlasResourceSnapshot());release();
    console.log(JSON.stringify([baseline,active,getAtlasResourceSnapshot()]));`;
  const child = spawnSync(process.execPath, ["--import", pathToFileURL(path.resolve(import.meta.dirname, "../node_modules/tsx/dist/loader.mjs")).href, "--input-type=module", "--eval", source], {
    cwd: f.workspace, encoding: "utf8", windowsHide: true,
  });
  assert.equal(child.status, 0, child.stderr);
  const snapshots = JSON.parse(child.stdout);
  f.identity.head = "a".repeat(40);
  await f.put("build", { ...f.values.build, head: f.identity.head });
  const refs = [];
  for (let index = 0; index < 2; index += 1) {
    const start = Date.parse("2026-09-27T00:00:00.000Z") + index * 3_600_000;
    const iso = (offset) => new Date(start + offset).toISOString();
    const raw = {
      schema: "mainline-a-resource-observation-v633", runId: `unit-fixture-not-browser-${index}`,
      build: { buildId: f.identity.runtimeBuildId, head: f.identity.head, branch: f.identity.branch },
      viewport: { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" },
      startedAt: iso(0), endedAt: iso(1_800_000),
      checkpoints: ["baseline", "active", "returned"].map((phase, i) => ({
        phase, capturedAt: iso(i * 900_000), elapsedMs: i * 900_000, scene: i === 1 ? "inspect" : "atlas", snapshot: snapshots[i],
      })),
      frameSummary: { sampleCount: 108000, totalMs: 1_800_000, minMs: 10, p50Ms: 16, p95Ms: 20, maxMs: 30 },
      memory: { source: "unavailable", beforeBytes: null, afterBytes: null },
      visibility: { startedVisible: true, endedVisible: true, interruptions: 0 },
      session: {
        state: "finished", requestedDurationMs: 1_800_000, durationSatisfied: true, issues: [], physicalMobile: "not-run",
        frameSummarySource: "requestAnimationFrame", frameSummaryMethod: "exact-samples",
        frameClock: { source: "document-timeline", sessionStartMs: 0, callbackCount: 108001, acceptedCount: 108001,
          firstCallbackMs: 0, firstAcceptedMs: 0, lastAcceptedMs: 1_800_000,
          skippedBeforeStartCount: 0, rejectedCount: 0, rejections: [] },
        timeline: ["baseline", "active", "returned", "finished"].map((event, i) => ({ elapsedMs: Math.min(i, 2) * 900_000, event, scene: i === 1 ? "inspect" : "atlas" })),
      },
      boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    };
    const bytes = JSON.stringify(raw);
    const relative = `docs/long-unit-${index}.json`;
    await writeFile(path.join(f.workspace, relative), bytes, { flag: "wx" });
    refs.push({ path: relative, sha256: sha256(bytes) });
  }
  return refs;
}

test("an explicit build wins despite a numerically later historical R66 filename", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "docs/mainline-a-r66-build-999.json"), JSON.stringify({ ...f.values.build, buildId: "old" }));
  const result = await loadEvidenceInput(f.workspace, "input.json");
  assert.equal(result.build.buildId, "test-build-055");
  assert.deepEqual(result.buildProblems, []);
});

test("missing evidence input does not fall back to directory search", async () => {
  const f = await makeFixture();
  await assert.rejects(loadEvidenceInput(f.workspace), /explicit-evidence-input-required/u);
});

test("current source drift invalidates a previously stable build", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "app/page.tsx"), "export default () => 'changed';\n");
  const result = await loadEvidenceInput(f.workspace, "input.json");
  assert.ok(result.buildProblems.includes("current-source-build-mismatch"));
});

test("a newly added production source invalidates the snapshot", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "app/new.ts"), "export const added = 1;\n");
  assert.ok((await loadEvidenceInput(f.workspace, "input.json")).buildProblems.includes("current-source-build-mismatch"));
});

test("tests do not change the production input snapshot", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "app/new.test.ts"), "export const testOnly = 1;\n");
  assert.equal((await captureCurrentInputs(f.workspace)).sha256, f.snapshot.sha256);
});

test("changed raw bytes are rejected even if surrounding receipt is unchanged", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "docs/raw.bin"), "original");
  await f.put("sourceArtifacts", { rawImages: [{ id: "nebula", path: "docs/raw.bin", sha256: sha256("original") }] }, "external-source");
  await loadEvidenceInput(f.workspace, "input.json");
  await writeFile(path.join(f.workspace, "docs/raw.bin"), "modified");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /evidence-sha-mismatch/u);
});

test("changed receipt bytes do not pass using a stored digest", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "docs/http.json"), "{}");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /evidence-sha-mismatch:http/u);
});

test("cross build, missing artifact identity, and retracted evidence fail binding", () => {
  const build = { buildId: "artifact", runtimeBuildId: "runtime", head: "head", branch: "branch" };
  assert.equal(buildBinding({ ...build }, build).bound, true);
  assert.equal(buildBinding({ ...build, buildId: "old" }, build).bound, false);
  assert.equal(buildBinding({ ...build, buildId: undefined }, build).bound, false);
  assert.equal(buildBinding({ ...build, retracted: true }, build).bound, false);
});

test("R65 V643 two-run evidence binds its runtime marker only after offline replay", () => {
  const build = { buildId: "artifact-build", runtimeBuildId: "mainline-a-0123456789abcdef", branch: "codex/mainline", head: "a".repeat(40) };
  const receipt = {
    schema: "mainline-a-r65-long-run-v643", status: "qualified",
    build: { buildId: build.runtimeBuildId, runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head, route: "/" },
    claims: { twoIndependentLongRuns: true, desktopViewport: true, mobileViewport: true, resourceLifecycle: true,
      physicalMobile: false, productionPerformance: false, realUserValidation: false,
      scientificValidity: false, copyrightApproval: false },
    boundary: { scientificPayloadWriteback: false },
  };
  const digest = "b".repeat(64);
  const offline = {
    sourceSha256: digest, receiptSchema: receipt.schema,
    inputVerification: { ok: true },
    verification: { ok: true, status: "qualified", completeLongRuns: 2, devices: ["desktop", "mobile"], independentKeys: ["one", "two"] },
    replaySummary: { status: "verified" }, classification: { performance: "qualified" },
    claims: { qualified: true, productionPerformance: false, realUserValidation: false, physicalMobile: false },
  };
  assert.equal(verifyR65LongRunBindingV645(receipt, build, offline, digest).status, "passed");
  assert.ok(verifyR65LongRunBindingV645(receipt, build, { ...offline, sourceSha256: "c".repeat(64) }, digest).problems.includes("r65-long-run:offline-replay-invalid"));
  assert.ok(verifyR65LongRunBindingV645(receipt, build, { ...offline, inputVerification: { ok: false } }, digest).problems.includes("r65-long-run:offline-replay-invalid"));
  assert.ok(verifyR65LongRunBindingV645({ ...receipt, build: { ...receipt.build, head: "old" } }, build, offline, digest).problems.includes("r65-long-run:build-identity-mismatch"));
  assert.ok(verifyR65LongRunBindingV645({ ...receipt, claims: { ...receipt.claims, productionPerformance: true } }, build, offline, digest).problems.includes("r65-long-run:claim-boundary-invalid"));
  assert.ok(verifyR65LongRunBindingV645(receipt, build, { ...offline, verification: { ...offline.verification, independentKeys: ["one", "one"] } }, digest).problems.includes("r65-long-run:offline-replay-invalid"));
});

test("V633 permission blocked attempts never pass browser, visual, or performance", async () => {
  const f = await makeFixture();
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  evidence.input.mode = "candidate";
  const report = await createAlignmentReport(f.workspace, evidence, {});
  for (const id of ["desktop-browser", "mobile-viewport", "visual", "performance", "lifecycle"]) {
    assert.notEqual(report.gates.find((row) => row.id === id).state, "passed");
  }
  assert.notEqual(report.gates.find((row) => row.id === "http").state, "passed");
  assert.equal(report.rightsClosure.signedItems, 0);
});

test("a forged passed browser wrapper cannot override the tool error", async () => {
  const f = await makeFixture();
  await f.put("browser", { ...f.values.browser, schema: "mainline-a-browser-evidence-v633", status: "passed", desktop: { status: "passed" } }, "browser");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  evidence.input.mode = "candidate";
  const report = await createAlignmentReport(f.workspace, evidence, {});
  assert.equal(report.gates.find((row) => row.id === "desktop-browser").state, "not-run");
});

test("fixture mode remains closed despite complete transport identity", async () => {
  const f = await makeFixture();
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.candidatePackageAllowed, false);
  assert.ok(report.blockers.includes("fixture-not-admitted"));
  assert.equal(report.boundary.scientificPayloadWriteback, false);
});

test("an explicit fixture transport cannot be promoted by relabeling the input candidate", async () => {
  const f = await makeFixture();
  f.input.mode = "candidate";
  await f.put("stellarRaw", { transport: "fixture-replay", scientificPayloadWriteback: false }, "external-source");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /fixture-evidence-not-admitted/u);
});

test("scientific writeback in a nested ledger is rejected", async () => {
  const f = await makeFixture();
  f.input.mode = "candidate";
  await f.put("sourceRights", { rows: [{ scientificPayloadWriteback: true }] }, "external-source");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /evidence-boundary-open/u);
});

test("canonical files and extension raw images are counted separately with disjoint IDs", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "docs/image.bin"), "image");
  const digest = sha256("image");
  await f.put("coverage", { records: [{ id: "m42", kind: "nebula", route: { assetPath: "docs/image.bin", assetHash: digest } }] });
  await f.put("canonicalAssets", { rows: [{ id: "m42", sha256: digest }] }, "http");
  await f.put("sourceArtifacts", { rawImages: [{ id: "m42", path: "docs/image.bin", sha256: digest }, { id: "new-nebula", path: "docs/image.bin", sha256: digest }] }, "external-source");
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.sourceClosure.canonicalRawOrRuntimeFilesVerified, 1);
  assert.equal(report.sourceClosure.extensionRawFilesVerified, 1);
  assert.equal(report.sourceClosure.extensionRawImagesVerified, 0);
  assert.equal(report.sourceClosure.totalDistinctVerified, 1);
  assert.notEqual(report.gates.find((row) => row.id === "nebula-file-integrity").state, "passed");
});

test("exclusive output preserves pre-existing historical bytes", async () => {
  const f = await makeFixture();
  const output = "docs/receipt.json";
  await writeFile(path.join(f.workspace, output), "historical");
  await assert.rejects(writeExclusiveJson(f.workspace, output, { replaced: true }), /EEXIST/u);
  assert.equal(await readFile(path.join(f.workspace, output), "utf8"), "historical");
});

test("path traversal and unknown evidence roles are rejected", async () => {
  const f = await makeFixture();
  assert.throws(() => relativePath(f.workspace, "../outside.json"), /outside-workspace/u);
  f.input.entries.unknown = f.input.entries.build;
  await f.save();
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /evidence-role-unknown/u);
});

test("symlink evidence cannot traverse workspace boundaries", async () => {
  const f = await makeFixture();
  const target = path.join(f.workspace, "target");
  await mkdir(target);
  await symlink(target, path.join(f.workspace, "linked"), "junction");
  await writeFile(path.join(target, "raw.bin"), "data");
  f.input.artifacts = [{ path: "linked/raw.bin", sha256: sha256("data"), evidenceClass: "static" }];
  await f.save();
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /symlink-rejected/u);
});

test("index replay rejects omitted SHA and duplicate file rows", async () => {
  const f = await makeFixture();
  const result = await loadEvidenceInput(f.workspace, "input.json");
  assert.equal((await verifyEvidenceIndex(f.workspace, result.index)).status, "verified");
  await assert.rejects(verifyEvidenceIndex(f.workspace, [result.index[0], result.index[0]]), /path-duplicate/u);
  await assert.rejects(verifyEvidenceIndex(f.workspace, [{ ...result.index[0], sha256: null }]), /sha-missing/u);
});

test("source manifest cannot authenticate itself with a dishonest count", async () => {
  const f = await makeFixture();
  const build = structuredClone(f.values.build);
  build.inputBefore.count += 1;
  assert.ok(verifyBuildSnapshot(build, f.snapshot).includes("build-input-manifest-digest-mismatch"));
});

test("arguments require explicit values and reject duplicate pins", () => {
  assert.throws(() => parseArguments(["--evidence-input"], ["evidence-input"]), /value-missing/u);
  assert.throws(() => parseArguments(["--output", "a", "--output", "b"], ["output"]), /duplicate-argument/u);
  assert.deepEqual(BOUNDARY.scientificPayloadWriteback, false);
});

test("forged stellar summary counters never confirm component identity", async () => {
  const f = await makeFixture();
  await f.put("stellarRaw", { records: [], counts: { total: 4, responseCaptured: 4 } }, "external-source");
  await f.put("stellarStructured", { records: [{ id: "acrux", componentIdentityStatus: "unresolved" }], counts: { total: 4, parsedCandidate: 4, componentConfirmed: 4 } }, "external-source");
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.sourceClosure.stellarRawResponses, 0);
  assert.equal(report.sourceClosure.stellarStructuredCandidates, 0);
  assert.equal(report.sourceClosure.stellarComponentConfirmed, 0);
  assert.ok(report.sourceClosure.stellarSummary.issues.includes("stellar-component-summary-mismatch"));
  assert.equal(report.gates.find((row) => row.id === "stellar-component-identity").state, "blocked");
});

test("canonical counts cannot conceal duplicate IDs or a missing actual kind", async () => {
  const f = await makeFixture();
  await f.put("coverage", { counts: { stars: 12, nebulae: 12, constellations: 12 }, records: Array.from({ length: 36 }, () => ({ id: "duplicate", kind: "star" })) });
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.gates.find((row) => row.id === "canonical-coverage").state, "blocked");
});

test("same-build summary wrappers cannot substitute for HTTP, browser or performance raw evidence", async () => {
  const f = await makeFixture();
  await f.put("browser", { ...f.identity, schema: "mainline-a-browser-evidence-v633", status: "passed", desktop: { status: "passed" }, mobileViewport: { status: "passed" } }, "browser");
  await f.put("performance", { ...f.identity, status: "passed", runs: [{ status: "complete", rawObservation: { sha256: "not-even-a-sha" } }] }, "performance");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  evidence.input.mode = "candidate";
  const report = await createAlignmentReport(f.workspace, evidence, {});
  for (const id of ["http", "desktop-browser", "mobile-viewport", "performance"]) assert.notEqual(report.gates.find((row) => row.id === id).state, "passed");
});

test("HTTP assets are rehashed from the expected build files, never an all-true summary", async () => {
  const f = await makeFixture();
  await mkdir(path.join(f.workspace, "docs/stage/static"), { recursive: true });
  await writeFile(path.join(f.workspace, "docs/stage/static/chunk.js"), "chunk-bytes");
  await f.put("build", { ...f.values.build, distDir: "docs/stage" });
  const hash = sha256("chunk-bytes");
  const base = "http://127.0.0.1:3057";
  await f.put("http", { ...f.values.http, schema: "mainline-a-http-evidence-v626", htmlBytes: 100,
    url: base, pageFinalUrl: `${base}/`, healthFinalUrl: `${base}/api/health`, pageRedirected: false, healthRedirected: false,
    buildReportValid: true, buildReportError: null, sourceReport: "docs/build.json",
    scriptAssets: [{ src: "/_next/static/chunk.js", status: 200, bytes: 11, expectedBytes: 11, sha256: hash, expectedSha256: hash,
      expectedPath: "docs/stage/static/chunk.js", matchesBuild: true, error: null, redirected: false, finalUrl: `${base}/_next/static/chunk.js` }] }, "http");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  evidence.input.mode = "candidate";
  assert.equal((await createAlignmentReport(f.workspace, evidence, {})).gates.find((row) => row.id === "http").state, "passed");
  await writeFile(path.join(f.workspace, "docs/stage/static/chunk.js"), "tampered");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /sha-mismatch/u);
});

test("fixture markers in indirectly referenced JSON are rejected", async () => {
  const f = await makeFixture();
  const bytes = JSON.stringify({ fixture: true, status: "passed" });
  await writeFile(path.join(f.workspace, "docs/indirect.json"), bytes);
  f.input.mode = "candidate";
  await f.put("sourceArtifacts", { capture: { path: "docs/indirect.json", sha256: sha256(bytes) } }, "external-source");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /fixture-evidence-not-admitted/u);
});

test("hash-valid malformed resource observations fail the V633 raw replay", async () => {
  const f = await makeFixture();
  await writeFile(path.join(f.workspace, "docs/resource.json"), "{}");
  const ref = { path: "docs/resource.json", sha256: sha256("{}") };
  await f.put("performance", { ...f.identity, status: "passed", rawObservations: [ref] }, "performance");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  evidence.input.mode = "candidate";
  const report = await createAlignmentReport(f.workspace, evidence, {});
  assert.deepEqual(report.resourceReplay.performance, []);
  assert.notEqual(report.gates.find((row) => row.id === "performance").state, "passed");
});

test("long-run remains not-run without its explicit input even if another receipt claims repetition", async () => {
  const f = await makeFixture();
  await f.put("performance", { ...f.identity, status: "passed", repeatCount: 20, durationMs: 3_600_000, longRunPassed: true }, "performance");
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.gates.find((row) => row.id === "long-run").state, "not-run");
  assert.equal(report.resourceReplay.longRunEvaluation.runCount, 0);
});

test("longRun and canonicalRuntime require their exact evidence classes", async () => {
  for (const role of ["longRun", "canonicalRuntime"]) {
    const f = await makeFixture();
    await f.put(role, { ...f.identity, status: "not-run" }, "static");
    await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /role-class-mismatch/u);
  }
});

test("long-run wrapper summaries cannot bypass raw replay or browser denial", async () => {
  const f = await makeFixture();
  await f.put("longRun", { ...f.identity, status: "passed", durationMs: 3_600_000, repeatCount: 2, rawObservations: [] }, "performance");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  evidence.input.mode = "candidate";
  const report = await createAlignmentReport(f.workspace, evidence, {});
  assert.equal(report.gates.find((row) => row.id === "long-run").state, "blocked");
  assert.ok(report.resourceReplay.longRunEvaluation.issues.includes("long-run:browser-device-not-observed"));
  assert.ok(report.resourceReplay.longRunEvaluation.issues.includes("long-run:two-independent-runs-required"));
});

test("long-run raw references are rehashed and malformed raw never gains a replay summary", async () => {
  const f = await makeFixture();
  const raw = Buffer.from('{"status":"measured-local","durationMs":1800000}');
  await writeFile(path.join(f.workspace, "docs/long-raw.json"), raw, { flag: "wx" });
  const ref = { path: "docs/long-raw.json", sha256: sha256(raw) };
  await f.put("longRun", { ...f.identity, status: "passed", rawObservations: [ref, ref] }, "performance");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  const report = await createAlignmentReport(f.workspace, evidence);
  assert.deepEqual(report.resourceReplay.longRun, []);
  assert.notEqual(report.gates.find((row) => row.id === "long-run").state, "passed");
  await writeFile(path.join(f.workspace, "docs/long-raw.json"), "changed");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /evidence-sha-mismatch/u);
});

test("canonical runtime is explicit, indexes nested raw references, and does not trust wrapper counts", async () => {
  const f = await makeFixture();
  await f.put("coverage", { records: [] });
  await writeFile(path.join(f.workspace, "docs/canonical-raw.json"), "{}", { flag: "wx" });
  const rawReference = { path: "docs/canonical-raw.json", sha256: sha256("{}") };
  await f.put("canonicalRuntime", { ...f.identity, status: "passed", counts: { star: 12, nebula: 12, constellation: 12 }, rawObservations: [rawReference] }, "browser");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  assert.ok(evidence.index.some((row) => row.path === rawReference.path));
  const report = await createAlignmentReport(f.workspace, evidence);
  assert.equal(report.gates.find((row) => row.id === "canonical-runtime").state, "blocked");
  await writeFile(path.join(f.workspace, "docs/canonical-raw.json"), "changed");
  await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /evidence-sha-mismatch/u);
});

test("nested long-run and canonical fixtures cannot be promoted with a candidate wrapper", async () => {
  for (const [role, field, evidenceClass] of [["longRun", "rawObservations", "performance"], ["canonicalRuntime", "rawObservations", "browser"]]) {
    const f = await makeFixture();
    f.input.mode = "candidate";
    const bytes = JSON.stringify({ fixture: true, status: "measured-local" });
    await writeFile(path.join(f.workspace, "docs/fixture.json"), bytes, { flag: "wx" });
    await f.put(role, { ...f.identity, status: "passed", [field]: [{ path: "docs/fixture.json", sha256: sha256(bytes) }] }, evidenceClass);
    await assert.rejects(loadEvidenceInput(f.workspace, "input.json"), /fixture-evidence-not-admitted/u);
  }
});

test("complete raw replays still cannot pass fixture and denied-browser release gates", async () => {
  const f = await makeFixture();
  const refs = await writeLongRunUnitObservations(f);
  await f.put("longRun", { ...f.identity, status: "passed", rawObservations: refs }, "performance");
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  const report = await createAlignmentReport(f.workspace, evidence);
  assert.equal(report.resourceReplay.longRun.length, 2);
  assert.equal(report.resourceReplay.longRun.every((row) => row.observationSummary.durationMs === 1_800_000), true);
  assert.ok(report.resourceReplay.longRunEvaluation.issues.includes("long-run:fixture-not-admitted"));
  assert.ok(report.resourceReplay.longRunEvaluation.issues.includes("long-run:browser-device-not-observed"));
  assert.equal(report.gates.find((row) => row.id === "long-run").state, "blocked");
  evidence.input.mode = "candidate";
  const candidate = await createAlignmentReport(f.workspace, evidence, {});
  assert.equal(candidate.gates.find((row) => row.id === "long-run").state, "blocked");
});

test("release recomputation rejects duplicated valid raw observations rather than trusting runCount", async () => {
  const f = await makeFixture();
  const refs = await writeLongRunUnitObservations(f);
  await f.put("longRun", { ...f.identity, status: "passed", runCount: 2, rawObservations: [refs[0], refs[0]] }, "performance");
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.resourceReplay.longRun.length, 2);
  assert.ok(report.resourceReplay.longRunEvaluation.issues.includes("long-run:duplicate-run-id"));
  assert.ok(report.resourceReplay.longRunEvaluation.issues.includes("long-run:duplicate-raw-sha256"));
  assert.equal(report.gates.find((row) => row.id === "long-run").state, "blocked");
});

test("a wrapper for a different artifact cannot rebind otherwise valid long-run raw files", async () => {
  const f = await makeFixture();
  const refs = await writeLongRunUnitObservations(f);
  await f.put("longRun", { ...f.identity, buildId: "another-artifact", status: "passed", rawObservations: refs }, "performance");
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.resourceReplay.longRun.length, 2);
  const gate = report.gates.find((row) => row.id === "long-run");
  assert.equal(gate.state, "blocked");
  assert.ok(gate.blockers.includes("receipt-build-mismatch:buildId"));
});
