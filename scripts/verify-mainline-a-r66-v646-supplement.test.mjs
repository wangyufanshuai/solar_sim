import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validateSupplementPolicy, verifySupplement } from "./verify-mainline-a-r66-v646-supplement.mjs";

const file = path.resolve("docs/release/v607/mainline-a-r66-v646-evidence-supplement-20261007.json");
const canonical = JSON.parse(await readFile(file, "utf8"));
const changed = (edit) => {
  const value = structuredClone(canonical);
  edit(value);
  return value;
};

test("V646 supplement retains the pinned candidate-only policy", () => {
  assert.equal(validateSupplementPolicy(canonical), true);
  assert.equal(canonical.runtimePayloadIncluded, false);
  assert.equal(canonical.claims.releaseApproved, false);
});

test("a release approval claim cannot be injected into the supplement", () => {
  const forged = changed((value) => { value.claims.releaseApproved = true; });
  assert.throws(() => validateSupplementPolicy(forged), /r66-v646:claims/);
});

test("a rights or stellar gate cannot be silently promoted", () => {
  const signed = changed((value) => { value.gates.nebulaRightsSignoff = "passed-12-of-12"; });
  const admitted = changed((value) => { value.gates.stellarComponentIdentity = "passed-4-of-4"; });
  assert.throws(() => validateSupplementPolicy(signed), /r66-v646:gates/);
  assert.throws(() => validateSupplementPolicy(admitted), /r66-v646:gates/);
});

test("an alternate base package and an escaped evidence path are rejected", () => {
  const wrongBase = changed((value) => { value.basePackage.path = "docs/release/v607/unreviewed/manifest.json"; });
  const escaped = changed((value) => { value.references[0].path = "../other-worktree/evidence.json"; });
  assert.throws(() => validateSupplementPolicy(wrongBase), /r66-v646:base-package/);
  assert.throws(() => validateSupplementPolicy(escaped), /r66-v646:reference-set/);
});

test("a forged raw TAP ledger digest fails before any release replay", async () => {
  const forged = changed((value) => { value.references.find((item) => item.role === "tapRawLedger").sha256 = "0".repeat(64); });
  await assert.rejects(verifySupplement(forged), /evidence-sha-mismatch:tapRawLedger/);
});

test("removing the structured analysis reference is rejected", () => {
  const partial = changed((value) => { value.references = value.references.filter((item) => item.role !== "tapCrossIdAnalysis"); });
  assert.throws(() => validateSupplementPolicy(partial), /r66-v646:reference-count/);
});
