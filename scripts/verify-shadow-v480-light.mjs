import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
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

const artifactPath = "dist/science/kerr-photon-evidence-workbench-v480/workbench.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v480-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v480.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v479-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v479.json");
const v476 = read("dist/science/kerr-science-product-admission-v476/admission.json");
const v479 = read("dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.version !== "v480-kerr-photon-evidence-workbench-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v480-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v480" ||
  artifact.stages.length !== 3 ||
  artifact.products.length !== 9 ||
  artifact.products.filter((product) => product.available).length !== 2 ||
  artifact.products.filter((product) => !product.available).length !== 7 ||
  artifact.products.some((product) => product.placeholderAllowed || product.presentationFallbackAllowed) ||
  artifact.provenance.length !== 4 ||
  artifact.provenance.reduce((count, row) => count + row.sampleCount, 0) !== 20 ||
  artifact.buffers.sparseScienceBufferSha256 !== v476.scienceBufferSha256 ||
  artifact.buffers.normalizedFrequencyBufferSha256 !== v479.frequencyBufferSha256 ||
  artifact.buffers.provenanceSha256 !== v479.provenanceSha256 ||
  artifact.buffers.sparseScienceBufferSha256 === artifact.buffers.normalizedFrequencyBufferSha256 ||
  artifact.buffers.scienceViewFrequencyBufferSha256 !== artifact.buffers.normalizedFrequencyBufferSha256 ||
  artifact.buffers.cinematicViewFrequencyBufferSha256 !== artifact.buffers.normalizedFrequencyBufferSha256 ||
  artifact.buffers.scienceViewAndCinematicViewShareFrequencyBuffer !== true ||
  artifact.audit.absoluteFrequencyRows !== 0 ||
  artifact.audit.physicalBandpassRows !== 0 ||
  artifact.audit.observedIntensityRows !== 0 ||
  artifact.audit.measuredStokesRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.imageProducts !== 0 ||
  artifact.audit.scienceWritebackCount !== 0 ||
  artifact.lifecycle.allResourcesAtBaseline !== true ||
  artifact.boundary.sparseAuthorityGranted !== true ||
  artifact.boundary.normalizedFrequencyAuthorityGranted !== true ||
  artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.observedIntensityAuthorityGranted !== false ||
  artifact.boundary.measuredStokesAuthorityGranted !== false ||
  artifact.boundary.denseAggregateAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.fitsWriteAllowed !== false ||
  artifact.boundary.pngWriteAllowed !== false ||
  artifact.boundary.denseShardRunAllowed !== false ||
  artifact.boundary.browserQualification !== "not-run"
) {
  throw new Error("v480-fail-closed-validation");
}

if (
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v479EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v479PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v480ArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v476ScienceBufferSha256 !== artifact.buffers.sparseScienceBufferSha256 ||
  evidence.dependency.v479FrequencyBufferSha256 !== artifact.buffers.normalizedFrequencyBufferSha256 ||
  evidence.dependency.v479ProvenanceSha256 !== artifact.buffers.provenanceSha256 ||
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
  throw new Error("v480-continuity-boundary");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v480-source-manifest:${entry.path}`);
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v480-source-manifest-canonical");
}

const runtimeFiles = [
  "app/lib/kerrPhotonEvidenceWorkbenchV480.ts",
  "app/lib/kerrPhotonEvidenceWorkbenchServerV480.ts",
  "app/lib/kerrPhotonEvidenceWorkbenchClientV480.ts",
  "app/components/KerrPhotonEvidenceWorkbenchV480.tsx",
  "app/api/atlas/relativity-evidence/v480/photon-evidence-workbench/route.ts",
  "app/local-shadow-v480/page.tsx",
];
const runtimeSource = runtimeFiles
  .map((path) => new TextDecoder("utf-8", { fatal: true }).decode(bytes(path)))
  .join("\n");
if (
  !runtimeSource.includes("normalized-frequency buffer") ||
  !runtimeSource.includes("2 allowed") ||
  !runtimeSource.includes("7 blocked") ||
  runtimeSource.includes("Math.random") ||
  runtimeSource.includes("<canvas") ||
  runtimeSource.includes("�")
) {
  throw new Error("v480-runtime-boundary");
}

const forbidden = readdirSync(resolve(root, "dist/science/kerr-photon-evidence-workbench-v480")).filter(
  (name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);
if (forbidden.length) throw new Error("v480-forbidden-image");
const serialized = JSON.stringify({ artifact, evidence, pointer });
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(serialized)) {
  throw new Error("v480-transient-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v480-low-memory-photon-evidence-workbench-fail-closed",
      artifactSha256: artifact.artifactSha256,
      sparseScienceBufferSha256: artifact.buffers.sparseScienceBufferSha256,
      normalizedFrequencyBufferSha256: artifact.buffers.normalizedFrequencyBufferSha256,
      provenanceSha256: artifact.buffers.provenanceSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      stages: 3,
      products: "2 allowed / 7 blocked",
      provenance: "4 rows / 20 samples",
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
