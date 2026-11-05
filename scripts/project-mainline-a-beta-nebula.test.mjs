import { cp, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MANIFEST_PATHS,
  OUTPUT_PATH,
  projectNebulaManifests,
  inspectNebulaLocalEvidence,
  readNebulaImageDimensions,
  resolveNebulaLocalPath,
  renderNebulaProjection,
  run,
  verifyNebulaLocalEvidence,
} from "./project-mainline-a-beta-nebula.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const copyFixture = async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "mainline-a-nebula-"));
  for (const relative of MANIFEST_PATHS) {
    const destination = path.join(temporary, relative);
    await import("node:fs/promises").then(({ mkdir }) => mkdir(path.dirname(destination), { recursive: true }));
    await cp(path.join(root, relative), destination);
  }
  return temporary;
};

test("projects eighteen sealed candidate assets without admitting NASA candidates", () => {
  const rows = projectNebulaManifests(root);
  assert.equal(rows.length, 18);
  assert.equal(new Set(rows.map((row) => row.id)).size, 18);
  assert.equal(rows.filter((row) => row.rightsStatus === "review").length, 18);
  assert.equal(rows.filter((row) => row.visualAssetAdmitted).length, 0);
  assert.equal(rows.filter((row) => row.scienceImagePayloadAllowed).length, 0);
});

test("requires HTTPS source, nonempty credit, dimensions, bytes, and digest", () => {
  const rows = projectNebulaManifests(root);
  for (const row of rows) {
    assert.match(row.source.url, /^https:\/\//);
    assert.ok(row.source.credit);
    assert.ok(row.source.bytes > 0);
    assert.ok(row.source.width >= 256 && row.source.height >= 256);
    assert.match(row.source.sha256, /^[a-f0-9]{64}$/);
  }
});

test("does not treat a CC BY label as clearance without an item-level decision", async () => {
  const temporary = await copyFixture();
  try {
    const target = path.join(temporary, MANIFEST_PATHS[0]);
    const value = JSON.parse(await readFile(target, "utf8"));
    value.assets[0].source.license = "CC BY 4.0";
    value.assets[0].source.licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
    delete value.assets[0].rightsStatus;
    await writeFile(target, JSON.stringify(value));
    const pending = projectNebulaManifests(temporary)[0];
    assert.equal(pending.rightsStatus, "review");
    value.assets[0].rightsStatus = "cleared";
    await writeFile(target, JSON.stringify(value));
    const cleared = projectNebulaManifests(temporary)[0];
    assert.equal(cleared.rightsStatus, "cleared");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("verifies every declared local image against bytes, digest, and dimensions", () => {
  const rows = projectNebulaManifests(root);
  const report = verifyNebulaLocalEvidence(root, rows);
  assert.equal(report.checked, 18);
  assert.equal(report.verified, 18);
  assert.equal(report.failed, 0);
  assert.ok(report.results.every((entry) => entry.status === "verified"));
  assert.ok(report.results.every((entry) => entry.checks.sizeMatch && entry.checks.digestMatch && entry.checks.dimensionsMatch));
});

test("rejects traversal and absolute paths before reading local evidence", () => {
  assert.throws(() => resolveNebulaLocalPath(root, "../outside.jpg"), /local-path-unsafe|local-path-outside-root/);
  assert.throws(() => resolveNebulaLocalPath(root, "C:/outside.jpg"), /local-path-absolute/);
  assert.throws(() => resolveNebulaLocalPath(root, "source-cache/nebula/../outside.jpg"), /local-path-unsafe/);
});

test("reports a tampered local payload without changing the sealed manifest", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "mainline-a-nebula-evidence-"));
  try {
    const rows = projectNebulaManifests(root);
    const original = rows[0];
    const destination = path.join(temporary, original.source.localPath);
    await mkdir(path.dirname(destination), { recursive: true });
    const bytes = await readFile(path.join(root, original.source.localPath));
    bytes[bytes.length - 1] ^= 0xff;
    await writeFile(destination, bytes);
    const report = inspectNebulaLocalEvidence(temporary, original);
    assert.equal(report.status, "mismatch");
    assert.equal(report.checks.digestMatch, false);
    assert.equal(report.checks.sizeMatch, true);
    assert.equal(original.source.sha256, rows[0].source.sha256);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("decodes image dimensions without a heavyweight image dependency", () => {
  const png = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(png, 0);
  png.write("IHDR", 12, "ascii");
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(480, 20);
  assert.deepEqual(readNebulaImageDimensions(png), { width: 640, height: 480, format: "png" });
  assert.equal(readNebulaImageDimensions(Buffer.from("not-an-image")), null);
});

test("rejects missing manifest and malformed asset fields", async () => {
  const temporary = await copyFixture();
  try {
    await rm(path.join(temporary, MANIFEST_PATHS[0]));
    assert.throws(() => projectNebulaManifests(temporary), /manifest-missing/);
    const restored = await copyFixture();
    try {
      const target = path.join(restored, MANIFEST_PATHS[1]);
      const value = JSON.parse(await readFile(target, "utf8"));
      value.assets[0].source.sha256 = "bad";
      await writeFile(target, JSON.stringify(value));
      assert.throws(() => projectNebulaManifests(restored), /sha256-required/);
    } finally { await rm(restored, { recursive: true, force: true }); }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("rejects duplicate targets and unsafe admission in projection", async () => {
  const rows = projectNebulaManifests(root);
  assert.throws(() => renderNebulaProjection([...rows, rows[0]]), /projection-count/);
  const duplicate = rows.map((row) => ({ ...row }));
  duplicate[1].id = duplicate[0].id;
  assert.throws(() => renderNebulaProjection(duplicate), /projection-id/);
  const unsafe = rows.map((row) => ({ ...row }));
  unsafe[0].visualAssetAdmitted = true;
  assert.throws(() => renderNebulaProjection(unsafe), /unsafe-admission/);
});

test("writes deterministic checked-in projection and catches stale output", async () => {
  const result = run({ root });
  assert.equal(result.assetCount, 18);
  assert.equal(result.candidateCount, 18);
  assert.equal((await readFile(path.join(root, OUTPUT_PATH), "utf8")).startsWith("// Generated"), true);
  assert.equal(run({ root, check: true }).status, "verified");
});
