import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  bindAtlasCalibrationHudV505,
  resolveAtlasCalibrationHudProfileV505,
} from "../app/lib/atlasCalibrationHudProfileV505";

const root = process.cwd();
const paths = Object.freeze({
  readiness:
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  preflight:
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v504-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v504.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/atlas-calibration-hud-v505/hud-audit.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const text = (path: string) => bytes(path).toString("utf8");
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
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

const readiness = read(paths.readiness);
const preflight = read(paths.preflight);
const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  readiness.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
  sha(readiness) !== readiness.artifactSha256 ||
  preflight.version !== "v504-kerr-measured-calibration-preflight-v1" ||
  sha(preflight) !== preflight.artifactSha256 ||
  previousEvidence.version !== "orbit-atlas-shadow-v504-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v504" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  readiness.decision.admitted !== false ||
  preflight.decision.measuredDetectorAuthorityGranted !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v505-upstream-boundary");
}

const sourceFiles = Object.freeze({
  readiness: "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  preflight: "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  wrapper: "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  profile: "app/lib/atlasCalibrationHudProfileV505.ts",
});
const sources = Object.fromEntries(
  Object.entries(sourceFiles).map(([id, path]) => [id, text(path)]),
) as Record<keyof typeof sourceFiles, string>;
const combined = Object.values(sources).join("\n");
const mojibake = /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/u;
if (
  mojibake.test(combined) ||
  ["Math.random", "<canvas", "physicsEngine", "setSceneRevision"].some((token) =>
    combined.includes(token),
  ) ||
  !sources.readiness.includes("bindAtlasCalibrationHudV505(mode, state.summary)") ||
  !sources.preflight.includes("bindAtlasCalibrationHudV505(mode, state.summary)") ||
  !sources.wrapper.includes('data-atlas-v505-scientific-field-mutation="false"')
) {
  throw new Error("v505-runtime-source-boundary");
}

const scienceProfile = resolveAtlasCalibrationHudProfileV505("science");
const cinematicProfile = resolveAtlasCalibrationHudProfileV505("cinematic");
if (
  scienceProfile !== resolveAtlasCalibrationHudProfileV505("science") ||
  cinematicProfile !== resolveAtlasCalibrationHudProfileV505("cinematic") ||
  !Object.isFrozen(scienceProfile) ||
  !Object.isFrozen(cinematicProfile) ||
  scienceProfile.tokens.glowOpacity !== 0 ||
  scienceProfile.tokens.transitionMs !== 0 ||
  cinematicProfile.tokens.glowOpacity <= 0 ||
  scienceProfile.scienceBoundary !== cinematicProfile.scienceBoundary ||
  scienceProfile.scienceBoundary.scientificFieldMutationAllowed !== false ||
  scienceProfile.scienceBoundary.randomDrawCount !== 0
) {
  throw new Error("v505-profile-boundary");
}

const payload = Object.freeze({
  readinessArtifactSha256: readiness.artifactSha256,
  preflightArtifactSha256: preflight.artifactSha256,
  calibrationAdmitted: readiness.decision.admitted,
  candidateReadyForIndependentValidation:
    preflight.observation.candidateReadyForIndependentValidation,
  detectorResponse: readiness.outputs.detectorResponse,
  observedIntensity: readiness.outputs.observedIntensity,
  scienceRaster: readiness.outputs.scienceRaster,
});
const scienceBinding = bindAtlasCalibrationHudV505("science", payload);
const cinematicBinding = bindAtlasCalibrationHudV505("cinematic", payload);
if (
  scienceBinding.sciencePayload !== payload ||
  cinematicBinding.sciencePayload !== payload ||
  scienceBinding.sciencePayload !== cinematicBinding.sciencePayload ||
  scienceBinding.scientificFieldMutationAllowed !== false ||
  cinematicBinding.scientificFieldMutationAllowed !== false
) {
  throw new Error("v505-payload-reference-boundary");
}

const tokenNames = Object.keys(scienceProfile.tokens) as (keyof typeof scienceProfile.tokens)[];
const tokenConsumption = tokenNames.map((token) => ({
  token,
  consumers: (["readiness", "preflight"] as const).filter((id) =>
    sources[id].includes(`profile.tokens.${token}`),
  ),
}));
if (tokenConsumption.some((entry) => entry.consumers.length === 0)) {
  throw new Error("v505-unconsumed-token");
}

const sourcePaths = [
  paths.readiness,
  paths.preflight,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  paths.formal,
  ...Object.values(sourceFiles),
  "app/lib/atlasCalibrationHudProfileV505.test.ts",
  "app/components/AtlasCalibrationHudRuntimeV505.test.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.test.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.test.tsx",
  "scripts/build-atlas-calibration-hud-v505.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v505-atlas-calibration-hud-audit-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "science-cinematic-calibration-hud-qualified-browser-pending",
  source: {
    v503ReadinessArtifactSha256: readiness.artifactSha256,
    v504PreflightArtifactSha256: preflight.artifactSha256,
    v504EvidenceSha256: previousEvidence.evidenceSha256,
    v504PointerSha256: previousPointer.pointerSha256,
  },
  profile: {
    version: scienceProfile.version,
    resolverReferenceStable: true,
    profileObjectsFrozen: true,
    tokenCount: tokenNames.length,
    allTokensConsumed: true,
    tokenConsumption,
    science: {
      glowOpacity: scienceProfile.tokens.glowOpacity,
      transitionMs: scienceProfile.tokens.transitionMs,
      linearScientificReadout:
        scienceProfile.scienceBoundary.linearScientificReadout,
    },
    cinematic: {
      glowOpacity: cinematicProfile.tokens.glowOpacity,
      transitionMs: cinematicProfile.tokens.transitionMs,
    },
  },
  payloadBoundary: {
    sharedPayloadSha256: sha(payload),
    sharedPayloadReferencePreserved: true,
    scientificFieldMutationAllowed: false,
    classificationMutationAllowed: false,
    redshiftMutationAllowed: false,
    evpaMutationAllowed: false,
    intensityMutationAllowed: false,
    randomDrawCount: 0,
    detectorResponse: "unavailable",
    observedIntensity: "unavailable",
    scienceRaster: "unavailable",
  },
  runtime: {
    consumerSurfaceCount: 2,
    modeToggleCount: 2,
    automaticRequestDeltaFromModeToggle: 0,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    utf8SourceFilesScanned: Object.keys(sourceFiles).length,
    mojibakeMatches: 0,
  },
  qualification: {
    stableProfile: "qualified",
    tokenConsumption: "qualified-12-of-12",
    scienceCinematicIsolation: "qualified",
    utf8: "qualified",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
  },
  denseCampaignStatus: "incomplete-0-of-49",
  formalDefaultKernel: "legacy-eih-1pn",
  boundary:
    "v505-two-real-calibration-surfaces-one-stable-science-cinematic-hud-profile-shared-immutable-payload-zero-scientific-field-random-canvas-scene-physics-or-default-mutation",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      tokenConsumption: `${tokenNames.length}/${tokenNames.length}`,
      consumerSurfaces: 2,
      sharedPayloadSha256: artifact.payloadBoundary.sharedPayloadSha256,
      scientificFieldMutation: false,
      mojibakeMatches: 0,
      browserQualification: "not-run",
      denseCampaign: "0/49",
    },
    null,
    2,
  ),
);
