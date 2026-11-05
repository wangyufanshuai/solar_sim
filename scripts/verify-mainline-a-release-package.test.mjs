import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeFixture } from "./mainline-a-release.test-support.mjs";
import { createAlignmentReport, jsonBytes, loadEvidenceInput, sha256, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";
import { buildIdentityBridge } from "./build-mainline-a-release-identity-bridge-v626.mjs";
import { preparePackage, writePackage } from "./build-mainline-a-release-package-v626.mjs";
import { verifyPackage, verifyRollbackBindingV636 } from "./verify-mainline-a-release-package.mjs";

// These temporary candidate-shaped documents exercise integrity only. No root
// app, network response, observed scene, human signoff, or release is supplied.
async function packageFixture() {
  const f = await makeFixture();
  f.input.mode = "candidate";
  await f.save();
  const root = { root: { package: { packageName: "solar-sim-viz", releaseIdentity: "solar-sim-mainline-a" }, inventory: { inventorySha256: sha256("root-input"), fileCount: 1, errors: [] } },
    workspaceBoundary: { readOnlyInput: true, rootWrites: false, parentGitOps: false } };
  await f.put("rootSourceAudit", root);
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  const observedRoot = { source: root };
  const report = await createAlignmentReport(f.workspace, evidence, observedRoot);
  const bridge = await buildIdentityBridge(f.workspace, evidence, report);
  await writeExclusiveJson(f.workspace, "docs/bridge.json", bridge);
  const prepared = await preparePackage(f.workspace, "input.json", "docs/bridge.json", "test-055", { audit: async () => ({ evidence, report }) });
  const result = await writePackage(f.workspace, "docs/package-test", prepared);
  return { ...f, prepared, manifest: result.manifestPath, packageDirectory: "docs/package-test" };
}

async function alterMember(f, name, mutate) {
  const file = path.join(f.workspace, f.packageDirectory, name);
  const value = JSON.parse(await readFile(file, "utf8"));
  mutate(value);
  const bytes = jsonBytes(value);
  await writeFile(file, bytes);
  const manifestPath = path.join(f.workspace, f.manifest);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const entry = manifest.files.find((row) => row.path === name);
  entry.sha256 = sha256(bytes);
  entry.bytes = bytes.length;
  await writeFile(manifestPath, jsonBytes(manifest));
}

test("offline replay validates package bytes but does not approve a release", async () => {
  const f = await packageFixture();
  const result = await verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation });
  assert.equal(result.integrity.status, "verified");
  assert.equal(result.currentSourceVerified, true);
  assert.equal(result.releaseApproved, false);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockers.includes("human-rights-signoff-pending"));
});

test("modified external evidence invalidates a previously written package", async () => {
  const f = await packageFixture();
  await writeFile(path.join(f.workspace, "docs/http.json"), "tampered");
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /evidence-sha-mismatch/u);
});

test("changing a package member without resealing its manifest is detected", async () => {
  const f = await packageFixture();
  await writeFile(path.join(f.workspace, f.packageDirectory, "rollback.json"), "{}");
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /evidence-sha-mismatch/u);
});

test("a resealed gate disagreement does not manufacture passed gates", async () => {
  const f = await packageFixture();
  await alterMember(f, "gate-checklist.json", (value) => { value.gates[0].state = "invented"; });
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /gate-snapshot-mismatch/u);
});

test("a resealed manifest cannot omit the source bridge snapshot", async () => {
  const f = await packageFixture();
  const file = path.join(f.workspace, f.manifest);
  const manifest = JSON.parse(await readFile(file, "utf8"));
  manifest.files = manifest.files.filter((row) => row.path !== "identity-bridge.json");
  await writeFile(file, jsonBytes(manifest));
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /file-set-incomplete/u);
});

test("a resealed cross-build package is rejected", async () => {
  const f = await packageFixture();
  await alterMember(f, "release-package.json", (value) => { value.build.buildId = "old-050"; });
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /package-build-mismatch/u);
});

for (const [label, mutate, expected] of [
  ["package identity", (value) => { value.packageId = "another-package"; }, /rollback-package-id-mismatch/u],
  ["preserved build", (value) => { value.preservedBuild = "E:\\unrelated\\build"; }, /rollback-preserved-build-mismatch/u],
  ["build receipt", (value) => { value.buildReceipt.sha256 = "f".repeat(64); }, /rollback-build-receipt-mismatch/u],
  ["automatic rollback", (value) => { value.automaticRollback = true; }, /rollback-mutation-policy-invalid/u],
  ["unindexed runtime", (value) => { value.runtime = { path: "somewhere" }; }, /rollback-unindexed-runtime-rejected/u],
]) {
  test(`resealing rollback ${label} cannot redirect recovery`, async () => {
    const f = await packageFixture();
    await alterMember(f, "rollback.json", mutate);
    await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), expected);
  });
}

