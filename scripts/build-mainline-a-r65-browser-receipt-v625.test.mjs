import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const script = path.join(root, "scripts/build-mainline-a-r65-browser-receipt-v625.mjs");
const sourceDom = path.join(root, "docs/release/v607/mainline-a-r65-browser-dom-20260922-045-raw.json");
const build = path.join(root, "docs/release/v607/mainline-a-r66-build-20260922-045.json");

async function fixture() {
  const old = JSON.parse(await readFile(sourceDom, "utf8"));
  const buildReport = JSON.parse(await readFile(build, "utf8"));
  const raw = { ...old, rows: old.rows.map((row) => ({ ...row })) };
  return { raw, buildReport };
}

async function runCase(mutator = () => {}, extra = []) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mainline-a-r65-"));
  const input = path.join(directory, "raw.json");
  const output = path.join(directory, "receipt.json");
  const { raw, buildReport } = await fixture();
  mutator(raw, buildReport);
  await writeFile(input, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  const buildPath = path.join(directory, "build.json");
  await writeFile(buildPath, `${JSON.stringify(buildReport, null, 2)}\n`, "utf8");
  const result = spawnSync(process.execPath, [
    script, "--input", input, "--build", buildPath, "--output", output,
    "--base", path.join(directory, "does-not-exist.json"), "--json", ...extra,
  ], { cwd: root, encoding: "utf8" });
  let receipt = null;
  try { receipt = JSON.parse(await readFile(output, "utf8")); } catch { /* blocked cases have no output */ }
  await rm(directory, { recursive: true, force: true });
  return { result, receipt };
}

test("raw DOM contract accepts six unmodified dataset maps without reading a base receipt", async () => {
  const { result, receipt } = await runCase();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.runs, 6);
  assert.equal(summary.desktopRuns, 3);
  assert.equal(summary.mobileRuns, 3);
  assert.equal(summary.resourceEvidence, "digest-only");
  assert.equal(receipt.status, "blocked", "long-run and physical-device gates remain blocked");
  assert.equal(receipt.runs.length, 6);
  assert.equal(receipt.build.runtimeBuildId, receipt.build.buildId);
  assert.equal(receipt.build.artifactBuildIdSource, "passed-build-report");
  assert.ok(receipt.runs.every((run) => run.build.runtimeBuildId === receipt.build.runtimeBuildId));
});

test("resource conversion refuses to manufacture registry or diff subfields", async () => {
  const { result, receipt } = await runCase();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const lifecycle = receipt.runs[0].resources;
  assert.deepEqual(lifecycle.before.fieldsAvailable, ["identityDigest", "revision"]);
  assert.equal(lifecycle.diff.evidenceAvailable, false);
  assert.equal(lifecycle.diff.total, undefined);
  assert.ok(lifecycle.diff.unavailableFields.includes("estimatedGpuBytes"));
  assert.match(receipt.notes.join("\n"), /digest equality alone cannot prove/i);
});

test("forged top-level runtime identity is rejected", async () => {
  const { result } = await runCase((raw) => { raw.buildObservation.mainline_build_id = "forged-runtime"; });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /build-report-runtime-mismatch|build-observation-identity/);
});

test("row runtime identity is checked independently of the top-level marker", async () => {
  const { result } = await runCase((raw) => { raw.rows[2].build_id = "other-runtime"; });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /row-runtime-mismatch/);
});

test("raw capture cannot be rebound to a different artifact sharing the same runtime ID", async () => {
  const { result, receipt } = await runCase((_raw, buildReport) => {
    buildReport.buildId = "different-artifact-with-same-runtime";
  });
  assert.notEqual(result.status, 0);
  assert.equal(receipt, null);
  assert.match(result.stdout, /build-report-artifact-mismatch/);
});

