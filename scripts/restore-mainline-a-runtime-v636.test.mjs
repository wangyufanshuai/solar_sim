import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { RUNTIME_PAYLOAD_BOUNDARY_V636 } from "./mainline-a-runtime-payload-v636.mjs";
import {
  planRuntimeRestoreV636, restoreRuntimeV636, validateRestoreTargetV636,
} from "./restore-mainline-a-runtime-v636.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");

async function fixture() {
  const workspace = await mkdtemp(path.join(tmpdir(), "mainline-a-restore-v636-"));
  const content = {
    ".next/BUILD_ID": "fixture-build",
    "server.js": "// Test-only inert entrypoint; never a production observation.\n",
    "package.json": '{"private":true}',
    "node_modules/next/package.json": '{"name":"next","version":"16.2.0"}',
    "node_modules/react/package.json": '{"name":"react","version":"19.2.0"}',
    "node_modules/react-dom/package.json": '{"name":"react-dom","version":"19.2.0"}',
    "public/asset.bin": "real fixture bytes, explicitly not science or a rights record",
  };
  const files = [];
  for (const file of Object.keys(content).sort()) {
    const target = path.join(workspace, "source", file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content[file], { flag: "wx" });
    files.push({ path: file, sourcePath: `no-longer-required/${file}`, bytes: Buffer.byteLength(content[file]), sha256: hash(content[file]), role: "standalone" });
  }
  const build = { buildId: "fixture-build", runtimeBuildId: `mainline-a-${"a".repeat(16)}`,
    branch: "codex/solar-sim-mainline-a", head: "b".repeat(40), profile: "vercel-lite",
    receiptPath: "absent-original-build-receipt.json", receiptSha256: "c".repeat(64), sourceSha256: "a".repeat(64) };
  const manifest = {
    schema: "mainline-a-runtime-payload-v636", status: "candidate-materialization-plan",
    entrypoint: "server.js", files, build,
    host: { platform: process.platform, arch: process.arch, node: process.versions.node },
    inventorySha256: hash(JSON.stringify(files.map(({ path: file, bytes, sha256 }) => ({ path: file, bytes, sha256 })))),
    totals: { files: files.length, bytes: files.reduce((sum, row) => sum + row.bytes, 0) },
    publicScope: "complete-public-tree-except-explicit-private-files",
    boundary: RUNTIME_PAYLOAD_BOUNDARY_V636,
    claims: { portableAcrossHosts: false, browserValidation: false, copyrightApproval: false, productionPerformance: false },
  };
  const raw = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  const manifestPath = "source/runtime-payload-manifest.json";
  await writeFile(path.join(workspace, manifestPath), raw, { flag: "wx" });
  return { workspace, manifest, raw, content, payloadManifest: { path: manifestPath, sha256: hash(raw) }, destination: "new-recovery", output: "restore-result.json" };
}

test("dry-run restore verifies actual files without creating a destination", async () => {
  const f = await fixture();
  const plan = await restoreRuntimeV636({ ...f, mode: "plan" });
  assert.equal(plan.readOnly, true);
  assert.equal(plan.files, 7);
  await assert.rejects(readFile(path.join(f.workspace, f.destination, "server.js")), /ENOENT/u);
  await assert.rejects(readFile(path.join(f.workspace, f.output)), /ENOENT/u);
});

test("recovery preserves exact bytes without requiring original workspace references", async () => {
  const f = await fixture();
  const result = await restoreRuntimeV636(f);
  assert.equal(result.status, "restored-verified");
  assert.equal(result.files, 7);
  assert.equal(result.releaseApproved, false);
  assert.equal(result.httpSmoke, "not-run");
  assert.deepEqual(await readFile(path.join(f.workspace, f.destination, "runtime-payload-manifest.json")), f.raw);
  for (const [file, value] of Object.entries(f.content)) {
    assert.equal(await readFile(path.join(f.workspace, f.destination, file), "utf8"), value);
  }
  await writeFile(path.join(f.workspace, "source/public/asset.bin"), "source changed later");
  assert.equal(await readFile(path.join(f.workspace, f.destination, "public/asset.bin"), "utf8"), f.content["public/asset.bin"]);
});

test("existing restore destinations and existing receipt files are never replaced", async () => {
  const f = await fixture();
  await mkdir(path.join(f.workspace, f.destination));
  await writeFile(path.join(f.workspace, f.destination, "original"), "preserve");
  await assert.rejects(restoreRuntimeV636(f), /restore-destination-already-exists/u);
  assert.equal(await readFile(path.join(f.workspace, f.destination, "original"), "utf8"), "preserve");
  await writeFile(path.join(f.workspace, f.output), "old receipt");
  await assert.rejects(restoreRuntimeV636({ ...f, destination: "other-new-dir" }), /restore-destination-already-exists/u);
  assert.equal(await readFile(path.join(f.workspace, f.output), "utf8"), "old receipt");
});

test("source tampering is rejected before any recovery directory exists", async () => {
  const f = await fixture();
  await writeFile(path.join(f.workspace, "source/public/asset.bin"), "tampered");
  await assert.rejects(planRuntimeRestoreV636(f), /output-file-mismatch/u);
  await assert.rejects(readFile(path.join(f.workspace, f.destination, "server.js")), /ENOENT/u);
});

test("manifest pin cannot be substituted by a valid-looking different digest", async () => {
  const f = await fixture();
  await assert.rejects(restoreRuntimeV636({ ...f, payloadManifest: { ...f.payloadManifest, sha256: "d".repeat(64) } }), /restore-manifest-pin-mismatch/u);
});

test("recovery rejects overlapping paths and receipts inside either runtime", () => {
  const root = path.resolve("temporary-fixture-root");
  for (const target of ["source", "source/nested", "..", "."]) {
    assert.throws(() => validateRestoreTargetV636(root, "source", target, "receipt.json"));
  }
  assert.throws(() => validateRestoreTargetV636(root, "source/subdir", "source", "receipt.json"), /overlap/u);
  assert.throws(() => validateRestoreTargetV636(root, "source", "output", "output/receipt.json"), /outside-runtime/u);
  assert.throws(() => validateRestoreTargetV636(root, "source", "output", "source/receipt.json"), /modify-source/u);
});