test("runtime rollback binds its inventory and exclusive destination policy", () => {
  const build = { receiptPath: "build.json", receiptSha256: "b".repeat(64) };
  const runtime = { path: "runtime/runtime-payload-manifest.json", sha256: "c".repeat(64) };
  const options = { packageId: "candidate", build, workingDirectory: "preserved", runtime };
  const rollback = {
    packageId: "candidate", automaticRollback: false, rootMutationAllowed: false, preservedBuild: "preserved",
    buildReceipt: { path: build.receiptPath, sha256: build.receiptSha256 },
    runtime: { ...runtime, restorePolicy: "new-exclusive-directory-only", existingEnvironmentMutation: false },
  };
  assert.equal(verifyRollbackBindingV636(rollback, options), true);
  for (const field of ["path", "sha256"]) {
    const copy = structuredClone(rollback);
    copy.runtime[field] = "wrong";
    assert.throws(() => verifyRollbackBindingV636(copy, options), /rollback-runtime-binding-mismatch/u);
  }
  const overwrite = structuredClone(rollback);
  overwrite.runtime.existingEnvironmentMutation = true;
  assert.throws(() => verifyRollbackBindingV636(overwrite, options), /rollback-restore-policy-invalid/u);
});

test("candidate boundaries cannot be resealed open", async () => {
  const f = await packageFixture();
  await alterMember(f, "alignment.json", (value) => { value.boundary.scientificPayloadWriteback = true; });
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /package-boundary-mismatch/u);
});

test("current source is independently rehashed while historical replay is labeled", async () => {
  const f = await packageFixture();
  await writeFile(path.join(f.workspace, "app/page.tsx"), "export default () => 'changed';\n");
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /current-source-invalid/u);
  const historical = await verifyPackage(f.workspace, f.manifest, { current: false });
  assert.equal(historical.historicalReplayOnly, true);
  assert.equal(historical.currentSourceVerified, false);
  assert.equal(historical.releaseApproved, false);
});

test("existing package directories are never replaced", async () => {
  const f = await packageFixture();
  const original = await readFile(path.join(f.workspace, f.manifest));
  await assert.rejects(writePackage(f.workspace, f.packageDirectory, f.prepared), /EEXIST/u);
  assert.deepEqual(await readFile(path.join(f.workspace, f.manifest)), original);
});

test("tampered fixture label cannot be packaged using the public preparation path", async () => {
  const f = await makeFixture();
  await assert.rejects(preparePackage(f.workspace, "input.json", "docs/bridge.json", "test-055"), /candidate-package-input-rejected/u);
});

test("synchronously forged and resealed gate copies fail independent derivation", async () => {
  const f = await packageFixture();
  for (const name of ["release-package.json", "alignment.json", "gate-checklist.json"]) {
    await alterMember(f, name, (value) => { value.gates.find((gate) => gate.id === "desktop-browser").state = "passed"; });
  }
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /derived-report-mismatch:gates/u);
});

test("a package cannot independently acquire a scientific or rights approval claim", async () => {
  const f = await packageFixture();
  await alterMember(f, "release-package.json", (value) => { value.claims.scientificValidity = true; value.claims.copyrightApproval = true; });
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation }), /derived-summary-mismatch:claims/u);
});

test("fresh root drift invalidates a previously passed root input gate", async () => {
  const f = await packageFixture();
  assert.equal(f.prepared.report.gates.find((row) => row.id === "root-readonly-input").state, "passed");
  const fresh = structuredClone(f.prepared.report.rootObservation);
  fresh.source.root.inventory.inventorySha256 = sha256("changed-root-input");
  await assert.rejects(verifyPackage(f.workspace, f.manifest, { rootObservation: fresh }), /derived-report-mismatch:gates/u);
});

// Tiny isolated runtimes below are fixture-only contract tests. They never
// represent a built application, a recovery smoke, or a rights approval.
const runtimeFixtureFsV636 = await import("node:fs/promises");
const { RUNTIME_PAYLOAD_BOUNDARY_V636 } = await import("./mainline-a-runtime-payload-v636.mjs");

