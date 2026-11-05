import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
function canonicalize(value) { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "pid", "host", "absolutePath"].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)])); }
function sha(value) { return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex"); }
function fileSha(relative) { return createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex"); }
function readEvidence(relative) { const document = JSON.parse(readFileSync(resolve(root, relative), "utf8")); const expected = document.evidenceSha256; const unsigned = { ...document }; delete unsigned.evidenceSha256; if (typeof expected !== "string" || sha(unsigned) !== expected) throw new Error(`${relative} SHA mismatch`); return document; }

const validationPath = "dist/science/v296-low-memory-validation.json";
const envelopePath = "dist/science/kerr-reference-v296/portable-envelope.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v296-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v296.json";
const formalPath = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const validation = readEvidence(validationPath);
const envelope = readEvidence(envelopePath);
if (validation.status !== "passed-geometry-redshift-qualified-polarization-pending" || envelope.geometry?.geometryRedshiftQualified !== true) throw new Error("v296 qualification input is incomplete");
const capabilities = { v282: "identity-cache-partial-1-of-9", v288: "failed-preserved", v291: "diagnostics-failed-preserved", v292: "geometry-redshift-failed-preserved", v293: "blocked-by-v292-preserved", v296: "geometry-redshift-qualified", polarization: "pending-v297", campaign: "incomplete-0-of-49", browserQualification: "not-run" };
const unsignedEvidence = {
  version: "v296-carter-constraint-stability-shadow-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "geometry-redshift-qualified-polarization-and-heavy-qualification-pending",
  capabilities,
  authority: { envelope: { path: envelopePath, sha256: fileSha(envelopePath), canonicalSha256: envelope.evidenceSha256 }, validation: { path: validationPath, sha256: fileSha(validationPath), canonicalSha256: validation.evidenceSha256 }, thresholds: envelope.geometry.thresholds, constraintStabilization: envelope.geometry.constraintStabilization },
  formalProductPointer: { path: formalPath, sha256: fileSha(formalPath), advanced: false },
  science: validation.science,
  release: { localShadowDefaultApplied: false, denseShardExecuted: false, polarizationCampaignExecuted: false, publicDeploymentBlocked: true, vercelApplied: false, productionApplied: false },
};
const evidence = { ...unsignedEvidence, evidenceSha256: sha(unsignedEvidence) };
mkdirSync(resolve(root, "dist/science"), { recursive: true });
writeFileSync(resolve(root, evidencePath), `${JSON.stringify(evidence, null, 2)}\n`);
const unsignedPointer = { version: "orbit-atlas-current-local-shadow-candidate-v296", generatedAt: new Date().toISOString(), status: evidence.status, capabilities, evidence: { path: evidencePath, sha256: fileSha(evidencePath), canonicalSha256: evidence.evidenceSha256 }, formalProductPointer: formalPath, formalProductPointerSha256: fileSha(formalPath), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true };
const pointer = { ...unsignedPointer, pointerSha256: sha(unsignedPointer) };
mkdirSync(resolve(root, "dist/release"), { recursive: true });
writeFileSync(resolve(root, pointerPath), `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ status: pointer.status, capabilities, pointer: pointerPath, formalProductPointerAdvanced: false }, null, 2));
