import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { auditAtlasScienceCinematicV7BoundaryV457 } from "../app/lib/atlasScienceCinematicV7V457";
import {
  canonicalKerrScienceProductEligibilityGraphV512,
  parseKerrScienceProductEligibilityGraphArtifactV512,
} from "../app/lib/kerrScienceProductEligibilityGraphV512";

const root = process.cwd();
const paths = Object.freeze({
  v456: "dist/science/kerr-sparse-science-image-v456/sparse-image-qualification.json",
  v457: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  v511Matrix: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  v511Runtime: "dist/science/kerr-instrument-authority-matrix-v511/runtime-audit.json",
  v511Evidence: "dist/science/orbit-atlas-shadow-v511-evidence.json",
  v511Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v511.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-science-product-eligibility-v512/eligibility-graph.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v456 = read(paths.v456);
const v457 = read(paths.v457);
const v511Matrix = read(paths.v511Matrix);
const v511Runtime = read(paths.v511Runtime);
const v511Evidence = read(paths.v511Evidence);
const v511Pointer = read(paths.v511Pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const visualBoundary = auditAtlasScienceCinematicV7BoundaryV457();
if (
  sha(v456) !== v456.artifactSha256 ||
  v456.counts?.headerCardCount !== 22 ||
  v456.counts?.sparseCoordinateRows !== 4 ||
  v456.counts?.sparseValueRows !== 0 ||
  v456.counts?.scienceRasterRows !== 0 ||
  v456.counts?.fitsFilesEmitted !== 0 ||
  v456.counts?.pngFilesEmitted !== 0 ||
  v456.sciencePayload?.wcsCoordinateAuthority !== true ||
  v456.sciencePayload?.detectorValueAuthority !== false ||
  sha(v457) !== v457.artifactSha256 ||
  v457.counts?.gateCount !== 10 ||
  v457.counts?.qualifiedCount !== 2 ||
  v457.counts?.blockerCount !== 8 ||
  v457.decisions?.promotionAllowed !== false ||
  v457.decisions?.fitsWriteAllowed !== false ||
  v457.decisions?.pngWriteAllowed !== false ||
  sha(v511Matrix) !== v511Matrix.artifactSha256 ||
  v511Matrix.counts?.sourcePhotonRows !== 4 ||
  v511Matrix.counts?.measuredResponseRows !== 0 ||
  v511Matrix.counts?.electronExpectationRows !== 0 ||
  sha(v511Runtime) !== v511Runtime.artifactSha256 ||
  v511Runtime.runtime?.finalResourceStatus !== "baseline" ||
  v511Evidence.version !== "orbit-atlas-shadow-v511-evidence-v1" ||
  sha(v511Evidence) !== v511Evidence.evidenceSha256 ||
  v511Pointer.version !== "orbit-atlas-current-local-shadow-candidate-v511" ||
  sha(v511Pointer) !== v511Pointer.pointerSha256 ||
  visualBoundary.profileId !== "science-cinematic-v7-v457" ||
  visualBoundary.scienceBloomDisabled !== true ||
  visualBoundary.scienceGradeDisabled !== true ||
  visualBoundary.scientificFieldMutation !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v512-product-source-boundary");
}

const sourcePaths = [
  paths.v456,
  paths.v457,
  paths.v511Matrix,
  paths.v511Runtime,
  paths.v511Evidence,
  paths.v511Pointer,
  paths.dense,
  paths.formal,
  "app/lib/atlasScienceCinematicV7V457.ts",
  "app/lib/kerrScienceProductEligibilityGraphV512.ts",
  "scripts/build-kerr-science-product-eligibility-graph-v512.ts",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((left, right) => left.path.localeCompare(right.path));
const node = (
  id: string,
  status: string,
  authorityClass: string,
  artifactSha256: string,
  availableRows: number,
  reason: string,
) => ({
  id,
  status,
  authorityClass,
  artifactSha256,
  availableRows,
  measuredRows: 0 as const,
  grantsScienceImageAuthority: false as const,
  reason,
});
const nodes = Object.freeze([
  node("fits-header-structure", "qualified", "structure", v456.artifactSha256, 22, "fits-keyword-and-astropy-roundtrip-qualified-no-hdu"),
  node("wcs-coordinate-envelope", "qualified", "coordinate", v456.artifactSha256, 4, "four-coordinate-rows-qualified-values-absent"),
  node("sparse-photon-observable", "qualified", "computational-observable", v511Matrix.artifactSha256, 4, "four-sparse-photon-observables-qualified-no-detector-projection"),
  node("measured-detector-inputs", "blocked", "measured-input", v511Matrix.artifactSha256, 0, "six-measured-calibration-files-missing"),
  node("detector-response", "blocked", "detector-conversion", v511Matrix.artifactSha256, 0, "measured-response-authority-unavailable"),
  node("electron-expectation", "blocked", "detector-conversion", v511Matrix.artifactSha256, 0, "geometry-exposure-and-response-authority-unavailable"),
  node("detector-pixel-values", "blocked", "pixel-value", v456.artifactSha256, 0, "coordinate-value-join-forbidden"),
  node("dense-aggregate", "incomplete", "campaign", dense.stateSha256, 0, "dense-campaign-incomplete-0-of-49"),
  node("heavy-qualification", "not-run", "qualification", v457.artifactSha256, 0, "browser-visual-soak-and-rtx-not-run"),
  node("science-product-promotion", "blocked", "promotion", v457.artifactSha256, 0, "eight-promotion-blockers-remain"),
]);
const edges = Object.freeze([
  { from: "fits-header-structure", to: "science-product-promotion", relation: "qualifies-structure-only", satisfied: true },
  { from: "wcs-coordinate-envelope", to: "detector-pixel-values", relation: "requires", satisfied: true },
  { from: "sparse-photon-observable", to: "electron-expectation", relation: "requires", satisfied: true },
  { from: "measured-detector-inputs", to: "detector-response", relation: "requires", satisfied: false },
  { from: "detector-response", to: "electron-expectation", relation: "requires", satisfied: false },
  { from: "electron-expectation", to: "detector-pixel-values", relation: "requires", satisfied: false },
  { from: "detector-pixel-values", to: "science-product-promotion", relation: "requires", satisfied: false },
  { from: "dense-aggregate", to: "science-product-promotion", relation: "requires", satisfied: false },
  { from: "heavy-qualification", to: "science-product-promotion", relation: "requires", satisfied: false },
  { from: "wcs-coordinate-envelope", to: "science-product-promotion", relation: "qualifies-structure-only", satisfied: true },
  { from: "sparse-photon-observable", to: "science-product-promotion", relation: "constrains", satisfied: true },
  { from: "measured-detector-inputs", to: "detector-pixel-values", relation: "requires", satisfied: false },
] as const);
const products = Object.freeze([
  { id: "fits-header-fixture", availability: "qualified", scienceAuthority: false, detectorImageClaimAllowed: false, scientificFieldMutationAllowed: false, reason: "header-structure-only-no-hdu" },
  { id: "wcs-coordinate-overlay", availability: "qualified", scienceAuthority: true, detectorImageClaimAllowed: false, scientificFieldMutationAllowed: false, reason: "coordinate-authority-only-values-absent" },
  { id: "sparse-photon-table", availability: "qualified", scienceAuthority: true, detectorImageClaimAllowed: false, scientificFieldMutationAllowed: false, reason: "four-computational-photon-observables" },
  { id: "cinematic-coordinate-composite", availability: "local-shadow-presentation-only", scienceAuthority: false, detectorImageClaimAllowed: false, scientificFieldMutationAllowed: false, reason: "seeded-style-may-not-claim-detector-image" },
  { id: "science-fits-hdu", availability: "blocked", scienceAuthority: false, detectorImageClaimAllowed: false, scientificFieldMutationAllowed: false, reason: "detector-values-dense-and-heavy-qualification-missing" },
  { id: "science-png-raster", availability: "blocked", scienceAuthority: false, detectorImageClaimAllowed: false, scientificFieldMutationAllowed: false, reason: "science-raster-authority-unavailable" },
] as const);
const unsigned = {
  version: "v512-kerr-science-product-eligibility-graph-v1" as const,
  generatedAt: "2026-08-01T00:00:00Z",
  status: "science-product-eligibility-graph-qualified-promotion-blocked" as const,
  source: Object.freeze({
    v456ArtifactSha256: v456.artifactSha256,
    v457ArtifactSha256: v457.artifactSha256,
    v511MatrixArtifactSha256: v511Matrix.artifactSha256,
    v511RuntimeArtifactSha256: v511Runtime.artifactSha256,
    v511EvidenceSha256: v511Evidence.evidenceSha256,
    v511PointerSha256: v511Pointer.pointerSha256,
  }),
  nodes,
  edges,
  products,
  counts: Object.freeze({
    nodeCount: 10 as const,
    edgeCount: edges.length,
    qualifiedNodeCount: 3 as const,
    blockedNodeCount: 5 as const,
    incompleteNodeCount: 1 as const,
    notRunNodeCount: 1 as const,
    fitsHeaderCards: 22 as const,
    wcsCoordinateRows: 4 as const,
    sparsePhotonRows: 4 as const,
    sparseValueRows: 0 as const,
    detectorProjectionRows: 0 as const,
    measuredResponseRows: 0 as const,
    electronExpectationRows: 0 as const,
    scienceRasterRows: 0 as const,
    fitsHduCount: 0 as const,
    pngCount: 0 as const,
  }),
  visualBoundary: Object.freeze({
    profileId: "science-cinematic-v7-v457" as const,
    scienceLinearDisplay: true as const,
    scienceBloomDisabled: true as const,
    scienceGradeDisabled: true as const,
    cinematicSeed: "orbit-atlas-v457-cinematic-seed-01" as const,
    cinematicMayStyleCoordinates: true as const,
    cinematicMayClaimDetectorImage: false as const,
    scientificFieldMutation: false as const,
    localShadowOnly: true as const,
    defaultApplied: false as const,
  }),
  decision: Object.freeze({
    coordinateOnlyScienceDisplayAllowed: true as const,
    sparsePhotonTableAllowed: true as const,
    detectorImageAuthorityGranted: false as const,
    scienceProductPromotionAllowed: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
    localShadowDefaultApplied: false as const,
  }),
  boundary: Object.freeze({
    detectorResponseAvailable: false as const,
    observedCountsAvailable: false as const,
    observedIntensityAvailable: false as const,
    scienceRasterAvailable: false as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    sciencePayloadMutationAllowed: false as const,
    formalProductPointer: "v263" as const,
    formalDefaultKernel: "legacy-eih-1pn" as const,
  }),
  sourceManifest,
  sourceSha256: sha(sourceManifest),
};
const artifact = parseKerrScienceProductEligibilityGraphArtifactV512({
  ...unsigned,
  artifactSha256: createHash("sha256")
    .update(canonicalKerrScienceProductEligibilityGraphV512(unsigned))
    .digest("hex"),
});
atomic(paths.output, artifact);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  nodes: artifact.counts.nodeCount,
  edges: artifact.counts.edgeCount,
  qualifiedNodes: artifact.counts.qualifiedNodeCount,
  blockedNodes: artifact.counts.blockedNodeCount,
  coordinates: artifact.counts.wcsCoordinateRows,
  photonRows: artifact.counts.sparsePhotonRows,
  sciencePixels: artifact.counts.scienceRasterRows,
  fitsHdu: artifact.counts.fitsHduCount,
  png: artifact.counts.pngCount,
  promotionAllowed: artifact.decision.scienceProductPromotionAllowed,
}, null, 2));