async function referencePackageFixtureV636() {
  const f = await packageFixture();
  const runtimeDirectory = "docs/sealed-runtime";
  const body = new Map([
    ["server.js", "// fixture-only server; never launched\n"],
    ["package.json", '{"name":"fixture-runtime"}\n'],
    [".next/BUILD_ID", `${f.prepared.evidence.build.buildId}\n`],
    ["node_modules/next/package.json", '{"name":"next","version":"fixture"}\n'],
    ["node_modules/react/package.json", '{"name":"react","version":"fixture"}\n'],
    ["node_modules/react-dom/package.json", '{"name":"react-dom","version":"fixture"}\n'],
    ["public/fixture.txt", "not an astronomical asset\n"],
  ]);
  const files = [];
  for (const [name, text] of body) {
    const absolute = path.join(f.workspace, runtimeDirectory, name);
    await runtimeFixtureFsV636.mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, text, { flag: "wx" });
    files.push({ path: name, bytes: Buffer.byteLength(text), sha256: sha256(text), sourcePath: `fixture-source/${name}`, role: "standalone" });
  }
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const build = Object.fromEntries(["buildId", "runtimeBuildId", "branch", "head", "profile", "receiptPath", "receiptSha256", "sourceSha256"]
    .map((key) => [key, f.prepared.evidence.build[key]]));
  const runtimeManifest = {
    schema: "mainline-a-runtime-payload-v636", status: "candidate-materialization-plan",
    entrypoint: "server.js", build, files,
    host: { platform: process.platform, arch: process.arch, node: process.versions.node },
    inventorySha256: sha256(JSON.stringify(files.map(({ path: name, bytes, sha256: digest }) => ({ path: name, bytes, sha256: digest })))),
    totals: { files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0) },
    publicScope: "complete-public-tree-except-explicit-private-files",
    boundary: RUNTIME_PAYLOAD_BOUNDARY_V636,
    claims: { browserValidation: false, copyrightApproval: false, productionPerformance: false },
  };
  const runtimeManifestPath = `${runtimeDirectory}/runtime-payload-manifest.json`;
  const runtimeReference = await writeExclusiveJson(f.workspace, runtimeManifestPath, runtimeManifest);
  const prepared = await preparePackage(f.workspace, "input.json", "docs/bridge.json", "test-058-reference", {
    audit: async () => ({ evidence: f.prepared.evidence, report: f.prepared.report }),
    runtimeManifest: { path: runtimeReference.path, sha256: runtimeReference.sha256 },
  });
  const result = await writePackage(f.workspace, "docs/reference-package", prepared);
  return { ...f, prepared, manifest: result.manifestPath, packageDirectory: result.directory,
    runtimeManifest, runtimeManifestPath, runtimeReference, runtimeDirectory };
}

function verifyReferenceFixtureV636(f) {
  return verifyPackage(f.workspace, f.manifest, { rootObservation: f.prepared.report.rootObservation });
}

async function alterReferenceBindingV636(f, change) {
  await alterMember(f, "runtime-payload.json", (value) => Object.assign(value, change));
  if (change.path !== undefined || change.sha256 !== undefined) {
    await alterMember(f, "rollback.json", (value) => {
      if (change.path !== undefined) value.runtime.path = change.path;
      if (change.sha256 !== undefined) value.runtime.sha256 = change.sha256;
    });
  }
}

test("workspace-reference package independently verifies the pinned runtime without copying it", async () => {
  const f = await referencePackageFixtureV636();
  const result = await verifyReferenceFixtureV636(f);
  assert.equal(result.integrity.status, "verified");
  assert.equal(result.integrity.packageFiles, 8);
  assert.equal(result.integrity.runtimePayload.status, "verified");
  assert.equal(result.integrity.runtimePayload.directory, f.runtimeDirectory);
  assert.deepEqual(result.integrity.runtimePayload.totals, f.runtimeManifest.totals);
  assert.equal(result.releaseApproved, false);
  const member = JSON.parse(await readFile(path.join(f.workspace, f.packageDirectory, "runtime-payload.json"), "utf8"));
  assert.equal(member.storage, "workspace-reference");
  assert.equal(member.path, f.runtimeManifestPath);
  await assert.rejects(runtimeFixtureFsV636.lstat(path.join(f.workspace, f.packageDirectory, "runtime")), { code: "ENOENT" });
});

test("reference and materialization modes are mutually exclusive", async () => {
  const f = await referencePackageFixtureV636();
  await assert.rejects(preparePackage(f.workspace, "input.json", "docs/bridge.json", "test-058-both", {
    audit: async () => ({ evidence: f.prepared.evidence, report: f.prepared.report }),
    runtime: true, runtimeManifest: { path: f.runtimeReference.path, sha256: f.runtimeReference.sha256 },
  }), /runtime-input-modes-exclusive/u);
});

