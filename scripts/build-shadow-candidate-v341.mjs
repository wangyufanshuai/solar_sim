import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v340Evidence: "dist/science/orbit-atlas-shadow-v340-evidence.json",
  v340Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v340.json",
  product: "dist/science/kerr-observation-product-v341/observation-product.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v341-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v341.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const v340Evidence = read(paths.v340Evidence);
const v340Pointer = read(paths.v340Pointer);
const productArtifact = read(paths.product);
const product = productArtifact.product ?? {};
const profileAudit = productArtifact.profileAudit ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (v340Evidence.status !== "visual-v7-v340-wired-browser-pending-dense-incomplete-0-of-49"
  || v340Pointer.capabilities?.v340VisualProfile !== "science-cinematic-v7-deep-space-precision-observatory"
  || productArtifact.status !== "qualified-sparse-observation-product-science-profile-invariant"
  || !/^[a-f0-9]{64}$/.test(productArtifact.artifactSha256 ?? "") || sha(productArtifact) !== productArtifact.artifactSha256
  || product.version !== "v341-kerr-sparse-observation-product-v1"
  || product.status !== "qualified-sparse-observation-product"
  || product.counts?.authorityRayCount !== 16 || product.counts.applicableDiskRayCount !== 4 || product.counts.bandMeasurementCount !== 12
  || product.authority?.denseCampaignStatus !== "incomplete-0-of-49" || product.authority?.denseAggregateSha256 !== null
  || product.instrument?.status !== "synthetic-audit-fixture-not-calibrated-observatory"
  || product.instrument?.stochasticNoise !== "disabled"
  || profileAudit.status !== "qualified-science-profile-invariant-cinematic-copy-isolated"
  || profileAudit.measurementCount !== 12 || profileAudit.scienceProfileInvariant !== true || profileAudit.cinematicPairwiseDistinct !== true
  || profileAudit.sourceProductByteIdentical !== true || profileAudit.presentationCopiesDisjoint !== true
  || profileAudit.cinematicPhysicalMeasurementFieldsExcluded !== true
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied") {
  throw new Error("v341-observation-boundary-mismatch");
}
const sourcePaths = [
  "app/lib/kerrScienceObservationProductV341.ts",
  "app/lib/kerrScienceObservationProductV341.test.ts",
  "app/lib/atlasShadowCapabilityPointerV341.ts",
  "app/lib/atlasShadowCapabilityPointerV341.test.ts",
  "app/lib/relativityWorkbenchEvidenceV341.ts",
  "app/lib/relativityEvidenceServerV341.ts",
  "app/lib/relativityEvidenceServerV341.test.ts",
  "app/api/atlas/relativity-evidence/v341/route.ts",
  "app/api/atlas/relativity-evidence/v341/route.test.ts",
  "app/components/RelativityEvidenceSurfaceV341.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-kerr-science-observation-product-v341.ts",
  "scripts/build-shadow-candidate-v341.mjs",
  "scripts/verify-shadow-v341-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v341-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "sparse-observation-product-v341-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v340EvidenceSha256: v340Evidence.evidenceSha256, v340PointerSha256: v340Pointer.pointerSha256, productArtifactSha256: productArtifact.artifactSha256 },
  observation: {
    status: product.status,
    authorityKind: product.authority.kind,
    authorityRayCount: product.counts.authorityRayCount,
    applicableDiskRayCount: product.counts.applicableDiskRayCount,
    unavailableRayCount: product.counts.unavailableRayCount,
    bandMeasurementCount: product.counts.bandMeasurementCount,
    polarizationMeasurementCount: product.counts.polarizationMeasurementCount,
    maximumEnvelope: product.maxima.conservativeLinearRelativeEnvelope,
    maximumInstrumentQuadrature: product.maxima.instrumentQuadratureRelativeDifference,
    maximumEvpaDifferenceDeg: product.maxima.evpaDifferenceDeg,
    expectedPhotonsPerPixelExposure: product.maxima.expectedPhotonsPerPixelExposure,
    instrumentModel: product.instrument.modelId,
    instrumentStatus: product.instrument.status,
    scienceCinematicBoundary: product.scienceCinematicBoundary,
  },
  profileAudit: { status: profileAudit.status, scienceDigest: profileAudit.scienceDigest, scienceDigests: profileAudit.scienceDigests, cinematicDigests: profileAudit.cinematicDigests, scienceProfileInvariant: profileAudit.scienceProfileInvariant, cinematicPairwiseDistinct: profileAudit.cinematicPairwiseDistinct, sourceProductByteIdentical: profileAudit.sourceProductByteIdentical, presentationCopiesDisjoint: profileAudit.presentationCopiesDisjoint, cinematicPhysicalMeasurementFieldsExcluded: profileAudit.cinematicPhysicalMeasurementFieldsExcluded },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "v341-sparse-observation-product-no-dense-image-no-measured-counts-no-cinematic-science-mutation-browser-heavy-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v341",
  generatedAt: new Date().toISOString(),
  status: "sparse-observation-product-v341-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v340VisualProfile: "science-cinematic-v7-deep-space-precision-observatory",
    v341ObservationProduct: "four-disk-rays-twelve-band-geometry-polarization-radiance-uncertainty-instrument-product",
    v341ScienceProfiles: "v5-v6-v7-physical-measurements-invariant",
    v341CinematicBoundary: "seeded-presentation-copies-disjoint-no-physical-fields",
    v341InstrumentBoundary: "synthetic-audit-fixture-not-calibrated-observatory",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, measurements: evidence.observation.bandMeasurementCount, scienceDigest: evidence.profileAudit.scienceDigest, cinematicDigests: evidence.profileAudit.cinematicDigests, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
