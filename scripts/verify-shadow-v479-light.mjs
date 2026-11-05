import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
  "provenanceSha256",
  "frequencyBufferSha256",
  "payloadSha256",
  "rowSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactPath = "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v479-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v479.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v478-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v478.json");
const v478 = read("dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(artifact.frequencyBuffer) !== artifact.frequencyBufferSha256 ||
  sha(artifact.provenance) !== artifact.provenanceSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v479-kerr-frequency-provenance-viewer-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v479-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v479" ||
  artifact.sourceChain.length !== 5 ||
  artifact.frequencyBuffer.length !== 4 ||
  artifact.provenance.length !== 4 ||
  artifact.frequencyBufferSha256 !== v478.payloadSha256 ||
  artifact.audit.sourceChainComplete !== true ||
  artifact.audit.frequencyBufferCanonicalIdentityShared !== true ||
  artifact.audit.presentationScientificFieldCount !== 0 ||
  artifact.audit.frequencyBufferMutationCount !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.audit.scienceEffectsZero !== true ||
  artifact.audit.cinematicSeedDeterministic !== true ||
  artifact.audit.absoluteFrequencyRows !== 0 ||
  artifact.audit.physicalBandpassRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.boundary.normalizedFrequencyAuthorityGranted !== true ||
  artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.productionPayloadAllowed !== false ||
  artifact.boundary.imageProductsGenerated !== false ||
  artifact.boundary.frequencyBufferMutationAllowed !== false ||
  artifact.boundary.cinematicScienceWritebackAllowed !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v479-fail-closed-validation");
}

const chainPaths = {
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v475: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
  v477: "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json",
  v478: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
};
for (const entry of artifact.sourceChain) {
  if (fileSha(chainPaths[entry.id]) !== entry.fileSha256) throw new Error("v479-chain-sha:" + entry.id);
}
for (const entry of artifact.provenance) {
  if (
    !entry.sourceRowSha256 ||
    entry.sampleIndices.length !== 5 ||
    entry.formulaIds.length !== 4 ||
    entry.physicalApplicability !== "normalized-coordinate-only-absolute-bandpass-unavailable"
  ) {
    throw new Error("v479-provenance-row");
  }
}
if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v478EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v478PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v479ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v479FrequencyBufferSha256 !== artifact.frequencyBufferSha256 ||
  evidence.dependency.v479ProvenanceSha256 !== artifact.provenanceSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath) ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v479-continuity-boundary");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error("v479-source-manifest:" + entry.path);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) throw new Error("v479-source-manifest-canonical");

const runtimeFiles = [
  "app/lib/kerrFrequencyProvenanceViewerV479.ts",
  "app/lib/kerrFrequencyProvenanceServerV479.ts",
  "app/lib/kerrFrequencyProvenanceClientV479.ts",
  "app/components/KerrFrequencyProvenanceViewerV479.tsx",
  "app/api/atlas/relativity-evidence/v479/frequency-provenance-viewer/route.ts",
  "app/local-shadow-v479/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("同一条证据链，两个不会串写的视图") ||
  !runtimeSource.includes("共享同一份 20 样本 frequency buffer") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v479-utf8-runtime-boundary");
}
const forbidden = readdirSync(resolve(root, "dist/science/kerr-frequency-provenance-viewer-v479")).filter((name) =>
  [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v479-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v479-transient-leak");
}
console.log(JSON.stringify({ status: "passed-v479-low-memory-frequency-provenance-viewer-fail-closed", artifactSha256: artifact.artifactSha256, frequencyBufferSha256: artifact.frequencyBufferSha256, provenanceSha256: artifact.provenanceSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, sourceChain: 5, rows: 4, samples: 20, presentationScientificFields: 0, frequencyBufferMutations: 0, absoluteFrequencyRows: 0, physicalBandpassRows: 0, sciencePixels: 0, denseCampaign: "0/49", browserQualification: "not-run", formalProductPointer: "v263" }, null, 2));
