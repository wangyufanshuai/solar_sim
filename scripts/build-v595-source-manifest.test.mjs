import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildV595SourceBoundaryRecords,
  buildV595SourceManifest,
  canonicalShaV595,
  writeV595SourceManifest,
} from "./build-v595-source-manifest.mjs";
import {
  V595_CLOSURE_SOURCE_PATHS,
  V595_DELTA_SOURCE_PATHS,
} from "./v595-source-paths.mjs";

test("v595 builder validates v594 base and emits only explicit delta records", () => {
  const manifest = buildV595SourceManifest(process.cwd(), {
    generatedAt: "2026-08-28T00:00:00.000Z",
  });
  assert.equal(manifest.parentVersion, "v594");
  assert.equal(manifest.baseCounts.files, 107);
  assert.equal(manifest.baseCounts.closureSourcePaths, 8);
  assert.equal(manifest.files.length, V595_DELTA_SOURCE_PATHS.length);
  assert.equal(manifest.closureSourcePaths.length, V595_CLOSURE_SOURCE_PATHS.length);
  const expectedPending = V595_CLOSURE_SOURCE_PATHS.filter((path) => !existsSync(path));
  assert.deepEqual(manifest.pendingClosurePaths, expectedPending);
  assert.equal(
    manifest.closureSourcePaths.every((row) =>
      row.state === (existsSync(row.path) ? "present" : "pending")),
    true,
  );
  assert.equal(manifest.receiptSha256, canonicalShaV595({ ...manifest, receiptSha256: undefined }));
  assert.equal(manifest.baseSourceManifestSha256, "6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f");
  assert.equal(manifest.baseCandidateManifestSha256, "e92484940ba9a812d0936bbd67b29c4cb3c3ac20d9477cd04a949e35efd33bad");
  assert.equal(manifest.baseReleaseDossierSha256, "a70645f4a124b6fb6d1eb3a061eb15cf66618154c1a2884acc1730cb41bd3865");
  assert.equal(manifest.baseResealReceiptSha256, "406bb72a58aade66c877c75f4bea220e8b42181217efee1e4d9a1d20b46e4664");
});

test("v595 boundary records are deterministic and sealed by bytes", () => {
  const records = buildV595SourceBoundaryRecords(process.cwd());
  assert.equal(records.length, V595_DELTA_SOURCE_PATHS.length);
  assert.deepEqual(records, [...records].sort((left, right) => left.path.localeCompare(right.path)));
  for (const record of records) {
    assert.equal(typeof record.path, "string");
    assert.equal(Number.isInteger(record.bytes), true);
    assert.equal(record.bytes > 0, true);
    assert.match(record.sha256, /^[0-9a-f]{64}$/);
  }
});

test("preflight writer is tmp-only and refuses formal v595 output", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-manifest-test-"));
  try {
    const result = await writeV595SourceManifest(process.cwd(), root, {
      generatedAt: "2026-08-28T00:00:00.000Z",
    });
    assert.equal(existsSync(result.outputPath), true);
    const roundTrip = JSON.parse(readFileSync(result.outputPath, "utf8"));
    assert.equal(roundTrip.receiptSha256, result.manifest.receiptSha256);
    await assert.rejects(
      () => writeV595SourceManifest(process.cwd(), "docs/release/v595"),
      /v595-formal-output-forbidden/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
