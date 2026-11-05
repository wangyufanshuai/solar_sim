import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V370,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  resolveAtlasInitialVisualProfileV299,
  resolveAtlasVisualProfileV299,
} from "../app/lib/atlasVisualProfileV299";

const root = process.cwd();
const output = "dist/science/atlas-visual-v11-v377/audit.json";
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const v370Audit = read("dist/science/atlas-visual-v10-v370/audit.json");
const expectation = read("dist/science/measured-expectation-v375/inspect.json");
const image = read("dist/science/expected-electron-image-v376/inspect.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const v10 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
const v11 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);
const v10ProfileDigestSha256 = sha(v10);
const v11ProfileDigestSha256 = sha(v11);
const hud = v11.runtimeTokens.hud.measurementLabV11;
const gravity = v11.runtimeTokens.strongGravityV11;
const initialFormal = resolveAtlasInitialVisualProfileV299({ build: "formal" });
const initialStandalone = resolveAtlasInitialVisualProfileV299({
  build: "standalone-full",
});
const initialLite = resolveAtlasInitialVisualProfileV299({ build: "vercel-lite" });
const initialShadow = resolveAtlasInitialVisualProfileV299({ build: "local-shadow" });

const forbiddenScienceProducts = [
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/science/expected-electron-image-v376/image.json",
  "dist/science/expected-electron-image-v376/image.csv",
];
if (
  v370Audit.version !== "v370-atlas-visual-v10-observatory-runtime-audit-v1" ||
  v370Audit.profileDigests?.v10ProfileDigestSha256 !== v10ProfileDigestSha256 ||
  v10ProfileDigestSha256 === v11ProfileDigestSha256 ||
  v11.v11TokensApplied !== true ||
  v11.v10TokensApplied !== false ||
  v11.defaultApplied !== false ||
  v11.localShadowDefaultEligible !== false ||
  !hud ||
  !gravity ||
  gravity.scienceExposure !== 1 ||
  gravity.scienceBloom !== 0 ||
  gravity.scienceNoise !== 0 ||
  expectation.status !== "blocked-dual-authority-inputs-unavailable" ||
  expectation.presentInputCount !== 1 ||
  expectation.photonInputQualified !== true ||
  expectation.detectorAuthorityQualified !== false ||
  expectation.geometryAuthorityQualified !== false ||
  expectation.measuredExpectationAvailable !== false ||
  expectation.expectationRowCount !== 0 ||
  image.status !== "blocked-envelope-unavailable" ||
  image.presentInputCount !== 0 ||
  image.imageAvailable !== false ||
  image.zeroImageFallbackUsed !== false ||
  forbiddenScienceProducts.some((path) => existsSync(resolve(root, path))) ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  initialFormal.profile !== "legacy-v9" ||
  initialStandalone.profile !== "legacy-v9" ||
  initialLite.profile !== "legacy-v9" ||
  initialShadow.profile !== "legacy-v9" ||
  initialFormal.v11MeasurementLabManualAbAvailable !== false ||
  initialStandalone.v11MeasurementLabManualAbAvailable !== false ||
  initialLite.v11MeasurementLabManualAbAvailable !== false ||
  initialShadow.v11MeasurementLabManualAbAvailable !== true ||
  initialShadow.localShadowDefaultApplied !== false
) {
  throw new Error("v377-visual-authority-boundary");
}

const consumer = "app/components/MeasurementLabSurfaceV377.tsx";
const consumerSource = bytes(consumer).toString("utf8");
const controlSource = bytes("app/components/AtlasVisualABControlV261.tsx").toString(
  "utf8",
);
const requiredConsumerFragments = [
  "tokens.electronColumnOpacity",
  "tokens.uncertaintyHaloOpacity",
  "tokens.shaRailOpacity",
  "tokens.authorityGateLuminance",
  "tokens.unavailableScanOpacity",
  "gravity.scienceExposure",
  "gravity.scienceBloom",
  "gravity.scienceNoise",
  'data-atlas-v377-science-buffer-mutation="false"',
  'data-atlas-v377-cinematic-buffer-mutation="false"',
  "decorative scan / no pixel payload",
];
if (
  requiredConsumerFragments.some((fragment) => !consumerSource.includes(fragment)) ||
  consumerSource.includes("Math.random") ||
  consumerSource.includes("<canvas") ||
  !controlSource.includes("V11 Measurement Lab · Shadow") ||
  !controlSource.includes("id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377 || localShadow") ||
  !controlSource.includes('data-atlas-v11-measurement-lab-default-applied="false"')
) {
  throw new Error("v377-runtime-token-consumer");
}