test("conflicting artifact aliases cannot hide a stale raw artifact ID", async () => {
  const { result } = await runCase((raw, buildReport) => {
    raw.buildObservation.artifactBuildId = buildReport.buildId;
    raw.buildObservation.build_artifact_id = "stale-artifact";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /alias-conflict/);
});

test("absent artifact label remains explicitly derived from the build report", async () => {
  const { result, receipt } = await runCase((raw) => {
    delete raw.buildObservation.build_artifact_id;
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(receipt.build.artifactBuildIdSource, "passed-build-report");
});

test("atlas scenario notes do not claim repeat-cycle interaction", async () => {
  const { result, receipt } = await runCase();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(receipt.repeatRuns, 0);
  for (const run of receipt.runs) {
    assert.equal(run.scenario, "atlas");
    assert.ok(run.notes.includes("observed-scenario:atlas"));
    assert.ok(!run.notes.some((note) => note.includes("repeat-cycle")));
  }
});

test("device and viewport mismatches are fail-closed", async () => {
  const { result } = await runCase((raw) => { raw.rows[3].device = "desktop"; });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /device-viewport-mismatch/);
});

test("unknown raw dataset fields are rejected instead of silently discarded", async () => {
  const { result } = await runCase((raw) => { raw.rows[0].madeUpMetric = "1"; });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /unknown-field/);
});

test("unknown root build observation fields are rejected", async () => {
  const { result } = await runCase((raw) => { raw.buildObservation.mainline_fake_marker = "forged"; });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /unknown-field/);
});

test("legacy normalized input without raw build provenance is rejected", async () => {
  const { result } = await runCase((raw) => {
    raw.schema = "mainline-a-browser-performance-dom-observation-v625";
    delete raw.buildObservation;
    delete raw.consoleObservation;
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /input-schema|build-observation|row-field-missing/);
});

test("blocked row is represented as blocked without inventing a successful sample", async () => {
  const { result, receipt } = await runCase((raw) => { raw.rows[1].run_status = "blocked"; });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(receipt.runs[1].status, "blocked");
  assert.ok(receipt.blockers.includes("row-observation-blocked"));
  assert.ok(receipt.runs[1].notes.includes("blocker:run-status-not-complete"));
});

test("missing numeric values are rejected rather than defaulted to zero", async () => {
  const { result } = await runCase((raw) => { delete raw.rows[0].frame_samples; });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /row-field-missing|number-required/);
});

test("DOMStringMap under-50MsRatio spelling is accepted without rewriting raw rows", async () => {
  const { result, receipt } = await runCase((raw) => {
    for (const row of raw.rows) {
      row["under-50MsRatio"] = row.under_50_ms_ratio;
      delete row.under_50_ms_ratio;
    }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(receipt.runs.length, 6);
  assert.equal(receipt.runs[0].frame.under50MsRatio, 1);
});

test("near-miss under-50msRatio spelling remains an unknown raw field", async () => {
  const { result } = await runCase((raw) => {
    for (const row of raw.rows) {
      row["under-50msRatio"] = row.under_50_ms_ratio;
      delete row.under_50_ms_ratio;
    }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /unknown-field/);
});

test("--check verifies the saved receipt against raw and build hashes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mainline-a-r65-check-"));
  const input = path.join(directory, "raw.json");
  const output = path.join(directory, "receipt.json");
  const buildPath = path.join(directory, "build.json");
  const { raw, buildReport } = await fixture();
  await writeFile(input, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  await writeFile(buildPath, `${JSON.stringify(buildReport, null, 2)}\n`, "utf8");
  const args = [script, "--input", input, "--build", buildPath, "--output", output, "--json"];
  const generated = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr || generated.stdout);
  const checked = spawnSync(process.execPath, [...args, "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  const saved = JSON.parse(await readFile(output, "utf8"));
  saved.runs[0].frame.sampleCount += 1;
  await writeFile(output, `${JSON.stringify(saved, null, 2)}\n`, "utf8");
  const tampered = spawnSync(process.execPath, [...args, "--check"], { cwd: root, encoding: "utf8" });
  assert.notEqual(tampered.status, 0);
  assert.match(tampered.stdout, /saved-digest|saved-content/);
  await rm(directory, { recursive: true, force: true });
});
