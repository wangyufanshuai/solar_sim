import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createAtlasVisualRuntimeMatrixV362 } from "../app/lib/atlasVisualRuntimeMatrixV362";
import { createKerrCanonicalRayViewV315, createKerrScienceGeometrySourceViewV315, createKerrSciencePolarizationSourceViewV315, createSparseKerrSciencePayloadV315 } from "../app/lib/kerrSciencePayloadV315";
import { replayKerrScienceCinematicV9V362 } from "../app/lib/kerrScienceCinematicV9V362";
import { loadKerrInstrumentLabSnapshotV362 } from "../app/lib/kerrInstrumentLabServerV362";
import { ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362, resolveAtlasVisualAssetSelectionV289 } from "../app/lib/atlasVisualAssetsV289";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V349, ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasVisualProfileV299 } from "../app/lib/atlasVisualProfileV299";

const root = process.cwd();
const output = "dist/science/atlas-visual-v9-v362/audit.json";
const bytes = (relative: string) => readFileSync(resolve(root, relative));
const read = (relative: string) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative: string) => createHash("sha256").update(bytes(relative)).digest("hex");
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

async function main(): Promise<void> {
const matrix = createAtlasVisualRuntimeMatrixV362();
const payload = createSparseKerrSciencePayloadV315(
  createKerrScienceGeometrySourceViewV315(read("dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json")),
  createKerrSciencePolarizationSourceViewV315(read("dist/science/kerr-reference-v313/polarization-short-gate.json")),
  createKerrCanonicalRayViewV315(read("dist/science/kerr-campaign-v314/ray-plan.json")),
);
const rendering = replayKerrScienceCinematicV9V362(payload);
const instrumentLab = await loadKerrInstrumentLabSnapshotV362(root);
const previousAudit = read("dist/science/atlas-visual-v8-v349/audit.json");
if (previousAudit.rendering?.scienceOutputDigest !== rendering.scienceOutputDigest
  || previousAudit.rendering?.cinematicDigests?.v8 !== rendering.cinematicDigests.v8) throw new Error("v362-v8-freeze-boundary");
const assetReady = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: ATLAS_VISUAL_PROFILE_CANDIDATE_V362, deepSpaceIntent: true });
const assetBeforeIntent = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: ATLAS_VISUAL_PROFILE_CANDIDATE_V362, deepSpaceIntent: false });
const assetLite = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "vercel-lite", visualProfile: ATLAS_VISUAL_PROFILE_CANDIDATE_V362, deepSpaceIntent: true });
const assetOrdinary = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "standalone-full", visualProfile: ATLAS_VISUAL_PROFILE_CANDIDATE_V362, deepSpaceIntent: true });
if (!assetReady.available || assetReady.provenance?.base.atlasVisualAssetRuntimeSelector !== ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362
  || assetBeforeIntent.reason !== "no-deep-space-intent" || assetLite.reason !== "lite-boundary" || assetOrdinary.reason !== "ordinary-standalone-boundary") throw new Error("v362-visual-asset-runtime-boundary");
const v8ProfileDigestSha256 = sha(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V349));
const v9ProfileDigestSha256 = sha(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362));
if (v8ProfileDigestSha256 === v9ProfileDigestSha256) throw new Error("v362-profile-distinction");
const consumers = [
  "app/components/GalaxyEnvironmentSphere.tsx", "app/components/Planet.tsx", "app/components/GaiaStarField.tsx",
  "app/components/UniversePmndrsPostProcessing.tsx", "app/components/KerrBlackHole.tsx", "app/components/LaunchSceneView.tsx",
  "app/components/ExoplanetSystemScene.tsx", "app/components/ScienceCinematicVisualSurfaceV261.tsx", "app/components/KerrInstrumentLabSurfaceV362.tsx",
];
const sourcePaths = [
  "app/lib/atlasVisualProfileV299.ts", "app/lib/atlasVisualRuntimeConsumptionV300.ts", "app/lib/atlasVisualRuntimeMatrixV362.ts",
  "app/lib/kerrStrongGravityVisualV305.ts", "app/lib/kerrScienceCinematicV9V362.ts", "app/lib/kerrInstrumentLabV362.ts",
  "app/lib/kerrInstrumentLabServerV362.ts", "app/lib/atlasVisualAssetsV289.ts", "app/components/AtlasVisualABControlV261.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", ...consumers, "scripts/build-visual-runtime-v362.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v362-atlas-visual-v9-instrument-lab-runtime-audit-v1",
  generatedAt: new Date().toISOString(),
  status: "implemented-v9-instrument-lab-science-frozen-browser-pending",
  visualDirection: "instrument-lab-uncertainty-observatory",
  matrix,
  rendering,
  instrumentLab,
  profileDigests: { v8ProfileDigestSha256, v9ProfileDigestSha256, instrumentLabTokenSignature: matrix.instrumentLabTokenSignature },
  runtimeConsumer: { component: "KerrInstrumentLabSurfaceV362", group: "hud", profileGate: ATLAS_VISUAL_PROFILE_CANDIDATE_V362, scienceBufferMutationAllowed: false, cinematicColorInputAllowed: false, deterministicSeed: 362 },
  assetRuntime: { availableAfterIntent: assetReady.available, selector: assetReady.provenance?.base.atlasVisualAssetRuntimeSelector ?? null, tier: assetReady.tier, beforeIntent: assetBeforeIntent.reason, lite: assetLite.reason, ordinaryStandalone: assetOrdinary.reason, networkDownloadApplied: false },
  ab: { profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V362, label: "V9 Instrument Lab · Shadow", localShadowManualOnly: true, defaultApplied: false, formalVisible: false, liteVisible: false, legacyV9NameAndDefaultUnchanged: true },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  browserQualification: "not-run",
  boundary: "instrument-lab-read-only-v9-manual-local-shadow-no-science-buffer-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, rows: matrix.rowCount, profiles: matrix.profiles, science: rendering.scienceOutputDigest, cinematic: rendering.cinematicDigests, instrument: instrumentLab.status, calibration: instrumentLab.measuredCalibration.status, assetSelector: artifact.assetRuntime.selector, browser: artifact.browserQualification }, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
