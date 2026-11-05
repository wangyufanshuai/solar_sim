import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

/**
 * R66 V627 input-audit tests.  Temporary roots are parser fixtures only;
 * none is written into the canonical root and no fixture is emitted as
 * release or scientific evidence.
 */

const workspace = path.resolve(process.cwd());
const script = path.join(workspace, "scripts/audit-mainline-a-root-source-v627.mjs");

function run(args = []) {
  const result = spawnSync(process.execPath, [script, "--json", "--no-write", ...args], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 4 * 1024 * 1024,
  });
  return { ...result, report: JSON.parse(result.stdout) };
}

async function fixture(label, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), `solar-r66-v627-${label}-`));
  const packageName = options.packageName ?? "solar-sim-viz";
  await writeFile(path.join(root, "package.json"), `${JSON.stringify({
    name: packageName,
    private: true,
    type: "module",
    mainlineAReleaseIdentity: options.releaseIdentity,
    scripts: { build: "vite build" },
  }, null, 2)}\n`, "utf8");
  await writeFile(path.join(root, "package-lock.json"), `${JSON.stringify({
    name: packageName,
    lockfileVersion: 3,
    packages: { "": { name: packageName } },
  }, null, 2)}\n`, "utf8");
  await writeFile(path.join(root, "index.html"), "<!doctype html><html><body><div id=app></div></body></html>\n", "utf8");
  await writeFile(path.join(root, "vite.config.js"), "export default {};\n", "utf8");
  if (options.source !== false) {
    await import("node:fs/promises").then(({ mkdir }) => mkdir(path.join(root, "src"), { recursive: true }));
    await writeFile(path.join(root, "src", "main.js"), options.sourceText ?? "export const rootMirror = true;\n", "utf8");
  }
  if (options.manifest) {
    await writeFile(path.join(root, "mainline-a-canonical-coverage.json"), `${JSON.stringify(options.manifest)}\n`, "utf8");
  }
  return root;
}

async function dispose(root) {
  await rm(root, { recursive: true, force: true });
}

test("canonical root inventory is read-only and records the missing manifest", () => {
  const result = run(["--root", path.resolve(workspace, "../web")]);
  assert.equal(result.report.schema, "mainline-a-root-source-audit-v627");
  assert.equal(result.report.status, "blocked");
  assert.ok(result.report.root.inventory.fileCount > 0);
  assert.equal(result.report.root.manifests.length, 0);
  assert.ok(result.report.blockers.includes("root-manifest-not-observed"));
  assert.equal(result.report.claimsClosed.rootCoverage, false);
  assert.equal(result.report.writes.root, false);
  assert.equal(result.report.writes.parentGit, false);
  assert.equal(result.report.boundary.scientificPayloadWriteback, false);
});

test("canonical root package and lock identities are independently captured", () => {
  const result = run(["--root", path.resolve(workspace, "../web")]);
  assert.equal(result.report.root.package.packageName, "solar-sim-viz");
  assert.equal(result.report.root.package.releaseIdentity, "solar-sim-mainline-a");
  assert.equal(result.report.root.packageLock.packageName, "solar-sim-viz");
  assert.equal(result.report.gates.find((gate) => gate.id === "root-package-identity").state, "passed");
});

test("source markers are observations and do not become coverage", () => {
  const result = run(["--root", path.resolve(workspace, "../web")]);
  assert.equal(result.report.root.source.hasMainlineMarkers, false);
  assert.equal(result.report.root.source.hasCanonicalMarkers, false);
  assert.equal(result.report.claimsClosed.rootCoverage, false);
  assert.equal(result.report.claimsClosed.manifestParity, false);
});

test("noncanonical fixture root remains blocked even when test mode is enabled", async () => {
  const root = await fixture("fixture-boundary", { releaseIdentity: "solar-sim-mainline-a" });
  try {
    const result = run(["--root", root, "--allow-test-root"]);
    assert.equal(result.report.status, "blocked");
    assert.ok(result.report.blockers.includes("root-manifest-not-observed"));
    assert.equal(result.report.workspaceBoundary.readOnlyInput, true);
    assert.equal(result.report.claimsClosed.rootCoverage, false);
  } finally { await dispose(root); }
});

test("wrong package name fails closed without inferring a manifest", async () => {
  const root = await fixture("wrong-package", { packageName: "untrusted-mirror", releaseIdentity: "solar-sim-mainline-a" });
  try {
    const result = run(["--root", root, "--allow-test-root"]);
    assert.ok(result.report.blockers.includes("root-package-identity-mismatch"));
    assert.ok(result.report.blockers.includes("root-manifest-not-observed"));
    assert.equal(result.report.root.manifests.length, 0);
  } finally { await dispose(root); }
});

test("wrong release identity is not repaired from the package name", async () => {
  const root = await fixture("wrong-release", { releaseIdentity: "untrusted-release" });
  try {
    const result = run(["--root", root, "--allow-test-root"]);
    assert.ok(result.report.blockers.includes("root-release-identity-mismatch"));
    assert.equal(result.report.root.package.releaseIdentity, "untrusted-release");
  } finally { await dispose(root); }
});

