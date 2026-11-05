import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v341Evidence: "dist/science/orbit-atlas-shadow-v341-evidence.json",
  v341Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v341.json",
  raster: "dist/science/kerr-observation-raster-v342/raster.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v342-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v342.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v341Evidence = read(paths.v341Evidence);
const v341Pointer = read(paths.v341Pointer);
const rasterArtifact = read(paths.raster);
const raster = rasterArtifact.raster ?? {};
const audit = rasterArtifact.audit ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (v341Evidence.status !== "sparse-observation-product-v341-qualified-browser-pending-dense-incomplete-0-of-49"
  || v341Pointer.capabilities?.v341ObservationProduct !== "four-disk-rays-twelve-band-geometry-polarization-radiance-uncertainty-instrument-product"
  || !/^[a-f0-9]{64}$/.test(rasterArtifact.artifactSha256 ?? "") || sha(rasterArtifact) !== rasterArtifact.artifactSha256
  || raster.version !== "v342-kerr-sparse-observation-raster-v1" || raster.status !== "qualified-sparse-observation-raster"
  || raster.counts?.rowCount !== 4 || raster.counts.columnCount !== 3 || raster.counts.cellCount !== 12 || raster.counts.bandCount !== 3
  || raster.authority?.denseCampaignStatus !== "incomplete-0-of-49" || raster.authority?.denseAggregateSha256 !== null
  || raster.scienceProfileInvariant !== true || raster.sciencePhysicalValuesUnchanged !== true || raster.cinematicCopiesDisjoint !== true || raster.cinematicPairwiseDistinct !== true
  || audit.status !== "qualified-raster-science-invariant-cinematic-seeded" || audit.cellCount !== 12 || audit.bandCount !== 3 || audit.scienceProfileInvariant !== true || audit.physicalValuesBeforeAfterIdentical !== true || audit.cinematicPhysicalFieldsExcluded !== true
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied") throw new Error("v342-raster-boundary-mismatch");
const sourcePaths = [
  "app/lib/kerrScienceObservationRasterV342.ts",
  "app/lib/kerrScienceObservationRasterV342.test.ts",
  "app/lib/atlasShadowCapabilityPointerV342.ts",
  "app/lib/atlasShadowCapabilityPointerV342.test.ts",
  "app/lib/relativityWorkbenchEvidenceV342.ts",
  "app/lib/relativityEvidenceServerV342.ts",
  "app/lib/relativityEvidenceServerV342.test.ts",
  "app/api/atlas/relativity-evidence/v342/route.ts",
  "app/api/atlas/relativity-evidence/v342/route.test.ts",
  "app/components/RelativityEvidenceSurfaceV342.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-kerr-science-observation-raster-v342.ts",
  "scripts/build-shadow-candidate-v342.mjs",
  "scripts/verify-shadow-v342-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v342-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "sparse-observation-raster-v342-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v341EvidenceSha256: v341Evidence.evidenceSha256, v341PointerSha256: v341Pointer.pointerSha256, rasterArtifactSha256: rasterArtifact.artifactSha256 },
  raster: { status: raster.status, rowCount: raster.counts.rowCount, columnCount: raster.counts.columnCount, cellCount: raster.counts.cellCount, bandOrder: raster.bandOrder, scienceDigest: raster.scienceDigest, cinematicDigests: raster.cinematicDigests, scienceProfileInvariant: raster.scienceProfileInvariant, sciencePhysicalValuesUnchanged: raster.sciencePhysicalValuesUnchanged, cinematicCopiesDisjoint: raster.cinematicCopiesDisjoint, cinematicPairwiseDistinct: raster.cinematicPairwiseDistinct, displayBoundary: raster.displayBoundary, denseStatus: raster.authority.denseCampaignStatus, cells: raster.scienceCells },
  audit: { status: audit.status, scienceDigest: audit.scienceDigest, scienceProfileInvariant: audit.scienceProfileInvariant, physicalValuesBeforeAfterIdentical: audit.physicalValuesBeforeAfterIdentical, cinematicPhysicalFieldsExcluded: audit.cinematicPhysicalFieldsExcluded },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "v342-sparse-raster-no-dense-image-no-science-authority-replacement-no-heavy-browser-qualification",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v342",
  generatedAt: new Date().toISOString(),
  status: "sparse-observation-raster-v342-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v341ObservationProduct: "qualified-four-disk-rays-twelve-band-product",
    v342ObservationRaster: "four-by-three-fixed-linear-sparse-raster",
    v342ScienceBoundary: "raw-radiance-and-error-envelope-read-only",
    v342CinematicBoundary: "seeded-copy-disjoint-no-physical-measurement-fields",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, cells: evidence.raster.cellCount, scienceDigest: evidence.raster.scienceDigest, cinematicDigests: evidence.raster.cinematicDigests, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
