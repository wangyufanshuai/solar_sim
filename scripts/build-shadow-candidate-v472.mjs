import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v471-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v471.json",
  profile: "dist/science/atlas-science-cinematic-v8-v472/profile-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v472-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v472.json",
});
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
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const profile = read(paths.profile);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v471-evidence-v1" ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v471" ||
  canonicalSha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  canonicalSha(previousPointer) !== previousPointer.pointerSha256 ||
  profile.version !== "v472-atlas-science-cinematic-v8-profile-audit-v1" ||
  profile.status !== "science-cinematic-v8-runtime-consumed-browser-pending" ||
  canonicalSha(profile) !== profile.artifactSha256 ||
  profile.contract?.tokenCount !== 33 ||
  profile.contract?.bindingCount !== 33 ||
  profile.contract?.consumerCount !== 13 ||
  profile.contract?.everyTokenConsumedExactlyOnce !== true ||
  profile.audit?.unconsumedTokenPaths?.length !== 0 ||
  profile.audit?.duplicateTokenPaths?.length !== 0 ||
  profile.profiles?.science?.strongGravity?.linearDisplay !== true ||
  profile.profiles?.science?.strongGravity?.bloomIntensity !== 0 ||
  profile.profiles?.science?.strongGravity?.colorGradeIntensity !== 0 ||
  profile.profiles?.science?.postFx?.grain !== 0 ||
  profile.profiles?.science?.postFx?.chromaticAberration !== 0 ||
  !profile.profiles?.cinematic?.strongGravity?.seed ||
  profile.runtime?.v8DefaultApplied !== false ||
  profile.observableBoundary?.productionAuthorityGrantedRowCount !== 0 ||
  profile.observableBoundary?.sciencePixelRows !== 0 ||
  profile.lifecycle?.allResourcesAtBaseline !== true ||
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
  throw new Error("v472-evidence-boundary");
}

const sourcePaths = [
  paths.profile,
  paths.previousEvidence,
  paths.previousPointer,
  paths.dense,
  "app/lib/atlasScienceCinematicV8V472.ts",
  "app/components/ScienceCinematicV8ObservableStageV472.tsx",
  "app/local-shadow-v472/page.tsx",
  "scripts/build-atlas-science-cinematic-v8-v472.ts",
  "scripts/build-shadow-candidate-v472.mjs",
  "scripts/verify-shadow-v472-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status = "v472-science-cinematic-v8-runtime-consumed-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v472-evidence-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  dependency: {
    v471EvidenceSha256: previousEvidence.evidenceSha256,
    v471EvidenceFileSha256: fileSha(paths.previousEvidence),
    v471PointerSha256: previousPointer.pointerSha256,
    v471PointerFileSha256: fileSha(paths.previousPointer),
    v472ProfileArtifactSha256: profile.artifactSha256,
    v472ProfileFileSha256: fileSha(paths.profile),
    frozenV7SourceSha256: profile.source.frozenV7SourceSha256,
    v314StateSha256: dense.stateSha256,
  },
  visualProfile: {
    id: profile.profileId,
    modeCount: profile.contract.modeCount,
    visualGroupCount: profile.contract.visualGroupCount,
    tokenCount: profile.contract.tokenCount,
    bindingCount: profile.contract.bindingCount,
    consumerCount: profile.contract.consumerCount,
    allTokensConsumedExactlyOnce: true,
    unconsumedTokenCount: 0,
    duplicateTokenCount: 0,
    stableProfileReferences: true,
    manualModeToggle: true,
    initialMode: "science",
    v8DefaultApplied: false,
    localShadowOnly: true,
  },
  isolation: {
    scienceLinearDisplay: true,
    scienceBloomIntensity: 0,
    scienceColorGradeIntensity: 0,
    scienceGrain: 0,
    scienceChromaticAberration: 0,
    cinematicSeed: profile.audit.cinematicSeed,
    scientificFieldMutationAllowed: false,
    classificationMutationAllowed: false,
    redshiftMutationAllowed: false,
    evpaMutationAllowed: false,
    intensityMutationAllowed: false,
  },
  observableBoundary: profile.observableBoundary,
  lifecycle: {
    ...profile.lifecycle,
    canvasCreatedByV472: false,
    sceneRevisionMutationAllowed: false,
  },
  boundary: profile.boundary,
  runtimeIntegration: profile.runtime,
  qualification: {
    v7FrozenContinuity: "qualified",
    v8TokenSchema: "qualified-33",
    v8RuntimeConsumers: "qualified-13",
    v8ScienceIsolation: "qualified",
    v8CinematicDeterminism: "qualified-seeded",
    v8ObservableHud: "implemented-browser-pending",
    productionAuthority: "blocked",
    scienceRaster: "blocked",
    browser: "not-run",
    visualMatrix: "not-run",
    soak: "not-run",
    rtxWebGpu: "not-run",
  },
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    runNextAuthorized: dense.runNextAuthorized,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundaryStatement:
    "v472-local-shadow-manual-v8-presentation-only-no-science-writeback-default-promotion-images-shards-or-heavy-qualification",
};
const evidence = { ...unsigned, evidenceSha256: canonicalSha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v472",
  generatedAt: "2026-07-30T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v471ObservableMatrix: "qualified",
    v472ScienceCinematicV8: "implemented-runtime-consumed-browser-pending",
    v472TokenConsumption: "qualified-33-of-33",
    v472RuntimeConsumers: "qualified-13",
    v472ScienceIsolation: "qualified-zero-effects",
    v472CinematicDeterminism: "qualified-seeded",
    v472V8DefaultApplied: false,
    v472ProductionAuthorityGranted: false,
    v472SciencePixelRows: 0,
    v472BrowserQualification: "not-run",
    v472VisualMatrixQualification: "not-run",
    v472SoakQualification: "not-run",
    v472RtxWebGpuQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    sciencePayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomic(paths.pointer, pointer);

console.log(
  JSON.stringify(
    {
      status,
      artifactSha256: profile.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      tokenCount: 33,
      bindingCount: 33,
      consumerCount: 13,
      unconsumedTokens: 0,
      scienceEffects: 0,
      cinematicSeed: profile.audit.cinematicSeed,
      v8DefaultApplied: false,
      sciencePixelRows: 0,
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
