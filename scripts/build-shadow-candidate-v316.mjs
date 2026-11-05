import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v315Evidence: "dist/science/orbit-atlas-shadow-v315-evidence.json",
  v315Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v315.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v316-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v316.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const v315Evidence = read(paths.v315Evidence);
const v315Pointer = read(paths.v315Pointer);
const state = read(paths.state);
const formal = read(paths.formal);
if (v315Evidence.status !== "science-runtime-upgraded-corrected-dense-incomplete-0-of-49"
  || v315Evidence.runtime?.scienceAuthority !== "v312-v313-short-gate-sparse"
  || v315Pointer.capabilities?.v315ScienceRuntime !== "implemented-v312-v313-sparse-authority") {
  throw new Error("v316 v315 dependency mismatch");
}
if (state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false
  || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer"
  || formal.publicDeploymentBlocked !== true) throw new Error("v316 campaign or formal boundary mismatch");

const consumers = {
  "app/components/GalaxyEnvironmentSphere.tsx": [
    "visualSky.starLuminance", "visualSky.milkyWayOpacity", "visualSky.nebulaOpacity", "groups.postFx.saturation",
  ],
  "app/components/GalaxyEnvironmentSupport.ts": ["sky.backgroundExposure", "sky.blackLevel", "sky.highlightShoulder"],
  "app/components/Planet.tsx": ["groups.solar.terminatorSoftness", "groups.solar.cloudOpacity", "groups.solar.nightSideExposure"],
  "app/components/usePlanetPresentationMaterials.ts": ["uProfileTerminatorSoftness", "profileSoftness"],
  "app/components/SunBody.tsx": ["groups.solar.sunSurfaceLuminance"],
  "app/components/SaturnRingLayers.tsx": ["groups.solar.ringOpticalDepth", "groups.solar.ringShadowStrength"],
  "app/components/GaiaStarField.tsx": ["groups.catalog.brightStarOpacity", "groups.catalog.distanceLuminanceFalloff", "profileDistanceAttenuation"],
  "app/components/CatalogFaintStarFieldV272.tsx": ["groups.catalog.faintStarOpacity"],
  "app/components/StarClusterMarkers.tsx": ["groups.catalog.deepSkyMarkerOpacity"],
  "app/components/CosmicScaleDataLayerV260.tsx": ["groups.catalog.cosmicPointOpacity"],
  "app/components/UniversePmndrsPostProcessing.tsx": ["groups.postFx.bloomStrength", "groups.postFx.bloomThreshold", "groups.postFx.vignetteStrength"],
  "app/components/KerrBlackHole.tsx": ["runtimeTokens.strongGravity.opacity", "runtimeTokens.strongGravity.flowSpeed", "runtimeTokens.strongGravity.flowStrength"],
  "app/lib/kerrStrongGravityVisualV305.ts": ["strongGravity.scienceDisplayTransform", "cinematic?.scienceExposure", "cinematic?.scienceBloom", "cinematic?.scienceNoise", "cinematic?.cinematicExposure", "cinematic?.cinematicBloom", "cinematic?.diskDetailSeed", "cinematic?.redshiftColorStrength", "cinematic?.dopplerColorStrength"],
  "app/components/LaunchSceneView.tsx": ["runtimeTokens.launch.coreOpacity", "runtimeTokens.launch.haloOpacity", "runtimeTokens.launch.shockOpacity"],
  "app/components/useLaunchSceneResources.ts": ["runtimeTokens.launch.detailSeed"],
  "app/components/ExoplanetSystemScene.tsx": ["runtimeTokens.exoplanet.temperatureColorMix", "runtimeTokens.exoplanet.orbitOpacity"],
  "app/components/ScienceCinematicVisualSurfaceV261.tsx": ["runtimeTokens.hud.density", "runtimeTokens.hud.measurementColor", "runtimeTokens.hud.riskColor", "runtimeTokens.hud.borderOpacity", "runtimeTokens.hud.backdropOpacity", "runtimeTokens.hud.scienceMeasurementColor", "runtimeTokens.hud.riskBoundaryColor", "hudGridSizePx"],
};
for (const [path, expressions] of Object.entries(consumers)) {
  const source = text(path);
  for (const expression of expressions) if (!source.includes(expression)) throw new Error(`v316 missing runtime token consumer ${path}:${expression}`);
}
const auditSource = text("app/lib/atlasVisualTokenFieldAuditV316.ts");
const fieldDeclarationCount = (auditSource.match(/\{ token: /g) ?? []).length;
if (fieldDeclarationCount !== 46 || !auditSource.includes('status: complete ? "field-complete-static-consumer-contract"')) {
  throw new Error("v316 field audit conservation failed");
}
const profileSource = text("app/lib/atlasVisualProfileV299.ts");
if (!profileSource.includes('ATLAS_VISUAL_PROFILE_CANDIDATE_V299 = "science-cinematic-v5-v299"')
  || !profileSource.includes('ATLAS_VISUAL_PROFILE_CANDIDATE_V300 = "science-cinematic-v6-v300"')
  || !profileSource.includes('profile: "legacy-v9"') || !profileSource.includes("localShadowDefaultApplied: false")) {
  throw new Error("v316 visual profile default boundary mismatch");
}
const rendererSource = text("app/lib/kerrStrongGravityVisualV305.ts");
if (!rendererSource.includes('displayTransform: "linear-no-grade"') || !rendererSource.includes("scienceBufferMutationAllowed: false")
  || !rendererSource.includes('noise: 0') || !rendererSource.includes('source: "interactive-shadow-copy"')) {
  throw new Error("v316 science cinematic boundary mismatch");
}

const sourcePaths = [
  "scripts/build-shadow-candidate-v316.mjs",
  "scripts/verify-shadow-v316-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/atlasVisualTokenFieldAuditV316.ts",
  "app/lib/atlasVisualTokenFieldAuditV316.test.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.test.ts",
  "app/lib/atlasVisualRuntimeTokenAuditV285R1.test.ts",
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/atlasVisualProfileV299.test.ts",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/components/GalaxyEnvironmentSupport.ts",
  "app/components/Planet.tsx",
  "app/components/usePlanetPresentationMaterials.ts",
  "app/components/GaiaStarField.tsx",
  "app/components/ScienceCinematicVisualSurfaceV261.tsx",
  "app/lib/relativityWorkbenchEvidenceV285.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV316.ts",
  "app/lib/atlasShadowCapabilityPointerV316.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v316-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "visual-token-fields-qualified-browser-pending-dense-incomplete-0-of-49",
  dependency: { v315EvidenceSha256: v315Evidence.evidenceSha256, v315PointerSha256: v315Pointer.pointerSha256, scienceAuthority: v315Evidence.runtime.scienceAuthority },
  visual: {
    profiles: ["science-cinematic-v5-v299", "science-cinematic-v6-v300"],
    groupCount: 8,
    requiredFieldCount: 46,
    declaredFieldCount: 46,
    fieldAudit: "field-complete-static-consumer-contract",
    runtimeGroupSignature: "resolved-profile-exact-v300",
    telemetry: "v316-field-count-and-v300-live-group-consumption-dom-attributes",
    localShadowManualAbOnly: true,
    localShadowDefaultApplied: false,
    browserQualification: "not-run",
  },
  boundaries: {
    science: "fixed-linear-no-random-no-bloom-immutable-cpu-payload",
    cinematic: "seeded-decoration-interactive-shadow-copy-no-science-buffer-mutation",
    dense: "incomplete-0-of-49-no-aggregate",
    formalProductPointer: "v263",
    defaultKernel: "legacy-eih-1pn",
    workerPhysicsMutation: "not-applied",
  },
  correctedCampaign: { status: state.status, completedShardCount: 0, plannedShardCount: 49, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "static-field-qualified-runtime-group-signature-wired-browser-and-visual-matrix-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v316",
  generatedAt: new Date().toISOString(),
  status: "visual-token-fields-qualified-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v315ScienceRuntime: "implemented-v312-v313-sparse-authority",
    v316VisualTokenFields: "static-qualified-46-of-46-runtime-signature-wired",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    scienceCinematicBoundary: "immutable-science-buffer-seeded-cinematic-only",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, visualFields: pointer.capabilities.v316VisualTokenFields, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
