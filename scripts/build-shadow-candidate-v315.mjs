import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  envelope: "dist/science/kerr-reference-v313/portable-envelope.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  plan: "dist/science/kerr-campaign-v314/ray-plan.json",
  legacyState: "dist/science/kerr-campaign-v298r1/campaign-state.json",
  legacyTruth: "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v315-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v315.json",
};

const readBytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(readBytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(readBytes(relative)).digest("hex");
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};
const source = (relative) => readBytes(relative).toString("utf8");

const geometry = read(paths.geometry);
const polarization = read(paths.polarization);
const envelope = read(paths.envelope);
const state = read(paths.state);
const plan = read(paths.plan);
const legacyState = read(paths.legacyState);
const legacyTruth = read(paths.legacyTruth);
const formal = read(paths.formal);

const geometrySha = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e";
const geometryFileSha = "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91";
const polarizationSha = "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f";
const polarizationFileSha = "b102cff3adcd9f5c0f4b6e51c9a05e6baaa2516b21d7fa816ed86dbe6f0ec12b";
const fullShortSha = "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6";
const planSha = "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04";
const planFileSha = "a19598c89d98172850fb6faf0b5b00fbe3e369bda409abea7d7b76b431b0906c";

if (geometry.evidenceSha256 !== geometrySha || fileSha(paths.geometry) !== geometryFileSha
  || geometry.correctedAuthorityQualified !== true || geometry.executionCount !== 128
  || geometry.toleranceConvergence?.strictSolverLadderPairCount !== 64) throw new Error("v315 geometry authority lock mismatch");
if (polarization.evidenceSha256 !== polarizationSha || fileSha(paths.polarization) !== polarizationFileSha
  || polarization.geometryEvidenceSha256 !== geometrySha || polarization.qualified !== true
  || polarization.applicableExecutionCount !== 16) throw new Error("v315 polarization authority lock mismatch");
if (envelope.status !== "full-kerr-short-authority-qualified"
  || envelope.geometry?.evidenceSha256 !== geometrySha || envelope.polarization?.evidenceSha256 !== polarizationSha) {
  throw new Error("v315 portable envelope mismatch");
}
if (state.version !== "v314-kerr-corrected-dense-campaign-state-v1" || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0 || state.nextShardIndex !== 0 || state.attemptConsumed !== false
  || state.runNextAuthorized !== false || state.runNextAvailable !== false || state.aggregateAvailable !== false
  || state.authority?.fullShortAuthoritySha256 !== fullShortSha || state.rayPlanSha256 !== planSha
  || state.rayPlanFileSha256 !== planFileSha) throw new Error("v315 corrected dense state boundary mismatch");
if (plan.version !== "v314-kerr-corrected-dense-ray-plan-v1" || plan.planSha256 !== planSha
  || fileSha(paths.plan) !== planFileSha || plan.rays?.length !== 3097 || plan.shards?.length !== 49
  || plan.rays.slice(0, 16).some((ray, index) => ray.rayIndex !== index || ray.stratum !== "canonical")) {
  throw new Error("v315 corrected ray-plan boundary mismatch");
}
if (legacyState.status !== "incomplete-1-of-49" || legacyTruth.status !== "failed-tolerance-ladder-degenerate"
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true) {
  throw new Error("v315 historical or formal boundary mismatch");
}

const runtimeSource = source("app/lib/kerrSciencePayloadClientV299.ts");
const payloadSource = source("app/lib/kerrSciencePayloadV315.ts");
const rasterSource = source("app/lib/kerrScienceRasterV307.ts");
const browserGateSource = source("app/lib/atlasStrongGravityBrowserGateV310.ts");
const artifactRouteSource = source("app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts");
const observablesWorkbenchSource = source("app/components/KerrScienceObservablesWorkbenchV306.tsx");
for (const token of [
  "v315-corrected-geometry-source",
  "v315-corrected-polarization-source",
  "v314-canonical-rays",
  "createSparseKerrSciencePayloadV315",
]) if (!runtimeSource.includes(token)) throw new Error(`v315 runtime source missing ${token}`);
for (const token of [
  "v312-v313-short-gate-sparse",
  "v315-sparse-release-residual-budget-v1",
  "denseAggregateSha256: null",
  "denseCampaignComplete: false",
]) if (!payloadSource.includes(token)) throw new Error(`v315 payload boundary missing ${token}`);
if (!rasterSource.includes('payload.authorityKind !== "v312-v313-short-gate-sparse"')) throw new Error("v315 raster authority not wired");
if (!browserGateSource.includes('args.science.scienceAuthorityKind !== "v312-v313-short-gate-sparse"')) throw new Error("v315 browser authority gate not wired");
if (!artifactRouteSource.includes('"v315-science-observables"')
  || !observablesWorkbenchSource.includes('/artifacts/v315-science-observables')) {
  throw new Error("v315 corrected science observables are not wired");
}