test("invalid candidate manifest is listed with schema errors", async () => {
  const root = await fixture("invalid-manifest", { releaseIdentity: "solar-sim-mainline-a", manifest: { schema: "fixture", counts: { stars: 12 } } });
  try {
    const result = run(["--root", root, "--allow-test-root"]);
    assert.equal(result.report.root.manifests.length, 1);
    assert.equal(result.report.root.manifests[0].valid, false);
    assert.ok(result.report.root.manifests[0].errors.includes("manifest-schema-mismatch"));
    assert.ok(result.report.blockers.includes("root-manifest-invalid"));
    assert.equal(result.report.claimsClosed.rootCoverage, false);
  } finally { await dispose(root); }
});

test("a copied valid-shaped fixture is never treated as canonical without a real path", async () => {
  const manifest = {
    schema: "mainline-a-canonical-coverage-v622",
    counts: { total: 36, stars: 12, nebulae: 12, constellations: 12 },
    records: Array.from({ length: 36 }, (_, index) => ({ id: `fixture-${index}`, kind: index < 12 ? "star" : index < 24 ? "nebula" : "constellation" })),
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
  };
  const root = await fixture("copied-fixture", { releaseIdentity: "solar-sim-mainline-a", manifest });
  try {
    const result = run(["--root", root, "--allow-test-root"]);
    assert.equal(result.report.root.manifests[0].valid, true);
    assert.equal(result.report.claimsClosed.rootCoverage, true);
    assert.equal(result.report.claimsClosed.manifestParity, false);
    assert.equal(result.report.boundary.scientificPayloadWriteback, false);
    assert.equal(result.report.notes.some((note) => /copied fixtures/i.test(note)), true);
  } finally { await dispose(root); }
});

test("source inventory captures deterministic file hashes and marker counts", async () => {
  const root = await fixture("markers", { releaseIdentity: "solar-sim-mainline-a", sourceText: "export const mainlineA = 'candidate-only'; const nebula = 'hold';\n" });
  try {
    const result = run(["--root", root, "--allow-test-root"]);
    assert.equal(result.report.root.source.hasMainlineMarkers, true);
    assert.equal(result.report.root.source.markerTotals.nebula, 1);
    assert.ok(result.report.root.inventory.inventorySha256.length === 64);
    const paths = result.report.root.inventory.files.map((file) => file.path);
    assert.deepEqual(paths, [...paths].sort((left, right) => left.localeCompare(right)));
  } finally { await dispose(root); }
});

test("binary public assets receive hashes without text marker interpretation", async () => {
  const root = await fixture("binary", { releaseIdentity: "solar-sim-mainline-a" });
  try {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(root, "public"), { recursive: true });
    await writeFile(path.join(root, "public", "nebula.png"), Buffer.from([0, 1, 2, 3, 255]));
    const result = run(["--root", root, "--allow-test-root"]);
    const asset = result.report.root.inventory.files.find((file) => file.path === "public/nebula.png");
    assert.ok(asset);
    assert.equal(asset.binary, true);
    assert.equal(asset.markers.length, 0);
    assert.equal(asset.sha256.length, 64);
  } finally { await dispose(root); }
});

test("output path validation rejects writes outside next-web", () => {
  const result = spawnSync(process.execPath, [script, "--json", "--output", "../root-source-audit.json"], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /output escapes next-web workspace/i);
});

test("check mode returns nonzero for the real unresolved root gate", () => {
  const result = spawnSync(process.execPath, [script, "--json", "--check"], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const report = JSON.parse(result.stdout);
  assert.notEqual(result.status, 0);
  assert.equal(report.status, "blocked");
  assert.ok(report.gates.some((gate) => gate.id === "root-canonical-manifest" && gate.state === "blocked"));
});

test("no-write mode leaves a pre-existing output untouched", async () => {
  const target = path.join(workspace, "docs/release/v607/mainline-a-r66-root-source-audit-v627-test-sentinel.json");
  await writeFile(target, "sentinel\n", "utf8");
  try {
    const result = run(["--output", target]);
    assert.equal(result.report.writes.output, false);
    assert.equal(await readFile(target, "utf8"), "sentinel\n");
  } finally { await rm(target, { force: true }); }
});

test("inventory is bounded and does not walk node_modules or dist", async () => {
  const root = await fixture("ignored", { releaseIdentity: "solar-sim-mainline-a" });
  try {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.join(root, "node_modules", "fake"), { recursive: true });
    await mkdir(path.join(root, "dist", "fake"), { recursive: true });
    await writeFile(path.join(root, "node_modules", "fake", "mainline.js"), "nebula\n", "utf8");
    await writeFile(path.join(root, "dist", "fake", "canonical.js"), "canonical\n", "utf8");
    const result = run(["--root", root, "--allow-test-root"]);
    const paths = result.report.root.inventory.files.map((file) => file.path);
    assert.equal(paths.some((entry) => entry.startsWith("node_modules/")), false);
    assert.equal(paths.some((entry) => entry.startsWith("dist/")), false);
  } finally { await dispose(root); }
});

test("read-only boundary explicitly excludes parent Git operations", () => {
  const result = run(["--root", path.resolve(workspace, "../web")]);
  assert.equal(result.report.workspaceBoundary.parentGitOps, false);
  assert.equal(result.report.boundary.parentGitMutation, false);
  assert.equal(result.report.writes.parentGit, false);
  assert.equal(result.report.writes.root, false);
});
