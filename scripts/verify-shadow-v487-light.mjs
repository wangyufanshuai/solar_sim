import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const text = (path) => bytes(path).toString("utf8");
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
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactPath = "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json";
const svgPath = "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.svg";
const evidencePath = "dist/science/orbit-atlas-shadow-v487-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v487.json";
const artifact = read(artifactPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v486-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v486.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
if (
  artifact.version !== "v487-kerr-dimensionless-photon-atlas-artifact-v1" ||
  evidence.version !== "orbit-atlas-shadow-v487-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v487" ||
  canonicalSha(artifact) !== artifact.artifactSha256 ||
  canonicalSha(artifact.rays) !== artifact.payloadSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v486EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v486PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v487ArtifactSha256 !== artifact.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath) ||
  fileSha(svgPath) !== artifact.vectorDiagnostic.fileSha256
) {
  throw new Error("v487-canonical-chain");
}

const svg = text(svgPath);
if (
  artifact.rays.length !== 4 ||
  artifact.rays.flatMap((ray) => ray.landmarks).length !== 20 ||
  artifact.rays.some((ray) =>
    ray.identifiability.identifiableDimension !== 1 ||
    ray.identifiability.unidentifiableDimension !== 4 ||
    ray.landmarks.some((landmark) => landmark.applicability !== "dimensionless-feature-position-only")
  ) ||
  artifact.audit.matrixElementCountCopied !== 0 ||
  artifact.audit.projectionRecordCountCopied !== 0 ||
  artifact.audit.detectorObservableRows !== 0 ||
  artifact.audit.observedIntensityRows !== 0 ||
  artifact.audit.sciencePixelRows !== 0 ||
  artifact.audit.fitsProducts !== 0 ||
  artifact.audit.pngProducts !== 0 ||
  artifact.boundary.absoluteFrequencyAuthorityGranted !== false ||
  artifact.boundary.physicalBandpassAuthorityGranted !== false ||
  artifact.boundary.detectorThroughputAuthorityGranted !== false ||
  artifact.boundary.observedIntensityAuthorityGranted !== false ||
  artifact.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  artifact.boundary.scienceRasterAuthorityGranted !== false ||
  artifact.boundary.browserQualification !== "not-run" ||
  !svg.startsWith("<?xml") ||
  !svg.includes("This is a coordinate diagnostic, not an intensity spectrum or detector image") ||
  svg.includes("<script") ||
  /(?:href|src)=["'](?:https?:|data:|javascript:)/i.test(svg)
) {
  throw new Error("v487-science-boundary");
}

const component = text("app/components/KerrDimensionlessPhotonAtlasV487.tsx");
const client = text("app/lib/kerrDimensionlessPhotonAtlasClientV487.ts");
const route = text("app/api/atlas/relativity-evidence/v487/dimensionless-photon-atlas/route.ts");
const page = text("app/local-shadow-v487/page.tsx");
if (
  !component.includes("Load bounded coordinate atlas") ||
  component.includes("useEffect") ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  !component.includes("The same immutable science SVG is used in both shells") ||
  !client.includes("requestCount: 0") ||
  !client.includes("if (requestPromise) return requestPromise") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes("Content-Security-Policy") ||
  !route.includes("128 * 1024") ||
  !page.includes('NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"')
) {
  throw new Error("v487-runtime-boundary");
}

if (
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.localShadowDefaultApplied !== false
) {
  throw new Error("v487-continuity-boundary");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) throw new Error(`v487-source-manifest:${entry.path}`);
}
if (canonicalSha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v487-source-manifest-canonical");
}

console.log(JSON.stringify({
  status: "passed-v487-low-memory-dimensionless-photon-atlas",
  artifactSha256: artifact.artifactSha256,
  payloadSha256: artifact.payloadSha256,
  svgSha256: artifact.vectorDiagnostic.fileSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  rays: 4,
  landmarks: 20,
  rank: "1/5",
  physicalObservables: "blocked",
  sciencePixels: 0,
  browserQualification: "not-run",
  denseCampaign: "0/49",
  formalProductPointer: "v263",
}, null, 2));