const sourcePaths = [
  "scripts/build-shadow-candidate-v315.mjs",
  "scripts/verify-shadow-v315-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrCampaignV314.ts",
  "app/lib/kerrSciencePayloadV315.ts",
  "app/lib/kerrSciencePayloadV315.test.ts",
  "app/lib/strongGravityRenderingV299.ts",
  "app/lib/strongGravityRenderingV299.test.ts",
  "app/lib/kerrSciencePayloadClientV299.ts",
  "app/lib/kerrSciencePayloadClientV299.test.ts",
  "app/lib/kerrScienceRasterV307.ts",
  "app/lib/kerrScienceRasterV307.test.ts",
  "app/lib/kerrScienceObservablesV306.ts",
  "app/lib/kerrScienceObservablesV306.test.ts",
  "app/lib/atlasBrowserObservabilityV294.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/RelativityResearchWorkbenchV315.test.ts",
  "app/components/KerrScienceObservablesWorkbenchV306.tsx",
  "app/lib/atlasShadowCapabilityPointerV315.ts",
  "app/lib/atlasShadowCapabilityPointerV315.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v315-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "science-runtime-upgraded-corrected-dense-incomplete-0-of-49",
  authority: {
    fullShortAuthoritySha256: fullShortSha,
    geometry: { version: "v312", evidenceSha256: geometrySha, fileSha256: geometryFileSha, executionCount: 128, strictSolverLadderPairCount: 64 },
    polarization: { version: "v313", evidenceSha256: polarizationSha, fileSha256: polarizationFileSha, applicableExecutionCount: 16 },
    envelope: { path: paths.envelope, evidenceSha256: envelope.evidenceSha256, fileSha256: fileSha(paths.envelope) },
    rayPlan: { version: "v314", planSha256: planSha, fileSha256: planFileSha, canonicalRayCount: 16, plannedRayCount: 3097 },
  },
  runtime: {
    scienceAuthority: "v312-v313-short-gate-sparse",
    errorBudgetVersion: "v315-sparse-release-residual-budget-v1",
    sampleCount: 16,
    correctedGeometrySourceMaximumBytes: 64 * 1024,
    correctedPolarizationSourceMaximumBytes: 16 * 1024,
    canonicalRaySourceMaximumBytes: 32 * 1024,
    denseAggregateSha256: null,
    denseAuthorityAccepted: false,
    scienceDisplay: "fixed-linear-no-random-no-bloom",
    cinematicScientificBufferMutationAllowed: false,
    browserQualification: "not-run",
  },
  correctedCampaign: {
    namespace: "kerr-campaign-v314",
    status: "incomplete-0-of-49",
    stateSha256: state.stateSha256,
    planSha256: planSha,
    completedShardCount: 0,
    plannedShardCount: 49,
    runNextAuthorized: false,
    aggregateAvailable: false,
  },
  historicalCampaign: { namespace: "kerr-campaign-v298r1", status: "quarantined-1-of-49-tolerance-ladder-degenerate", truthAuditSha256: legacyTruth.truthAuditSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  science: { defaultKernel: "legacy-eih-1pn", workerPhysicsMutation: "not-applied", legacyKerrMutation: "not-applied", realtimePhysicsMutation: "not-applied" },
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "local-shadow-corrected-sparse-science-runtime-dense-incomplete-no-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v315",
  generatedAt: new Date().toISOString(),
  status: "science-runtime-upgraded-corrected-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v312GeometryTolerance: "corrected-authority-qualified",
    v313Polarization: "qualified-against-v312",
    fullKerrShortAuthority: "qualified-v312-v313-envelope",
    historicalV298r1: "quarantined-1-of-49-tolerance-ladder-degenerate",
    v314CorrectedDense: "incomplete-0-of-49",
    v315ScienceRuntime: "implemented-v312-v313-sparse-authority",
    denseBoundary: "incomplete-no-aggregate",
    browserQualification: "not-run",
    visualProfile: "manual-local-shadow-only-not-default",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scienceAuthority: evidence.runtime.scienceAuthority, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
