import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import {
  assertV594ResealKeySet,
  auditV594ReadonlyOperation,
  createV594ReadonlyResult,
  declaredReceiptPaths,
  V594_VERIFIER_STATUS,
  verifyV594Readonly,
} from "./verify-v594-stellar-relativity-candidate.mjs";

test("v594 verifier exposes readonly qualified status", () => {
  assert.equal(V594_VERIFIER_STATUS, "passed-readonly-qualified-additive-v594-stellar-relativity-candidate");
  const result = createV594ReadonlyResult({ sourceManifestSha256: "a".repeat(64) });
  assert.equal(result.writesPerformed, false);
});

test("v594 verifier requires an exact frozen reseal key set", () => {
  const paths = ["a.json", "b.json"];
  const outputs = Object.fromEntries(paths.map((path) => [path, {
    bytes: 1,
    sha256: "a".repeat(64),
  }]));
  assert.doesNotThrow(() => assertV594ResealKeySet(outputs, paths));
  assert.throws(() => assertV594ResealKeySet({ "a.json": outputs["a.json"] }, paths),
    /key-set/);
  assert.throws(() => assertV594ResealKeySet({ ...outputs, "extra.json": outputs["a.json"] }, paths),
    /key-set/);
  assert.throws(() => assertV594ResealKeySet(outputs, ["a.json", "a.json"]),
    /alias/);
});

test("v594 declaration traversal caps containers without rejecting wide scalar evidence", () => {
  const path = "tmp/v594-wide-scalar-evidence.json";
  const wideScalarEvidence = {
    samples: Array.from({ length: 25000 }, (_, index) => index),
    artifact: { path, bytes: 1, sha256: "a".repeat(64) },
  };
  assert.deepEqual([...declaredReceiptPaths(wideScalarEvidence)], [path]);

  const excessiveContainers = Array.from({ length: 20000 }, () => ({}));
  assert.throws(() => declaredReceiptPaths(excessiveContainers), /declaration-cap/);
});

test("v594 readonly audit detects a write in an isolated formal workspace", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v594-readonly-verifier-"));
  const path = "docs/release/v594/release-export-v594.json";
  try {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), "before\n", "utf8");
    await assert.rejects(auditV594ReadonlyOperation({
      root,
      paths: [path],
      operation: () => writeFile(resolve(root, path), "after\n", "utf8"),
    }), /readonly-files-mutated/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v594 verifier fails closed when formal closure artifacts are absent", async () => {
  await assert.rejects(verifyV594Readonly({ root: "E:/does-not-exist-v594-fixture" }), /missing|ENOENT|workspace|source/);
});
