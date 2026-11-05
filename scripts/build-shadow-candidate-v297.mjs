import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envelopePath = "dist/science/kerr-reference-v297/portable-envelope.json";
const statePath = "dist/science/kerr-campaign-v298/campaign-state.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v297-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v297.json";
const formalPath = "dist/release/orbit-atlas-current-product-evidence-v263.json";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
function sha(value) { return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex"); }
function fileSha(relative) { return createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex"); }
function readEvidence(relative, field = "evidenceSha256") {
  const document = JSON.parse(readFileSync(resolve(root, relative), "utf8"));
  const expected = document[field];
  const unsigned = { ...document };
  delete unsigned[field];
  if (typeof expected !== "string" || sha(unsigned) !== expected) throw new Error(`${relative} SHA mismatch`);
  return document;
}

const envelope = readEvidence(envelopePath);
const state = readEvidence(statePath, "stateSha256");
if (envelope.status !== "full-kerr-short-authority-qualified") throw new Error("v297 authority is not qualified");
if (state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.runNextAvailable !== false) throw new Error("v298 state is not planner-only");
if (state.authority?.v297EnvelopeSha256 !== fileSha(envelopePath) || state.authority?.v297CanonicalSha256 !== envelope.evidenceSha256) throw new Error("v298 authority lock does not match v297 envelope");

const capabilities = {
  v282: "identity-cache-partial-1-of-9",
  v283: "qualification-withdrawn",
  v284: "quarantined-nonauthoritative-1-of-49",
  v288: "failed-preserved",
  v296: "geometry-redshift-qualified",
  v297: "full-kerr-short-authority-qualified",
  campaign: "incomplete-0-of-49",
  browserQualification: "not-run",
};
const unsignedEvidence = {
  version: "v297-kerr-polarization-shadow-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "full-kerr-short-authority-qualified-campaign-pending",
  capabilities,
  authority: {
    envelope: { path: envelopePath, sha256: fileSha(envelopePath), canonicalSha256: envelope.evidenceSha256 },
    polarization: envelope.polarization,
    campaignPlan: { path: statePath, sha256: fileSha(statePath), canonicalSha256: state.stateSha256 },
  },
  formalProductPointer: { path: formalPath, sha256: fileSha(formalPath), advanced: false },
  science: envelope.science,
  release: {
    localShadowDefaultApplied: false,
    denseShardExecuted: false,
    polarizationCampaignExecuted: false,
    publicDeploymentBlocked: true,
    vercelApplied: false,
    productionApplied: false,
  },
  boundary: "v297-qualified-short-authority-v298-planner-only",
};
const evidence = { ...unsignedEvidence, evidenceSha256: sha(unsignedEvidence) };
mkdirSync(resolve(root, "dist/science"), { recursive: true });
writeFileSync(resolve(root, evidencePath), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

const unsignedPointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v297",
  generatedAt: new Date().toISOString(),
  status: "full-kerr-short-authority-qualified-campaign-pending",
  capabilities,
  evidence: { path: evidencePath, sha256: fileSha(evidencePath), canonicalSha256: evidence.evidenceSha256 },
  formalProductPointer: "v263",
  formalProductPointerPath: formalPath,
  formalProductPointerSha256: fileSha(formalPath),
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
};
const pointer = { ...unsignedPointer, pointerSha256: sha(unsignedPointer) };
mkdirSync(resolve(root, "dist/release"), { recursive: true });
writeFileSync(resolve(root, pointerPath), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ status: pointer.status, capabilities, pointer: pointerPath, formalProductPointerAdvanced: false }, null, 2));
