import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

/**
 * R66 root manifest probe contract tests.
 *
 * These tests exercise only disposable input roots and the read-only probe
 * output.  They do not convert a fixture into root evidence, and they never
 * write the canonical root mirror.
 */

const workspace = path.resolve(process.cwd());
const script = path.join(workspace, "scripts/probe-mainline-a-root-manifest-v626.mjs");
const nextManifest = path.join(workspace, "app/data/mainlineACanonicalCoverageV622.generated.json");

function run(args) {
  return spawnSync(process.execPath, [script, "--json", "--no-write", ...args], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 2 * 1024 * 1024,
  });
}

function report(result) {
  assert.ok(result.stdout, `probe must emit JSON; stderr=${result.stderr}`);
  return JSON.parse(result.stdout);
}

test("canonical root absence is fail-closed and does not infer coverage", () => {
  const before = run([]);
  const value = report(before);
  assert.equal(value.schema, "mainline-a-root-manifest-probe-v626");
  assert.equal(value.status, "blocked");
  assert.equal(value.parity.rootManifestPresent, false);
  assert.equal(value.parity.nextWebManifestPresent, true);
  assert.equal(value.claimsClosed.rootCoverage, false);
  assert.equal(value.claimsClosed.manifestParity, false);
  assert.ok(value.blockers.includes("root-manifest-not-present"));
  assert.equal(value.writes.root, false);
  assert.equal(value.writes.parentGit, false);
  assert.equal(value.boundary.scientificPayloadWriteback, false);
  assert.equal(before.status, 0, "--no-write probe is observational and may report a blocked state");
});

test("--check returns nonzero for an unresolved root manifest gate", () => {
  const result = spawnSync(process.execPath, [script, "--json", "--check"], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 2 * 1024 * 1024,
  });
  const value = report(result);
  assert.notEqual(result.status, 0);
  assert.equal(value.status, "blocked");
  assert.ok(value.gates.some((gate) => gate.id === "root-manifest" && gate.state === "blocked"));
});

test("noncanonical input roots remain blocked even when a fixture contains a copied manifest", async () => {
  const temporary = await mkdtemp(path.join(workspace, "tmp/solar-r66-root-probe-"));
    await writeFile(path.join(temporary, "package.json"), `${JSON.stringify({ name: "solar-sim-viz", type: "module" }, null, 2)}\n`, "utf8");
    await writeFile(path.join(temporary, "mainlineACanonicalCoverageV622.generated.json"), await readFile(nextManifest), "utf8");
    const result = run(["--root", temporary, "--allow-test-root"]);
    const value = report(result);
    assert.equal(value.status, "blocked");
    assert.equal(value.parity.rootManifestPresent, true);
    assert.equal(value.parity.structuralMatch, true);
    assert.ok(value.blockers.includes("root-read-only-boundary"));
    assert.equal(value.writes.root, false);
    assert.equal(value.writes.scientificPayload, false);
});

test("malformed fixture manifest is classified as invalid instead of promoted", async () => {
  const temporary = await mkdtemp(path.join(workspace, "tmp/solar-r66-root-probe-invalid-"));
    await writeFile(path.join(temporary, "package.json"), `${JSON.stringify({ name: "solar-sim-viz", type: "module" }, null, 2)}\n`, "utf8");
    await writeFile(path.join(temporary, "mainline-a-canonical-coverage.json"), JSON.stringify({ schema: "fixture", counts: { stars: 12 } }), "utf8");
    const result = run(["--root", temporary, "--allow-test-root"]);
    const value = report(result);
    assert.equal(value.status, "blocked");
    assert.equal(value.parity.rootManifestPresent, true);
    assert.equal(value.claimsClosed.rootCoverage, false);
    assert.ok(value.blockers.includes("root-manifest-invalid"));
    assert.ok(value.root.manifest.errors.includes("manifest-schema-mismatch"));
});

test("probe rejects an output path outside next-web before any write", () => {
  const result = spawnSync(process.execPath, [script, "--json", "--no-write", "--output", "../root-probe.json"], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /output escapes next-web workspace/i);
});

test("next-web manifest shape is independently validated", () => {
  const result = run([]);
  const value = report(result);
  assert.equal(value.nextWeb.manifest.valid, true);
  assert.equal(value.nextWeb.manifest.counts.total, 36);
  assert.equal(value.nextWeb.manifest.counts.stars, 12);
  assert.equal(value.nextWeb.manifest.counts.nebulae, 12);
  assert.equal(value.nextWeb.manifest.counts.constellations, 12);
  assert.equal(value.nextWeb.manifest.recordCounts.star, 12);
  assert.equal(value.nextWeb.manifest.recordCounts.nebula, 12);
  assert.equal(value.nextWeb.manifest.recordCounts.constellation, 12);
  assert.equal(value.nextWeb.manifest.boundaryValid, true);
  assert.equal(value.nextWeb.manifest.boundary.scientificPayloadWriteback, false);
  assert.equal(value.nextWeb.manifest.boundary.runtimeWrites, false);
  assert.equal(value.nextWeb.manifest.boundary.measurementWrites, false);
});

for (const invalid of [true, null, "false"]) {
  test(`a ${JSON.stringify(invalid)} writeback value cannot be reported as closed`, async () => {
    const temporary = await mkdtemp(path.join(workspace, "tmp/solar-r66-root-probe-boundary-"));
    const manifest = JSON.parse(await readFile(nextManifest, "utf8"));
    manifest.boundary.scientificPayloadWriteback = invalid;
    await writeFile(path.join(temporary, "package.json"), JSON.stringify({ name: "solar-sim-viz" }));
    await writeFile(path.join(temporary, "mainline-a-canonical-coverage.json"), JSON.stringify(manifest));
    const value = report(run(["--root", temporary, "--allow-test-root"]));
    assert.equal(value.root.manifest.valid, false);
    assert.equal(value.root.manifest.boundaryValid, false);
    assert.notEqual(value.root.manifest.boundary.scientificPayloadWriteback, false);
    assert.ok(value.root.manifest.errors.includes("manifest-boundary-open"));
    assert.equal(value.claimsClosed.manifestParity, false);
  });
}
