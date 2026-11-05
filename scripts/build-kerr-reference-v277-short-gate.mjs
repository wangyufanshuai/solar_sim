#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const OUT = resolve(ROOT, "dist/science/kerr-reference-v277");
const evidencePath = resolve(OUT, "short-gate-evidence.json");
const pointerPath = resolve(ROOT, "dist/release/orbit-atlas-current-local-v277-kerr.json");
const canonical = (value) => JSON.stringify(value, (_, entry) => {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
  return Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)));
});
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const generatedAt = new Date().toISOString();
const unsigned = {
  version: "v277-corrected-kerr-optics-short-gate-evidence-v1",
  generatedAt,
  status: "implemented-awaiting-qualification",
  gate: {
    selectedRayCount: 16,
    executionsPerRay: 8,
    expectedExecutionCount: 128,
    criticalBracketCount: 40,
    status: "not-run",
    gatePassed: false,
    automaticRetryApplied: false,
  },
  boundary: "offline-kerr-test-particle-zamo-thin-disk-not-grmhd",
  legacyReference: {
    codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
    screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
    v8NegativeEvidencePreserved: true,
  },
  science: {
    defaultKernel: "legacy-eih-1pn",
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  release: {
    formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    formalProductPointerAdvanced: false,
    localShadowPromotionApplied: false,
    publicDeploymentBlocked: true,
  },
  boundaryNote: "corrected-contract-and-preview-tracer-present; scientific short gate has not been claimed",
};
const evidence = { ...unsigned, evidenceSha256: sha256(canonical(unsigned)) };
const pointerUnsigned = {
  version: "orbit-atlas-current-local-v277-kerr",
  generatedAt,
  status: evidence.status,
  source: { path: "dist/science/kerr-reference-v277/short-gate-evidence.json", sha256: sha256(canonical(evidence)) },
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowPromotionApplied: false,
  publicDeploymentBlocked: true,
};
const pointer = { ...pointerUnsigned, pointerSha256: sha256(canonical(pointerUnsigned)) };
await mkdir(OUT, { recursive: true });
for (const [path, value] of [[evidencePath, evidence], [pointerPath, pointer]]) {
  const part = `${path}.part`;
  await writeFile(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(part, path);
}
console.log(JSON.stringify({ evidence: evidencePath, pointer: pointerPath, status: evidence.status, gatePassed: false }, null, 2));