const immutableSciencePaths = [
  "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  "dist/science/measured-expectation-v375/inspect.json",
  "dist/science/expected-electron-image-v376/inspect.json",
];
const immutableScienceSourceManifest = immutableSciencePaths.map((path) => ({
  path,
  sha256: fileSha(path),
}));
const sourcePaths = [
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/atlasVisualProfileV370.test.ts",
  "app/lib/atlasVisualProfileV377.test.ts",
  "app/components/AtlasVisualABControlV261.tsx",
  consumer,
  "app/components/MeasurementLabSurfaceV377.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/build-visual-runtime-v377.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v377-atlas-visual-v11-measurement-lab-runtime-audit-v1",
  generatedAt: new Date().toISOString(),
  status: "implemented-v11-measurement-lab-science-image-unavailable-browser-pending",
  visualDirection: "cryogenic-superconducting-measurement-chamber",
  profileDigests: {
    v10ProfileDigestSha256,
    v11ProfileDigestSha256,
    measurementLabTokenSignature: sha(hud),
    strongGravityTokenSignature: sha(gravity),
  },
  measurementState: {
    expectedInputs: 8,
    presentInputs: expectation.presentInputCount,
    photonInputQualified: expectation.photonInputQualified,
    detectorAuthorityQualified: expectation.detectorAuthorityQualified,
    geometryAuthorityQualified: expectation.geometryAuthorityQualified,
    expectationRows: expectation.expectationRowCount,
    scienceImageCells: 0,
    scienceImageAvailable: image.imageAvailable,
    imageArraysExist: false,
    observedCountsAvailable: false,
  },
  scienceBoundary: {
    displayTransform: "identity-linear-float64-no-normalization",
    exposure: gravity.scienceExposure,
    bloom: gravity.scienceBloom,
    noise: gravity.scienceNoise,
    immutableScienceSourceManifest,
    immutableScienceSourceSha256: sha(immutableScienceSourceManifest),
    sciencePayloadMutationAllowed: false,
    zeroImageFallbackAllowed: false,
    cinematicCopyAllowed: false,
  },
  cinematicBoundary: {
    seededDetail: true,
    detailSeed: hud.detailSeed,
    electronColumnsEncodeScience: false,
    uncertaintyHaloEncodesScience: false,
    classificationMutationAllowed: false,
    redshiftMutationAllowed: false,
    evpaMutationAllowed: false,
    intensityMutationAllowed: false,
  },
  runtimeConsumer: {
    component: "MeasurementLabSurfaceV377",
    groups: ["hud.measurementLabV11", "strongGravityV11"],
    profileGate: ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
    tokenGroups: [
      "panelOpacity",
      "metrologyGridOpacity",
      "electronColumnOpacity",
      "uncertaintyHaloOpacity",
      "shaRailOpacity",
      "authorityGateLuminance",
      "unavailableScanOpacity",
      "detailSeed",
      "scienceExposure",
      "scienceBloom",
      "scienceNoise",
    ],
    scienceBufferMutationAllowed: false,
    cinematicBufferMutationAllowed: false,
  },
  ab: {
    profile: ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
    label: "V11 Measurement Lab · Shadow",
    localShadowManualOnly: true,
    defaultApplied: false,
    formalVisible: false,
    standaloneVisible: false,
    liteVisible: false,
    legacyV9NameAndDefaultUnchanged: true,
    v10Frozen: true,
  },
  denseCampaign: {
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
    stateSha256: dense.stateSha256,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  browserQualification: "not-run",
  boundary:
    "v11-manual-local-shadow-cryogenic-measurement-lab-no-science-image-no-pixel-fallback-no-product-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      v10: v10ProfileDigestSha256,
      v11: v11ProfileDigestSha256,
      input: `${expectation.presentInputCount}/8`,
      imageCells: 0,
      dense: dense.status,
      browser: artifact.browserQualification,
    },
    null,
    2,
  ),
);