test("preparation rejects a wrong runtime reference hash", async () => {
  const f = await referencePackageFixtureV636();
  await assert.rejects(preparePackage(f.workspace, "input.json", "docs/bridge.json", "test-058-pin", {
    audit: async () => ({ evidence: f.prepared.evidence, report: f.prepared.report }),
    runtimeManifest: { path: f.runtimeReference.path, sha256: "a".repeat(64) },
  }), /runtime-reference-pin-invalid/u);
});

for (const key of ["buildId", "runtimeBuildId", "branch", "head", "profile", "receiptPath", "receiptSha256", "sourceSha256"]) {
  test(`resealed reference binding cannot substitute build ${key}`, async () => {
    const f = await referencePackageFixtureV636();
    await alterMember(f, "runtime-payload.json", (value) => { value.build[key] = "another-build-value"; });
    await assert.rejects(verifyReferenceFixtureV636(f), new RegExp(`package-runtime-build-mismatch:${key}`, "u"));
  });
}

test("resealing a changed referenced payload to another build is rejected", async () => {
  const f = await referencePackageFixtureV636();
  f.runtimeManifest.build.buildId = "different-fixture-build";
  const bytes = jsonBytes(f.runtimeManifest);
  await writeFile(path.join(f.workspace, f.runtimeManifestPath), bytes);
  await alterReferenceBindingV636(f, { sha256: sha256(bytes), bytes: bytes.length });
  await assert.rejects(verifyReferenceFixtureV636(f), /expected-build-mismatch:buildId/u);
});

test("resealed binding and rollback cannot manufacture a matching payload hash", async () => {
  const f = await referencePackageFixtureV636();
  await alterReferenceBindingV636(f, { sha256: "b".repeat(64) });
  await assert.rejects(verifyReferenceFixtureV636(f), /evidence-sha-mismatch:runtimeManifest/u);
});

test("runtime file tampering remains detectable through workspace-reference mode", async () => {
  const f = await referencePackageFixtureV636();
  await writeFile(path.join(f.workspace, f.runtimeDirectory, "server.js"), "tampered fixture entry\n");
  await assert.rejects(verifyReferenceFixtureV636(f), /output-file-mismatch:server.js/u);
});

for (const variant of ["absolute", "dot-segments", "backslashes", "outside", "wrong-basename"]) {
  test(`resealed runtime reference rejects ${variant} path`, async () => {
    const f = await referencePackageFixtureV636();
    const candidate = variant === "absolute" ? path.join(f.workspace, f.runtimeManifestPath)
      : variant === "dot-segments" ? "docs/unused/../sealed-runtime/runtime-payload-manifest.json"
      : variant === "backslashes" ? f.runtimeManifestPath.replaceAll("/", "\\")
      : variant === "outside" ? "../outside/runtime-payload-manifest.json"
      : "docs/sealed-runtime/not-the-manifest.json";
    await alterReferenceBindingV636(f, { path: candidate });
    await assert.rejects(verifyReferenceFixtureV636(f), /package-runtime-path-invalid|package-runtime-reference-path-not-canonical|evidence-path-outside-workspace/u);
  });
}

for (const storage of ["embedded", "remote-reference", "../workspace-reference"]) {
  test(`resealed storage ${storage} cannot reinterpret an existing reference`, async () => {
    const f = await referencePackageFixtureV636();
    await alterReferenceBindingV636(f, { storage });
    await assert.rejects(verifyReferenceFixtureV636(f), /package-runtime-path-invalid|package-runtime-storage-invalid/u);
  });
}

test("a reference cannot silently switch to a linked runtime directory", async () => {
  const f = await referencePackageFixtureV636();
  await runtimeFixtureFsV636.symlink(path.join(f.workspace, f.runtimeDirectory), path.join(f.workspace, "docs/linked-runtime"), "junction");
  await alterReferenceBindingV636(f, { path: "docs/linked-runtime/runtime-payload-manifest.json" });
  await assert.rejects(verifyReferenceFixtureV636(f), /evidence-symlink-rejected/u);
});

test("reference inventory totals and exclusive restoration policy remain independently checked", async () => {
  const f = await referencePackageFixtureV636();
  await alterReferenceBindingV636(f, { totalBytes: f.runtimeManifest.totals.bytes + 1 });
  await assert.rejects(verifyReferenceFixtureV636(f), /package-runtime-inventory-count-mismatch/u);
  const second = await referencePackageFixtureV636();
  await alterMember(second, "rollback.json", (value) => { value.runtime.existingEnvironmentMutation = true; });
  await assert.rejects(verifyReferenceFixtureV636(second), /rollback-restore-policy-invalid/u);
});
