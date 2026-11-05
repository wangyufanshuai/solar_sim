import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildV596SourceBoundaryRecords,
  buildV596SourceManifest,
  canonicalShaV596,
  writeV596SourceManifest,
} from "./build-v596-source-manifest.mjs";
import {
  V596_CLOSURE_SOURCE_PATHS,
  V596_DELTA_SOURCE_PATHS,
  V596_PARENT_RETIRED_SOURCE_PATHS,
} from "./v596-source-paths.mjs";

test("v596 builder binds qualified v595 and emits explicit delta plus retirements", () => {
  const manifest = buildV596SourceManifest(process.cwd(), {
    generatedAt: "2026-08-31T00:00:00.000Z",
  });
  assert.equal(manifest.parentVersion, "v595");
  assert.equal(manifest.baseCounts.files, 74);
  assert.equal(manifest.baseCounts.closureSourcePaths, 8);
  assert.equal(manifest.baseCounts.retiredOrReplacedPaths, 14);
  assert.equal(manifest.files.length, V596_DELTA_SOURCE_PATHS.length);
  assert.equal(manifest.closureSourcePaths.length, V596_CLOSURE_SOURCE_PATHS.length);
  assert.deepEqual(manifest.parentRetiredOrReplacedPaths.map((row) => row.path),
    V596_PARENT_RETIRED_SOURCE_PATHS);
  assert.equal(manifest.parentRetiredOrReplacedPaths.every((row) =>
    row.currentState === "absent" && /^retired-parent-/.test(row.disposition)
      && Number.isInteger(row.parentBytes) && /^[0-9a-f]{64}$/.test(row.parentSha256)), true);
  const expectedPending = V596_CLOSURE_SOURCE_PATHS.filter((path) => !existsSync(path));
  assert.deepEqual(manifest.pendingClosurePaths, expectedPending);
  assert.equal(manifest.receiptSha256,
    canonicalShaV596(Object.fromEntries(Object.entries(manifest)
      .filter(([key]) => key !== "receiptSha256"))));
  assert.equal(manifest.baseSourceManifestSha256,
    "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186");
  assert.equal(manifest.baseCandidateManifestSha256,
    "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1");
  assert.equal(manifest.baseReleaseDossierSha256,
    "ea6a5247cf9708162df26acead217e23159f0d8793466dd98071888831866765");
  assert.equal(manifest.baseResealReceiptSha256,
    "ccf9c5cbfc0418c25295a51fde4efdb1364d9a7206dfa056eb004fb53b5c9a13");
});

test("v596 boundary records are deterministic and sealed by bytes", () => {
  const records = buildV596SourceBoundaryRecords(process.cwd());
  assert.equal(records.length, V596_DELTA_SOURCE_PATHS.length);
  assert.deepEqual(records, [...records].sort((left, right) => left.path.localeCompare(right.path)));
  for (const record of records) {
    assert.equal(Number.isSafeInteger(record.bytes) && record.bytes > 0, true);
    assert.match(record.sha256, /^[0-9a-f]{64}$/);
  }
});

test("preflight writer refuses the formal v596 output directory", async () => {
  const root = resolve(process.cwd(), "tmp", `v596-manifest-test-${process.pid}`);
  try {
    const result = await writeV596SourceManifest(process.cwd(), root, {
      generatedAt: "2026-08-31T00:00:00.000Z",
    });
    assert.equal(existsSync(result.outputPath), true);
    assert.equal(JSON.parse(readFileSync(result.outputPath, "utf8")).receiptSha256,
      result.manifest.receiptSha256);
    await assert.rejects(
      () => writeV596SourceManifest(process.cwd(), "docs/release/v596"),
      /v596-formal-output-forbidden/,
    );
    await assert.rejects(
      () => writeV596SourceManifest(process.cwd(), "../v596-manifest-outside"),
      /v596-output-root-boundary/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
